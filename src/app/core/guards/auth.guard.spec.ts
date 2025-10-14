import { Injectable } from '@angular/core';
import {
  CanActivate,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  currentUserSubject: any;
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean {
  if (this.authService.isAuthenticated) {
    const requiredRole = route.data['role'];
    const currentUser = this.authService.currentUser;

    if (requiredRole && currentUser?.role !== requiredRole) {
      this.router.navigate(['/dashboard']);
      return false;
    }

    return true;
  }

  this.router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });
  return false;
}

  initAuth(): void {
  const token = sessionStorage.getItem('token');
  const storedUser = sessionStorage.getItem('currentUser');

  if (token && storedUser && !this.currentUserSubject.value) {
    this.currentUserSubject.next(JSON.parse(storedUser));
  }
}


}
