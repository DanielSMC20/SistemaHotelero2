import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Guest } from '../domain/guests.interface';

@Injectable({
    providedIn: 'root'
})
export class GuestsInfraestructure   {
    public readonly API_URL_LISTA_HUESPEDES = 'http://localhost:8080/customers';
    constructor(
        private http: HttpClient
    ){}

    getAllGuests(): Observable<Guest[]> {
    return this.http.get<Guest[]>(this.API_URL_LISTA_HUESPEDES);
    }


   


}