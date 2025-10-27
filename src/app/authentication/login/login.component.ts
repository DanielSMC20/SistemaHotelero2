import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthUser } from '../../core/models/models';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  showPassword = false;


  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient, 
  ) {}

  ngOnInit(): void {
    this.createForm();

    if (this.authService.isAuthenticated) {
      this.redirectBasedOnRole();
    }
  }

  createForm(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }
  onSubmit(): void {
  if (this.loginForm.invalid) {
    this.errorMessage = 'Por favor completa todos los campos correctamente';
    return;
  }

  this.loading = true;
  this.errorMessage = '';

  const { username, password, rememberMe } = this.loginForm.value;

  this.authService.login(username, password).subscribe({
    next: () => {

      this.loading = false;
      this.redirectBasedOnRole();
    },
    error: (err) => {
      this.loading = false;
      this.errorMessage = err?.error?.message || 'Usuario o contraseña incorrectos';
    }
  });
}


private redirectBasedOnRole(): void {
  const user = this.authService.currentUser;

  if (!user) {
    this.router.navigate(['/layout/dashboard']);
    return;
  }

  switch (user.role) {
    case 'RECEPCIONISTA':
      this.router.navigate(['/layout/checkin']);   // 👈 con prefijo
      break;
    case 'ADMIN':
    case 'GERENTE':
    default:
      this.router.navigate(['/layout/dashboard']); // 👈 con prefijo
      break;
  }
}


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  get username() {
    return this.loginForm.get('username');
  }

  get password() {
    return this.loginForm.get('password');
  }

  openForgot(evt: Event): void {
    evt.preventDefault();
    const emailOrUser = prompt('Ingresa tu email o usuario para recuperar tu contraseña:');
    if (!emailOrUser) { return; }

    this.authService.requestPasswordReset(emailOrUser).subscribe({
      next: (resp) => {
        // En DEV, tu backend devuelve devToken. Lo aprovechamos:
        const devToken = resp?.devToken;
        if (devToken) {
          alert(`(DEV) Usa este token para resetear: ${devToken}\nTe llevaré a la pantalla para cambiar tu contraseña.`);
          this.router.navigate(['/reset-password'], { queryParams: { token: devToken } });
        } else {
          alert('Si existe una cuenta asociada, recibirás un correo con instrucciones.');
        }
      },
      error: () => {
        alert('Si existe una cuenta asociada, recibirás un correo con instrucciones.');
      },
    });
  }


}
