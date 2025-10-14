import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';

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

  private readonly TEST_CREDENTIALS: {
    [key: string]: { password: string; user: User };
  } = {
    admin: {
      password: 'admin123',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@hotel.com',
        role: 'admin',
        fullName: 'Administrador Principal',
      },
    },
    receptionist: {
      password: 'recep123',
      user: {
        id: 2,
        username: 'receptionist',
        email: 'recep@hotel.com',
        role: 'receptionist',
        fullName: 'Recepción Hotel',
      },
    },
    manager: {
      password: 'gerente123',
      user: {
        id: 3,
        username: 'manager',
        email: 'manager@hotel.com',
        role: 'manager',
        fullName: 'Gerente Hotel',
      },
    },
  };

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
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
    if (this.loginForm.valid) {
      this.loading = true;
      this.errorMessage = '';

      const { username, password } = this.loginForm.value;

      console.log('Login: Intentando con usuario:', username);

      setTimeout(() => {
        if (
          this.TEST_CREDENTIALS[username] &&
          this.TEST_CREDENTIALS[username].password === password
        ) {
          console.log('Login: Credenciales correctas');
          const userData = this.TEST_CREDENTIALS[username];

          const loginResponse = {
            user: userData.user,
            token: 'fake-jwt-token-' + Date.now(),
          };

          try {
            this.authService.loginDemo(userData.user, loginResponse.token);

            console.log('Login: loginDemo ejecutado');

            setTimeout(() => {
              console.log('Login: Verificando autenticación...');
              console.log(
                'Login: isAuthenticated:',
                this.authService.isAuthenticated
              );
              console.log('Login: currentUser:', this.authService.currentUser);

              if (this.authService.isAuthenticated) {
                console.log('Login: Autenticación exitosa, redirigiendo...');
                this.redirectBasedOnRole();
              } else {
                console.log('Login: ERROR - Autenticación falló');
                this.errorMessage =
                  'Error al iniciar sesión. Intenta nuevamente.';
                this.loading = false;
              }
            }, 100);
          } catch (error) {
            console.error('Login: Error en loginDemo:', error);
            this.errorMessage = 'Error interno. Intenta de nuevo.';
            this.loading = false;
          }
        } else {
          console.log('Login: Credenciales incorrectas');
          this.errorMessage = 'Usuario o contraseña incorrectos';
          this.loading = false;
        }
      }, 1500);
    } else {
      console.log('Login: Formulario inválido');
      this.errorMessage = 'Por favor completa todos los campos correctamente';
    }
  }

  private redirectBasedOnRole(): void {
    const user = this.authService.currentUser;
    console.log(
      'Login: Redirigiendo usuario:',
      user?.username,
      'con rol:',
      user?.role
    );

    if (user) {
      if (user.role === 'admin') {
        this.router.navigate(['/dashboard']);
      } else if (user.role === 'receptionist') {
        this.router.navigate(['/checkin']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } else {
      console.log('Login: No hay usuario, yendo a dashboard por defecto');
      this.router.navigate(['/dashboard']);
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

  showTestCredentials(): void {
    console.log('Login: Mostrando credenciales de prueba');
    alert(`
🚀 USUARIOS DE PRUEBA DISPONIBLES:

🔐 ADMINISTRADOR (Acceso completo):
• Usuario: admin
• Contraseña: admin123

👩‍💼 RECEPCIONISTA (Check-in/out):
• Usuario: receptionist
• Contraseña: recep123

👨‍💼 GERENTE (Reportes y gestión):
• Usuario: manager
• Contraseña: gerente123

💡 ¡Prueba con cualquiera de estos usuarios!
Luego podrás navegar por todo el sistema hotelero.

📝 NOTA: Si tienes problemas, revisa la consola (F12) para ver los logs de debug.
    `);
  }
}
