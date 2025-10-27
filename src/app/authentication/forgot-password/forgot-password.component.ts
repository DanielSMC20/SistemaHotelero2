// src/app/authentication/forgot-password/forgot-password.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AuthRecoveryService } from '../../core/services/auth-recovery.service';
import { RouterModule } from '@angular/router';   // <-- importa esto


@Component({
  standalone: true,
  selector: 'app-forgot-password',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
private fb = inject(FormBuilder);                // declarar primero

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = false;

  constructor(
    private recovery: AuthRecoveryService
  ) {}

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const email = this.form.value.email!;
    this.recovery.forgotPassword(email).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire('Listo ✅', 'Te enviamos un correo con el enlace de recuperación.', 'success');
      },
      error: (e) => {
        this.loading = false;
        Swal.fire('Ups', e?.error || 'No pudimos enviar el correo.', 'error');
      }
    });
  }
}
