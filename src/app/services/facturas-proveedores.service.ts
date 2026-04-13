import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IfacturaProveedor } from '../interfaces/ifactura-proveedor';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FacturasProveedoresService {
  private baseUrl = `${environment.apiUrl}/facturas`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<IfacturaProveedor[]> {
    return this.http.get<IfacturaProveedor[]>(this.baseUrl);
  }

  getByProveedor(proveedorId: number): Observable<IfacturaProveedor[]> {
    return this.http.get<IfacturaProveedor[]>(
      `${this.baseUrl}/proveedor/${proveedorId}`,
    );
  }

  getById(facturaId: number): Observable<IfacturaProveedor> {
    return this.http.get<IfacturaProveedor>(`${this.baseUrl}/${facturaId}`);
  }

  generar(proveedorId: number): Observable<IfacturaProveedor> {
    return this.http.post<IfacturaProveedor>(
      `${this.baseUrl}/generar/${proveedorId}`,
      {},
    );
  }

  pagar(facturaId: number): Observable<IfacturaProveedor> {
    return this.http.put<IfacturaProveedor>(
      `${this.baseUrl}/pagar/${facturaId}`,
      {},
    );
  }

  actualizarNumeroFacturaProveedor(
    facturaId: number,
    numeroFacturaProveedor: string,
  ): Observable<IfacturaProveedor> {
    const params = new HttpParams().set(
      'numeroFacturaProveedor',
      numeroFacturaProveedor,
    );

    return this.http.put<IfacturaProveedor>(
      `${this.baseUrl}/numero-proveedor/${facturaId}`,
      {},
      { params },
    );
  }
}
