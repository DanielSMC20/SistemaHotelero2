import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import Swal from 'sweetalert2';
import { PhoneCodeApi, PhoneCodeUI } from '../../../../core/models/models';
import { Guest } from '../../domain/guests.interface';
import { GuestApplication } from '../../application/guests.application.ts';
import { GuestsInfraestructure } from '../../infraestructure/guests.infraestructure';

ModuleRegistry.registerModules([AllCommunityModule]);

// 👇 Interface local para los códigos de país


@Component({
  selector: 'app-guest-list',
  standalone: true,
  imports: [CommonModule, RouterModule, AgGridAngular, FormsModule],
  templateUrl: './guest-list.component.html',
  styleUrls: ['./guest-list.component.css'],
})
export class GuestListComponent implements OnInit {

  guests: Guest[] = [];
  rowData: Guest[] = [];
  p: any;

  gridApi: any;
  gridColumnApi: any;

  // 🔹 Códigos de país
  phoneCodes: PhoneCodeApi[] = [];
  loadingCodes = false;

  // 🔹 Estado del modal de registro
  showRegisterModal = false;

  registerForm: {
    tipoPersona: 'NATURAL' | 'JURIDICA';
    documento: string;
    nombresCompletos: string;
    razonSocial: string;
    telefono: string;
    email: string;
    phoneCountryCode: string;
  } = {
    tipoPersona: 'NATURAL',
    documento: '',
    nombresCompletos: '',
    razonSocial: '',
    telefono: '',
    email: '',
    phoneCountryCode: '+51',
  };

  // 🔹 Definición de columnas
  columnDefs: ColDef<Guest>[] = [
    {
      headerName: 'ID',
      field: 'id',
      maxWidth: 100,
      valueFormatter: p => p.value ?? '—',
      cellClass: 'text-center'
    },
    {
      headerName: 'Nombres y apellidos',
      field: 'nombresCompletos',
      minWidth: 260,
      cellRenderer: (p: any) => `
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-700 font-semibold">
            ${(p.value || '?').charAt(0)}
          </div>
          <div class="leading-tight">
            <div class="font-medium text-gray-900">${p.value || '—'}</div>
          </div>
        </div>
      `
    },
    { headerName: 'DNI / RUC', field: 'documento', maxWidth: 160 },
    { headerName: 'Teléfono', field: 'telefono', maxWidth: 180 },
    {
      headerName: 'Email',
      field: 'email',
      minWidth: 260,
      cellRenderer: (p: any) =>
        p.value
          ? `<a class="text-blue-600 hover:underline" href="mailto:${p.value}">${p.value}</a>`
          : '—'
    },
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
        editBtn.innerHTML = `
          <span class="inline-flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5h2m-1 0v14m7-7H5"/>
            </svg>
            Editar
          </span>`;
        editBtn.className =
          'bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm';
        editBtn.addEventListener('click', () => params.context.componentParent.editar(params.data));

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = `
          <span class="inline-flex items-center gap-1">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h2a2 2 0 012 2v2"/>
            </svg>
            Eliminar
          </span>`;
        deleteBtn.className =
          'bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm';
        deleteBtn.addEventListener('click', () => params.context.componentParent.eliminar(params.data));

        container.appendChild(editBtn);
        container.appendChild(deleteBtn);
        return container;
      },
      cellClass: 'text-center'
    },
  ];

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
      filter: true,
      floatingFilter: true,
      minWidth: 120,
    },
    overlayNoRowsTemplate:
      '<div class="text-gray-500">No hay datos para mostrar</div>',
    overlayLoadingTemplate:
      '<div class="text-gray-500">Cargando…</div>',
    getRowId: (params: any) => params.data.documento,
  };

  constructor(
    private GET_HUESPEDES: GuestApplication,
    private guestsInfraestructure: GuestsInfraestructure
  ) {}

  ngOnInit(): void {
    this.loadGuests();
    this.loadPhoneCodes();
  }

  private loadGuests(): void {
    this.GET_HUESPEDES.execute().subscribe({
      next: (data) => {
        this.rowData = data;
      },
      error: (err) => console.error('Error al cargar huéspedes:', err),
    });
  }

  private loadPhoneCodes(): void {
    this.loadingCodes = true;
    this.guestsInfraestructure.getPhoneCodes().subscribe({
      next: (res) => {
        this.phoneCodes = res;
        this.loadingCodes = false;
      },
      error: (err) => {
        console.error('Error al cargar códigos de país', err);
        this.loadingCodes = false;
      }
    });
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  onQuickFilter(ev: Event) {
    const val = (ev.target as HTMLInputElement).value ?? '';
    this.gridApi?.setQuickFilter(val);
  }

  exportarCSV() {
    this.gridApi?.exportDataAsCsv({
      fileName: 'huespedes.csv',
      processCellCallback: (p: any) => (p.value ?? '').toString(),
    });
  }

  // =======================
  // Modal registro
  // =======================

  openRegisterModal() {
    this.registerForm = {
      tipoPersona: 'NATURAL',
      documento: '',
      nombresCompletos: '',
      razonSocial: '',
      telefono: '',
      email: '',
      phoneCountryCode: this.phoneCodes.length > 0 ? this.phoneCodes[0].dialCode : '+51'
    };
    this.showRegisterModal = true;
  }

  closeRegisterModal() {
    this.showRegisterModal = false;
  }

  setTipoPersona(tipo: 'NATURAL' | 'JURIDICA') {
    this.registerForm.tipoPersona = tipo;
    this.registerForm.documento = '';
    this.registerForm.nombresCompletos = '';
    this.registerForm.razonSocial = '';
  }

onLookupDni() {
  const dni = this.registerForm.documento.trim();
  if (!/^\d{8}$/.test(dni)) {
    alert('El DNI debe tener 8 dígitos');
    return;
  }

  this.guestsInfraestructure.lookupDni(dni).subscribe({
    next: (resp: any) => {
      // A veces la API viene como { data: {...} } o directo
      const data = resp.data ?? resp;

      // De tu screenshot:
      // document_number, first_last_name, second_last_name, first_name, full_name
      const fullName =
        data.full_name ||
        `${data.first_last_name ?? ''} ${data.second_last_name ?? ''} ${data.first_name ?? ''}`.trim();

      if (fullName) {
        this.registerForm.nombresCompletos = fullName;
      }

      if (data.document_number) {
        this.registerForm.documento = data.document_number;
      }
    },
    error: (err) => {
      console.error(err);
      alert('No se pudo obtener datos desde RENIEC');
    },
  });
}

onLookupRuc() {
  const ruc = this.registerForm.documento.trim();
  if (!/^\d{11}$/.test(ruc)) {
    alert('El RUC debe tener 11 dígitos');
    return;
  }

  this.guestsInfraestructure.lookupRuc(ruc).subscribe({
    next: (resp: any) => {
      // Igual, puede venir como { data: {...} } o plano
      const data = resp.data ?? resp;

      // De tu screenshot:
      // razon_social, numero_documento, estado, condicion, etc.
      const razon =
        data.razon_social ||
        data.nombre_o_razon_social ||
        data.nombre ||
        '';

      if (razon) {
        this.registerForm.razonSocial = razon;
      }

      if (data.numero_documento) {
        this.registerForm.documento = data.numero_documento;
      }
    },
    error: (err) => {
      console.error(err);
      alert('No se pudo obtener datos desde SUNAT');
    },
  });
}

  submitRegister() {
    const f = this.registerForm;

    // ===== VALIDACIONES BÁSICAS =====
    if (!f.telefono || !f.email || !f.documento) {
      alert('Documento, teléfono y email son obligatorios');
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) {
      alert('El email no es válido');
      return;
    }

    if (!/^\d{6,12}$/.test(f.telefono)) {
      alert('El teléfono debe tener entre 6 y 12 dígitos');
      return;
    }

    if (f.tipoPersona === 'NATURAL') {
      if (!/^\d{8}$/.test(f.documento)) {
        alert('El DNI debe tener 8 dígitos');
        return;
      }
      if (!f.nombresCompletos.trim()) {
        alert('El nombre completo es obligatorio para persona natural');
        return;
      }
    } else {
      if (!/^\d{11}$/.test(f.documento)) {
        alert('El RUC debe tener 11 dígitos');
        return;
      }
      if (!f.razonSocial.trim()) {
        alert('La razón social es obligatoria para empresa');
        return;
      }
    }

    // ===== DTO que espera CustomerUpsertRequest =====
    const payload: any = {
      documento: f.documento,
      tipoDocumento: f.tipoPersona === 'NATURAL' ? 'DNI' : 'RUC',
      nombresCompletos:
        f.tipoPersona === 'NATURAL'
          ? f.nombresCompletos
          : f.razonSocial,
      email: f.email,
      phoneCountryCode: f.phoneCountryCode || '+51',
      telefono: f.telefono,
      telefonoE164: null,
    };

    this.guestsInfraestructure.createGuest(payload).subscribe({
      next: (created: any) => {
        const displayName =
          created.nombresCompletos ?? created.razonSocial ?? '—';

        const nuevoGuest: Guest = {
          id: created.id,
          nombresCompletos: displayName,
          email: created.email,
          telefono: created.telefono,
          documento: created.documento,
        };

        this.gridApi?.applyTransaction({ add: [nuevoGuest] });
        this.closeRegisterModal();
      },
      error: (err) => {
        console.error(err);
        alert(err.error?.message || 'No se pudo registrar el cliente');
      },
    });
  }

  // =======================
  // Editar / eliminar
  // =======================

  editar(guest: Guest) {
    Swal.fire({
      title: 'Editar huésped',
      width: 600,
      padding: '2em',
      color: '#333',
      background: '#fff',
      showCancelButton: true,
      confirmButtonText: 'Guardar cambios',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      html: `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left">
        <label><strong>Nombre completo</strong></label>
        <input id="nombre" class="swal2-input" placeholder="Nombre" value="${guest.nombresCompletos}" style="width:100%">

        <label><strong>DNI / RUC</strong></label>
        <input id="dni" class="swal2-input" placeholder="Documento" value="${guest.documento}" style="width:100%">

        <label><strong>Teléfono</strong></label>
        <input id="telefono" class="swal2-input" placeholder="Teléfono" value="${guest.telefono}" style="width:100%">

        <label><strong>Email</strong></label>
        <input id="email" class="swal2-input" placeholder="Email" value="${guest.email}" style="width:100%">
      </div>
    `,
      preConfirm: () => {
        const nombre = (document.getElementById('nombre') as HTMLInputElement).value.trim();
        const dni = (document.getElementById('dni') as HTMLInputElement).value.trim();
        const telefono = (document.getElementById('telefono') as HTMLInputElement).value.trim();
        const email = (document.getElementById('email') as HTMLInputElement).value.trim();

        if (!nombre || !dni || !telefono || !email) {
          Swal.showValidationMessage('⚠️ Todos los campos son obligatorios');
          return;
        }

        return { nombre, dni, telefono, email };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const updatedGuest: Guest = {
          ...guest,
          nombresCompletos: result.value.nombre,
          documento: result.value.dni,
          telefono: result.value.telefono,
          email: result.value.email,
        };

        this.guestsInfraestructure.getEditGuest(guest.documento, updatedGuest).subscribe({
          next: () => {
            this.gridApi.applyTransaction({ update: [updatedGuest] });
            Swal.fire({
              icon: 'success',
              title: '¡Actualizado!',
              text: 'Los datos del huésped fueron actualizados correctamente.',
              showConfirmButton: false,
              timer: 1500,
            });
          },
          error: (err) => {
            console.error(err);
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo actualizar el huésped.',
            });
          },
        });
      }
    });
  }

  eliminar(guest: Guest) {
    Swal.fire({
      title: '¿Eliminar huésped?',
      text: `Se eliminará a ${guest.nombresCompletos}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((res) => {
      if (res.isConfirmed) {
        // this.guestsInfraestructure.deleteGuest(guest.documento).subscribe(...)

        this.gridApi.applyTransaction({ remove: [guest] });
        Swal.fire('Eliminado', 'El huésped fue eliminado.', 'success');
      }
    });
  }
}
