import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ruta } from '../interfaces/iruta';

@Injectable({
  providedIn: 'root',
})
export class RutaService {
  private apiUrl = 'http://localhost:9018/api/rutas';

  constructor(private http: HttpClient) {}

  getRutas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(this.apiUrl);
  }

  getRuta(id: number): Observable<Ruta> {
    return this.http.get<Ruta>(`${this.apiUrl}/${id}`);
  }

  crearRuta(ruta: Ruta): Observable<Ruta> {
    return this.http.post<Ruta>(this.apiUrl, ruta);
  }

  actualizarRuta(id: number, ruta: Ruta): Observable<Ruta> {
    return this.http.put<Ruta>(`${this.apiUrl}/${id}`, ruta);
  }

  eliminarRuta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  filtrarPorEstado(estado: string): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(`${this.apiUrl}/estado/${estado}`);
  }

  filtrarPorTransportista(nombre: string): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(`${this.apiUrl}/transportista/${nombre}`);
  }

  filtrarPorFecha(fecha: string): Observable<Ruta[]> {
    // fecha en formato 'yyyy-MM-dd'
    return this.http.get<Ruta[]>(`${this.apiUrl}/fecha/${fecha}`);
  }

  cerrarRuta(id: number): Observable<Ruta> {
    return this.http.put<Ruta>(`${this.apiUrl}/cerrar/${id}`, {});
  }

  crearRutasDia(payload: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/dia`, payload);
}

}
