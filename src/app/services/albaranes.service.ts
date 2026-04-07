import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlbaranesService {
  private apiUrl = `${environment.apiUrl}/albaranes`;

  private jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  });

  constructor(private http: HttpClient) {}

  crearDesdeCliente(clienteId: number, empresa: string): Observable<any> {
    const params = new HttpParams().set('empresa', empresa);
    return this.http.post(`${this.apiUrl}/clientes/${clienteId}`, {}, { params });
  }

  listarPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/clientes/${clienteId}`);
  }

  getById(albaranId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${albaranId}`);
  }

  agregarLinea(albaranId: number, linea: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${albaranId}/lineas`, linea, { headers: this.jsonHeaders });
  }

  eliminarLinea(albaranId: number, lineaId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${albaranId}/lineas/${lineaId}`);
  }

  confirmar(albaranId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${albaranId}/confirmar`, {}, { headers: this.jsonHeaders });
  }
}
