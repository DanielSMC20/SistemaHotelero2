import { Cliente, Habitacion } from "../../../core/models/models";

export interface Reserva  {
  id: number;
  cliente: Cliente;
  habitacion: Habitacion;
  checkIn: Date;   // ISO
  checkOut: Date;  // ISO
  estado?: string;
  precioTotal: number; 
}
export interface ReservationRequest {
  documento: string;
  nombresCompletos: string;
  email?: string;
  telefono?: string;
  roomId: number;
  checkIn: string;   // yyyy-MM-dd
  checkOut: string;  // yyyy-MM-dd
  tipoDocumento?: string; // si luego lo agregas
}
export interface Invoice {
  id: number;
  number: string;
  reservationId: number;
  total: number;      
  status: string;     
  issuedAt: string;  
}
export interface ReniecDniResponse {
  first_name: string;
  first_last_name: string;
  second_last_name: string;
  full_name: string;
  document_number: string;
}
export interface SunatRucResponse {
  razon_social: string;
  numero_documento: string;
  estado: string;
  condicion: string;
  direccion: string;
  ubigeo: string;
}