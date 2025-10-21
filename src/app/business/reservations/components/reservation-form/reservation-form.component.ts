import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup, ValidationErrors, AbstractControl } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ReservationInfraestructure } from '../../infraestructure/reservation.infraestructure';
import { Reserva } from '../../domain/reservation.interface';
import { Habitacion } from '../../../../core/models/models';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css']
})
export class ReservationFormComponent implements OnInit {
  @Input() editing: Reserva | null = null;
  @Output() closed = new EventEmitter<boolean>(); // true = refrescar lista

  PEN = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 2 });

  rooms: Habitacion[] = [];
  consulting = false;
  saving = false;

  today = new Date();
  minIn = this.toYMD(this.today);
  minOut = this.toYMD(new Date(this.today.getFullYear(), this.today.getMonth(), this.today.getDate() + 1));

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private reservationInfra: ReservationInfraestructure
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadRooms();
    this.prefillIfEditing();
    this.form.valueChanges.subscribe(() => this.syncDates());
  }

  // ============ Form & validators ============
  private buildForm() {
    this.form = this.fb.group(
      {
        documento: ['', [Validators.required, Validators.pattern(/^\d{8}$|^\d{11}$/)]],
        nombresCompletos: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.email]],
        telefono: ['', [Validators.pattern(/^\d{6,15}$/)]],
        checkIn: [this.minIn, Validators.required],
        checkOut: [this.minOut, Validators.required],
        roomId: ['', Validators.required],
      },
      { validators: [this.checkOutNotBeforeCheckIn] }
    );
  }

  private checkOutNotBeforeCheckIn = (group: AbstractControl): ValidationErrors | null => {
    const ci = group.get('checkIn')?.value;
    const co = group.get('checkOut')?.value;
    if (ci && co && co < ci) {
      return { checkOutBeforeCheckIn: true };
    }
    return null;
  };

  private prefillIfEditing() {
    if (!this.editing) return;
    const e = this.editing;
    this.form.patchValue({
      documento: e.cliente?.documento ?? '',
      nombresCompletos: e.cliente?.nombresCompletos ?? '',
      email: e.cliente?.email ?? '',
      telefono: e.cliente?.telefono ?? '',
      checkIn: this.toYMD(e.checkIn),
      checkOut: this.toYMD(e.checkOut),
      roomId: String(e.habitacion?.id ?? '')
    });
    this.minOut = this.form.value.checkIn || this.minIn;
  }

  // ============ Utils ============
  toYMD(d: Date | string): string {
    const dv = d instanceof Date ? d : new Date(d);
    const mm = String(dv.getMonth() + 1).padStart(2, '0');
    const dd = String(dv.getDate()).padStart(2, '0');
    return `${dv.getFullYear()}-${mm}-${dd}`;
  }
  startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
  diffDays(a?: string | null, b?: string | null) {
    if (!a || !b) return 0;
    const d1 = this.startOfDay(new Date(a)).getTime();
    const d2 = this.startOfDay(new Date(b)).getTime();
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  }
  get nights() { return this.diffDays(this.form.value.checkIn, this.form.value.checkOut); }
  get selectedRoom(): Habitacion | undefined {
    const roomId = this.form?.value?.roomId;
    return this.rooms.find(r => String(r.id) === String(roomId));
  }
  get estimate(): number {
    const price = Number(this.selectedRoom?.precioPorNoche || 0);
    return (this.nights > 0 && price > 0) ? this.nights * price : 0;
  }

  // ============ Data ============
  loadRooms() {
    this.reservationInfra.getRoomsAvailable().subscribe({
      next: (rooms) => (this.rooms = rooms ?? []),
      error: () => (this.rooms = [])
    });
  }

  // ============ RENIEC/SUNAT ============
  lookupDoc() {
    const numero = (this.form.value.documento || '').trim();
    if (!/^\d{8}$|^\d{11}$/.test(numero)) {
      this.form.get('documento')?.markAsTouched();
      return;
    }
    this.consulting = true;
    this.reservationInfra.lookupDocument(numero)
      .pipe(finalize(() => (this.consulting = false)))
      .subscribe({
        next: (info) => {
          this.form.patchValue({
            nombresCompletos: info?.nombresCompletos || ''
          });
        },
        error: () => { /* opcional: toast de error */ }
      });
  }

  // ============ fechas coherentes ============
  syncDates() {
    const ci = this.form.value.checkIn!;
    const co = this.form.value.checkOut!;
    if (ci && co && co < ci) {
      this.form.patchValue({ checkOut: ci }, { emitEvent: false });
    }
    this.minOut = this.form.value.checkIn || this.minIn;
  }

  // ============ submit ============
  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const tipoDocumento = (v.documento!.length === 8) ? 'DNI' : 'RUC';

    const payload = {
      documento: v.documento!.trim(),
      nombresCompletos: v.nombresCompletos!.trim(),
      email: (v.email || '').trim() || undefined,
      telefono: (v.telefono || '').trim() || undefined,
      roomId: Number(v.roomId!),
      checkIn: v.checkIn!,
      checkOut: v.checkOut!,
      tipoDocumento
    };

    this.saving = true;

    // Flujo: crear reserva + (opcional) buscar factura
    this.reservationInfra.createWithCustomer(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (reserva) => {
          // Si quieres emitir o solo consultar si existe
          this.reservationInfra.getInvoiceByReservation(reserva.id).subscribe({
            next: () => this.closed.emit(true),
            error: () => this.closed.emit(true)
          });
        },
        error: (err) => {
          // ejemplo: 409 por duplicado de DNI/email
          const msg = err?.error?.message || 'No se pudo crear la reserva';
          // TODO: mostrar toast
          console.error(msg, err);
        }
      });
  }

  cancel() { this.closed.emit(false); }

  digitsOnly(ctrl: 'documento' | 'telefono', e: Event) {
    const el = e.target as HTMLInputElement;
    const clean = (el.value || '').replace(/\D/g, '');
    this.form.get(ctrl)?.setValue(clean, { emitEvent: false });
  }

  onInputLower(ctrl: string, e: Event) {
    const el = e.target as HTMLInputElement;
    this.form.get(ctrl)?.setValue((el.value || '').trim(), { emitEvent: false });
  }
}
