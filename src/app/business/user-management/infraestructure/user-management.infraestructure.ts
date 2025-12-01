import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserInfrastructure {

  private readonly API1 = environment.API_URL;
  

  private API = 'http://localhost:8080/auth';

  constructor(private http: HttpClient) {}

    private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('token');
      return new HttpHeaders({
        Authorization: `Bearer ${token ?? ''}`,
        'Content-Type': 'application/json',
      });
    }
  register(body: any): Observable<any> {
    return this.http.post(`${this.API}/register`, body);
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/users`);
  }

  updateUser(id: number, body: any): Observable<any> {
    return this.http.put(`${this.API}/users/${id}`, body);
  }

  changeEstado(id: number, estado: number): Observable<any> {
    return this.http.patch(`${this.API}/users/${id}/estado`, { estado });
  }

    lookupDni(numero: string) {
    return this.http.get<any>(`${this.API1}/external/reniec-dni`, {
      params: { numero },
      headers: this.getAuthHeaders(),
    });
  }
  lookupRuc(numero: string) {
    return this.http.get<any>(`${this.API1}/external/sunat-ruc`, {
      params: { numero },
      headers: this.getAuthHeaders(),
    });
  }
}
