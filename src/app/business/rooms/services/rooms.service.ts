// core/services/hotel.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { env } from '../../../core/environments/environment';
import { Observable } from 'rxjs';

export interface Room {
  id: number;
  number: string;   // si en backend es 'numero', puedes mapear aquí
  numero: string;
  tipo: 'SIMPLE'|'DOBLE'|'MATRIMONIAL'|'SUITE';
  estado: 'DISPONIBLE'|'OCUPADA'|'MANTENIMIENTO';
  capacidad: number;
  camas: number;
  rango?: string;
  precioPorNoche: number;
  precioPorHora: number;
  detalles?: string;
  // ...otros campos (floor, amenities) si los usas
}

@Injectable({ providedIn: 'root' })
export class HotelService {
  private readonly API = env.API_BASE;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  createRoom(body: any): Observable<Room> {
    return this.http.post<Room>(`${this.API}/rooms`, body, { headers: this.headers() });
  }

  // ...otros métodos (get rooms, etc.)
}
