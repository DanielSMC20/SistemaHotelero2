// core/services/hotel.service.ts (fragmento)
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Room {
  id: number;
  codigo: string;        // ← mapea desde 'numero'
  number: string;         // ← mapea desde 'numero'
  type: string;           // ← 'tipo'
  status: string;         // ← 'estado' (DISPONIBLE/OCUPADA/MANTENIMIENTO)
  price: number;          // ← 'precioPorNoche'
  maxGuests: number;      // ← 'capacidad'
  amenities?: string[];
  floor?: number;
  createdAt?: Date;
  updatedAt?: Date;
  details?: string;
}


@Injectable({ providedIn: 'root' })
export class HotelService {

  actionLoading = false;
  private API = environment.API_URL;
  private ROOMS_URL = `${this.API}/rooms`;

  constructor(private http: HttpClient) {}

  private auth(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
    
  createRoom(body: any): Observable<Room> {
    return this.http.post<Room>(`${this.API}/rooms`, body, { headers: this.auth() });
  }

  getRooms(): Observable<Room[]> {
    return this.http.get<any[]>(this.ROOMS_URL, { headers: this.auth() }).pipe(
      map(list => (list ?? []).map(r => ({
        id: r.id,
        number: r.numero,
        codigo: r.codigo,
        type: (r.tipo ?? '').toString().toLowerCase(),
        status: (r.estado ?? '').toString().toLowerCase(), // lo normalizamos a minúsculas para tu UI
        price: Number(r.precioPorNoche ?? 0),
        maxGuests: Number(r.capacidad ?? 0),
        amenities: [],
        details: r.detalles,
        floor: r.piso ?? undefined,
        createdAt: r.fechaRegistro ? new Date(r.fechaRegistro) : undefined,
        updatedAt: undefined,
      })))
    );
  }

  setOccupied(id: number) {
    return this.http.patch<void>(`${this.ROOMS_URL}/${id}/ocupar`, null, { headers: this.auth() });
  }
  setAvailable(id: number) {
    return this.http.patch<void>(`${this.ROOMS_URL}/${id}/liberar`, null, { headers: this.auth() });
  }
  setMaintenance(id: number) {
    return this.http.patch<void>(`${this.ROOMS_URL}/${id}/mantener`, null, { headers: this.auth() });
  }

  deleteRoom(id: number) {
    return this.http.delete<void>(`${this.ROOMS_URL}/${id}`, { headers: this.auth() });
  }
updateRoom(id: number, payload: any): Observable<Room> {
    return this.http.put<Room>(`${this.ROOMS_URL}/${id}`, payload, {
      headers: this.auth(),
    });
  }

}
