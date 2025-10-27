import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors

} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthRecoveryService } from '../../core/services/auth-recovery.service';
import { RouterModule } from '@angular/router';   // <-- importa esto



function match(controlName: string, confirmName: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    const c = group.get(controlName);
    const k = group.get(confirmName);
    if (!c || !k) return null;
    return c.value === k.value ? null : { notMatch: true };
  };
}

@Component({
  standalone: true,
  selector: 'app-reset-password',
  imports: [CommonModule, ReactiveFormsModule,RouterModule], // << sin FormsModule
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private recovery = inject(AuthRecoveryService);

  loading = false;
  hide = true;

  form = this.fb.group({
    token: ['', Validators.required],                        // << control para el token
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: match('newPassword', 'confirmPassword') });
tokenAuto: any;

  ngOnInit(): void {
     const t = this.route.snapshot.queryParamMap.get('token');
  if (t) {
    this.form.patchValue({ token: t });
    this.tokenAuto = true;
  }              // autocompleta token
  }

  get strength() {
    const pwd = this.form.controls.newPassword.value || '';
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return Math.min(100, (score / 5) * 100);
  }
  get strengthLabel() {
    const s = this.strength;
    if (s >= 80) return 'Fuerte';
    if (s >= 50) return 'Media';
    return 'Débil';
    }

  get canSubmit() {
    return this.form.valid && !this.loading;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading = true;
    const token = this.form.value.token!;
    const pass  = this.form.value.newPassword!;

    this.recovery.resetPassword(token, pass).subscribe({
      next: () => {
        this.loading = false;
        Swal.fire('Listo ✅', 'Tu contraseña fue actualizada.', 'success');
        this.router.navigateByUrl('/login');
      },
      error: (e) => {
        this.loading = false;
        Swal.fire('Ups', e?.error || 'Token inválido o expirado.', 'error');
      }
    });
  }
}
