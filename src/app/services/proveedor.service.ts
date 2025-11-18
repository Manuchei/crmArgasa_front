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
    return this.http.get<any[]>(`${this.apiUrl}`);
  }
  getByEmpresa(empresa: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/empresa/${empresa}`);
  }
  getByOfcio(oficio: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/oficio/${oficio}`);
  }
  buscar(texto: string, empresa?: string, oficio?: string): Observable<any[]> {
  let params = new HttpParams().set('texto', texto);
  if (empresa) params = params.set('empresa', empresa);
  if (oficio) params = params.set('oficio', oficio);

  return this.http.get<any[]>(`${this.apiUrl}/buscar`, { params });
}

crearProveedor(proveedor: any) {
  return this.http.post(`${this.apiUrl}`, proveedor);
}

}
