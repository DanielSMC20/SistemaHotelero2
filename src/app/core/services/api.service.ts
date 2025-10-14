
import { env } from '../environments/environment'; // usa environment si prefieres
// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = env.API_BASE;

@Injectable({ providedIn: 'root' })
export class ApiService {
  getRoomById(id: number): Observable<import("./hotel.service").Room> {
    throw new Error('Method not implemented.');
  }
  constructor(private http: HttpClient) {}

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let h = new HttpHeaders({ 'Content-Type': 'application/json' });
    return token ? h.set('Authorization', `Bearer ${token}`) : h;
  }
  private toParams(q?: Record<string, any>) {
    let p = new HttpParams();
    if (q) Object.entries(q).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') p = p.set(k, String(v));
    });
    return p;
  }

  listCustomers(q?: any): Observable<any> { return this.http.get(`${API_BASE}/customers`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  getCustomer(id: number): Observable<any> { return this.http.get(`${API_BASE}/customers/${id}`, { headers: this.authHeaders() }); }
  getCustomerByDocumento(documento: string): Observable<any> { return this.http.get(`${API_BASE}/customers/by-document`, { headers: this.authHeaders(), params: this.toParams({ documento }) }); }
  createCustomer(body: any): Observable<any> { return this.http.post(`${API_BASE}/customers`, body, { headers: this.authHeaders() }); }
  updateCustomer(id: number, body: any): Observable<any> { return this.http.put(`${API_BASE}/customers/${id}`, body, { headers: this.authHeaders() }); }
  deleteCustomer(id: number): Observable<any> { return this.http.delete(`${API_BASE}/customers/${id}`, { headers: this.authHeaders() }); }

  listRooms(q?: any): Observable<any> { return this.http.get(`${API_BASE}/rooms`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  getRoom(id: number): Observable<any> { return this.http.get(`${API_BASE}/rooms/${id}`, { headers: this.authHeaders() }); }
  getRoomAvailability(q?: any) : Observable<any> { return this.http.get(`${API_BASE}/rooms/available`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  createRoom(body: any): Observable<any> { return this.http.post(`${API_BASE}/rooms`, body, { headers: this.authHeaders() }); }
  updateRoom(id: number, body: any): Observable<any> { return this.http.put(`${API_BASE}/rooms/${id}`, body, { headers: this.authHeaders() }); }
  deleteRoom(id: number): Observable<any> { return this.http.delete(`${API_BASE}/rooms/${id}`, { headers: this.authHeaders() }); }

  listReservations(q?: any): Observable<any> { return this.http.get(`${API_BASE}/reservations`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  getReservation(id: number): Observable<any> { return this.http.get(`${API_BASE}/reservations/${id}`, { headers: this.authHeaders() }); }
  createReservation(body: any): Observable<any> { return this.http.post(`${API_BASE}/reservations`, body, { headers: this.authHeaders() }); }
  createReservationWithCustomer(body: any): Observable<any> { return this.http.post(`${API_BASE}/reservations/with-customer`, body, { headers: this.authHeaders() }); }
  deleteReservation(id: number): Observable<any> { return this.http.delete(`${API_BASE}/reservations/${id}`, { headers: this.authHeaders() }); }

  listPayments(q?: any) { return this.http.get(`${API_BASE}/payments`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  listInvoices(q?: any) { return this.http.get(`${API_BASE}/invoices`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  listReports(q?: any)  { return this.http.get(`${API_BASE}/reports`,  { headers: this.authHeaders(), params: this.toParams(q) }); }
}
