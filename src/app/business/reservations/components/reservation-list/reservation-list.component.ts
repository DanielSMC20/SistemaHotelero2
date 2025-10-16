import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import Swal from 'sweetalert2';

import { Reserva } from '../../domain/reservation.interface';
import { ReservationInfraestructure } from '../../infraestructure/reservation.infraestructure';
import { ReservationFormComponent } from '../reservation-form/reservation-form.component';
import { Habitacion } from '../../../../core/models/models';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    AgGridAngular,
    ReservationFormComponent,
  ],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css'],
})
export class ReservationListComponent implements OnInit {
  rowData: Reserva[] = [];
  roomData: Habitacion[] = [];

  // AG Grid refs
  gridApi: any;
  gridColumnApi: any;

  // UI state
  quick = '';
  showForm = false;
  editing?: Reserva | null;

  constructor(private reservationInfra: ReservationInfraestructure) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  // =============== Helpers ===============
  // Devuelve string 'YYYY-MM-DD' desde Date o string cualquiera (seguro para filtro texto)
  private toDateStr = (v: Date | string | null | undefined): string => {
    if (!v) return '';
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(+d) ? String(v) : d.toISOString().slice(0, 10);
  };

  // Lee checkIn / fechaCheckIn indistintamente
  private getCheckIn = (row: any): string =>
    this.toDateStr(row?.fechaCheckIn ?? row?.checkIn);

  // Lee checkOut / fechaCheckOut indistintamente
  private getCheckOut = (row: any): string =>
    this.toDateStr(row?.fechaCheckOut ?? row?.checkOut);

  // =============== Columnas ===============
  // Usamos valueGetter para anidados y fechas -> un solo filtro de texto funciona en todo
  columnDefs: ColDef[] = [
    { headerName: 'ID', field: 'id', maxWidth: 100, cellClass: 'text-center' },

    {
      headerName: 'Cliente',
      minWidth: 240,
      valueGetter: (p) => p.data?.cliente?.nombresCompletos ?? '',
      cellRenderer: (p: any) => `
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 flex items-center justify-center rounded-full bg-indigo-50 text-indigo-700 font-semibold">
            ${(p.value || '?').charAt(0)}
          </div>
          <div class="leading-tight">
            <div class="font-medium text-gray-900">${p.value || '—'}</div>
          </div>
        </div>`,
    },
    {
      headerName: 'Documento',
      maxWidth: 160,
      valueGetter: (p) => p.data?.cliente?.documento ?? '',
    },
    {
      headerName: 'Habitación',
      maxWidth: 120,
      valueGetter: (p) => p.data?.habitacion?.numero ?? '',
    },
    {
      headerName: 'Tipo',
      maxWidth: 150,
      valueGetter: (p) => p.data?.habitacion?.tipo ?? '',
    },

    {
      headerName: 'Check-In',
      field: 'fechaCheckIn', // si te llega como checkIn: usa valueGetter: p => p.data.checkIn
      filter: 'agDateColumnFilter',
      valueGetter: (p) => this.asDate(p.data?.fechaCheckIn ?? p.data?.checkIn),
      valueFormatter: (p) =>
        p.value ? (p.value as Date).toISOString().slice(0, 10) : '',
      maxWidth: 160,
      filterParams: {
        browserDatePicker: true, // usa el datepicker nativo del navegador
        inRangeInclusive: true,
        comparator: (filterDate: Date, cellValue?: Date) => {
          if (!cellValue) return -1;
          const c = new Date(cellValue);
          c.setHours(0, 0, 0, 0);
          if (c.getTime() === filterDate.getTime()) return 0;
          return c < filterDate ? -1 : 1;
        },
      },
    },
    {
      headerName: 'Check-Out',
      field: 'fechaCheckOut',
      filter: 'agDateColumnFilter',
      valueGetter: (p) =>
        this.asDate(p.data?.fechaCheckOut ?? p.data?.checkOut),
      valueFormatter: (p) =>
        p.value ? (p.value as Date).toISOString().slice(0, 10) : '',
      maxWidth: 160,
      filterParams: {
        browserDatePicker: true,
        inRangeInclusive: true,
        comparator: (filterDate: Date, cellValue?: Date) => {
          if (!cellValue) return -1;
          const c = new Date(cellValue);
          c.setHours(0, 0, 0, 0);
          if (c.getTime() === filterDate.getTime()) return 0;
          return c < filterDate ? -1 : 1;
        },
      },
    },

    {
      headerName: 'Estado',
      field: 'estado',
      maxWidth: 160,
      cellRenderer: (params: any) => {
        const s = String(params.value || '').toUpperCase();
        const cls: Record<string, string> = {
          CONFIRMED: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
          PENDING: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
          CANCELLED: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
          RESERVADO: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
          CANCELADO: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
        };
        const label: Record<string, string> = {
          CONFIRMED: 'Confirmada',
          PENDING: 'Pendiente',
          CANCELLED: 'Cancelada',
          RESERVADO: 'Reservado',
          CANCELADO: 'Cancelado',
        };
        return `<span class="px-2 py-1 rounded-full text-xs font-medium ${
          cls[s] ?? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
        }">${label[s] ?? params.value ?? '—'}</span>`;
      },
    },

    // Acciones
    {
      headerName: 'Acciones',
      width: 220,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.className = 'flex items-center justify-center gap-2';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Editar';
        editBtn.className =
          'bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm';
        editBtn.addEventListener('click', () =>
          params.context.componentParent.onEdit(params.data)
        );

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Eliminar';
        deleteBtn.className =
          'bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm';
        deleteBtn.addEventListener('click', () =>
          params.context.componentParent.onDelete(params.data)
        );

        container.appendChild(editBtn);
        container.appendChild(deleteBtn);
        return container;
      },
      cellClass: 'text-center',
    },
  ];

  // =============== GridOptions (filtro simple para todo) ===============
  gridOptions = {
    context: { componentParent: this },
    rowHeight: 56,
    headerHeight: 44,
    animateRows: true,
    pagination: true,
    paginationPageSize: 10,
    suppressCellFocus: true,
    defaultColDef: {
      resizable: true,
      sortable: true,
      filter: 'agTextColumnFilter', // un único tipo de filtro
      floatingFilter: true,
      minWidth: 120,
      filterParams: { debounceMs: 200, caseSensitive: false, trimInput: true },
    },
    overlayNoRowsTemplate:
      '<div class="text-gray-500">No hay reservas para mostrar</div>',
    overlayLoadingTemplate:
      '<div class="text-gray-500">Cargando reservas…</div>',
    getRowId: (p: any) => p.data.id,
  };

  // =============== Handlers UI ===============
  onQuickFilter(ev: Event) {
    this.quick = (ev.target as HTMLInputElement).value ?? '';
    this.gridApi?.setQuickFilter(this.quick);
  }

  reset() {
    this.quick = '';
    this.gridApi?.setQuickFilter('');
    this.gridApi?.setFilterModel(null);
    this.gridApi?.setSortModel(null);
  }
    private getRoomsAvailable() {
    this.reservationInfra.getRoomsAvailable().subscribe({
      next: (data) => {
        this.roomData = data;
        this.gridApi?.setRowData(this.roomData);
      },
      error: (err) => console.error('Error al cargar reservas:', err),
    });
  }

create() {
  const svc = this.reservationInfra;

  // ===== Utilidades =====
  const PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });
  const toYMD = (d: Date) => {
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${d.getFullYear()}-${mm}-${dd}`;
  };
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
  const diffDays = (a?: string, b?: string) => {
    if (!a || !b) return 0;
    const d1 = startOfDay(new Date(a)).getTime();
    const d2 = startOfDay(new Date(b)).getTime();
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  };
  const onlyDigits = (el: HTMLInputElement) => el.value = el.value.replace(/\D/g, '');

  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);

  Swal.fire({
    title: 'Nueva reserva',
    width: '880px',
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#2563eb',
    customClass: {
      popup: 'rounded-2xl p-0 overflow-hidden',
      title: 'text-left px-6 pt-6 pb-1 text-2xl font-semibold text-gray-900',
      htmlContainer: 'w-full px-6 pb-4',
      actions: 'px-6 pb-6',
      confirmButton: 'swal2-confirm !rounded-xl !px-5 !py-2.5 !text-white !bg-indigo-600 hover:!bg-indigo-700 focus:!ring-2 focus:!ring-offset-2 focus:!ring-indigo-500',
      cancelButton: 'swal2-cancel !rounded-xl !px-5 !py-2.5 !text-gray-700 !bg-gray-100 hover:!bg-gray-200'
    },
    html: `
      <div class="space-y-5">
        <div class="rounded-2xl border border-gray-200 bg-white/60 p-5">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label for="documento" class="block text-sm font-medium text-gray-700 mb-1">Documento</label>
              <div class="flex gap-2">
                <input id="documento" type="text" maxlength="11"
                       class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                       placeholder="DNI (8) o RUC (11)" aria-describedby="docHelp">
                <button id="btnConsultar" type="button"
                        class="px-4 py-2.5 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-2">
                  <svg id="spinnerDoc" class="hidden h-4 w-4 animate-spin text-gray-500" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>Consultar</span>
                </button>
              </div>
              <div id="docHelp" class="text-xs text-gray-500 mt-1">Ingresa 8 dígitos (DNI) o 11 (RUC) y presiona Consultar.</div>
            </div>

            <div>
              <label for="nombresCompletos" class="block text-sm font-medium text-gray-700 mb-1">Nombres completos / Razón social</label>
              <input id="nombresCompletos" type="text"
                     class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                     placeholder="Se autocompleta al consultar">
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" type="email"
                     class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                     placeholder="correo@dominio.com">
            </div>

            <div>
              <label for="telefono" class="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input id="telefono" type="text" maxlength="9"
                     class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                     placeholder="987654321">
            </div>

            <div>
              <label for="checkIn" class="block text-sm font-medium text-gray-700 mb-1">Check-in</label>
              <input id="checkIn" type="date"
                     class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div>
              <label for="checkOut" class="block text-sm font-medium text-gray-700 mb-1">Check-out</label>
              <input id="checkOut" type="date"
                     class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            </div>

            <div class="md:col-span-2">
              <label for="roomId" class="block text-sm font-medium text-gray-700 mb-1">Habitación disponible</label>
              <select id="roomId"
                      class="w-full rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="">Seleccione una habitación</option>
              </select>
              <div id="estimate" class="text-sm text-gray-700 mt-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hidden"></div>
            </div>
          </div>
        </div>

        <p class="text-xs text-gray-500">
          Al guardar, el sistema recalcula el total con tarifas y reglas vigentes.
        </p>
      </div>
    `,
    didOpen: () => {
      // ------- refs
      const inEl  = document.getElementById('checkIn')  as HTMLInputElement;
      const outEl = document.getElementById('checkOut') as HTMLInputElement;
      const roomSel = document.getElementById('roomId') as HTMLSelectElement;
      const estimateEl = document.getElementById('estimate') as HTMLDivElement;

      const docEl = document.getElementById('documento') as HTMLInputElement;
      const nameEl = document.getElementById('nombresCompletos') as HTMLInputElement;
      const btnConsultar = document.getElementById('btnConsultar') as HTMLButtonElement;
      const spinnerDoc = document.getElementById('spinnerDoc') as unknown as SVGElement;
      const docHelp = document.getElementById('docHelp') as HTMLDivElement;

      const emailEl = document.getElementById('email') as HTMLInputElement;
      const telEl = document.getElementById('telefono') as HTMLInputElement;

      // ------- mínimos y valores por defecto
      const min = toYMD(today);
      if (inEl) { inEl.min = min; inEl.value = toYMD(today); }
      if (outEl) { outEl.min = min; outEl.value = toYMD(tomorrow); }

      // ------- normalizadores
      const onDigits = (e: Event) => onlyDigits(e.target as HTMLInputElement);
      docEl?.addEventListener('input', onDigits);
      telEl?.addEventListener('input', onDigits);

      // ------- render habitaciones
      const renderRooms = (rooms: any[]) => {
        roomSel.innerHTML = '<option value="">Seleccione una habitación</option>';
        if (!rooms?.length) {
          roomSel.innerHTML = '<option value="">No hay habitaciones disponibles</option>';
          return;
        }
        const opts = rooms.map((r: any) =>
          `<option value="${r.id}" data-price="${r.precioPorNoche}" data-numero="${r.numero}">
             Hab. ${r.numero} — ${PEN.format(Number(r.precioPorNoche || 0))}
           </option>`).join('');
        roomSel.insertAdjacentHTML('beforeend', opts);
      };

      // ------- estimado
      const updateEstimate = () => {
        const nights = diffDays(inEl?.value, outEl?.value);
        const price = Number((roomSel.selectedOptions[0]?.getAttribute('data-price')) || 0);
        if (nights > 0 && price > 0) {
          const total = nights * price;
          const numero = roomSel.selectedOptions[0]?.getAttribute('data-numero') ?? '-';
          estimateEl.classList.remove('hidden');
          estimateEl.innerHTML =
            `<div class="flex flex-wrap items-center gap-3">
               <span class="inline-flex items-center gap-2 rounded-lg bg-indigo-50 text-indigo-700 px-3 py-1.5">
                 <span class="font-semibold">${nights}</span> noches
               </span>
               <span class="inline-flex items-center gap-2 rounded-lg bg-gray-100 text-gray-700 px-3 py-1.5">
                 Habitación <span class="font-semibold">${numero}</span>
               </span>
               <span class="inline-flex items-center gap-2 rounded-lg bg-emerald-50 text-emerald-700 px-3 py-1.5">
                 Estimado total <span class="font-semibold">${PEN.format(total)}</span>
               </span>
             </div>
             <div class="text-xs text-gray-500 mt-2">* El total definitivo lo calcula el sistema al guardar.</div>`;
        } else {
          estimateEl.classList.add('hidden');
          estimateEl.innerHTML = '';
        }
        validateForm(); // revalida disponibilidad de "Guardar"
      };

      // ------- carga inicial de habitaciones
      const reloadRooms = () => {
        svc.getRoomsAvailable().subscribe({
          next: (rooms: any[]) => { renderRooms(rooms); updateEstimate(); },
          error: () => { renderRooms([]); estimateEl.classList.add('hidden'); estimateEl.innerHTML = ''; }
        });
      };

      // ------- consultar DNI/RUC
      const consultarDocumento = () => {
        const numero = (docEl?.value || '').trim();
        nameEl.value = '';
        const validDoc = /^\d{8}$|^\d{11}$/.test(numero);
        if (!validDoc) {
          docHelp.textContent = 'Documento inválido: usa DNI (8) o RUC (11).';
          docHelp.className = 'text-xs text-red-600 mt-1';
          return;
        }
        docHelp.textContent = 'Consultando…';
        docHelp.className = 'text-xs text-blue-600 mt-1';
        spinnerDoc?.classList.remove('hidden');
        btnConsultar.disabled = true;

        svc.lookupDocument(numero).subscribe({
          next: (info: { nombresCompletos: string; tipoDocumento: string; }) => {
            nameEl.value = info.nombresCompletos || '';
            docHelp.textContent = (info.tipoDocumento === 'RUC')
              ? 'Razón social encontrada (RUC).'
              : 'Nombre encontrado (DNI).';
            docHelp.className = 'text-xs text-green-600 mt-1';
            validateForm();
          },
          error: () => {
            nameEl.value = '';
            docHelp.textContent = 'No se pudo consultar el documento. Verifica el número o intenta nuevamente.';
            docHelp.className = 'text-xs text-red-600 mt-1';
          },
          complete: () => {
            spinnerDoc?.classList.add('hidden');
            btnConsultar.disabled = false;
          }
        });
      };

      btnConsultar?.addEventListener('click', consultarDocumento);

      // ------- fechas
      inEl?.addEventListener('change', () => {
        if (outEl && inEl.value) {
          outEl.min = inEl.value;
          if (outEl.value < inEl.value) outEl.value = inEl.value;
        }
        updateEstimate();
      });

      outEl?.addEventListener('change', () => {
        if (inEl && outEl.value && outEl.value < inEl.value) inEl.value = outEl.value;
        updateEstimate();
      });

      roomSel?.addEventListener('change', updateEstimate);

      // ------- validación en vivo + habilitar Guardar
      const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidDoc = () => /^\d{8}$|^\d{11}$/.test((docEl?.value || '').trim());
      const isValidTel = () => /^\d{6,15}$/.test((telEl?.value || '').trim()); // flexible
      const isValidEmail = () => emailRx.test((emailEl?.value || '').trim());
      const isValidDates = () => !!inEl?.value && !!outEl?.value && outEl.value >= inEl.value;
      const hasRoom = () => !!(roomSel?.value);

      const validateForm = () => {
        const ok = isValidDoc() && (nameEl?.value || '').trim().length > 1 &&
                   isValidEmail() && isValidTel() && isValidDates() && hasRoom();
        const confirmBtn = Swal.getConfirmButton();
        if (confirmBtn) confirmBtn.toggleAttribute('disabled', !ok);
      };

      [docEl, nameEl, emailEl, telEl, inEl, outEl, roomSel].forEach(el => el?.addEventListener('input', validateForm));
      [inEl, outEl, roomSel].forEach(el => el?.addEventListener('change', validateForm));

      // estado inicial
      reloadRooms();
      updateEstimate();
      validateForm();

      // foco amigable
      setTimeout(() => docEl?.focus(), 50);
    },
    preConfirm: () => {
      const get = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value?.trim() || '';
      const documento = get('documento');
      const nombresCompletos = get('nombresCompletos');
      const email = get('email');
      const telefono = get('telefono');
      const roomIdStr = (document.getElementById('roomId') as HTMLSelectElement)?.value;
      const roomId = roomIdStr ? Number(roomIdStr) : 0;
      const checkIn = get('checkIn');
      const checkOut = get('checkOut');

      // Validaciones finales (por si acaso)
      if (!documento || !nombresCompletos || !email || !telefono || !roomId || !checkIn || !checkOut) {
        Swal.showValidationMessage('Por favor completa todos los campos');
        return false;
      }
      if (!/^\d{8}$|^\d{11}$/.test(documento)) {
        Swal.showValidationMessage('Documento inválido: usa DNI (8 dígitos) o RUC (11 dígitos)');
        return false;
      }
      if (checkOut < checkIn) {
        Swal.showValidationMessage('La fecha de salida no puede ser anterior a la de entrada');
        return false;
      }

      const tipoDocumento = documento.length === 8 ? 'DNI' : 'RUC';
      return { documento, nombresCompletos, email, telefono, roomId, checkIn, checkOut, tipoDocumento };
    },
  }).then((result) => {
    if (result.isConfirmed && result.value) {
      const toastLoading = Swal.fire({
        title: 'Creando reserva…',
        didOpen: () => Swal.showLoading(),
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false
      });

      svc.createWithCustomer(result.value).subscribe({
        next: (reserva) => {
          svc.getInvoiceByReservation(reserva.id).subscribe({
            next: (factura) => {
              Swal.fire({
                icon: 'success',
                title: 'Reserva creada',
                html:
                  '<div class="text-left space-y-1">' +
                  `<div><b>Reserva:</b> #${reserva.id}</div>` +
                  `<div><b>Total:</b> ${PEN.format(Number(reserva.precioTotal || 0))}</div>` +
                  `<div><b>Factura:</b> ${factura.number} — ${factura.status}</div>` +
                  '</div>',
                timer: 2600,
                showConfirmButton: false,
              });
            },
            error: () => {
              Swal.fire({
                icon: 'success',
                title: 'Reserva creada',
                html: `<div class="text-left"><b>Total:</b> ${PEN.format(Number(reserva.precioTotal || 0))}</div>`,
                timer: 2200,
                showConfirmButton: false,
              });
            }
          });
        },
        error: () => Swal.fire({ icon: 'error', title: 'No se pudo crear la reserva' }),
      });
    }
  });
}



  // Pop-up editar
  onEdit(reserva: Reserva) {
    this.editing = reserva;
    this.showForm = true;
  }

  // Cerrar pop-up
  onCloseForm(refresh?: boolean) {
    this.showForm = false;
    this.editing = null;
    if (refresh) this.loadReservations();
  }

  // Eliminar
  onDelete(reserva: Reserva) {
    Swal.fire({
      title: '¿Eliminar reserva?',
      text: `Se eliminará la reserva de ${reserva.cliente.nombresCompletos}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.reservationInfra.deleteReservation(reserva.id).subscribe({
          next: () => {
            this.gridApi?.applyTransaction({ remove: [reserva] });
            Swal.fire('Eliminada', 'La reserva ha sido eliminada.', 'success');
          },
          error: () =>
            Swal.fire('Error', 'No se pudo eliminar la reserva.', 'error'),
        });
      }
    });
  }

  // =============== Data ===============
  private loadReservations() {
    this.reservationInfra.getAllReservations().subscribe({
      next: (data) => {
        this.rowData = data;
        // si el grid ya estaba listo, fuerza setRowData
        this.gridApi?.setRowData(this.rowData);
      },
      error: (err) => console.error('Error al cargar reservas:', err),
    });
  }
  private asDate = (v: any): Date | null => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(+d) ? null : d;
  };
}
