import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import Swal from 'sweetalert2';
import { GuestApplication } from '../../application/guests.application.ts';
import { Guest } from '../../domain/guests.interface';
import { GuestsInfraestructure } from '../../infraestructure/guests.infraestructure';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-guest-list',
  standalone: true,
  imports: [CommonModule, RouterModule, AgGridAngular],
  templateUrl: './guest-list.component.html',
  styleUrls: ['./guest-list.component.css'],
})
export class GuestListComponent implements OnInit {
  guests: Guest[] = [];
  rowData: Guest[] = [];
  p: any;

  gridApi: any;
  gridColumnApi: any;

  // 🔹 Definición de columnas con formatos y ancho mínimo
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
      cellRenderer: (p: { value: any; data: { documento: any; }; }) => `
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-700 font-semibold">${(p.value || '?').charAt(0)}</div>
          <div class="leading-tight">
            <div class="font-medium text-gray-900">${p.value || '—'}</div>
          </div>
        </div>
      `
    },
    { headerName: 'DNI', field: 'documento', maxWidth: 160 },
    { headerName: 'Teléfono', field: 'telefono', maxWidth: 180 },
    {
      headerName: 'Email',
      field: 'email',
      minWidth: 260,
      cellRenderer: (p: { value: any; }) =>
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
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5h2m-1 0v14m7-7H5"/></svg>
            Editar
          </span>`;
        editBtn.className =
          'bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-1.5 px-3 rounded-lg shadow-sm';
        editBtn.addEventListener('click', () => params.context.componentParent.editar(params.data));

        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = `
          <span class="inline-flex items-center gap-1">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>
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

  // 🔹 GridOptions con paginación, filtros flotantes y estados
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
    getRowId: (params: any) => params.data.documento, // clave única
  };

  constructor(
    private GET_HUESPEDES: GuestApplication,
    private guestsInfraestructure: GuestsInfraestructure
  ) {}

  ngOnInit(): void {
    this.loadGuests();
  }

  onGridReady(params: any) {
    this.gridApi = params.api;
    this.gridColumnApi = params.columnApi;
  }

  // 🔹 Búsqueda global
  onQuickFilter(ev: Event) {
    const val = (ev.target as HTMLInputElement).value ?? '';
    this.gridApi?.setQuickFilter(val);
  }

  // 🔹 Exportar CSV
  exportarCSV() {
    this.gridApi?.exportDataAsCsv({
      fileName: 'huespedes.csv',
      processCellCallback: (p: any) => (p.value ?? '').toString(),
    });
  }

  private loadGuests(): void {
    this.GET_HUESPEDES.execute().subscribe({
      next: (data) => {
        this.rowData = data;
      },
      error: (err) => console.error('Error al cargar huéspedes:', err),
    });
  }

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

        <label><strong>DNI</strong></label>
        <input id="dni" class="swal2-input" placeholder="DNI" value="${guest.documento}" style="width:100%">

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
            // Actualiza solo en memoria
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

  

  registrar() {
    Swal.fire({
      title: 'Registrar nuevo huésped',
      width: 600,
      padding: '2em',
      color: '#333',
      background: '#fff',
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      focusConfirm: false,
      html: `
      <div style="display:flex; flex-direction:column; gap:10px; text-align:left">
        <label><strong>Nombre completo</strong></label>
        <input id="nombre" class="swal2-input" placeholder="Nombre completo" style="width:100%">

        <label><strong>DNI</strong></label>
        <input id="dni" class="swal2-input" placeholder="DNI" maxlength="8" style="width:100%">

        <label><strong>Teléfono</strong></label>
        <input id="telefono" class="swal2-input" placeholder="Teléfono" style="width:100%">

        <label><strong>Email</strong></label>
        <input id="email" class="swal2-input" placeholder="Correo electrónico" style="width:100%">
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

        // Validaciones simples
        if (!/^\d{8}$/.test(dni)) {
          Swal.showValidationMessage('⚠️ El DNI debe tener 8 dígitos');
          return;
        }
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          Swal.showValidationMessage('⚠️ El email no es válido');
          return;
        }

        return { nombre, dni, telefono, email };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        const nuevoHuesped = result.value;

        // 👉 Aquí podrías llamar a tu servicio:
        // this.guestsService.createGuest(nuevoHuesped).subscribe(() => { ... });

        Swal.fire({
          icon: 'success',
          title: '¡Registrado!',
          text: 'El huésped fue agregado correctamente.',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  }


}