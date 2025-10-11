import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface Guest {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  documentId: string;
  nationality: string;
  checkinDate?: string;
  checkoutDate?: string;
  roomNumber?: string;
  status: 'active' | 'checked-out' | 'inactive';
}

@Component({
  selector: 'app-guest-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './guest-list.component.html',
  styleUrls: ['./guest-list.component.css'],
})
export class GuestListComponent implements OnInit {
  guests: Guest[] = [];
  searchTerm = '';

  constructor() {}

  ngOnInit(): void {
    this.guests = [
      {
        id: 1,
        fullName: 'Juan Pérez García',
        email: 'juan.perez@email.com',
        phone: '+52 555 123 4567',
        documentId: 'ABC123456DEF',
        nationality: 'Mexicano',
        checkinDate: '2024-01-15',
        roomNumber: '101',
        status: 'active',
      },
      {
        id: 2,
        fullName: 'María González López',
        email: 'maria.gonzalez@email.com',
        phone: '+52 555 987 6543',
        documentId: 'DEF789012ABC',
        nationality: 'Española',
        checkinDate: '2024-01-16',
        roomNumber: '205',
        status: 'active',
      },
      {
        id: 3,
        fullName: 'Carlos López Martínez',
        email: 'carlos.lopez@email.com',
        phone: '+52 555 456 7890',
        documentId: 'GHI345678DEF',
        nationality: 'Mexicano',
        checkoutDate: '2024-01-14',
        status: 'checked-out',
      },
    ];
  }

  get filteredGuests(): Guest[] {
    if (!this.searchTerm) return this.guests;

    return this.guests.filter(
      (guest) =>
        guest.fullName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        guest.email.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        guest.documentId.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'checked-out':
        return 'bg-gray-100 text-gray-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  trackByGuestId(index: number, guest: Guest): number {
    return guest.id;
  }

  checkOut(guestId: number): void {
    const guest = this.guests.find((g) => g.id === guestId);
    if (guest) {
      guest.status = 'checked-out';
    }
  }
}
