import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community'; // 👈 NUEVO
import Swal from 'sweetalert2';
import { GuestApplication } from '../../application/guests.application.ts';
import { Guest } from '../../domain/guests.interface';

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

  constructor(private getAllGuests: GuestApplication) { }

  ngOnInit(): void {
    this.getAllGuests.execute().subscribe({
      next: (data) => this.guests = data,
      error: (err) => console.error('Error al obtener huéspedes:', err)
    });
  }






  columnDefs: ColDef<Guest>[] = [
    {headerName: 'ID',field: 'id', width: 80,cellStyle: { 'text-align': 'center' }, },
    { headerName: 'Nombres y apellidos', field: 'nombresCompletos' },
    { headerName: 'DNI', field: 'documento' },
    { headerName: 'Teléfono', field: 'telefono' },
    { headerName: 'Email', field: 'email' },
    {
      headerName: 'Acciones',
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.gap = '8px';

        const editBtn = document.createElement('button');
        editBtn.innerText = 'Editar';
        editBtn.className =
          'bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1 px-3 rounded-lg shadow-sm transition-all duration-200';
        editBtn.addEventListener('click', () => {
          params.context.componentParent.editar(params.data);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Eliminar';
        deleteBtn.className =
          'bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-1 px-3 rounded-lg shadow-sm transition-all duration-200';
        deleteBtn.addEventListener('click', () => {
          params.context.componentParent.eliminar();
        });

        container.appendChild(editBtn);
        container.appendChild(deleteBtn);
        return container;
      },
      width: 230,
      cellStyle: { 'text-align': 'center' },
    },
  ];

  rowData: Guest[] = [
    {
      id: 1,
      nombresCompletos: 'Saul Espino Carhuayo ',
      documento: '72848724',
      telefono: '950788996',
      email: 'espinosaul2003@gmail.com',

    },
    {
     id: 2,
      nombresCompletos: 'Andrea Sayritupac Ruiz',
      documento: '8784284',
      telefono: '65117865',
      email: 'cbuybc@gmail.com',
    },
  ];
  gridOptions = {
    context: { componentParent: this },
  };

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
        const nombre = (
          document.getElementById('nombre') as HTMLInputElement
        ).value.trim();
        const dni = (
          document.getElementById('dni') as HTMLInputElement
        ).value.trim();
        const telefono = (
          document.getElementById('telefono') as HTMLInputElement
        ).value.trim();
        const email = (
          document.getElementById('email') as HTMLInputElement
        ).value.trim();

        if (!nombre || !dni || !telefono || !email) {
          Swal.showValidationMessage('⚠️ Todos los campos son obligatorios');
          return;
        }

        return { nombre, dni, telefono, email };
      },
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        guest.nombresCompletos = result.value.nombre;
        guest.email = result.value.email;
        guest.telefono = result.value.telefono;
        guest.documento = result.value.dni;
        

        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'Los datos del huésped fueron actualizados correctamente.',
          showConfirmButton: false,
          timer: 1500,
        });
      }
    });
  }

  eliminar() {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: 'btn btn-success',
        cancelButton: 'btn btn-danger',
      },
      buttonsStyling: true,
    });
    swalWithBootstrapButtons
      .fire({
        title: '¿Estas seguro de eliminar este usuario?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Si, eliminar',
        cancelButtonText: 'No, cancelar!',

        reverseButtons: true,
      })
      .then((result) => {
        if (result.isConfirmed) {
          swalWithBootstrapButtons.fire({
            title: 'Elinado!',
            text: 'El usuario se ha eliminado',
            icon: 'success',
          });
        } // else if (result?.dismiss == Swal.DismissReason.cancel) {
        //   swalWithBootstrapButtons.fire({
        //     title: 'Cancelado',
        //     icon: 'error',
        //   });
        // }
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
