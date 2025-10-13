import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community'; // 👈 NUEVO
import Swal from 'sweetalert2';

ModuleRegistry.registerModules([AllCommunityModule]);

interface Guest {
  id: number;
  nombre: string;
  dni: string;
  telefono: string;
  email: string;
  fechaRegistro: string;
}

@Component({
  selector: 'app-guest-list',
  standalone: true,
  imports: [CommonModule, RouterModule, AgGridAngular],
  templateUrl: './guest-list.component.html',
  styleUrls: ['./guest-list.component.css'],
})
export class GuestListComponent implements OnInit {
  ngOnInit(): void { }

  columnDefs: ColDef<Guest>[] = [
    { headerName: 'ID', field: 'id', width: 80, cellStyle: { 'text-align': 'center' } },
    { headerName: 'Nombres y apellidos', field: 'nombre' },
    { headerName: 'DNI', field: 'dni' },
    { headerName: 'Teléfono', field: 'telefono' },
    { headerName: 'Email', field: 'email' },
    { headerName: 'Fecha registro', field: 'fechaRegistro' },
    {
      headerName: 'Acciones',
      cellRenderer: (params: any) => {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.justifyContent = 'center';
        container.style.gap = '8px';

        const editBtn = document.createElement('button');
        editBtn.innerText = 'Editar';
        editBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-1 px-3 rounded-lg shadow-sm transition-all duration-200';
        editBtn.addEventListener('click', () => {
          params.context.componentParent.editar(params.data);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Eliminar';
        deleteBtn.className = 'bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-1 px-3 rounded-lg shadow-sm transition-all duration-200';
        deleteBtn.addEventListener('click', () => {
          params.context.componentParent.eliminar();
        });

        container.appendChild(editBtn);
        container.appendChild(deleteBtn);
        return container;
      },
      width: 230,
      cellStyle: { 'text-align': 'center' },
    }


  ];

  rowData: Guest[] = [
    {
      id: 1,
      nombre: 'Saul Espino Carhuayo ',
      dni: '72848724',
      telefono: '950788996',
      email: 'espinosaul2003@gmail.com',
      fechaRegistro: '11/10/2025',
    },
     {
      id: 2,
      nombre: 'Andrea Sayritupac Ruiz',
      dni: '8784284',
      telefono: '65117865',
      email: 'cbuybc@gmail.com',
      fechaRegistro: '12/10/2025',
    },
  ];
  gridOptions = {
    context: { componentParent: this }
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
        <input id="nombre" class="swal2-input" placeholder="Nombre" value="${guest.nombre}" style="width:100%">

        <label><strong>DNI</strong></label>
        <input id="dni" class="swal2-input" placeholder="DNI" value="${guest.dni}" style="width:100%">

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
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        guest.nombre = result.value.nombre;
        guest.dni = result.value.dni;
        guest.telefono = result.value.telefono;
        guest.email = result.value.email;

        Swal.fire({
          icon: 'success',
          title: '¡Actualizado!',
          text: 'Los datos del huésped fueron actualizados correctamente.',
          showConfirmButton: false,
          timer: 1500
        });
      }
    });
  }


  eliminar() {
    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger"
      },
      buttonsStyling: true
    });
    swalWithBootstrapButtons.fire({
      title: "¿Estas seguro de eliminar este usuario?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, eliminar",
      cancelButtonText: "No, cancelar!",
      
      reverseButtons: true
    }).then((result) => {
      if (result.isConfirmed) {
        swalWithBootstrapButtons.fire({
          title: "Elinado!",
          text: "El usuario se ha eliminado",
          icon: "success"
        });
      } else if (
        /* Read more about handling dismissals below */
        result.dismiss === Swal.DismissReason.cancel
      ) {
        swalWithBootstrapButtons.fire({
          title: "Cancelado",
          icon: "error"
        });
      }
    });
  }
}
