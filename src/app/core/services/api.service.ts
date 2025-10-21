
import { env } from '../environments/environment'; // usa environment si prefieres
// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';

const API_BASE = env.API_BASE;
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
export interface DayTotal {
  day: string;       // 'YYYY-MM-DD'
  total: number;     // BigDecimal -> number
}

export interface DailyRevenueItem {
  roomNumber: string;
  guestName: string;
  dni: string;
  checkIn: string;   // "YYYY-MM-DD"
  checkOut: string;  // "YYYY-MM-DD"
  price: number;     // BigDecimal/string -> number
}

export interface OccupancyItem {
  day: string;        // "YYYY-MM-DD"
  occupied: number;
  available: number;
  maintenance?: number;
}
@Injectable({ providedIn: 'root' })
export class ApiService {
  API_BASE: string = env.API_BASE;
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
recordPayment(body: { reservationId: number; amount: number; method: string; reference?: string }) {
  return this.http.post<{ success: boolean; data: PaymentResponse }>(
    `${this.API_BASE}/payments`, body, { headers: this.authHeaders() }
  );
}

getPaymentsByReservation(reservaId: number) {
  return this.http.get<{ success: boolean; data: PaymentResponse[] }>(
    `${this.API_BASE}/payments/by-reservation/${reservaId}`, { headers: this.authHeaders() }
  );
}
revenueTotals(start: string, end: string) {
  return this.http.get<{ success: boolean; message: string; data: DayTotal[] }>(
    `${this.API_BASE}/payments/revenue`,
    { headers: this.authHeaders(), params: this.toParams({ start, end }) }
  ).pipe(
    map(resp => (resp?.data ?? []).map(r => ({
      day: r.day?.substring(0, 10),
      total: Number(r.total ?? 0)
    })))
  );
}

  listCustomers(q?: any): Observable<any> { return this.http.get(`${this.API_BASE}/customers`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  getCustomer(id: number): Observable<any> { return this.http.get(`${this.API_BASE}/customers/${id}`, { headers: this.authHeaders() }); }
  getCustomerByDocumento(documento: string): Observable<any> { return this.http.get(`${this.API_BASE}/customers/by-document`, { headers: this.authHeaders(), params: this.toParams({ documento }) }); }
  createCustomer(body: any): Observable<any> { return this.http.post(`${this.API_BASE}/customers`, body, { headers: this.authHeaders() }); }
  updateCustomer(id: number, body: any): Observable<any> { return this.http.put(`${this.API_BASE}/customers/${id}`, body, { headers: this.authHeaders() }); }
  deleteCustomer(id: number): Observable<any> { return this.http.delete(`${this.API_BASE}/customers/${id}`, { headers: this.authHeaders() }); }

  listRooms(q?: any): Observable<any> { return this.http.get(`${this.API_BASE}/rooms`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  getRoom(id: number): Observable<any> { return this.http.get(`${this.API_BASE}/rooms/${id}`, { headers: this.authHeaders() }); }
  getRoomAvailability(q?: any) : Observable<any> { return this.http.get(`${this.API_BASE}/rooms/available`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  createRoom(body: any): Observable<any> { return this.http.post(`${this.API_BASE}/rooms`, body, { headers: this.authHeaders() }); }
  updateRoom(id: number, body: any): Observable<any> { return this.http.put(`${this.API_BASE}/rooms/${id}`, body, { headers: this.authHeaders() }); }
  deleteRoom(id: number): Observable<any> { return this.http.delete(`${this.API_BASE}/rooms/${id}`, { headers: this.authHeaders() }); }

  listReservations(q?: any): Observable<any> { return this.http.get(`${this.API_BASE}/reservations`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  getReservation(id: number): Observable<any> { return this.http.get(`${this.API_BASE}/reservations/${id}`, { headers: this.authHeaders() }); }
  createReservation(body: any): Observable<any> { return this.http.post(`${this.API_BASE}/reservations`, body, { headers: this.authHeaders() }); }
  createReservationWithCustomer(body: any): Observable<any> { return this.http.post(`${this.API_BASE}/reservations/with-customer`, body, { headers: this.authHeaders() }); }
  deleteReservation(id: number): Observable<any> { return this.http.delete(`${this.API_BASE}/reservations/${id}`, { headers: this.authHeaders() }); }

  listPayments(q?: any) { return this.http.get(`${this.API_BASE}/payments`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  listInvoices(q?: any) { return this.http.get(`${this.API_BASE}/invoices`, { headers: this.authHeaders(), params: this.toParams(q) }); }
  listReports(q?: any)  { return this.http.get(`${this.API_BASE}/reports`,  { headers: this.authHeaders(), params: this.toParams(q) }); }
  revenue(start: string, end: string): Observable<DailyRevenueItem[]> {
    return this.http.get<ApiResponse<DailyRevenueItem[]>>(
      `${this.API_BASE}/reports/daily-revenue`,
      { headers: this.authHeaders(), params: this.toParams({ start, end }) }
    ).pipe(
      map(resp => (resp?.data ?? []).map(x => ({
        ...x,
        price: Number(x.price ?? 0)
      })))
    );
  }

  /**
   * Ocupación por día (ajusta la ruta si tu backend usa otra)
   * Espera data: { day: 'YYYY-MM-DD', occupied: number, available: number, maintenance?: number }[]
   */
  occupancy(start: string, end: string): Observable<OccupancyItem[]> {
    return this.http.get<ApiResponse<OccupancyItem[]>>(
      `${this.API_BASE}/reports/occupancy`,
      { headers: this.authHeaders(), params: this.toParams({ start, end }) }
    ).pipe(map((resp: { data: any; }) => resp?.data ?? []));
  }

  // ======== Compat / si ya los estabas usando en otros componentes ========
  getRevenueByDay(start: Date, end: Date): Observable<DailyRevenueItem[]> {
    const s = start.toISOString().slice(0, 10);
    const e = end.toISOString().slice(0, 10);
    return this.revenue(s, e);
  }

  getOccupancyByDay(start: Date, end: Date): Observable<OccupancyItem[]> {
    const s = start.toISOString().slice(0, 10);
    const e = end.toISOString().slice(0, 10);
    return this.occupancy(s, e);
  }

}
