import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Reserva } from '../../../reservations/domain/reservation.interface';
import { ReservationInfraestructure } from '../../../reservations/infraestructure/reservation.infraestructure';
import { CheckCenterComponent } from "../../shared/checkCenterComponent";

interface Activity {
  id: string;
  type: 'checkin' | 'checkout' | 'reservation' | 'maintenance';
  guestName: string;
  roomNumber: string;
  time: string;
  details: string;
  priority: 'low' | 'medium' | 'high';
}

@Component({
  selector: 'app-today-activities',
  standalone: true,
  imports: [CommonModule, RouterModule, CheckCenterComponent],
  templateUrl: './today-activities.component.html',
  styleUrls: ['./today-activities.component.css'],
})
export class TodayActivitiesComponent implements OnInit {
  activities: Activity[] = [];
  reservas: Reserva[] = [];
  constructor(private api: ReservationInfraestructure){}

  ngOnInit(): void {
    this.activities = [
      {
        id: '1',
        type: 'checkin',
        guestName: 'Ana Rodríguez',
        roomNumber: '103',
        time: '10:30 AM',
        details: 'Llegada programada',
        priority: 'high',
      },
      {
        id: '2',
        type: 'checkout',
        guestName: 'Luis Martínez',
        roomNumber: '201',
        time: '11:00 AM',
        details: 'Check-out programado',
        priority: 'medium',
      },
      {
        id: '3',
        type: 'reservation',
        guestName: 'Sofía Herrera',
        roomNumber: '150',
        time: '02:00 PM',
        details: 'Nueva reservación confirmada',
        priority: 'low',
      },
      {
        id: '4',
        type: 'maintenance',
        guestName: 'N/A',
        roomNumber: '305',
        time: '03:00 PM',
        details: 'Mantenimiento programado',
        priority: 'high',
      },
    ];
    this.api.getAllReservations().subscribe(d => this.reservas = d);

  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'checkin':
        return '✅';
      case 'checkout':
        return '🚪';
      case 'reservation':
        return '📅';
      case 'maintenance':
        return '🔧';
      default:
        return '📋';
    }
  }
  onDoCheckIn(r: Reserva){ this.api.checkIn(r.id).subscribe(_ => this.refresh()); }
  onDoCheckOut(r: Reserva){ this.api.checkOut(r.id).subscribe(_ => this.refresh()); }

  private refresh(){ this.api.getAllReservations().subscribe(d => this.reservas = d); }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  trackByActivityId(index: number, activity: Activity): string {
    return activity.id;
  }

  completeActivity(id: string): void {
    const activity = this.activities.find((a) => a.id === id);
    if (activity && confirm(`¿Marcar "${activity.details}" como completada?`)) {
      // Lógica para completar actividad
      this.activities = this.activities.filter((a) => a.id !== id);
    }
  }
}
