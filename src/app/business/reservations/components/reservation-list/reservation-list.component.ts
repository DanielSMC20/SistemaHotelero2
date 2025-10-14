import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Reservation {
  id: string;
  guestName: string;
  roomNumber: string;
  checkinDate: string;
  checkoutDate: string;
  status: 'pending' | 'confirmed' | 'checked-in' | 'cancelled';
  total: number;
}

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.css'],
})
export class ReservationListComponent implements OnInit {
  reservations: Reservation[] = [];

  constructor() {}

  ngOnInit(): void {
    this.reservations = [
      {
        id: '001',
        guestName: 'Juan Pérez',
        roomNumber: '101',
        checkinDate: '2024-01-15',
        checkoutDate: '2024-01-17',
        status: 'confirmed',
        total: 240,
      },
      {
        id: '002',
        guestName: 'María González',
        roomNumber: '205',
        checkinDate: '2024-01-16',
        checkoutDate: '2024-01-20',
        status: 'pending',
        total: 720,
      },
      {
        id: '003',
        guestName: 'Carlos López',
        roomNumber: '312',
        checkinDate: '2024-01-17',
        checkoutDate: '2024-01-18',
        status: 'checked-in',
        total: 120,
      },
    ];
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'checked-in':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'confirmed':
        return 'Confirmada';
      case 'pending':
        return 'Pendiente';
      case 'checked-in':
        return 'Registrada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }

  trackByReservationId(index: number, reservation: Reservation): string {
    return reservation.id;
  }

  cancelReservation(id: string): void {
    if (confirm('¿Estás seguro de cancelar esta reservación?')) {
      const reservation = this.reservations.find((r) => r.id === id);
      if (reservation) {
        reservation.status = 'cancelled';
      }
    }
  }

  performCheckin(id: string): void {
    const reservation = this.reservations.find((r) => r.id === id);
    if (reservation) {
      reservation.status = 'checked-in';
    }
  }
}
