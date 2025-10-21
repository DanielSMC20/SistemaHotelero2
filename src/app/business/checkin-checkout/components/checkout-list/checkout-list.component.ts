// checkout-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckCenterComponent } from '../../shared/checkCenterComponent';
import { ReservationInfraestructure } from '../../../reservations/infraestructure/reservation.infraestructure';
import { Reserva } from '../../../reservations/domain/reservation.interface';

@Component({
  standalone: true,
  selector: 'app-checkout-list',
  imports: [CommonModule, CheckCenterComponent],
  templateUrl: './checkout-list.component.html'
})
export class CheckoutListComponent implements OnInit {
  reservas: Reserva[] = [];
  constructor(private api: ReservationInfraestructure){}

  ngOnInit(){ this.api.getAllReservations().subscribe(d => this.reservas = d); }

  onDoCheckOut(r: Reserva){
    this.api.checkOut(r.id).subscribe({ next: _ => {
      // si quieres mostrar factura aquí, puedes llamar a invoices
      this.api.getAllReservations().subscribe(d => this.reservas = d);
    }});
  }
}
