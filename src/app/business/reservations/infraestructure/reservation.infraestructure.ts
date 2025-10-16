import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { Invoice, ReniecDniResponse, Reserva, ReservationRequest, SunatRucResponse } from '../domain/reservation.interface';
import { Habitacion } from '../../../core/models/models';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationInfraestructure {

  // Ajusta la URL base según tu backend
    private readonly API = environment.API_URL;
  private readonly API_URL_RESERVAS = `${this.API}/reservations`;
  private readonly API_URL_ROOMS = `${this.API}/rooms`;
  private readonly API_URL_INVOICES = `${this.API}/invoices`;
  private readonly API_URL = this.API;
  private DECOLECTA_BASE = environment.DECOLECTA_BASE;
  private DECOLECTA_TOKEN = environment.DECOLECTA_TOKEN;

  constructor(private http: HttpClient) {}

  // === Helpers ===
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); // o desde AuthService
    return new HttpHeaders({
      'Authorization': `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json'
    });
  }

  // === Mapeos API <-> UI ===
  private parseApiDate(v: any): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v;
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/); // yyyy-MM-dd
  if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
  const d = new Date(s); 
  return isNaN(+d) ? undefined : d;
}

private toApiDate(d?: Date): string | undefined {
  return d ? d.toISOString().slice(0,10) : undefined; // yyyy-MM-dd
}

private fromApi = (api: any): Reserva => ({
  id: api.id,
  cliente: api.cliente,
  habitacion: api.habitacion,
  checkIn: this.parseApiDate(api.checkIn)!,   // API -> dominio
  checkOut: this.parseApiDate(api.checkOut)!,
  estado: api.estado,
  precioTotal: api.precioTotal,
});

private toApi = (r: Partial<Reserva>) => ({
  id: r.id,
  cliente_id: r.cliente?.id,
  habitacion_id: r.habitacion?.id,
  checkIn: this.toApiDate(r.checkIn),         // dominio -> API
  checkOut: this.toApiDate(r.checkOut),
  estado: r.estado,
  precioTotal: r.precioTotal,
});



private fromApiR = (api: any): Habitacion => ({
  id: api.id,
  numero: api.numero,
  tipo: api.TipoHabitacion,
  precioPorNoche: api.precioPorNoche,   // API -> dominio
  disponible: api.disponible,
});
private toApiR = (r: Partial<Habitacion>) => ({
  id: r.id,
  numero: r.numero,
  tipo: r.tipo,
  precioPorNoche: r.precioPorNoche,
  disponible: r.disponible,
});

private fromApiReserva = (api: any): Reserva => ({
  id: api.id,
  cliente: api.cliente,
  habitacion: api.habitacion,
  checkIn: this.parseApiDate(api.checkIn)!,
  checkOut: this.parseApiDate(api.checkOut)!,
  estado: api.estado,
  precioTotal: api.precioTotal,
});
private fromApiInvoice = (api: any): Invoice => ({
  id: api.id,
  number: api.number,
  reservationId: api.reservationId,
  total: api.total,
  status: api.status,
  issuedAt: api.issuedAt,
});

  getAllReservations(): Observable<Reserva[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(this.API_URL_RESERVAS, { headers }).pipe(
      map(list => (list ?? []).map(this.fromApi))
    );
  }

  getRoomsAvailable(): Observable<Habitacion[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(`${this.API_URL_ROOMS}/available`, { headers }).pipe(
      map(list => (list ?? []).map(this.fromApiR))
    );
  }
getInvoiceByReservation(reservationId: number): Observable<Invoice> {
  const headers = this.getAuthHeaders();
  return this.http.get<Invoice>(
    `${this.API_URL_INVOICES}/by-reservation/${reservationId}`,
    { headers }
  ).pipe(
    map(this.fromApiInvoice)
  );
}


createWithCustomer(body: ReservationRequest): Observable<Reserva> {
  const headers = this.getAuthHeaders();
  return this.http.post<any>(`${this.API_URL_RESERVAS}/with-customer`, body, { headers }).pipe(
    map(this.fromApiReserva) 
  );
}

  getReservationById(id: number): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.API_URL_RESERVAS}/${id}`, { headers }).pipe(
      map(this.fromApi)
    );
  }

  createReservation(body: Partial<Reserva>): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.API_URL_RESERVAS, this.toApi(body), { headers }).pipe(
      map(this.fromApi)
    );
  }

  updateReservation(id: number, body: Partial<Reserva>): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    return this.http.put<any>(`${this.API_URL_RESERVAS}/${id}`, this.toApi(body), { headers }).pipe(
      map(this.fromApi)
    );
  }

  deleteReservation(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.API_URL_RESERVAS}/${id}`, { headers });
  }
  private decolectaHeaders(): HttpHeaders {
    const headers: Record<string, string> = {};
    if (this.DECOLECTA_TOKEN) {
      headers['Authorization'] = `Bearer ${this.DECOLECTA_TOKEN}`;
    }
    return new HttpHeaders(headers);
  }

  lookupDni(numero: string) {
  return this.http.get<any>(`${environment.API_URL}/external/reniec-dni`, { params: { numero } });
}
lookupRuc(numero: string) {
  return this.http.get<any>(`${environment.API_URL}/external/sunat-ruc`, { params: { numero } });
}
lookupDocument(numero: string): Observable<{ nombresCompletos: string; tipoDocumento: 'DNI'|'RUC'; raw: any }> {
  if (/^\d{11}$/.test(numero)) {
    return this.lookupRuc(numero).pipe(
      map(r => ({
        nombresCompletos: (r as any)?.razon_social?.toString().trim() ?? '',
        tipoDocumento: 'RUC' as 'DNI'|'RUC',   // 👈 evitar as const
        raw: r
      }))
    );
  }
  if (/^\d{8}$/.test(numero)) {
    return this.lookupDni(numero).pipe(
      map(r => ({
        nombresCompletos: (r as any)?.full_name?.toString().trim() ?? '',
        tipoDocumento: 'DNI' as 'DNI'|'RUC',   // 👈 evitar as const
        raw: r
      }))
    );
  }
  return throwError(() => new Error('Documento inválido: usa DNI (8) o RUC (11)'));
}
}