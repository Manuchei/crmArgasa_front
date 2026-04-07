import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class ClienteProductoService {
  private apiUrl = `${environment.apiUrl}/clientes`;

  constructor(private http: HttpClient) {}

  addProducto(
    clienteId: number,
    productoId: number,
    cantidad: number,
    descuento: number,
    importePagado: number,
    empresa: string,
  ): Observable<any> {
    const headers = new HttpHeaders({ 'X-Empresa': empresa });

    const body = { cantidad, descuento, importePagado };

    return this.http.post<any>(
      `${this.apiUrl}/${clienteId}/productos/${productoId}`,
      body,
      { headers },
    );
  }

  getProductosCliente(clienteId: number, empresa?: string): Observable<any[]> {
    const headers = empresa
      ? new HttpHeaders({ 'X-Empresa': empresa })
      : undefined;

    return this.http.get<any[]>(`${this.apiUrl}/${clienteId}/productos`, {
      headers,
    });
  }

  deleteProductoCliente(
    clienteId: number,
    productoId: number,
    empresa?: string,
  ): Observable<any> {
    const headers = empresa
      ? new HttpHeaders({ 'X-Empresa': empresa })
      : undefined;

    return this.http.delete<any>(
      `${this.apiUrl}/${clienteId}/productos/${productoId}`,
      { headers },
    );
  }

  deleteProductoClienteById(
    clienteProductoId: number,
    empresa?: string,
  ): Observable<any> {
    const headers = empresa
      ? new HttpHeaders({ 'X-Empresa': empresa })
      : undefined;

    return this.http.delete<any>(
      `${this.apiUrl}/productos/${clienteProductoId}`,
      { headers },
    );
  }
}
