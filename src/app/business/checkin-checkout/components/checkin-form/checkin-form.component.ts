// checkin-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckCenterComponent } from '../../shared/checkCenterComponent';
import { ReservationInfraestructure } from '../../../reservations/infraestructure/reservation.infraestructure';
import { Reserva } from '../../../reservations/domain/reservation.interface';

@Component({
  standalone: true,
  selector: 'app-checkin-form',
  imports: [CommonModule, CheckCenterComponent],
  templateUrl: './checkin-form.component.html'
})
export class CheckinFormComponent implements OnInit {
  reservas: Reserva[] = [];
  loading = false;

  constructor(private api: ReservationInfraestructure){}

  ngOnInit(){ this.load(); }

  load(){
    this.loading = true;
    this.api.getAllReservations().subscribe({
      next: data => { this.reservas = data; },
      complete: () => this.loading = false
    });
  }

  onDoCheckIn(r: Reserva){
    this.api.checkIn(r.id).subscribe({ next: _ => this.load() });
  }
}
