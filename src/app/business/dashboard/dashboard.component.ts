import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartConfiguration } from 'chart.js';
// Importa la directiva directamente
import { BaseChartDirective } from 'ng2-charts';

import 'chart.js/auto'; // ✅ registra Chart.js automáticamente
import { firstValueFrom } from 'rxjs'; // ✅ para reemplazar toPromise
import { ReportService, DailyRevenueItem, OccupancyItem } from '../../core/services/report.service';
import { ApiService } from '../../core/services/api.service';

function iso(d: Date) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  // Usa BaseChartDirective en lugar de NgChartsModule
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  // rango: últimos 30 días
  today = new Date();
  start = new Date(new Date().setDate(this.today.getDate() - 29));
  end = this.today;

  // tarjetas
  totalRooms = 0;
  occupiedToday = 0;
  availableToday = 0;
  occupancyRateToday = 0; // 0..1

  // datos crudos
  revenue = signal<DailyRevenueItem[]>([]);
  occupancy = signal<OccupancyItem[]>([]);

  // métricas derivadas
  totalRevenue = computed(() =>
    this.revenue().reduce((acc, r) => acc + (Number(r.total) || 0), 0)
  );
  avgRevenue = computed(() =>
    this.revenue().length ? Math.round(this.totalRevenue() / this.revenue().length) : 0
  );

  // ====== Chart.js configs ======
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

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = null;

    const s = iso(this.start);
    const e = iso(this.end);

    try {
      const [rev, occ] = await Promise.all([
        firstValueFrom(this.reports.revenue(s, e)),
        firstValueFrom(this.reports.occupancy(s, e)),
      ]);
      this.revenue.set(rev ?? []);
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

  private hydrateRevenueChart() {
    const r = this.revenue();
    const labels = r.map(x => (typeof x.day === 'string' ? x.day : x.day.toString()));
    const data = r.map(x => Number(x.total || 0));

    this.revenueLineData = {
      labels,
      datasets: [{ ...this.revenueLineData.datasets[0], data }],
    };
  }

  private hydrateOccupancyCharts() {
    const o = this.occupancy();
    const labels = o.map(x => (typeof x.day === 'string' ? x.day : x.day.toString()));
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

    // anillo “hoy”
    const todayIso = iso(this.end);
    const todayRow = o.find(x => {
      const d = typeof x.day === 'string' ? x.day : new Date(x.day).toISOString().slice(0, 10);
      return d === todayIso;
    });

    this.occupiedToday = todayRow?.occupied ?? 0;
    this.availableToday = todayRow?.available ?? 0;
    const total = this.occupiedToday + this.availableToday;
    this.totalRooms = total; // inferimos
    this.occupancyRateToday = total ? this.occupiedToday / total : 0;

    this.doughnutData = {
      labels: ['Ocupadas', 'Disponibles'],
      datasets: [{ data: [this.occupiedToday, this.availableToday] }],
    };
  }

  // util para cambiar rango rápido (7/30 días)
  setRange(days: number) {
    this.start = new Date(new Date().setDate(this.today.getDate() - (days - 1)));
    this.load();
  }

  private loadAll(): void {
  // === INGRESOS DIARIOS ===
  this.api.getRevenueByDay(this.start, this.end).subscribe({
    next: (resp: any) => {
      const arr = resp.data || []; // ApiResponse<List<DailyRevenueItem>>
      const labels = arr.map((d: any) => d.date);
      const values = arr.map((d: any) => d.total);
      this.revenueLineData = {
        labels,
        datasets: [
          { label: 'Ingresos (S/.)', data: values, borderColor: '#2563eb', fill: false }
        ]
      };
    },
    error: (err) => console.error('Error al obtener ingresos', err)
  });

  // === OCUPACIÓN POR DÍA ===
  this.api.getOccupancyByDay(this.start, this.end).subscribe({
    next: (resp: any) => {
      const arr = resp.data || []; // ApiResponse<List<OccupancyItem>>
      this.occupancyBarData = {
        labels: arr.map((d: any) => d.date),
        datasets: [
          { label: 'Ocupadas', data: arr.map((d: any) => d.occupied), stack: 'occ' },
          { label: 'Disponibles', data: arr.map((d: any) => d.available), stack: 'occ' },
          { label: 'Mantenimiento', data: arr.map((d: any) => d.maintenance || 0), stack: 'occ' }
        ]
      };
    },
    error: (err) => console.error('Error al obtener ocupación', err)
  });
}
}
