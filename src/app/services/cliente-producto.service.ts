import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClienteProductoService {
  private apiUrl = 'http://localhost:9018/api/clientes';

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

    const body = {
      cantidad,
      descuento,
      importePagado,
    };

    return this.http.post(
      `${this.apiUrl}/${clienteId}/productos/${productoId}`,
      body,
      { headers },
    );
  }

  // ✅ Listar productos asignados a un cliente
  getProductosCliente(clienteId: number, empresa?: string): Observable<any[]> {
    const headers = empresa
      ? new HttpHeaders({ 'X-Empresa': empresa })
      : undefined;

    return this.http.get<any[]>(`${this.apiUrl}/${clienteId}/productos`, {
      headers,
    });
  }

  // ✅ Eliminar un producto asignado a un cliente (por clienteId + productoId)
  // Endpoint esperado: DELETE /api/clientes/{clienteId}/productos/{productoId}
  deleteProductoCliente(
    clienteId: number,
    productoId: number,
    empresa?: string,
  ): Observable<any> {
    const headers = empresa
      ? new HttpHeaders({ 'X-Empresa': empresa })
      : undefined;

    return this.http.delete(
      `${this.apiUrl}/${clienteId}/productos/${productoId}`,
      { headers },
    );
  }

  // ✅ Alternativa si tu backend borra por ID del registro cliente_producto
  // Endpoint esperado: DELETE /api/clientes/productos/{clienteProductoId}
  deleteProductoClienteById(
    clienteProductoId: number,
    empresa?: string,
  ): Observable<any> {
    const headers = empresa
      ? new HttpHeaders({ 'X-Empresa': empresa })
      : undefined;

    return this.http.delete(
      `${this.apiUrl}/productos/${clienteProductoId}`,
      { headers },
    );
  }
}