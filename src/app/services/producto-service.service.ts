import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IProducto } from '../interfaces/iproducto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductoServiceService {
  private baseUrl = 'http://localhost:9018/api/productos';

  constructor(private http: HttpClient) {}

  list(empresa?: string) {
    const params = empresa
      ? new HttpParams().set('empresa', empresa)
      : undefined;
    return this.http.get<IProducto[]>(this.baseUrl, { params });
  }

  create(producto: IProducto): Observable<IProducto> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<IProducto>(this.baseUrl, producto, { headers });
  }

  // ✅ NUEVO: ajustar stock con delta
  ajustarStock(productoId: number, delta: number) {
    return this.http.patch<any>(
      `${this.baseUrl}/${productoId}/stock`,
      { delta },
    );
  }
}
