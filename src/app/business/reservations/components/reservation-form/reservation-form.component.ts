import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ReservationRequest } from '../../domain/reservation.interface';

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-form.component.html'
})
export class ReservationFormComponent implements OnInit {
  @Output() submitted = new EventEmitter<ReservationRequest>();

  form: any;
  todayISO = new Date().toISOString().slice(0, 10);

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      documento: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      nombresCompletos: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
      roomId: [null, [Validators.required, Validators.min(1)]],
      checkIn: ['', Validators.required],
      checkOut: ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.submitted.emit(this.form.value as ReservationRequest);
  }
}
