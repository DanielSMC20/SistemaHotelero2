import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';
import { CommonModule, NgIfContext } from '@angular/common';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormGroup,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ReservationInfraestructure } from '../../infraestructure/reservation.infraestructure';
import { Reserva } from '../../domain/reservation.interface';
import { Habitacion } from '../../../../core/models/models';
import { PhoneCodeApi, PhoneCodeUI } from '../../../../core/models/models';

type PhoneRule = { min: number; max: number };

@Component({
  selector: 'app-reservation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './reservation-form.component.html',
  styleUrls: ['./reservation-form.component.css'],
})
export class ReservationFormComponent implements OnInit {
  @Input() editing: Reserva | null = null;
  @Output() closed = new EventEmitter<boolean>(); // true = refrescar lista

  PEN = new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 2,
  });

  rooms: Habitacion[] = [];
  consulting = false;
  saving = false;

  today = new Date();
  minIn = this.toYMD(this.today);
  minOut = this.toYMD(
    new Date(
      this.today.getFullYear(),
      this.today.getMonth(),
      this.today.getDate() + 1
    )
  );

  form!: FormGroup;

phoneCodes: PhoneCodeUI[] = [];

  // Reglas de longitud por país (local, SIN prefijo)
  private PHONE_RULES: Record<string, PhoneRule> = {
    '+51': { min: 9, max: 9 }, // Perú
    '+1': { min: 10, max: 10 }, // USA/Canadá
    '+34': { min: 9, max: 9 }, // España
    '+54': { min: 10, max: 10 }, // Argentina
    '+55': { min: 10, max: 11 }, // Brasil
    '+56': { min: 9, max: 9 }, // Chile
    '+57': { min: 10, max: 10 }, // Colombia
    '+58': { min: 10, max: 10 }, // Venezuela
    '+593': { min: 9, max: 9 }, // Ecuador
    '+502': { min: 8, max: 8 }, // Guatemala
    default: { min: 6, max: 15 },
  };

  // Reglas de documento por tipo
  private DOC_RULES: Record<
    string,
    {
      numeric: boolean;
      min: number;
      max: number;
      placeholder: string;
      help: string;
    }
  > = {
    DNI: {
      numeric: true,
      min: 8,
      max: 8,
      placeholder: 'DNI (8 dígitos)',
      help: 'Ingresa DNI de 8 dígitos.',
    },
    CE: {
      numeric: false,
      min: 8,
      max: 12,
      placeholder: 'CE (8-12 alfanum.)',
      help: 'CE: 8 a 12 caracteres alfanuméricos.',
    },
    PASAPORTE: {
      numeric: false,
      min: 6,
      max: 12,
      placeholder: 'Pasaporte (6-12)',
      help: 'Pasaporte: 6 a 12 caracteres.',
    },
    OTRO: {
      numeric: false,
      min: 4,
      max: 20,
      placeholder: 'Documento',
      help: 'Documento: 4 a 20 caracteres.',
    },
    RUC: {
      numeric: true,
      min: 11,
      max: 11,
      placeholder: 'RUC (11 dígitos)',
      help: 'RUC: 11 dígitos.',
    },
  };
  loadingCodes: boolean | undefined;
  fallbackCodes!: TemplateRef<NgIfContext<number | false>> | null;

  constructor(
    private fb: FormBuilder,
    private reservationInfra: ReservationInfraestructure
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadRooms();
    this.prefillIfEditing();
    this.loadPhoneCodes();
    this.loadPhoneCodes();   

    this.form
      .get('phoneCountryCode')!
      .valueChanges.subscribe(() => this.updatePhoneValidators());
    this.form
      .get('telefono')!
      .valueChanges.subscribe(() => this.updatePhoneValidators());

    // Revalidar documento cuando cambie el tipo
    this.form
      .get('tipoPersona')!
      .valueChanges.subscribe(() => this.updateDocumentoValidators());
    this.form
      .get('tipoDocumento')!
      .valueChanges.subscribe(() => this.updateDocumentoValidators());

    this.form.valueChanges.subscribe(() => this.syncDates());

    // aplicar validadores iniciales
    this.updatePhoneValidators();
    this.updateDocumentoValidators();
  }
private prefillIfEditing() {
  if (!this.editing) return;
  const e = this.editing;
  this.form.patchValue({
    tipoPersona: e.cliente?.tipoPersona || 'NATURAL',
    tipoDocumento: e.cliente?.tipoDocumento || 'DNI',
    documento: e.cliente?.documento || '',
    nombresCompletos: e.cliente?.nombresCompletos || e.cliente?.razonSocial || '',
    email: e.cliente?.email || '',
    phoneCountryCode: '+51',           // si guardas separado en backend, mapéalo aquí
    telefono: (e.cliente?.telefono || '').replace(/\D/g, ''),

    checkIn: this.toYMD(e.checkIn),
    checkOut: this.toYMD(e.checkOut),
    roomId: String(e.habitacion?.id ?? '')
  });

  // actualiza mínimos y validadores dependientes
  this.minOut = this.form.value.checkIn || this.minIn;
  this.updateDocumentoValidators();
  this.updatePhoneValidators();
}

  // ============ Form & validators ============
  private buildForm() {
    const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ'’\-. ]+$/;

    this.form = this.fb.group(
      {
        // persona/doc
        tipoPersona: ['NATURAL', Validators.required], // NATURAL | JURIDICA
        tipoDocumento: ['DNI', Validators.required], // NATURAL: DNI/CE/PASAPORTE/OTRO, JURIDICA: RUC fijo en UI

        documento: ['', []], // validadores dinámicos por tipo

        // Nombres/Razón social
        nombresCompletos: [
          '',
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(120),
            Validators.pattern(NAME_REGEX),
          ],
        ],

        // Email opcional pero válido y <= 80
        email: ['', [Validators.email, Validators.maxLength(80)]],

        // Teléfono
        phoneCountryCode: ['+51', Validators.required],
        telefono: ['', [Validators.pattern(/^\d*$/)]], // min/max dinámico

        // Fechas y room
        checkIn: [this.minIn, Validators.required],
        checkOut: [this.minOut, Validators.required],
        roomId: ['', Validators.required],
      },
      { validators: [this.checkOutNotBeforeCheckIn] }
    );
  }

  private updateDocumentoValidators() {
    const persona = this.form.get('tipoPersona')!.value || 'NATURAL';
    const tipo =
      persona === 'JURIDICA'
        ? 'RUC'
        : this.form.get('tipoDocumento')!.value || 'DNI';
    const rule = this.DOC_RULES[tipo];

    const ctrl = this.form.get('documento')!;
    const validators = [];

    // requerido siempre
    validators.push(Validators.required);
    // patrón por tipo
    if (rule.numeric) {
      validators.push(Validators.pattern(/^\d+$/));
      validators.push(Validators.minLength(rule.min));
      validators.push(Validators.maxLength(rule.max));
    } else {
      // alfanumérico flexible
      validators.push(Validators.pattern(/^[A-Za-z0-9]+$/));
      validators.push(Validators.minLength(rule.min));
      validators.push(Validators.maxLength(rule.max));
    }

    ctrl.setValidators(validators);
    ctrl.updateValueAndValidity({ emitEvent: false });

    // ajustar valor actual a la norma
    const now = String(ctrl.value || '');
    ctrl.setValue(this.normalizeDoc(now, tipo), { emitEvent: false });
  }

  private updatePhoneValidators() {
    const code = this.form.get('phoneCountryCode')!.value || '+51';
    const rule = this.getPhoneRule(code);
    const telCtrl = this.form.get('telefono')!;

    telCtrl.setValidators([
      Validators.required,
      Validators.pattern(/^\d+$/),
      Validators.minLength(rule.min),
      Validators.maxLength(rule.max),
    ]);
    telCtrl.updateValueAndValidity({ emitEvent: false });
  }

private getPhoneRule(code?: string) {
  const k = (code || '').trim();
  return this.PHONE_RULES[k] || this.PHONE_RULES['default'];
}

  // ============ Getters usados por el template ============
  get docMaxLength(): number {
    const persona = this.form.get('tipoPersona')!.value || 'NATURAL';
    const tipo =
      persona === 'JURIDICA'
        ? 'RUC'
        : this.form.get('tipoDocumento')!.value || 'DNI';
    return this.DOC_RULES[tipo].max;
  }

  get isNumericDoc(): boolean {
    const persona = this.form.get('tipoPersona')!.value || 'NATURAL';
    const tipo =
      persona === 'JURIDICA'
        ? 'RUC'
        : this.form.get('tipoDocumento')!.value || 'DNI';
    return this.DOC_RULES[tipo].numeric;
  }

  get placeholderDoc(): string {
    const persona = this.form.get('tipoPersona')!.value || 'NATURAL';
    const tipo =
      persona === 'JURIDICA'
        ? 'RUC'
        : this.form.get('tipoDocumento')!.value || 'DNI';
    return this.DOC_RULES[tipo].placeholder;
  }

  get helpDoc(): string {
    const ctrl = this.form.get('documento')!;
    const persona = this.form.get('tipoPersona')!.value || 'NATURAL';
    const tipo =
      persona === 'JURIDICA'
        ? 'RUC'
        : this.form.get('tipoDocumento')!.value || 'DNI';
    const rule = this.DOC_RULES[tipo];

    if (!ctrl.touched || ctrl.valid) return rule.help;
    if (ctrl.hasError('required')) return 'Documento obligatorio.';
    if (ctrl.hasError('pattern'))
      return rule.numeric ? 'Solo dígitos.' : 'Solo caracteres alfanuméricos.';
    if (ctrl.hasError('minlength') || ctrl.hasError('maxlength'))
      return `Longitud inválida: ${rule.min} a ${rule.max} caracteres.`;
    return rule.help;
  }

  // ============ UI actions ============
  toggleJuridica(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.form.get('tipoPersona')!.setValue(checked ? 'JURIDICA' : 'NATURAL');

    // Si es jurídica, bloqueamos a RUC y normalizamos
    if (checked) {
      this.form.get('tipoDocumento')!.setValue('DNI', { emitEvent: false }); // no se usa en UI, pero mantenemos algo
      const norm = this.normalizeDoc(
        String(this.form.get('documento')!.value || ''),
        'RUC'
      );
      this.form.get('documento')!.setValue(norm, { emitEvent: false });
    } else {
      // vuelve a NATURAL con DNI por defecto
      this.form.get('tipoDocumento')!.setValue('DNI', { emitEvent: false });
      const norm = this.normalizeDoc(
        String(this.form.get('documento')!.value || ''),
        'DNI'
      );
      this.form.get('documento')!.setValue(norm, { emitEvent: false });
    }

    this.updateDocumentoValidators();
  }

  // Normaliza el input del documento según tipo
  onDocumentoInput(e: Event) {
    const el = e.target as HTMLInputElement;
    const persona = this.form.get('tipoPersona')!.value || 'NATURAL';
    const tipo =
      persona === 'JURIDICA'
        ? 'RUC'
        : this.form.get('tipoDocumento')!.value || 'DNI';
    const norm = this.normalizeDoc(el.value || '', tipo);
    if (norm !== el.value) {
      this.form.get('documento')!.setValue(norm, { emitEvent: false });
    }
  }

  private normalizeDoc(v: string, tipo: string): string {
    const rule = this.DOC_RULES[tipo] || this.DOC_RULES['DNI'];
    const clean = rule.numeric
      ? v.replace(/\D+/g, '')
      : v.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return clean.slice(0, rule.max);
  }

  // ============ Utils ============
  toYMD(d: Date | string): string {
    const dv = d instanceof Date ? d : new Date(d);
    const mm = String(dv.getMonth() + 1).padStart(2, '0');
    const dd = String(dv.getDate()).padStart(2, '0');
    return `${dv.getFullYear()}-${mm}-${dd}`;
  }
  startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  diffDays(a?: string | null, b?: string | null) {
    if (!a || !b) return 0;
    const d1 = this.startOfDay(new Date(a)).getTime();
    const d2 = this.startOfDay(new Date(b)).getTime();
    return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
  }
  get nights() {
    return this.diffDays(this.form.value.checkIn, this.form.value.checkOut);
  }
  get selectedRoom(): Habitacion | undefined {
    const roomId = this.form?.value?.roomId;
    return this.rooms.find((r) => String(r.id) === String(roomId));
  }
  get estimate(): number {
    const price = Number(this.selectedRoom?.precioPorNoche || 0);
    return this.nights > 0 && price > 0 ? this.nights * price : 0;
  }

  // ============ Data ============
  loadRooms() {
    this.reservationInfra.getRoomsAvailable().subscribe({
      next: (rooms) => (this.rooms = rooms ?? []),
      error: () => (this.rooms = []),
    });
  }

  // ============ RENIEC/SUNAT ============
  lookupDoc() {
    const persona = this.form.get('tipoPersona')!.value || 'NATURAL';
    const tipo =
      persona === 'JURIDICA'
        ? 'RUC'
        : this.form.get('tipoDocumento')!.value || 'DNI';
    const numero = (this.form.value.documento || '').trim();
    // validación mínima antes de consultar
    const rule = this.DOC_RULES[tipo];
    if (!numero || numero.length < rule.min) {
      this.form.get('documento')?.markAsTouched();
      return;
    }

    this.consulting = true;

    // usa tu infraestructura actual (para DNI/RUC)
    if (tipo === 'RUC') {
      this.reservationInfra
        .lookupRuc(numero)
        .pipe(finalize(() => (this.consulting = false)))
        .subscribe({
          next: (r) => {
            const razon = (r as any)?.razon_social?.toString().trim() ?? '';
            if (razon) this.form.patchValue({ nombresCompletos: razon });
          },
          error: () => {},
        });
      return;
    }
    if (tipo === 'DNI') {
      this.reservationInfra
        .lookupDni(numero)
        .pipe(finalize(() => (this.consulting = false)))
        .subscribe({
          next: (r) => {
            const full = (r as any)?.full_name?.toString().trim() ?? '';
            if (full) this.form.patchValue({ nombresCompletos: full });
          },
          error: () => {},
        });
      return;
    }

    // Otros tipos: sin consulta externa
    this.consulting = false;
  }

  // ============ fechas coherentes ============
  private checkOutNotBeforeCheckIn = (
    group: AbstractControl
  ): ValidationErrors | null => {
    const ci = group.get('checkIn')?.value;
    const co = group.get('checkOut')?.value;
    if (ci && co && co < ci) {
      return { checkOutBeforeCheckIn: true };
    }
    return null;
  };

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

    // tipoDocumento final
    const tipoFinal = v.tipoPersona === 'JURIDICA' ? 'RUC' : v.tipoDocumento;

    // Teléfono -> E.164
    const code = String(v.phoneCountryCode || '+51')
      .replace(/[^+\d]/g, '')
      .replace(/^([^+])/, '+$1');
    const local = String(v.telefono || '').replace(/\D+/g, '');
    const telefonoE164 = `${code}${local}`;

    const payload = {
      // cliente
      tipoPersona: v.tipoPersona,
      tipoDocumento: tipoFinal,
      documento: v.documento.trim(),
      nombresCompletos: v.nombresCompletos.trim(),
      email: (v.email || '').trim() || undefined,

      // teléfono
      phoneCountryCode: code,
      telefono: local || undefined,
      telefonoE164,

      // reserva
      roomId: Number(v.roomId!),
      checkIn: v.checkIn!,
      checkOut: v.checkOut!,
      estado: 'RESERVADO',
    };

    this.saving = true;

    this.reservationInfra
      .createWithCustomer(payload as any)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (reserva) => {
          // opcional: consulta de factura
          this.reservationInfra.getInvoiceByReservation(reserva.id).subscribe({
            next: () => this.closed.emit(true),
            error: () => this.closed.emit(true),
          });
        },
        error: (err) => {
          const msg = err?.error?.message || 'No se pudo crear la reserva';
          console.error(msg, err);
        },
      });
  }

  cancel() {
    this.closed.emit(false);
  }

  // util para inputs numéricos
  digitsOnly(ctrl: 'documento' | 'telefono', e: Event) {
    const el = e.target as HTMLInputElement;
    const clean = (el.value || '').replace(/\D/g, '');
    this.form.get(ctrl)?.setValue(clean, { emitEvent: false });
  }

  // trim util
  onInputLower(ctrl: string, e: Event) {
    const el = e.target as HTMLInputElement;
    this.form
      .get(ctrl)
      ?.setValue((el.value || '').trim(), { emitEvent: false });
  }

  private loadPhoneCodes() {
  this.loadingCodes = true;
  this.reservationInfra.getPhoneCodes().subscribe({
    next: (codes: PhoneCodeApi[]) => {
      // Mapear a modelo de UI
      this.phoneCodes = (codes || [])
        .map(c => ({ code: c.dialCode, label: c.country, flag: c.flag }))
        .sort((a, b) => a.label.localeCompare(b.label));

      // Si el control no tiene valor, setear +51 por defecto si existe
      const current = this.form.get('phoneCountryCode')!.value;
      if (!current) {
        const pe = this.phoneCodes.find(c => c.code === '+51');
        this.form.get('phoneCountryCode')!.setValue(pe?.code || '+51', { emitEvent: false });
      }
    },
    error: () => {},
    complete: () => this.loadingCodes = false
  });
}
}
