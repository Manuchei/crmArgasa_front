import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IProducto } from '../interfaces/iproducto';
import { IProductoMovimiento } from '../interfaces/iproducto-movimiento';
import { environment } from '../../enviroments/enviroment';


@Injectable({
  providedIn: 'root',
})
export class ProductoServiceService {
  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  private getEmpresa(): 'ARGASA' | 'ELECTROLUGA' {
    const empresa = (localStorage.getItem('empresa_activa') || 'ARGASA')
      .toUpperCase()
      .trim();

    return empresa === 'ELECTROLUGA' ? 'ELECTROLUGA' : 'ARGASA';
  }

  private getToken(): string {
    return localStorage.getItem('token') || '';
  }

  private headers(): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'X-Empresa': this.getEmpresa(),
    });

    const token = this.getToken();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  getProductos(): Observable<IProducto[]> {
    return this.http.get<IProducto[]>(this.apiUrl, {
      headers: this.headers(),
    });
  }

  list(): Observable<IProducto[]> {
    return this.getProductos();
  }

  crearProducto(producto: IProducto): Observable<IProducto> {
    const body: IProducto = {
      ...producto,
      empresa: this.getEmpresa(),
    };

    return this.http.post<IProducto>(this.apiUrl, body, {
      headers: this.headers(),
    });
  }

  create(producto: IProducto): Observable<IProducto> {
    return this.crearProducto(producto);
  }

  ajustarStock(
    id: number,
    delta: number,
    motivo?: string,
  ): Observable<IProducto> {
    return this.http.patch<IProducto>(
      `${this.apiUrl}/${id}/stock`,
      {
        delta,
        motivo: motivo?.trim() || null,
      },
      { headers: this.headers() },
    );
  }

  subirStock(
    id: number,
    cantidad: number,
    motivo?: string,
  ): Observable<IProducto> {
    return this.ajustarStock(id, Math.abs(cantidad), motivo);
  }

  bajarStock(
    id: number,
    cantidad: number,
    motivo?: string,
  ): Observable<IProducto> {
    return this.ajustarStock(id, -Math.abs(cantidad), motivo);
  }

  getMovimientos(): Observable<IProductoMovimiento[]> {
    return this.http.get<IProductoMovimiento[]>(`${this.apiUrl}/movimientos`, {
      headers: this.headers(),
    });
  }

  getMovimientosPorProducto(id: number) {
  return this.http.get<any[]>(`${this.apiUrl}/${id}/movimientos`, {
    headers: this.headers(),
  });
}
}
