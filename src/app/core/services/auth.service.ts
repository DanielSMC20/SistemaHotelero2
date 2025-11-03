// src/app/core/auth/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, catchError } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { env } from '../environments/environment';

export type Rol = 'ADMIN' | 'RECEPCIONISTA' | 'GERENTE';

export interface UsuarioSesion {
  id?: number;
  username?: string;
  usuario?: string;
  nombres?: string;
  apellidos?: string;
  pais?: string;
  role: Rol;            // 👈 un solo rol (lo que manda tu backend)
  token?: string;
  [k: string]: any;
}

export interface ForgotResponse {
  message?: string;
  devToken?: string;   // opcional en DEV
}

const API = env.API_AUTH;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UsuarioSesion | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  // Normaliza string -> Rol
  private normalizeRole(roleStr: any): Rol {
    const v = String(roleStr ?? '').toUpperCase().trim().replace(/^ROLE_/, '');
    if (v === 'ADMIN') return 'ADMIN';
    if (v === 'RECEPCION' || v === 'RECEPCIONISTA') return 'RECEPCIONISTA';
    if (v === 'GERENTE' || v === 'GERENCIA') return 'GERENTE';
    // por defecto si llega algo raro
    return 'RECEPCIONISTA';
  }

  // === Login ===
  login(username: string, password: string): Observable<any> {
    return this.http.post<{ token: string; usuario: any }>(
      `${API}/login`,
      { username, password },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    ).pipe(
      tap((resp) => {
        if (!resp?.token) return;

        const role = this.normalizeRole(resp.usuario?.role);
        const userSesion: UsuarioSesion = {
          ...resp.usuario,
          username: resp.usuario?.usuario ?? resp.usuario?.username ?? resp.usuario?.email,
          role,
          token: resp.token,
        };

        localStorage.setItem('token', resp.token);
        localStorage.setItem('currentUser', JSON.stringify(userSesion));
        this.currentUserSubject.next(userSesion);
      }),
      catchError((error) => {
        console.error('Error en login:', error);
        this.logout();
        return of(error);
      })
    );
  }

  // === Restaurar sesión (tolerante en DEV) ===
  restoreSession(): void {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');

    if (!storedUser) {
      this.currentUserSubject.next(null);
      return;
    }

    try {
      const raw = JSON.parse(storedUser);
      const role = this.normalizeRole(raw?.role);

      const userSesion: UsuarioSesion = {
        ...raw,
        role,
        token: token ?? undefined,
      };

      // No tumbamos sesión por token en DEV; la UI necesita el usuario
      this.currentUserSubject.next(userSesion);
    } catch {
      this.currentUserSubject.next(null);
    }
  }

  // === Token helpers ===
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  get isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && this.isTokenValid(token);
  }

  private isTokenValid(token: string): boolean {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return true; // DEV: considera válido si no hay payload

      const payload = JSON.parse(atob(payloadPart));

      if (typeof payload?.exp === 'number') {
        return payload.exp * 1000 - 30_000 > Date.now(); // margen 30s
      }
      return true; // DEV: si no hay exp, considéralo válido
    } catch {
      return true; // DEV: tolerante ante tokens dummy
    }
  }

  // === Logout ===
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // === Usuario actual ===
  get currentUser(): UsuarioSesion | null {
    return this.currentUserSubject.value;
  }

  // === Autorización (role único) ===
  hasRol(rol: Rol): boolean {
    return (this.currentUser?.role ?? '').toUpperCase().trim() === rol.toUpperCase().trim();
  }

  hasAnyRol(roles: Rol[]): boolean {
    const current = (this.currentUser?.role ?? '').toUpperCase().trim();
    return roles.map(r => r.toUpperCase().trim()).includes(current);
  }

  // === Opcional: reset password ===
  requestPasswordReset(emailOrUser: string) {
    return this.http.post<ForgotResponse>(
      `${API}/auth/forgot`,
      { emailOrUser },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }

  resetPassword(token: string, newPassword: string) {
    return this.http.post(
      `${API}/auth/reset`,
      { token, newPassword },
      { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
    );
  }
}
