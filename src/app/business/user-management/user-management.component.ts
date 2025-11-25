import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserInfrastructure } from './infraestructure/user-management.infraestructure';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
})
export class UserManagementComponent implements OnInit {

  form = {
    usuario: '',
    clave: '',
    nombres: '',
    apellidos: '',
    pais: '',
    role: ''   
  };

  constructor(private userInfra: UserInfrastructure) {}

  ngOnInit(): void {}

  registrarUsuario() {
    this.userInfra.register(this.form).subscribe({
      next: (res) => {
        console.log(res);
        Swal.fire('Listo ', 'Tu contraseña fue actualizada.', 'success');
      },
      error: (err) => {
        console.error(err);
        Swal.fire('Ups ! ', 'Hubo un problema al crear usuario :(', 'error');
      }
    });
  }
}
