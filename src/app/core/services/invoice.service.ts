import { env } from '../environments/environment'; // usa environment si prefieres
// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

const API_BASE = env.API_BASE;

@Injectable({ providedIn: 'root' })
export class InvoiceResponse {
  getRoomById(id: number): Observable<import("./hotel.service").Room> {
    throw new Error('Method not implemented.');
  }
  constructor(private http: HttpClient) {}
}