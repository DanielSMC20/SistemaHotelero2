import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly API_BASE_URL = 'http://localhost:3000/api'; // Cambiar por tu backend
  private readonly httpOptions: any;

  constructor(private http: HttpClient, private authService: AuthService) {
    this.httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  }

  // Obtener headers con token de autenticación
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.append('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // GET request genérico
  get<T>(endpoint: string, params?: any): Observable<T> {
    const headers = this.getAuthHeaders();
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.append(key, params[key].toString());
        }
      });
    }

    return this.http.get<T>(`${this.API_BASE_URL}/${endpoint}`, {
      headers,
      params: httpParams,
    });
  }

  // POST request genérico
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.API_BASE_URL}/${endpoint}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  // PUT request genérico
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.API_BASE_URL}/${endpoint}`, data, {
      headers: this.getAuthHeaders(),
    });
  }

  // DELETE request genérico
  delete<T>(endpoint: string, id?: number): Observable<T> {
    const url = id ? `${endpoint}/${id}` : endpoint;
    return this.http.delete<T>(`${this.API_BASE_URL}/${url}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // Métodos específicos para el sistema hotelero

  // Habitaciones
  getRooms(params?: any): Observable<any> {
    return this.get('rooms', params);
  }

  getRoomById(id: number): Observable<any> {
    return this.get(`rooms/${id}`);
  }

  createRoom(roomData: any): Observable<any> {
    return this.post('rooms', roomData);
  }

  updateRoom(id: number, roomData: any): Observable<any> {
    return this.put(`rooms/${id}`, roomData);
  }

  deleteRoom(id: number): Observable<any> {
    return this.delete('rooms', id);
  }

  // Reservaciones
  getReservations(params?: any): Observable<any> {
    return this.get('reservations', params);
  }

  getReservationById(id: number): Observable<any> {
    return this.get(`reservations/${id}`);
  }

  createReservation(reservationData: any): Observable<any> {
    return this.post('reservations', reservationData);
  }

  updateReservation(id: number, reservationData: any): Observable<any> {
    return this.put(`reservations/${id}`, reservationData);
  }

  deleteReservation(id: number): Observable<any> {
    return this.delete('reservations', id);
  }

  // Huéspedes
  getGuests(params?: any): Observable<any> {
    return this.get('guests', params);
  }

  getGuestById(id: number): Observable<any> {
    return this.get(`guests/${id}`);
  }

  createGuest(guestData: any): Observable<any> {
    return this.post('guests', guestData);
  }

  updateGuest(id: number, guestData: any): Observable<any> {
    return this.put(`guests/${id}`, guestData);
  }

  deleteGuest(id: number): Observable<any> {
    return this.delete('guests', id);
  }

  // Check-in/Check-out
  performCheckin(data: any): Observable<any> {
    return this.post('checkin', data);
  }

  performCheckout(reservationId: number): Observable<any> {
    return this.post(`checkout/${reservationId}`, {});
  }

  getTodayActivities(): Observable<any> {
    return this.get('activities/today');
  }
}
