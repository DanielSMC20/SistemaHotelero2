// src/app/business/reports/infraestructure/report.infraestructure.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportInfrastructure {
  private readonly API_URL = 'http://localhost:8080/reports';

  constructor(private http: HttpClient) {}

  /** 🔹 Helper para adjuntar el token JWT */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /** 🔹 Endpoint: /reports/revenue */
  getRevenue(start: string, end: string): Observable<any[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    const headers = this.getAuthHeaders();

    return this.http.get<any[]>(`${this.API_URL}/revenue`, { params, headers });
  }

  /** 🔹 (Opcional) Endpoint: /reports/occupancy */
  getOccupancy(start: string, end: string): Observable<any[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    const headers = this.getAuthHeaders();

    return this.http.get<any[]>(`${this.API_URL}/occupancy`, { params, headers });
  }
}
