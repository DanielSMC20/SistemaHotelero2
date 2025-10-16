// src/app/core/models/models.ts
import { TipoHabitacion, Rol } from './enums';

// === Clientes ===
export interface Cliente {
  id: number;
  documento: string;
  nombresCompletos: string; // mapea @Column(name="nombres_completos")
  email?: string;
  telefono?: string;
  tipoDocumento: string; // DNI | PASAPORTE | CARNET EXTRANJERIA
}

// === Habitacion ===
export interface Habitacion {
  id: number;
  numero: string;
  tipo: TipoHabitacion;        // SIMPLE | DOBLE | SUITE | MATRIMONIAL
  precioPorNoche: number;
  disponible: boolean;
}


// === Auth ===
export interface AuthUser {
  id: number;
  usuario: string;
  clave:string;
  role?: Rol;    
  nombres: string;
  apellidos:string;
  pais:string;
}

export interface LoginResponse {
  token: string;               // tu /auth/login devuelve { token }
}

export interface Invoice {
  id: number;
  number: string;
  reservationId: number;
  total: number;       // si tu backend usa BigDecimal, Jackson lo manda como number
  status: string;      // PENDIENTE | PAGADA | ANULADA
  issuedAt: string;    // ISO
}

