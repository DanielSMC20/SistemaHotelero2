import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Guest } from '../domain/guests.interface';

@Injectable({
  providedIn: 'root'
})
export class GuestsInfraestructure {

  private readonly API_URL_LISTA_HUESPEDES = 'http://localhost:8080/customers';

  constructor(private http: HttpClient) {}
  

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

}
