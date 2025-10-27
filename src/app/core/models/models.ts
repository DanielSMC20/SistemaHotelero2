// src/app/core/models/models.ts
import { TipoHabitacion, Rol } from './enums';

// === Clientes ===
export interface Cliente {
  razonSocial: string;
  tipoPersona: any;
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
}
export interface InvoiceResponse {
  id: number;
  monto: number;           // Total pagado o a pagar
  metodo: string;          // Efectivo / Tarjeta / Yape / etc.
  estado: string;          // COMPLETADO / PENDIENTE / REEMBOLSADO / FALLIDO
  referencia?: string;     // Código opcional
  registradoPor?: string;  // Usuario que lo registró
  pagadoEn?: string;       // Fecha/hora de pago (ISO string)
  reservaId: number;       // ID de la reserva asociada

  // 🔽 campos opcionales que puedes calcular o simular en el front
  total?: number;          // total de la factura (si la usas en el modal)
  deuda?: number;          // monto pendiente (si la usas en el modal)
}
export interface ExtraCharge{
  id: string;
  concepto: string;
  monto: number;
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
export interface PhoneCodeApi {
  country: string;
  iso2: string;
  dialCode: string;
  flag?: string;
}

// Modelo que usa la UI
export interface PhoneCodeUI {
  code: string;   // ej. "+51"
  label: string;  // ej. "Perú"
  flag?: string;  // opcional
}
