import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Reserva } from '../../reservations/domain/reservation.interface';
import { PaymentModalComponent } from '../../../components/payment-modal.component';
import { ApiService } from '../../../core/services/api.service';
import { ReservationInfraestructure } from '../../reservations/infraestructure/reservation.infraestructure';
import Swal from 'sweetalert2';

type Mode = 'checkin' | 'checkout' | 'both';

@Component({
  selector: 'app-check-center',
  standalone: true,
  imports: [CommonModule, PaymentModalComponent],
  templateUrl: './check-center.component.html',
  styleUrls: ['./check-center.component.css']
})
export class CheckCenterComponent implements OnInit, OnChanges {
  /** Todas las reservas que quieras mostrar (por fecha de hoy o lo que toque) */
  @Input() reservas: Reserva[] = [];
  @Input() mode: Mode = 'both';
  /** ocultar cabecera (para embebidos en páginas) */
  @Input() hideHeader = false;

  /** Eventos hacia afuera (opcional, por si un contenedor superior quiere escuchar) */
  @Output() doCheckIn = new EventEmitter<Reserva>();
  @Output() doCheckOut = new EventEmitter<Reserva>();

  // estado UI
  tab: 'arrivals' | 'stays' = 'arrivals';
  query = '';
  selected: Reserva | null = null;

  // Pago / modal
  facturaSeleccionada: any = null;
  mostrarModalPago = false;

  constructor(private api: ApiService, private reser: ReservationInfraestructure) {}

  arrivals: Reserva[] = [];
  stays: Reserva[] = [];

  // ===== Helpers =====
  private norm(s: any) { return (s ?? '').toString().trim().toUpperCase(); }
  private state(r?: Reserva | null) { return this.norm(r?.estado); }

  ngOnInit(): void {
    this.refresh(); // ✅ Llama la API al iniciar
  }

  ngOnChanges(_: SimpleChanges): void {
    // tab por modo
    this.tab = (this.mode === 'checkout') ? 'stays' : 'arrivals';
    this.splitData();
  }

  private splitData() {
    const q = this.norm(this.query).toLowerCase();
    const match = (r: Reserva) => {
      if (!q) return true;
      return [
        r?.cliente?.nombresCompletos,
        r?.cliente?.documento,
        r?.habitacion?.numero
      ]
        .map(v => this.norm(v).toLowerCase())
        .some(v => v.includes(q));
    };

    this.arrivals = (this.reservas || [])
      .filter(r => this.state(r) === 'RESERVADO')
      .filter(match);

    this.stays = (this.reservas || [])
      .filter(r => this.state(r) === 'CHECKED_IN')
      .filter(match);

    // si el seleccionado desaparece tras buscar, lo limpiamos
    if (this.selected && ![...this.arrivals, ...this.stays].some(x => x.id === this.selected!.id)) {
      this.selected = null;
    }
  }

  // === API visible para el template ===
  filteredReservations(): Reserva[] {
    return this.tab === 'arrivals' ? this.arrivals : this.stays;
  }

  primaryActionEnabled(): boolean {
    if (!this.selected) return false;
    return this.canCheckIn(this.selected) || this.canCheckOut(this.selected);
  }

  setTab(t: 'arrivals' | 'stays') { this.tab = t; this.selected = null; }
  onSearch(q: string) { this.query = q; this.splitData(); }
  pick(r: Reserva) { this.selected = r; }

  // Estados permitidos
  canCheckIn(r?: Reserva | null) { return !!r && this.state(r) === 'RESERVADO'; }
  canCheckOut(r?: Reserva | null) { return !!r && this.state(r) === 'CHECKED_IN'; }

  // Acción primaria: AHORA sí pega check-in
  primaryAction() {
    if (this.canCheckIn(this.selected)) {
      // Llama a la API directamente
      this.onDoCheckIn(this.selected!);
      // Y si quieres, además emite hacia arriba
      this.doCheckIn.emit(this.selected!);
      return;
    }

    if (this.canCheckOut(this.selected)) {
      this.abrirModalPago(this.selected!);
      return;
    }
  }

  // ===== Modal de pago =====
  abrirModalPago(reserva: Reserva) {
    this.facturaSeleccionada = {
      id: reserva.id,
      total: reserva.precioTotal,
      deuda: reserva.precioTotal,
      reservationId: reserva.id,
    };
    this.mostrarModalPago = true;
  }

  cerrarModalPago() {
    this.mostrarModalPago = false;
  }

procesarPago(event: { monto: number; metodo: string }) {
  if (!this.facturaSeleccionada) return;

  // Abrimos la ventana antes para evitar bloqueos de popups
  const newWindow = window.open('', '_blank');

  this.api.recordPayment({
    reservationId: this.facturaSeleccionada.reservationId,
    amount: event.monto,
    method: (event.metodo ?? '').toString().toUpperCase(),
  }).subscribe({
    next: (res: any) => {
      console.log('Respuesta de recordPayment:', res);

      const paymentId = res?.data?.id;
      console.log('paymentId =', paymentId);

      // 1) Descargar/abrir la boleta en PDF
      if (paymentId) {
        this.reser.downloadPaymentReceipt(paymentId).subscribe({
          next: (blob) => {
            console.log('Blob PDF recibido:', blob);
            const url = URL.createObjectURL(blob);

            if (newWindow) {
              newWindow.location.href = url; // carga el PDF en la nueva pestaña
            } else {
              window.open(url, '_blank');
            }
          },
          error: (err) => {
            console.error('Error al descargar el comprobante PDF', err);
            Swal.fire({
              icon: 'error',
              title: 'Error al descargar la boleta',
              text: 'El pago se registró, pero no se pudo abrir el comprobante.',
              confirmButtonColor: '#dc2626',
            });
          },
        });
      } else {
        console.warn('No vino id de pago en res.data.id, no se puede descargar boleta');
      }

      // 2) Después de registrar el pago, hacemos el check-out
      this.onCheckOutAfterPayment(this.facturaSeleccionada.reservationId);

      // 3) Cerramos el modal y mostramos éxito
      this.cerrarModalPago();
      Swal.fire({
        icon: 'success',
        title: 'Pago completado con éxito',
        text: 'El check-out se ha registrado correctamente.',
        confirmButtonColor: '#2563eb',
      });
    },
    error: (err: any) => {
      console.error('Error al registrar el pago', err);
      Swal.fire({
        icon: 'error',
        title: 'Error al registrar el pago',
        text: 'Verifica la conexión o el servidor.',
        confirmButtonColor: '#dc2626',
      });
    },
  });
}



  // ===== Acciones contra API =====
  onDoCheckIn(r: Reserva) {
    this.reser.checkIn(r.id).subscribe({
      next: () => {
        this.refresh();
        Swal.fire({
          icon: 'success',
          title: 'Check-in registrado',
          confirmButtonColor: '#16a34a'
        });
      },
      error: (e) => {
        console.error(e);
        Swal.fire({ icon: 'error', title: 'No se pudo hacer check-in' });
      }
    });
  }

  onDoCheckOut(r: Reserva) {
    this.reser.checkOut(r.id).subscribe({
      next: () => {
        this.doCheckOut.emit(r); // por si otro componente padre quiere escuchar
        this.refresh();
      },
      error: (e) => console.error(e)
    });
  }

  private onCheckOutAfterPayment(reservationId: number) {
    this.reser.checkOut(reservationId).subscribe({
      next: () => {
        const res = [...this.arrivals, ...this.stays].find(x => x.id === reservationId) || null;
        if (res) this.doCheckOut.emit(res);
        this.refresh();
      },
      error: (e) => console.error('Error al hacer check-out después de pago', e)
    });
  }

  private refresh() {
    this.reser.getAllReservations().subscribe({
      next: d => {
        this.reservas = d;
        this.splitData();
      },
      error: (e) => console.error(e)
    });
  }
}
