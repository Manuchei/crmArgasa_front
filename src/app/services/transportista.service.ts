import { Itrasnportista } from './../interfaces/itrasnportista';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroment';


@Injectable({ providedIn: 'root' })
export class TransportistaService {
  private apiUrl = `${environment.apiUrl}/transportistas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Itrasnportista[]> {
    return this.http.get<Itrasnportista[]>(this.apiUrl);
  }

  create(t: Itrasnportista): Observable<Itrasnportista> {
    return this.http.post<Itrasnportista>(this.apiUrl, t);
  }

  update(id: number, t: Itrasnportista): Observable<Itrasnportista> {
    return this.http.put<Itrasnportista>(`${this.apiUrl}/${id}`, t);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
