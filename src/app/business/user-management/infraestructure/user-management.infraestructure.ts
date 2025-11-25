import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserInfrastructure {
  private readonly API_URL = 'http://localhost:8080/auth/register';

  constructor(private http: HttpClient) {}

  register(data: any): Observable<any> {
    return this.http.post(this.API_URL, data, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    });
  }
}
