import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HotelService, Room } from '../../../../core/services/hotel.service';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.css'],
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [];
  loading = true;
  error: string | null = null;

  availableRoomsCount = 0;
  occupiedRoomsCount = 0;
  maintenanceRoomsCount = 0;
  occupancyPercentage = 0;

  constructor(private hotelService: HotelService) {}

  ngOnInit(): void {
    this.loadRooms();
  }

  loadRooms(): void {
    this.loading = true;s
    this.error = null;

    setTimeout(() => {
      this.rooms = [
        {
          id: 1,
          number: '101',
          type: 'standard',
          status: 'disponible',
          price: 120,
          maxGuests: 2,
          amenities: ['WiFi', 'TV'],
          floor: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          number: '102',
          type: 'suite',
          status: 'ocupado',
          price: 250,
          maxGuests: 4,
          amenities: ['WiFi', 'TV', 'Jacuzzi'],
          floor: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 3,
          number: '201',
          type: 'deluxe',
          status: 'mantenimiento',
          price: 180,
          maxGuests: 3,
          amenities: ['WiFi', 'Minibar'],
          floor: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 4,
          number: '202',
          type: 'standard',
          status: 'disponible',
          price: 120,
          maxGuests: 2,
          amenities: ['WiFi', 'TV'],
          floor: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 5,
          number: '301',
          type: 'suite',
          status: 'ocupado',
          price: 250,
          maxGuests: 4,
          amenities: ['WiFi', 'TV', 'Jacuzzi'],
          floor: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      this.updateStats();
      this.loading = false;
    }, 1000);
  }

  private updateStats(): void {
    this.availableRoomsCount = this.rooms.filter(
      (room) => room.status === 'disponible'
    ).length;
    this.occupiedRoomsCount = this.rooms.filter(
      (room) => room.status === 'ocupado'
    ).length;
    this.maintenanceRoomsCount = this.rooms.filter(
      (room) => room.status === 'mantenimiento'
    ).length;

    if (this.rooms.length > 0) {
      this.occupancyPercentage = Math.round(
        (this.occupiedRoomsCount / this.rooms.length) * 100
      );
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'disponible':
        return 'bg-green-100 text-green-800';
      case 'ocupado':
        return 'bg-red-100 text-red-800';
      case 'mantenimiento':
        return 'bg-yellow-100 text-yellow-800';
      case 'cleaning':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getTypeColor(type: string): string {
    switch (type) {
      case 'standard':
        return 'bg-blue-100 text-blue-800';
      case 'suite':
        return 'bg-purple-100 text-purple-800';
      case 'deluxe':
        return 'bg-green-100 text-green-800';
      case 'presidential':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  // ✅ Traducciones para mostrar en español
  translateType(type: string): string {
    switch (type) {
      case 'standard':
        return 'Estándar';
      case 'suite':
        return 'Suite';
      case 'deluxe':
        return 'De Lujo';
      case 'presidential':
        return 'Presidencial';
      default:
        return type;
    }
  }

  translateStatus(status: string): string {
    switch (status) {
      case 'disponible':
        return 'Disponible';
      case 'ocupado':
        return 'Ocupada';
      case 'mantenimiento':
        return 'En Mantenimiento';
      case 'cleaning':
        return 'Limpieza';
      default:
        return status;
    }
  }

  deleteRoom(id: number): void {
    if (confirm('¿Estás seguro de eliminar esta habitación?')) {
      this.rooms = this.rooms.filter((room) => room.id !== id);
      this.updateStats();
    }
  }

  trackByRoomId(index: number, room: Room): number {
    return room.id;
  }
}
