import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ModuleRegistry, AllCommunityModule, GridOptions } from 'ag-grid-community';
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
  editing: Reserva | null = null;

  // AG Grid refs
  gridApi: any;
  gridColumnApi: any;

  // UI state
  quick = '';
  showForm = false;

  constructor(private reservationInfra: ReservationInfraestructure) {}

  ngOnInit(): void {
    this.loadReservations();
    // Si necesitas rooms para el modal de crear (no pisa el grid principal)
    // this.getRoomsAvailable();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  // =============== Helpers ===============
  // Devuelve 'YYYY-MM-DD' desde Date o string
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

  private asDate = (v: any): Date | null => {
    if (!v) return null;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(+d) ? null : d;
  };

  // =============== Columnas ===============
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
      field: 'fechaCheckIn',
      filter: 'agDateColumnFilter',
      valueGetter: (p) => this.asDate(p.data?.fechaCheckIn ?? p.data?.checkIn),
      valueFormatter: (p) => (p.value ? (p.value as Date).toISOString().slice(0, 10) : ''),
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
      headerName: 'Check-Out',
      field: 'fechaCheckOut',
      filter: 'agDateColumnFilter',
      valueGetter: (p) => this.asDate(p.data?.fechaCheckOut ?? p.data?.checkOut),
      valueFormatter: (p) => (p.value ? (p.value as Date).toISOString().slice(0, 10) : ''),
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
          BOOKED: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
          CHECKED_IN: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200',
          CHECKED_OUT: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
          CANCELLED: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
          // legacy:
          RESERVADO: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200',
          CANCELADO: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200',
        };
        const label: Record<string, string> = {
          BOOKED: 'Reservada',
          CHECKED_IN: 'Check-in',
          CHECKED_OUT: 'Check-out',
          CANCELLED: 'Cancelada',
          RESERVADO: 'Reservada',
          CANCELADO: 'Cancelada',
        };
        return `<span class="px-2 py-1 rounded-full text-xs font-medium ${
          cls[s] ?? 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
        }">${label[s] ?? params.value ?? '—'}</span>`;
      },
    },
{
  headerName: 'Acciones',
  width: 160,
  sortable: false,
  filter: false,
  pinned: 'right',
  cellRenderer: (params: any) => {
    const btn = document.createElement('button');
    btn.textContent = 'Opciones';
    btn.className = 'bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold py-1.5 px-3 rounded-lg';
    btn.addEventListener('click', () =>
      params.context.componentParent.openRowActions(params.data)
    );
    return btn;
  },
  cellClass: 'text-center',
},
  ];

  // =============== GridOptions ===============
  gridOptions: GridOptions = {
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
      filter: 'agTextColumnFilter',
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
        this.roomData = data; // ← NO pisamos el grid principal
      },
      error: (err) => console.error('Error al cargar rooms available:', err),
    });
  }

  create() {
    this.editing = null;
    this.showForm = true;
    document.body.style.overflow = 'hidden';
  }

  onEdit(reserva: Reserva) {
    this.editing = reserva;
    this.showForm = true;
    document.body.style.overflow = 'hidden';
  }

  onCloseForm(refresh?: boolean) {
    this.showForm = false;
    this.editing = null;
    document.body.style.overflow = '';
    if (refresh) this.loadReservations();
  }

  // =============== Acciones ===============
  onCheckIn(reserva: Reserva) {
    this.reservationInfra.checkIn(reserva.id).subscribe({
      next: (updated) => {
        this.gridApi?.applyTransaction({ update: [updated] });
        Swal.fire('OK', 'Check-in registrado.', 'success');
      },
      error: (err) =>
        Swal.fire('Error', err?.error?.message || 'No se pudo hacer check-in', 'error'),
    });
  }

  onCheckOut(reserva: Reserva) {
    this.reservationInfra.checkOut(reserva.id).subscribe({
      next: (updated) => {
        this.gridApi?.applyTransaction({ update: [updated] });
        Swal.fire('OK', 'Check-out registrado.', 'success');
      },
      error: (err) =>
        Swal.fire('Error', err?.error?.message || 'No se pudo hacer check-out', 'error'),
    });
  }

  onExtend(reserva: Reserva) {
    Swal.fire({
      title: 'Extender estadía',
      input: 'number',
      inputLabel: 'Horas extra',
      inputAttributes: { min: '1', max: '12', step: '1' },
      showCancelButton: true,
      confirmButtonText: 'Aplicar',
      cancelButtonText: 'Cancelar',
      preConfirm: (val) => {
        const n = Number(val);
        if (!n || n <= 0) {
          Swal.showValidationMessage('Ingresa un número de horas válido (> 0)');
          return false;
        }
        return n;
      },
    }).then((r) => {
      if (r.isConfirmed) {
        const horasExtra = Number(r.value);
        this.reservationInfra.extendStay(reserva.id, horasExtra).subscribe({
          next: (updated) => {
            this.gridApi?.applyTransaction({ update: [updated] });
            Swal.fire('OK', `Reserva extendida ${horasExtra} h.`, 'success');
          },
          error: (err) =>
            Swal.fire('Error', err?.error?.message || 'No se pudo extender la reserva', 'error'),
        });
      }
    });
  }

  onDelete(reserva: Reserva) {
    Swal.fire({
      title: '¿Eliminar reserva?',
      text: `Se eliminará la reserva de ${reserva.cliente?.nombresCompletos ?? 'cliente'}`,
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
          error: (err) =>
            Swal.fire('Error', err?.error?.message || 'No se pudo eliminar la reserva.', 'error'),
        });
      }
    });
  }

  // =============== Data ===============
private loadReservations() {
  this.reservationInfra.getAllReservations().subscribe({
    next: (data) => {
      // 🔥 Filtrar: excluir CHECKED_OUT
      this.rowData = data.filter(r =>
        String(r.estado).toUpperCase() !== 'CHECKED_OUT'
      );

    },
    error: (err) => console.error('Error al cargar reservas:', err),
  });
}

openRowActions(reserva: Reserva) {
  Swal.fire({
    title: `Opciones — Reserva #${reserva.id}`,
    html: `
      <div class="flex flex-col gap-2 text-left">
        <button id="act-edit"      class="w-full text-left px-3 py-2 rounded-lg ring-1 ring-slate-300 hover:bg-slate-50">✏️ Editar</button>
        <button id="act-checkin"   class="w-full text-left px-3 py-2 rounded-lg ring-1 ring-emerald-300 hover:bg-emerald-50">✅ Check-in</button>
        <button id="act-checkout"  class="w-full text-left px-3 py-2 rounded-lg ring-1 ring-amber-300 hover:bg-amber-50">🧾 Check-out</button>
        <button id="act-extend"    class="w-full text-left px-3 py-2 rounded-lg ring-1 ring-indigo-300 hover:bg-indigo-50">⏱️ Agregar horas</button>
        <button id="act-delete"    class="w-full text-left px-3 py-2 rounded-lg ring-1 ring-rose-300 hover:bg-rose-50">🗑️ Eliminar</button>
      </div>
    `,
    showConfirmButton: false,
    didOpen: () => {
      const $ = (id: string) => document.getElementById(id)!;
      $('act-edit')    .addEventListener('click', () => { this.onEdit(reserva);    Swal.close(); });
      $('act-checkin') .addEventListener('click', () => { this.onCheckIn(reserva); Swal.close(); });
      $('act-checkout').addEventListener('click', () => { this.onCheckOut(reserva);Swal.close(); });
      $('act-extend')  .addEventListener('click', () => { this.onExtend(reserva);  Swal.close(); });
      $('act-delete')  .addEventListener('click', () => { this.onDelete(reserva);  Swal.close(); });
    }
  });
}
}
