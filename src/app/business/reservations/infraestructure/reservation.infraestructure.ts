import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import {
  Invoice,
  Reserva,
  ReservationRequest,
} from '../domain/reservation.interface';
import { Habitacion } from '../../../core/models/models';
import { environment } from '../../../../environments/environment';
import { PhoneCodeApi, PhoneCodeUI } from '../../../core/models/models';


@Injectable({ providedIn: 'root' })
export class ReservationInfraestructure {
  private readonly API = environment.API_URL;

  private readonly RES_URL = `${this.API}/reservations`;
  private readonly ROOMS_URL = `${this.API}/rooms`;
  private readonly INV_URL = `${this.API}/invoices`;
  private readonly PAY_URL = `${this.API}/payments`; 

  // Si usas interceptor JWT, puedes borrar getAuthHeaders y quitar {headers}
  constructor(private http: HttpClient) {}

  // =============== Helpers ===============
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json',
    });
  }


  
  // yyyy-MM-dd -> Date (00:00)
  private parseApiDate(v: any): Date | undefined {
    if (!v) return undefined;
    if (v instanceof Date) return v;
    const s = String(v).trim();
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00`);
    const d = new Date(s);
    return isNaN(+d) ? undefined : d;
  }

  // Date -> yyyy-MM-dd
  private toApiDate(d?: Date): string | undefined {
    return d ? d.toISOString().slice(0, 10) : undefined;
  }

  // ====== Reserva mappers ======
  private fromApi = (api: any): Reserva => ({
    id: api.id,
    cliente: api.cliente,            // viene como objeto (Clientes)
    habitacion: api.habitacion,      // viene como objeto (Habitacion)
    checkIn: this.parseApiDate(api.checkIn ?? api.fechaCheckIn)!,
    checkOut: this.parseApiDate(api.checkOut ?? api.fechaCheckOut)!,
    estado: api.estado,
    // Si backend manda BigDecimal, puede llegar como string; casteo a number
    precioTotal: typeof api.precioTotal === 'string'
      ? Number(api.precioTotal)
      : api.precioTotal,
  });

  /**
   * IMPORTANTE:
   * El backend espera la entidad Reserva:
   * { cliente:{id}, habitacion:{id}, checkIn:'yyyy-MM-dd', checkOut:'yyyy-MM-dd', estado?, precioTotal? }
   */
  private toApi = (r: Partial<Reserva>) => ({
    id: r.id,
    cliente: r.cliente?.id ? { id: r.cliente.id } : undefined,
    habitacion: r.habitacion?.id ? { id: r.habitacion.id } : undefined,
    checkIn: this.toApiDate(r.checkIn),
    checkOut: this.toApiDate(r.checkOut),
    estado: r.estado,
    precioTotal: r.precioTotal,
  });

  // ====== Habitacion mappers (para rooms/available) ======
  private fromApiRoom = (api: any): Habitacion => ({
    id: api.id,
    number: api.codigo,
    numero: api.numero,
    tipo: api.tipo,
    estado: api.estado,
    capacidad: api.capacidad,
    camas: api.camas,
    rango: api.rango,             
    precioPorNoche: api.precioPorNoche,
    precioPorHora: api.precioPorHora,
    detalles: api.detalles,
  });

  // ====== Invoice mapper ======
  private fromApiInvoice = (api: any): Invoice => ({
    id: api.id,
    number: api.number,           // coincide con InvoiceResponse.number
    reservationId: api.reservationId,
    total: typeof api.total === 'string' ? Number(api.total) : api.total,
    status: api.status,
    issuedAt: api.issuedAt,
  });

  // =============== Reservations ===============
  getAllReservations(): Observable<Reserva[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<any[]>(this.RES_URL, { headers }).pipe(
      map((list) => (list ?? []).map(this.fromApi))
    );
  }

  getReservationById(id: number): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    return this.http.get<any>(`${this.RES_URL}/${id}`, { headers }).pipe(
      map(this.fromApi)
    );
  }

  createReservation(body: Partial<Reserva>): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    return this.http.post<any>(this.RES_URL, this.toApi(body), { headers }).pipe(
      map(this.fromApi)
    );
  }

  updateReservation(id: number, body: Partial<Reserva>): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<any>(`${this.RES_URL}/${id}`, this.toApi(body), { headers })
      .pipe(map(this.fromApi));
  }

  updateRoom(id: number, body: Partial<Habitacion>): Observable<Habitacion> {
  const headers = this.getAuthHeaders();
  return this.http.put<Habitacion>(`${this.ROOMS_URL}/${id}`, body, { headers });
}

  deleteReservation(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.RES_URL}/${id}`, { headers });
  }

  // (Si aún usas el endpoint with-customer)
  createWithCustomer(body: ReservationRequest): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<any>(`${this.RES_URL}/with-customer`, body, { headers })
      .pipe(map(this.fromApi));
  }

  // =============== Acciones de negocio ===============
  checkIn(id: number): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    return this.http
      .patch<any>(`${this.RES_URL}/${id}/checkin`, {}, { headers })
      .pipe(map(this.fromApi));
  }

  checkOut(id: number): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    return this.http
      .patch<any>(`${this.RES_URL}/${id}/checkout`, null, { headers })
      .pipe(map(this.fromApi));
  }

  extendStay(id: number, horasExtra: number): Observable<Reserva> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('horasExtra', horasExtra);
    return this.http
      .patch<any>(`${this.RES_URL}/${id}/extend`, null, { headers, params })
      .pipe(map(this.fromApi));
  }

  // Reporte entre fechas (para listados/estadística)
  getByDateRange(inicio: string, fin: string): Observable<Reserva[]> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams().set('inicio', inicio).set('fin', fin);
    return this.http
      .get<any[]>(`${this.RES_URL}/report`, { headers, params })
      .pipe(map((list) => (list ?? []).map(this.fromApi)));
  }

  // Por cliente
  getByCustomer(clienteId: number): Observable<Reserva[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<any[]>(`${this.RES_URL}/by-customer/${clienteId}`, { headers })
      .pipe(map((list) => (list ?? []).map(this.fromApi)));
  }

  // =============== Rooms disponibles ===============
  getRoomsAvailable(): Observable<Habitacion[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<any[]>(`${this.ROOMS_URL}/available`, { headers })
      .pipe(map((list) => (list ?? []).map(this.fromApiRoom)));
  }

  // =============== Invoices ===============
  getInvoiceByReservation(reservationId: number): Observable<Invoice> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<any>(`${this.INV_URL}/by-reservation/${reservationId}`, { headers })
      .pipe(map(this.fromApiInvoice));
  }

  // =============== Lookups (RENIEC / SUNAT) ===============
  // Ajusta las rutas a tus endpoints reales del backend
  lookupDni(numero: string) {
    return this.http.get<any>(`${this.API}/external/reniec-dni`, {
      params: { numero },
      headers: this.getAuthHeaders(),
    });
  }
  lookupRuc(numero: string) {
    return this.http.get<any>(`${this.API}/external/sunat-ruc`, {
      params: { numero },
      headers: this.getAuthHeaders(),
    });
  }
  lookupDocument(
    numero: string
  ): Observable<{ nombresCompletos: string; tipoDocumento: 'DNI' | 'RUC'; raw: any }> {
    if (/^\d{11}$/.test(numero)) {
      return this.lookupRuc(numero).pipe(
        map((r) => ({
          nombresCompletos: (r as any)?.razon_social?.toString().trim() ?? '',
          tipoDocumento: 'RUC' as 'DNI' | 'RUC',
          raw: r,
        }))
      );
    }
    if (/^\d{8}$/.test(numero)) {
      return this.lookupDni(numero).pipe(
        map((r) => ({
          nombresCompletos: (r as any)?.full_name?.toString().trim() ?? '',
          tipoDocumento: 'DNI' as 'DNI' | 'RUC',
          raw: r,
        }))
      );
    }
    return throwError(() => new Error('Documento inválido: usa DNI (8) o RUC (11)'));
  }

  recordPayment(data: { reservationId: number | string; amount: number; method: string }): Observable<any> {
    return this.http.post(
      `${this.RES_URL}/${data.reservationId}/payments`,
      data,
      { headers: this.getAuthHeaders() }
    );
  }

  

downloadPaymentReceipt(paymentId: number): Observable<Blob> {
  const headers = this.getAuthHeaders();
  return this.http.get(`${this.PAY_URL}/${paymentId}/comprobante`, {
    headers,
    responseType: 'blob',
  });
}
getPhoneCodes() {
  const headers = this.getAuthHeaders();
  return this.http.get<PhoneCodeApi[]>(`${this.API}/phone-codes`, { headers });
}
}
