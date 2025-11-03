import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service'; // ajusta la ruta si tu Auth está en /core/services

@Injectable({ providedIn: 'root' })
export class RoleLandingGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean | UrlTree {
    const role = (this.auth.currentUser?.role || '').toUpperCase();

    if (role === 'RECEPCIONISTA') {
      return this.router.createUrlTree(['/layout', 'reservations']);
    }
    // ADMIN o GERENTE (o vacío): Dashboard
    return this.router.createUrlTree(['/layout', 'dashboard']);
  }
}
