// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit, computed, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import 'chart.js/auto';
import { firstValueFrom } from 'rxjs';

import { ApiService, DayTotal } from '../../core/services/api.service';
import { ReportService, OccupancyItem } from '../../core/services/report.service';

// ---------- Helpers de fecha en horario local ----------
function localISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`; // YYYY-MM-DD
}
function monthBounds(yyyyMm: string) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end   = new Date(y, m, 0);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  return { start, end };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  // Charts refs (para forzar update)
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  @ViewChild('occBar') occBarChart?: BaseChartDirective;
  @ViewChild('occDoughnut') occDoughnutChart?: BaseChartDirective;

  // ====== RANGO: MES COMPLETO ======
  selectedMonth = localISO(new Date()).slice(0, 7); // 'YYYY-MM'
  start = monthBounds(this.selectedMonth).start;
  end   = monthBounds(this.selectedMonth).end;

  // ====== Tarjetas ======
  totalRooms = 0;
  occupiedToday = 0;
  availableToday = 0;
  occupancyRateToday = 0;

  // ====== Datos crudos ======
  dayTotals = signal<DayTotal[]>([]);          // pagos por día (desde /reports/revenue)
  occupancy  = signal<OccupancyItem[]>([]);    // ocupación por día

  // ====== Métricas derivadas ======
  totalRevenue = computed(() =>
    this.dayTotals().reduce((acc, d) => acc + (Number(d.total) || 0), 0)
  );
  avgRevenue = computed(() => {
    const days = Math.floor((this.end.getTime() - this.start.getTime()) / 86400000) + 1;
    return days ? Math.round(this.totalRevenue() / days) : 0;
  });

  // ====== Configs Chart.js ======
  // Ingresos (línea/área)
  revenueLineData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: [
      {
        label: 'Ingresos diarios (S/.)',
        data: [],
        fill: true,
        tension: 0.25,
        pointRadius: 2,
      },
    ],
  };
  revenueLineOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { display: true } },
  };

  // Ocupación por día (barras apiladas)
  occupancyBarData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { label: 'Ocupadas', data: [] },
      { label: 'Disponibles', data: [] },
    ],
  };
  occupancyBarOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true },
    },
    plugins: { legend: { display: true } },
  };

  // Anillo ocupación de hoy (doughnut)
  doughnutData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Ocupadas', 'Disponibles'],
    datasets: [{ data: [0, 0] }],
  };
  doughnutOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: { legend: { position: 'bottom' } },
  };

  loading = true;
  error: string | null = null;

  constructor(private api: ApiService, private reports: ReportService) {}

  // ================== Ciclo de vida ==================
  ngOnInit(): void {
    this.load();
  }

  // ================== Carga de datos ==================
  async load(): Promise<void> {
    this.loading = true;
    this.error = null;

    // recalcula límites del mes (por si cambió selectedMonth)
    const { start, end } = monthBounds(this.selectedMonth);
    this.start = start;
    this.end = end;

    const s = localISO(this.start);
    const e = localISO(this.end);

    try {
      const [totals, occ] = await Promise.all([
        firstValueFrom(this.api.revenueTotals(s, e)), // pagos agregados por día
        firstValueFrom(this.reports.occupancy(s, e)), // ocupación
      ]);
      this.dayTotals.set(totals ?? []);
      this.occupancy.set(occ ?? []);

      this.hydrateRevenueChart();
      this.hydrateOccupancyCharts();
    } catch (err: any) {
      console.error(err);
      this.error = err?.error?.message ?? 'No se pudieron cargar los reportes';
    } finally {
      this.loading = false;
    }
  }

  // ================== Charts: ingresos ==================
  private hydrateRevenueChart() {
    const rows = this.dayTotals(); // [{ day:'YYYY-MM-DD', total:number }]
    const start = this.start, end = this.end;

    // 1) labels día a día del rango
    const labels: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      labels.push(localISO(d));
    }

    // 2) mapa fecha → total (relleno con 0)
    const map = new Map<string, number>();
    labels.forEach(l => map.set(l, 0));

    // 3) sumar totales en su día
    for (const r of rows) {
      const key = (r.day || '').substring(0, 10);
      if (key && map.has(key)) map.set(key, (map.get(key) || 0) + Number(r.total || 0));
    }

    // 4) set chart y update
    this.revenueLineData = {
      labels,
      datasets: [
        { ...this.revenueLineData.datasets[0], data: labels.map(k => map.get(k) || 0) }
      ],
    };
    this.chart?.update();
  }

  // ================== Charts: ocupación ==================
  private hydrateOccupancyCharts() {
    const o = this.occupancy();
    const labels = o.map(x => (typeof x.day === 'string' ? x.day : String(x.day)));
    const occupied = o.map(x => Number(x.occupied || 0));
    const available = o.map(x => Number(x.available || 0));

    // barras apiladas
    this.occupancyBarData = {
      labels,
      datasets: [
        { ...this.occupancyBarData.datasets[0], data: occupied },
        { ...this.occupancyBarData.datasets[1], data: available },
      ],
    };
    this.occBarChart?.update();

    // anillo “hoy”
    const todayIso = localISO(this.end);
    const todayRow = o.find(x =>
      (typeof x.day === 'string' ? x.day : new Date(x.day).toISOString().slice(0, 10)) === todayIso
    );

    this.occupiedToday = todayRow?.occupied ?? 0;
    this.availableToday = todayRow?.available ?? 0;
    const total = this.occupiedToday + this.availableToday;
    this.totalRooms = total;
    this.occupancyRateToday = total ? this.occupiedToday / total : 0;

    this.doughnutData = {
      labels: ['Ocupadas', 'Disponibles'],
      datasets: [{ data: [this.occupiedToday, this.availableToday] }],
    };
    this.occDoughnutChart?.update();
  }

  // ================== Cambiar de mes ==================
  onMonthChange(value: string) {        // value: 'YYYY-MM' desde <input type="month">
    if (!value) return;
    this.selectedMonth = value;
    this.load();
  }
  shiftMonth(delta: number) {           // -1 anterior, +1 siguiente
    const [y, m] = this.selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    this.selectedMonth = localISO(d).slice(0, 7);
    this.load();
  }
}
