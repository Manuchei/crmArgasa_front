import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICliente } from '../interfaces/icliente';
import { ITrabajo } from '../interfaces/itrabajo';

@Injectable({
  providedIn: 'root',
})
export class ClientesService {
  private readonly apiUrl = 'http://localhost:9018/api/clientes';

  // ✅ Headers JSON (evita 415)
  private readonly jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  });

  constructor(private http: HttpClient) {}

  getClientes(): Observable<ICliente[]> {
    return this.http.get<ICliente[]>(this.apiUrl);
  }

  getCliente(id: number): Observable<ICliente> {
    return this.http.get<ICliente>(`${this.apiUrl}/${id}`);
  }

  crearCliente(cliente: ICliente): Observable<ICliente> {
    return this.http.post<ICliente>(this.apiUrl, cliente, {
      headers: this.jsonHeaders,
      responseType: 'json',
    });
  }

  actualizarCliente(id: number, cliente: ICliente): Observable<ICliente> {
    return this.http.put<ICliente>(`${this.apiUrl}/${id}`, cliente, {
      headers: this.jsonHeaders,
      responseType: 'json',
    });
  }

  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  buscarClientes(texto: string, empresa?: string): Observable<ICliente[]> {
    let params = new HttpParams().set('texto', (texto ?? '').trim());
    if (empresa && empresa.trim().length > 0) {
      params = params.set('empresa', empresa.trim());
    }

    return this.http.get<ICliente[]>(`${this.apiUrl}/buscar`, { params });
  }

  // ✅ Añadir un trabajo nuevo a un cliente existente
  agregarTrabajo(idCliente: number, trabajo: ITrabajo): Observable<ICliente> {
    return this.http.post<ICliente>(`${this.apiUrl}/${idCliente}/trabajos`, trabajo, {
      headers: this.jsonHeaders,
      responseType: 'json',
    });
  }
}
