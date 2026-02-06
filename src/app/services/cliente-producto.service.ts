import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClienteProductoService {

  private base = 'http://localhost:9018/api/clientes';

  constructor(private http: HttpClient) { }

 addProducto(clienteId: number, productoId: number) {
    return this.http.post(
      `${this.base}/${clienteId}/productos/${productoId}`,
      {}
    );
  }
}