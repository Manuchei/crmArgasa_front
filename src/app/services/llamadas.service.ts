import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IEventoCalendario } from '../interfaces/ievento-calendario';
import { ILlamada } from '../interfaces/illamda';

@Injectable({
  providedIn: 'root',
})
export class LlamadasService {

  private apiUrl = 'http://localhost:9018/api/llamadas';

  constructor(private http: HttpClient) {}

  /* ============================================================
     📌 EVENTOS PARA FULLCALENDAR (mes visible)
     ============================================================ */
 getEventosCalendario() {
  return this.http.get<ILlamada[]>(this.apiUrl + '/calendario');
}


  /* ============================================================
     📌 LLAMADAS DEL DÍA
     ============================================================ */
  getLlamadasDia(fechaStr: string): Observable<ILlamada[]> {
    return this.http.get<ILlamada[]>(
      `${this.apiUrl}/dia?fecha=${fechaStr}`
    );
  }

  /* ============================================================
     📌 CRUD
     ============================================================ */
  crearLlamada(llamada: ILlamada): Observable<ILlamada> {
    return this.http.post<ILlamada>(this.apiUrl, llamada);
  }

  actualizarLlamada(id: number, llamada: ILlamada): Observable<ILlamada> {
    return this.http.put<ILlamada>(`${this.apiUrl}/${id}`, llamada);
  }

  eliminarLlamada(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /* ============================================================
     📌 OBTENER UNA LLAMADA POR ID
     ============================================================ */
  getLlamada(id: number): Observable<ILlamada> {
    return this.http.get<ILlamada>(`${this.apiUrl}/${id}`);
  }

  getById(id: number): Observable<ILlamada> {
  return this.http.get<ILlamada>(`${this.apiUrl}/llamadas/${id}`);
}

}
