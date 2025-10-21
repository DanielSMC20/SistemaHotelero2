// src/app/components/payment-modal/payment-modal.component.ts
import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceResponse } from '../core/models/models';

interface ExtraCharge {
  id: string;
  concepto: string;
  monto: number;
}

@Component({
  selector: 'app-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payment-modal.component.html',
})
export class PaymentModalComponent implements OnChanges {
  @Input() factura: InvoiceResponse | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() pay = new EventEmitter<{ monto: number; metodo: string; extras?: ExtraCharge[] }>();

  metodoPago = 'Efectivo';
  montoBase = 0;
  montoPago = 0;
  extras: ExtraCharge[] = [];
  extraConcepto = '';
  extraMonto: number | null = null;

  ngOnChanges(): void {
    if (!this.factura) return;

    this.montoBase = Number(this.factura.total ?? this.factura.monto ?? 0);
    const key = this.storageKey();
    const saved = localStorage.getItem(key);
    this.extras = saved ? JSON.parse(saved) as ExtraCharge[] : [];
    this.recomputeTotals();
  }

  addExtra() {
    const c = (this.extraConcepto ?? '').trim();
    const m = Number(this.extraMonto ?? 0);
    if (!c || m <= 0) return;

    this.extras = [
      ...this.extras,
      { id: cryptoRandom(), concepto: c, monto: round2(m) }
    ];
    this.persist();
    this.extraConcepto = '';
    this.extraMonto = null;
    this.recomputeTotals();
  }

  removeExtra(id: string) {
    this.extras = this.extras.filter(e => e.id !== id);
    this.persist();
    this.recomputeTotals();
  }

  get totalExtras(): number {
    return this.extras.reduce((s, e) => s + (e.monto || 0), 0);
  }

  get totalAPagar(): number {
    return round2(this.montoBase + this.totalExtras);
  }

  private recomputeTotals() {
    this.montoPago = this.totalAPagar;
  }

  private persist() {
    const key = this.storageKey();
    localStorage.setItem(key, JSON.stringify(this.extras));
  }

  private storageKey() {
    const id = this.factura?.reservaId ?? this.factura?.id ?? 0;
    return `extras:${id}`;
  }

  confirmarPago() {
    this.pay.emit({ monto: this.totalAPagar, metodo: this.metodoPago, extras: this.extras });
  }
}

// -------- Helpers locales --------
function round2(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }
function cryptoRandom() { return Math.random().toString(36).slice(2, 10); }
