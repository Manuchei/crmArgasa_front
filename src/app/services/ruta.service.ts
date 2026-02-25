import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Ruta } from '../interfaces/iruta';
import { RutaDiaRequestDTO } from '../interfaces/iruta-dia';

@Injectable({ providedIn: 'root' })
export class RutaService {
  private apiUrl = 'http://localhost:9018/api/rutas';

  constructor(private http: HttpClient) {}

  private getEmpresaActual(): 'ARGASA' | 'ELECTROLUGA' {
    const emp = (localStorage.getItem('empresa_activa') || 'ARGASA')
      .toUpperCase()
      .trim();
    return emp === 'ELECTROLUGA' ? 'ELECTROLUGA' : 'ARGASA';
  }

  private headersEmpresa(): HttpHeaders {
    return new HttpHeaders().set('X-Empresa', this.getEmpresaActual());
  }

  getRutas(): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(this.apiUrl, {
      headers: this.headersEmpresa(),
    });
  }

  getRuta(id: number): Observable<Ruta> {
    return this.http.get<Ruta>(`${this.apiUrl}/${id}`, {
      headers: this.headersEmpresa(),
    });
  }

  crearRuta(ruta: Ruta): Observable<Ruta> {
    const body = { ...ruta, empresa: this.getEmpresaActual() };
    return this.http.post<Ruta>(this.apiUrl, body, {
      headers: this.headersEmpresa(),
    });
  }

  actualizarRuta(id: number, ruta: Ruta): Observable<Ruta> {
    const body = { ...ruta, empresa: this.getEmpresaActual() };
    return this.http.put<Ruta>(`${this.apiUrl}/${id}`, body, {
      headers: this.headersEmpresa(),
    });
  }

  eliminarRuta(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`, {
      headers: this.headersEmpresa(),
    });
  }

  filtrarPorEstado(estado: string): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(`${this.apiUrl}/estado/${estado}`, {
      headers: this.headersEmpresa(),
    });
  }

  filtrarPorTransportista(nombre: string): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(`${this.apiUrl}/transportista/${nombre}`, {
      headers: this.headersEmpresa(),
    });
  }

  filtrarPorFecha(fecha: string): Observable<Ruta[]> {
    return this.http.get<Ruta[]>(`${this.apiUrl}/fecha/${fecha}`, {
      headers: this.headersEmpresa(),
    });
  }

  cerrarRuta(id: number): Observable<Ruta> {
    return this.http.put<Ruta>(
      `${this.apiUrl}/cerrar/${id}`,
      {},
      { headers: this.headersEmpresa() },
    );
  }

  crearRutasDia(payload: RutaDiaRequestDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/dia`, payload);
  }
}
