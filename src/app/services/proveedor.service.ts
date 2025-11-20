import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProveedorService {

  private apiUrl = 'http://localhost:9018/api/proveedores';

  constructor(private http: HttpClient) {}

  getProveedores(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getProveedorById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getByEmpresa(empresa: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/empresa/${empresa}`);
  }

  getByOficio(oficio: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/oficio/${oficio}`);
  }

  buscar(texto: string, empresa?: string, oficio?: string): Observable<any[]> {
    let params = new HttpParams().set('texto', texto);

    if (empresa) params = params.set('empresa', empresa);
    if (oficio) params = params.set('oficio', oficio);

    return this.http.get<any[]>(`${this.apiUrl}/buscar`, { params });
  }

  crearProveedor(proveedor: any): Observable<any> {
    return this.http.post(this.apiUrl, proveedor);
  }

  actualizarProveedor(id: number, proveedor: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, proveedor);
  }

  deleteProveedor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }


getTrabajosByProveedor(id: number) {
  return this.http.get<any[]>(`${this.apiUrl}/${id}/trabajos`);
}

crearTrabajoProveedor(id: number, trabajo: any) {
  return this.http.post(`http://localhost:9018/api/trabajos-proveedor/${id}`, trabajo);
}

eliminarTrabajo(id: number) {
  return this.http.delete(`http://localhost:9018/api/trabajos-proveedor/${id}`);
}

guardarTrabajo(trabajo: any) {
  return this.http.post(`${this.apiUrl}/trabajos`, trabajo);
}


}
