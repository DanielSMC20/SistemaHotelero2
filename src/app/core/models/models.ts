// src/app/core/models/models.ts
import { TipoHabitacion, Rol } from './enums';

// === Clientes ===
export interface Cliente {
  id: number;
  documento: string;
  nombresCompletos: string; // mapea @Column(name="nombres_completos")
  email?: string;
  telefono?: string;
}

// === Habitacion ===
export interface Habitacion {
  id: number;
  numero: string;
  tipo: TipoHabitacion;        // SIMPLE | DOBLE | SUITE | MATRIMONIAL
  precioPorNoche: number;
  disponible: boolean;
}

// === Reserva ===
export interface Reserva {
  id: number;
  cliente: Cliente;
  habitacion: Habitacion;
  fechaCheckIn: string;        // ISO date del backend
  fechaCheckOut: string;       // ISO date del backend
  estado?: string;
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
