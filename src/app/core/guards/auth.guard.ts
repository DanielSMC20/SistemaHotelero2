import {
  CanActivateFn,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/enums';

export const AuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const requiredRoles: Rol[] | undefined = route.data?.['roles'];
  if (!requiredRoles || requiredRoles.length === 0) return true;

  const userRole = auth.currentUser?.role as Rol | undefined;

  if (userRole && requiredRoles.includes(userRole)) return true;

  return router.createUrlTree(['/layout/dashboard']);
};
