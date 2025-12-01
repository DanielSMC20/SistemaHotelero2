import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Guest } from '../domain/guests.interface';
import { PhoneCodeApi } from '../../../core/models/models';

@Injectable({
  providedIn: 'root'
})
export class GuestsInfraestructure {

  private readonly API_URL_LISTA_HUESPEDES = 'http://localhost:8080/customers';
  private api = 'http://localhost:8080';


  constructor(private http: HttpClient) {}

   private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json',
    });
  }
  

  getAllGuests(): Observable<Guest[]> {
    // Obtén el token del localStorage (o de tu AuthService)
    const token = localStorage.getItem('token'); 

    // Crea los headers con el token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    // Pasa los headers a la petición
    return this.http.get<Guest[]>(this.API_URL_LISTA_HUESPEDES, { headers });
}
getEditGuest(documento: string, guest: Guest): Observable<Guest> {
  const token = localStorage.getItem('token');

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  const url = `${this.API_URL_LISTA_HUESPEDES}/documento/${documento}`;

  return this.http.put<Guest>(url, guest, { headers });
}
postRegisterGuest(){
    
}

 createGuest(body: any) {
      const token = localStorage.getItem('token'); 

      const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(`${this.api}/customers/from-reservation-style`, body,{ headers });
  }
  lookupDni(numero: string) {
    return this.http.get<any>(`${this.api}/external/reniec-dni`, {
      params: { numero },
      headers: this.getAuthHeaders(),
    });
  }
  lookupRuc(numero: string) {
    return this.http.get<any>(`${this.api}/external/sunat-ruc`, {
      params: { numero },
      headers: this.getAuthHeaders(),
    });
  }

  getPhoneCodes() {
    const headers = this.getAuthHeaders();
    return this.http.get<PhoneCodeApi[]>(`${this.api}/phone-codes`, { headers });
  }
}
