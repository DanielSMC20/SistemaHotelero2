import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Guest } from '../domain/guests.interface'; 
import { GuestsInfraestructure } from '../infraestructure/guests.infraestructure'; 

@Injectable({
  providedIn: 'root'
})
export class GuestApplication {
  constructor(private guestApi: GuestsInfraestructure) {}

  execute(): Observable<Guest[]> {
    return this.guestApi.getAllGuests();
  }
  
}
