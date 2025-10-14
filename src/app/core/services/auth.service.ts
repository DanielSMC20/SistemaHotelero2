import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap, catchError, pairs } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { env } from '../environments/environment';

const API = env.API_AUTH;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.restoreSession(); 
  }

  // 👉 Método de login
login(username: string, password: string): Observable<any> {
  return this.http
    .post<{ token: string; usuario: any }>(`${API}/login`, { username, password }, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    })
    .pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.usuario));
          this.currentUserSubject.next(response.usuario);
        }
      }),
      catchError((error) => {
        console.error('Error en login:', error);
        this.logout();
        return of(error);
      })
    );
}


  // 👉 Decodifica el token JWT
  private decodeUserFromToken(token: string): any {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.id || payload.userId,
        usuario: payload.usuario || payload.usuario,
        clave: payload.clave,
        role: payload.role ,
        nombres: payload.sub || payload.nombres,
        apellidos: payload.sub || payload.apellidos,
        pais: payload.sub || payload.pais
            };
    } catch (e) {
      console.error('Error decodificando token:', e);
      return null;
    }
  }

  // 👉 Restaura sesión al recargar la página
  restoreSession(): void {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');

    if (!token || !storedUser || storedUser === 'undefined' || storedUser === 'null') {
      this.logout();
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      this.currentUserSubject.next(user);
    } catch (e) {
      console.error('Error restaurando sesión:', e);
      this.logout();
    }
  }

  // 👉 Obtener token
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 👉 Saber si el usuario está autenticado
  get isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // 👉 Cerrar sesión
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  // 👉 Obtener el usuario actual
  get currentUser() {
    return this.currentUserSubject.value;
  }
}
