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

  // ✅ NUEVO: listar productos asignados a un cliente
  // OJO: ajusta si tu endpoint es distinto
  getProductosCliente(clienteId: number, empresa?: string) {
    const headers = empresa
      ? new HttpHeaders({ 'X-Empresa': empresa })
      : undefined;
    return this.http.get<any[]>(`${this.apiUrl}/${clienteId}/productos`, {
      headers,
    });
  }
}
