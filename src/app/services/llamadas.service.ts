import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ILlamada } from '../interfaces/illamda';
import { IEventoCalendario } from '../interfaces/ievento-calendario';
import { ILlamadaRequest } from '../interfaces/illamada-request';

@Injectable({ providedIn: 'root' })
export class LlamadasService {
  private baseUrl = 'http://localhost:9018/api/llamadas';

  constructor(private http: HttpClient) {}

  getEventosCalendario(): Observable<IEventoCalendario[]> {
    return this.http.get<IEventoCalendario[]>(`${this.baseUrl}/eventos`);
  }

  getById(id: number): Observable<ILlamada> {
    return this.http.get<ILlamada>(`${this.baseUrl}/${id}`);
  }

  // ✅ request DTO
  crearLlamada(llamada: ILlamadaRequest): Observable<ILlamada> {
    return this.http.post<ILlamada>(this.baseUrl, llamada);
  }

  // ✅ request DTO
  actualizarLlamada(id: number, llamada: ILlamadaRequest): Observable<ILlamada> {
    return this.http.put<ILlamada>(`${this.baseUrl}/${id}`, llamada);
  }

  eliminarLlamada(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getLlamadasDia(fecha: string): Observable<ILlamada[]> {
    return this.http.get<ILlamada[]>(`${this.baseUrl}/dia/${fecha}`);
  }
  getProximasLlamadas(limit = 10) {
  return this.http.get<ILlamada[]>(`${this.baseUrl}/proximas?limit=${limit}`);
}

}
