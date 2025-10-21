import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DailyRevenueItem {
  day: string | Date;     // LocalDate en backend → string ISO
  total: number;
}
export interface OccupancyItem {
  day: string | Date;
  occupied: number;
  available: number;
  rate: number;           // 0..1
}
interface ApiResponse<T> { success: boolean; data: T; message?: string; }

@Injectable({ providedIn: 'root' })
export class ReportService {
  private API = environment.API_URL;
  constructor(private http: HttpClient) {}

  private auth(): HttpHeaders {
    const token = localStorage.getItem('token') ?? '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  revenue(start: string, end: string): Observable<DailyRevenueItem[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http
      .get<ApiResponse<DailyRevenueItem[]>>(`${this.API}/reports/revenue`, { headers: this.auth(), params })
      .pipe(map(r => r.data ?? []));
  }

  occupancy(start: string, end: string): Observable<OccupancyItem[]> {
    const params = new HttpParams().set('start', start).set('end', end);
    return this.http
      .get<ApiResponse<OccupancyItem[]>>(`${this.API}/reports/occupancy`, { headers: this.auth(), params })
      .pipe(map(r => r.data ?? []));
  }
}
