import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    // Verificar si hay usuario autenticado
    if (this.authService.isAuthenticated) {
      // Verificar roles si es necesario
      const requiredRole = route.data['role'];
      if (requiredRole && !this.authService.isAdmin) {
        // Redirigir si no tiene el rol requerido
        this.router.navigate(['/dashboard']);
        return false;
      }
      return true;
    }

    // No autenticado - redirigir a login
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
    return false;
  }
}
