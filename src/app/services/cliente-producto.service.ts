import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ClienteProductoService {
  private baseUrl = 'http://localhost:9018/api/productos';

  constructor(private http: HttpClient) {}

  addProducto(clienteId: number, productoId: number, empresa?: string): Observable<any> {
    let headers = new HttpHeaders();

    if (empresa) {
      headers = headers.set('X-Empresa', empresa);
    }

    return this.http.post(
      `${this.baseUrl}/clientes/${clienteId}/productos/${productoId}`,
      {},
      { headers }
    );
  }
}
