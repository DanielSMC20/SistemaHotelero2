import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { UserInfrastructure } from './infraestructure/user-management.infraestructure';

@Component({
  selector: 'app-user',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class UserManagementComponent implements OnInit {

  // -------------------------------
  // FORMULARIO DE REGISTRO
  // -------------------------------
  form = {
    usuario: '',
    clave: '',
    nombres: '',
    apellidos: '',
    pais: '',
    role: '',
    dni: ''        

  };

  loadingDni = false;


  // -------------------------------
  // LISTA DE USUARIOS
  // -------------------------------
  usuarios: any[] = [];
  filtro: string = '';

  // -------------------------------
  // MODAL DE EDICIÓN
  // -------------------------------
  mostrarModalEditar = false;
  editForm: any = {};
  usuarioSeleccionado: any = null;

  constructor(private userInfra: UserInfrastructure) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  // -------------------------------
  // LISTAR USUARIOS
  // -------------------------------
  cargarUsuarios() {
    this.userInfra.getAll().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (err) => console.error(err)
    });
  }

consultarDni() {
  const numero = (this.form.dni || '').trim();

  if (numero.length !== 8) {
    Swal.fire('Atención', 'Ingresa un DNI válido de 8 dígitos', 'warning');
    return;
  }

  this.loadingDni = true;

  this.userInfra.lookupDni(numero).subscribe({
    next: (res) => {
      // res tiene: document_number, first_last_name, second_last_name, first_name, full_name

      this.form.nombres = (res.first_name ?? '').trim();
      this.form.apellidos = `${res.first_last_name ?? ''} ${res.second_last_name ?? ''}`.trim();
    },
    error: () => {
      Swal.fire(
        'Error',
        'No se pudo consultar el DNI. Verifica el número o inténtalo de nuevo.',
        'error'
      );
    },
    complete: () => {
      this.loadingDni = false;
    }
  });
}


  abrirModalEditar(user: any) {
    this.usuarioSeleccionado = user;

    this.editForm = {
      usuario: user.usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      pais: user.pais,
      role: user.role
    };

    this.mostrarModalEditar = true;
  }

  cerrarModalEditar() {
    this.mostrarModalEditar = false;
    this.usuarioSeleccionado = null;
  }

  // -------------------------------
  // GUARDAR CAMBIOS (SIN CAMBIAR usuario NI clave)
  // -------------------------------
  guardarCambiosUsuario() {
    this.userInfra.updateUser(this.usuarioSeleccionado.id, this.editForm).subscribe({
      next: () => {
        Swal.fire('Actualizado', 'El usuario fue actualizado.', 'success');
        this.cerrarModalEditar();
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudieron guardar los cambios.', 'error');
      }
    });
  }

  // -------------------------------
  // CAMBIAR ESTADO (0 = INACTIVO, 1 = ACTIVO)
  // -------------------------------
  cambiarEstado(user: any) {

    const newState = user.estado === 1 ? 0 : 1;

    this.userInfra.changeEstado(user.id, newState).subscribe({
      next: (updated) => {
        user.estado = updated.estado;
        Swal.fire(
          'Listo',
          updated.estado === 1 ? 'Usuario activado.' : 'Usuario inhabilitado.',
          'success'
        );
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Error', 'No se pudo cambiar el estado.', 'error');
      }
    });
  }



// flags de modales
mostrarModalRegistro = false;

// abrir / cerrar registro
abrirModalRegistro() {
  // limpia el form antes
  this.form = {
    usuario: '',
    clave: '',
    nombres: '',
    apellidos: '',
    pais: '',
    role: '',
    dni: ''
  };
  this.mostrarModalRegistro = true;
}

cerrarModalRegistro() {
  this.mostrarModalRegistro = false;
}

// registrar (ahora cierra modal)
registrarUsuario() {
  this.userInfra.register(this.form).subscribe({
    next: () => {
      Swal.fire('Listo', 'Usuario registrado correctamente.', 'success');
      this.cerrarModalRegistro();
      this.cargarUsuarios();
    },
    error: (err) => {
      console.error(err);
      Swal.fire('Ups!', err.error?.message || 'No se pudo registrar el usuario.', 'error');
    }
  });
}


filterUsuario: string = '';
filterNombre: string = '';
filterRol: string = '';
filterEstado: string = ''; // '1', '0' o ''

filteredUsuarios() {
  return this.usuarios.filter(u => {
    // Usuario
    if (this.filterUsuario.trim()) {
      const term = this.filterUsuario.toLowerCase();
      const usuario = (u.usuario ?? '').toLowerCase();
      if (!usuario.includes(term)) return false;
    }

    // Nombre completo (nombres + apellidos)
    if (this.filterNombre.trim()) {
      const term = this.filterNombre.toLowerCase();
      const fullName = `${u.nombres ?? ''} ${u.apellidos ?? ''}`.toLowerCase();
      if (!fullName.includes(term)) return false;
    }

    // Rol
    if (this.filterRol) {
      if (u.role !== this.filterRol) return false;
    }

    // Estado (1 / 0)
    if (this.filterEstado !== '') {
      const est = Number(this.filterEstado);
      if (u.estado !== est) return false;
    }

    return true;
  });
}

}
