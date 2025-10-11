import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'receptionist' | 'manager';
  fullName: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'api/auth';
  public currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  get isAdmin(): boolean {
    return this.isAuthenticated && this.currentUser?.role === 'admin';
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}/login`, {
        username,
        password,
      })
      .pipe(
        map((response) => {
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          localStorage.setItem('token', response.token);
          this.currentUserSubject.next(response.user);
          return response;
        }),
        catchError((error) => {
          console.error('Error en login:', error);
          throw error;
        })
      );
  }

  loginDemo(userData: User, token: string): void {
    console.log('AuthService: loginDemo ejecutado para:', userData.username);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    localStorage.setItem('token', token);
    this.currentUserSubject.next(userData);
    console.log('AuthService: Usuario seteado:', this.currentUser);
    console.log('AuthService: isAuthenticated:', this.isAuthenticated);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  checkToken(): Observable<boolean> {
    const token = localStorage.getItem('token');
    if (!token) {
      return of(false);
    }

    return this.http
      .get<{ valid: boolean }>(`${this.API_URL}/verify`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .pipe(
        map((response) => response.valid),
        catchError(() => {
          this.logout();
          return of(false);
        })
      );
  }
}
