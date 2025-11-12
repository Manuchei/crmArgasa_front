import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IeventoCalendario } from '../interfaces/ievento-calendario';

@Injectable({
  providedIn: 'root',
})
export class LlamadasService {
  private apiUrl = 'http://localhost:9018/api/llamadas';

  constructor(private http: HttpClient) {}

  // 🔹 Obtener todas las llamadas
  listarTodas(): Observable<IeventoCalendario[]> {
    return this.http.get<IeventoCalendario[]>(this.apiUrl);
  }

  // 🔹 Crear una nueva llamada
  crearLlamada(llamada: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, llamada);
  }

  // 🔹 Actualizar una llamada existente
  actualizarLlamada(id: number, llamada: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, llamada);
  }

  // 🔹 Eliminar una llamada por su ID
  eliminarLlamada(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // 🔹 Obtener las llamadas de un día concreto
  obtenerPorFecha(fecha: string): Observable<IeventoCalendario[]> {
    return this.http.get<IeventoCalendario[]>(`${this.apiUrl}/fecha/${fecha}`);
  }

  // 🔹 Obtener todas las llamadas en formato de eventos para el calendario
  getEventosCalendario(): Observable<IeventoCalendario[]> {
    return this.http.get<IeventoCalendario[]>(`${this.apiUrl}/calendario`);
  }
}
