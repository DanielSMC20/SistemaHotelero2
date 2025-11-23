import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HotelService, Room } from '../../../../core/services/hotel.service';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';

type RoomView = 'table' | 'grid';
@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.css'],
})
export class RoomListComponent implements OnInit {
  rooms: Room[] = [];
  loading = true;
  error: string | null = null;
  view: RoomView = 'table';
  showCreate = false;
  createForm!: FormGroup;
  editingRoom: Room | null = null;


  availableRoomsCount = 0;
  occupiedRoomsCount = 0;
  maintenanceRoomsCount = 0;
  occupancyPercentage = 0;
  selected: Room | undefined;
  opening: boolean | undefined;
  saving: any;
  actionLoading: any;
  
  setView(v: RoomView) {
    this.view = v;
  }

  get isGrid() {
    return this.view === 'grid';
  }
  get isTable() {
    return this.view === 'table';
  }

  total = 0;
  disponibles = 0;
  ocupadas = 0;
  mantenimiento = 0;
  porcentajeOcupacion = 0;
  
  constructor(private fb: FormBuilder, private hotelService: HotelService) {}

  get isEditMode(): boolean {
    return !!this.editingRoom;
  }

  ngOnInit(): void {
    this.loadRooms();
    this.view = 'table';
    this.buildCreateForm();
      this.hotelService.getRooms().subscribe((rooms: Room[]) => {
      this.total = rooms.length;
      this.disponibles = rooms.filter(r => r.status === 'disponible').length;
      this.ocupadas = rooms.filter(r => r.status === 'ocupada').length;
      this.mantenimiento = rooms.filter(r => r.status === 'mantenimiento').length;
    });
  }

  openCreateModal() {
    this.editingRoom = null;
    this.showCreate = true;
    document.body.style.overflow = 'hidden';
  }
  
  closeCreateModal() {
    this.showCreate = false;
    this.editingRoom = null;
    document.body.style.overflow = '';
    this.createForm.reset({
      numero: '',
      tipo: '',
      estado: 'DISPONIBLE',
      capacidad: 1,
      camas: 1,
      rango: '',
      precioPorNoche: 0,
      precioPorHora: 0,
      detalles: '',
    });
  }
  
  private buildCreateForm() {
    this.createForm = this.fb.group({
      numero: ['', [Validators.required, Validators.maxLength(10)]],
      tipo: ['', [Validators.required]],
      estado: ['DISPONIBLE', [Validators.required]],
      capacidad: [1, [Validators.required, Validators.min(1)]],
      camas: [1, [Validators.required, Validators.min(1)]],
      rango: [''],
      precioPorNoche: [0, [Validators.required, Validators.min(0)]],
      precioPorHora: [0, [Validators.required, Validators.min(0)]],
      detalles: [''],
    });
  }

  openEditModal(room: Room) {
    this.editingRoom = room;
    this.showCreate = true;
    document.body.style.overflow = 'hidden';

    // Mapea Room → formulario (ajusta nombres si tu modelo difiere)
    this.createForm.reset({
      numero: room.number ?? '',             // o room.numero si tu modelo así lo maneja
      tipo: (room.type ?? '').toUpperCase(), // SIMPLE, DOBLE, etc.
      estado: (room.status ?? 'DISPONIBLE').toUpperCase(),
      capacidad: room.maxGuests ?? 1,
      camas: (room as any).camas ?? 1,
      rango: (room as any).rango ?? '',
      precioPorNoche: (room as any).precioPorNoche ?? room.price ?? 0,
      precioPorHora: (room as any).precioPorHora ?? 0,
      detalles: room.details ?? '',
    });
  }

  loadRooms(): void {
    this.loading = true;
    this.error = null;
    this.hotelService.getRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.updateStats();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo cargar habitaciones';
        this.loading = false;
      },
    });
  }
  
  async saveRoom() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    const payload = this.createForm.value;
    this.saving = true;

    try {
      if (this.isEditMode && this.editingRoom) {
        // ⭐ EDITAR
        const updated = await firstValueFrom(
          this.hotelService.updateRoom(this.editingRoom.id, payload)
        );

        const idx = this.rooms.findIndex(r => r.id === updated.id);
        if (idx !== -1) {
          this.rooms[idx] = { ...this.rooms[idx], ...updated };
        }
        this.updateStats();

        Swal.fire({
          icon: 'success',
          title: 'Habitación actualizada',
          text: `La habitación ${updated.number ?? updated.id} se actualizó correctamente.`,
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        // ⭐ CREAR
        const created = await firstValueFrom(
          this.hotelService.createRoom(payload)
        );
        this.rooms = [created, ...this.rooms];
        this.updateStats();

        Swal.fire({
          icon: 'success',
          title: 'Habitación creada',
          text: `La habitación ${created.number ?? created.id} fue creada correctamente.`,
          timer: 2000,
          showConfirmButton: false,
        });
      }

      this.closeCreateModal();
    } catch (e: any) {
      console.error(e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e?.error?.message || 'No se pudo guardar la habitación.',
      });
    } finally {
      this.saving = false;
    }
  }

  openRoom(r: Room) {
    this.selected = r;
    this.opening = true;
    document.body.style.overflow = 'hidden';
    setTimeout(() => (this.opening = false), 150);
  }

  closeRoom() {
    this.selected = undefined;
    document.body.style.overflow = '';
  }

async markAvailable(r: Room) {
  const prev = r.status;
  r.status = 'disponible';
  this.updateStats();

  try {
    const updated = await firstValueFrom(this.hotelService.setAvailable(r.id));
    // Actualizamos con lo que venga del backend (por si cambia algo más)
    Object.assign(r, updated);
    this.updateStats();

    Swal.fire({
      icon: 'success',
      title: '¡Actualizado!',
      text: `La habitación ${r.number} fue marcada como disponible.`,
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (err) {
    r.status = prev;
    this.updateStats();
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo marcar como disponible.',
    });
  }
}

async markOccupied(r: Room) {
  const prev = r.status;
  r.status = 'ocupada';
  this.updateStats();

  try {
    const updated = await firstValueFrom(this.hotelService.setOccupied(r.id));
    Object.assign(r, updated);
    this.updateStats();

    Swal.fire({
      icon: 'success',
      title: '¡Actualizado!',
      text: `La habitación ${r.number} fue marcada como ocupada.`,
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (err) {
    r.status = prev;
    this.updateStats();
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo marcar como ocupada.',
    });
  }
}

async markMaintenance(r: Room) {
  const prev = r.status;
  r.status = 'mantenimiento';
  this.updateStats();

  try {
    const updated = await firstValueFrom(this.hotelService.setMaintenance(r.id));
    Object.assign(r, updated);
    this.updateStats();

    Swal.fire({
      icon: 'warning',
      title: '¡Actualizado!',
      text: `La habitación ${r.number} está en mantenimiento.`,
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (err) {
    r.status = prev;
    this.updateStats();
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se pudo marcar en mantenimiento.',
    });
  }
}

  private updateStats(): void {
    this.availableRoomsCount = this.rooms.filter(
      (room) => room.status === 'disponible'
    ).length;
    this.occupiedRoomsCount = this.rooms.filter(
      (room) => room.status === 'ocupada'
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
      case 'ocupada':
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
      case 'ocupada':
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

  q = '';

  get filteredRooms(): Room[] {
    const term = this.q.trim().toLowerCase();
    if (!term) return this.rooms;
    return this.rooms.filter((r) =>
      [
        r.number,
        r.type,
        r.status,
        String(r.maxGuests ?? ''),
        String(r.price ?? ''),
      ].some((v) => (v ?? '').toString().toLowerCase().includes(term))
    );
  }

  refresh() {
    this.loadRooms();
  }

  
}