import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Reserva } from '../domain/reservation.interface'; 
import { ReservationInfraestructure } from '../infraestructure/reservation.infraestructure'; 

@Injectable({
  providedIn: 'root'
})
export class ReservationApplication {
  constructor(private reservationApi: ReservationInfraestructure) {}

  execute(): Observable<Reserva[]> {
    return this.reservationApi.getAllReservations();
  }
  
}
