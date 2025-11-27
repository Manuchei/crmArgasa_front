import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {

  private apiProveedores = 'http://localhost:9018/api/proveedores';
  private apiTrabajos = 'http://localhost:9018/api/trabajos-proveedor';

  constructor(private http: HttpClient) {}

  // ========== PROVEEDORES ==========
  getProveedores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiProveedores);
  }

  getProveedorById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiProveedores}/${id}`);
  }

  crearProveedor(proveedor: any): Observable<any> {
    return this.http.post(this.apiProveedores, proveedor);
  }

  actualizarProveedor(id: number, proveedor: any): Observable<any> {
    return this.http.put(`${this.apiProveedores}/${id}`, proveedor);
  }

  deleteProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiProveedores}/${id}`);
  }

  buscar(texto: string, empresa?: string, oficio?: string): Observable<any[]> {
    let params = new HttpParams().set('texto', texto);

    if (empresa) params = params.set('empresa', empresa);
    if (oficio) params = params.set('oficio', oficio);

    return this.http.get<any[]>(`${this.apiProveedores}/buscar`, { params });
  }

  // ========== TRABAJOS POR PROVEEDOR ==========
  getTrabajosByProveedor(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiTrabajos}/proveedor/${id}`);
  }

  crearTrabajoProveedor(idProveedor: number, trabajo: any): Observable<any> {
    return this.http.post(`${this.apiTrabajos}/proveedor/${idProveedor}`, trabajo);
  }

  eliminarTrabajo(idTrabajo: number): Observable<void> {
    return this.http.delete<void>(`${this.apiTrabajos}/${idTrabajo}`);
  }
}
