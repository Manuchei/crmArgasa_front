import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IfacturaCliente } from '../../../interfaces/ifactura-cliente';

@Injectable({ providedIn: 'root' })
export class FacturasClientesService {
  private baseUrl = '/api/facturas-clientes';

  constructor(private http: HttpClient) {}

  getAll(): Observable<IfacturaCliente[]> {
    return this.http.get<IfacturaCliente[]>(this.baseUrl);
  }

  getByCliente(clienteId: number): Observable<IfacturaCliente[]> {
    return this.http.get<IfacturaCliente[]>(`${this.baseUrl}/cliente/${clienteId}`);
  }

  generar(clienteId: number): Observable<IfacturaCliente> {
    return this.http.post<IfacturaCliente>(`${this.baseUrl}/generar/${clienteId}`, {});
  }

  pagar(facturaId: number): Observable<IfacturaCliente> {
    return this.http.put<IfacturaCliente>(`${this.baseUrl}/pagar/${facturaId}`, {});
  }
}
