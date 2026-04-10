import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Proveedor } from '../interfaces/iproveedor';

@Injectable({
  providedIn: 'root',
})
export class ProveedorService {
  private apiProveedores = `${environment.apiUrl}/proveedores`;
  private apiTrabajos = `${environment.apiUrl}/trabajos-proveedor`;
  private apiAlbaranesProveedor = `${environment.apiUrl}/albaranes-proveedor`;

  constructor(private http: HttpClient) {}

  getProveedores(): Observable<Proveedor[]> {
    return this.http.get<Proveedor[]>(this.apiProveedores);
  }

  getProveedorById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiProveedores}/${id}`);
  }

  crearProveedor(proveedor: Proveedor): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiProveedores, proveedor);
  }

  actualizarProveedor(id: number, proveedor: Proveedor): Observable<Proveedor> {
    return this.http.put<Proveedor>(`${this.apiProveedores}/${id}`, proveedor);
  }

  deleteProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiProveedores}/${id}`);
  }

  buscar(
    texto: string,
    empresa?: string,
    oficio?: string,
  ): Observable<Proveedor[]> {
    let params = new HttpParams().set('texto', texto);

    if (empresa) params = params.set('empresa', empresa);
    if (oficio) params = params.set('oficio', oficio);

    return this.http.get<Proveedor[]>(`${this.apiProveedores}/buscar`, {
      params,
    });
  }

  getTrabajosByProveedor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiTrabajos}/proveedor/${id}`);
  }

  crearTrabajoProveedor(idProveedor: number, trabajo: any): Observable<any> {
    return this.http.post(
      `${this.apiTrabajos}/proveedor/${idProveedor}`,
      trabajo,
    );
  }

  eliminarTrabajo(idTrabajo: number): Observable<void> {
    return this.http.delete<void>(`${this.apiTrabajos}/${idTrabajo}`);
  }

  crearAlbaranProveedor(proveedorId: number, payload: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiAlbaranesProveedor}/proveedores/${proveedorId}`,
      payload,
    );
  }

  listarAlbaranesProveedor(proveedorId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiAlbaranesProveedor}/proveedores/${proveedorId}`,
    );
  }

  getAlbaranProveedorById(albaranId: number): Observable<any> {
    return this.http.get<any>(`${this.apiAlbaranesProveedor}/${albaranId}`);
  }

  eliminarAlbaranProveedor(albaranId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiAlbaranesProveedor}/${albaranId}`);
  }
}
