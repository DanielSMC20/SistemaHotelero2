import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface Room {
  id: number;
  number: string;
  type: 'standard' | 'suite' | 'deluxe' | 'presidential';
  status: 'disponible' | 'ocupado' | 'mantenimiento' | 'cleaning';
  price: number;
  maxGuests: number;
  amenities: string[];
  floor: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  occupancyRate: number;
}

export interface HotelConfig {
  name: string;
  totalRooms: number;
  checkinTime: string;
  checkoutTime: string;
  currency: string;
  taxRate: number;
  address: {
    street: string;
    city: string;
    country: string;
    zipCode: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class HotelService {
  private hotelConfigSubject = new BehaviorSubject<HotelConfig | null>(null);
  public hotelConfig$ = this.hotelConfigSubject.asObservable();

  constructor(private apiService: ApiService) {
    this.loadHotelConfig();
  }

  loadHotelConfig(): void {
    const defaultConfig: HotelConfig = {
      name: 'Hotel Grand Plaza',
      totalRooms: 120,
      checkinTime: '15:00',
      checkoutTime: '12:00',
      currency: 'USD',
      taxRate: 0.16,
      address: {
        street: 'Av. Principal 123',
        city: 'Ciudad de México',
        country: 'México',
        zipCode: '12345',
      },
    };

    this.hotelConfigSubject.next(defaultConfig);
  }

  getHotelConfig(): HotelConfig | null {
    return this.hotelConfigSubject.value;
  }

  getRooms(params?: any): Observable<Room[]> {
    return this.apiService.getRooms(params);
  }

  getRoomById(id: number): Observable<Room> {
    return this.apiService.getRoomById(id);
  }

  createRoom(roomData: Partial<Room>): Observable<Room> {
    return this.apiService.createRoom(roomData);
  }

  updateRoom(id: number, roomData: Partial<Room>): Observable<Room> {
    return this.apiService.updateRoom(id, roomData);
  }

  deleteRoom(id: number): Observable<any> {
    return this.apiService.deleteRoom(id);
  }

  getRoomStats(): Observable<RoomStats> {
    return this.apiService.getRooms().pipe(
      map((rooms: Room[]) => {
        const total = rooms.length;
        const available = rooms.filter(
          (room: Room) => room.status === 'disponible'
        ).length;
        const occupied = rooms.filter(
          (room: Room) => room.status === 'ocupado'
        ).length;
        const maintenance = rooms.filter(
          (room: Room) => room.status === 'mantenimiento'
        ).length;
        const occupancyRate =
          total > 0 ? Math.round((occupied / total) * 100) : 0;

        return { total, available, occupied, maintenance, occupancyRate };
      })
    );
  }

  getRoomsByStatus(status: Room['status']): Observable<Room[]> {
    return this.getRooms({ status }).pipe(
      map((rooms: Room[]) =>
        rooms.filter((room: Room) => room.status === status)
      )
    );
  }

  getAvailableRooms(dateFrom?: string, dateTo?: string): Observable<Room[]> {
    const params: any = { status: 'disponible' };
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    return this.apiService.getRooms(params);
  }

  getRoomTypes(): Observable<any[]> {
    return of([
      {
        type: 'standard',
        price: 120,
        maxGuests: 2,
        amenities: ['WiFi', 'TV', 'Baño'],
      },
      {
        type: 'suite',
        price: 250,
        maxGuests: 4,
        amenities: ['WiFi', 'TV', 'Jacuzzi', 'Vista'],
      },
      {
        type: 'deluxe',
        price: 180,
        maxGuests: 3,
        amenities: ['WiFi', 'TV', 'Minibar'],
      },
      {
        type: 'presidential',
        price: 450,
        maxGuests: 4,
        amenities: ['Todo incluido', 'Servicio VIP'],
      },
    ]);
  }

  calculateTotalPrice(
    roomPrice: number,
    nights: number,
    extraServices: number = 0
  ): number {
    const config = this.getHotelConfig();
    const subtotal = roomPrice * nights + extraServices;
    const tax = config ? subtotal * config.taxRate : subtotal * 0.16;
    return subtotal + tax;
  }

  validateRoomData(roomData: Partial<Room>): string[] {
    const errors: string[] = [];

    if (!roomData.number || roomData.number.trim() === '') {
      errors.push('El número de habitación es requerido');
    }

    if (!roomData.type) {
      errors.push('El tipo de habitación es requerido');
    }

    if (!roomData.price || roomData.price <= 0) {
      errors.push('El precio debe ser mayor a 0');
    }

    if (!roomData.maxGuests || roomData.maxGuests <= 0) {
      errors.push('El número máximo de huéspedes debe ser mayor a 0');
    }

    if (!roomData.floor || roomData.floor < 1) {
      errors.push('El piso debe ser mayor o igual a 1');
    }

    return errors;
  }
}
