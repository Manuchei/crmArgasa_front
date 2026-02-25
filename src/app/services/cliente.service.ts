import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICliente } from '../interfaces/icliente';
import { ITrabajo } from '../interfaces/itrabajo';

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private readonly apiUrl = 'http://localhost:9018/api/clientes';

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
    return this.http.post<ICliente>(this.apiUrl, this.limpiarPayload(cliente), {
      headers: this.jsonHeaders,
      responseType: 'json',
    });
  }

  actualizarCliente(id: number, cliente: ICliente): Observable<ICliente> {
    return this.http.put<ICliente>(`${this.apiUrl}/${id}`, this.limpiarPayload(cliente), {
      headers: this.jsonHeaders,
      responseType: 'json',
    });
  }

  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ✅ Buscador: solo texto. La empresa la decide X-Empresa (TenantContext)
  buscarClientes(texto: string): Observable<ICliente[]> {
    const params = new HttpParams().set('texto', (texto ?? '').trim());
    return this.http.get<ICliente[]>(`${this.apiUrl}/buscar`, { params });
  }

  // ✅ Añadir un trabajo nuevo a un cliente existente
  agregarTrabajo(idCliente: number, trabajo: ITrabajo): Observable<ICliente> {
    return this.http.post<ICliente>(`${this.apiUrl}/${idCliente}/trabajos`, trabajo, {
      headers: this.jsonHeaders,
      responseType: 'json',
    });
  }

  // ---------------------------------------
  // Helpers
  // ---------------------------------------

  /**
   * ✅ No se envía empresa desde el frontend (la asigna el backend por X-Empresa).
   * También elimina posibles campos "calculados" del front que no tengan por qué ir al backend.
   */
  private limpiarPayload(cliente: ICliente): Partial<ICliente> {
    const { empresa, saldoDebe, saldoPagado, pendiente, ...resto } = cliente;
    return resto;
  }

  getProductosCliente(clienteId: number, empresa: string) {
  return this.http.get<any[]>(
    `http://localhost:9018/api/clientes/${clienteId}/productos`,
    { params: { empresa } }
  );
}
}
