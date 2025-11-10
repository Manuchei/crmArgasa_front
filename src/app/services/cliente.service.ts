import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICliente } from '../interfaces/icliente';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:9018/api/clientes';

  constructor(private http: HttpClient) {}

  // ✅ Método auxiliar para crear cabeceras con token si existe
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  // ✅ Obtener lista de clientes
  listar(): Observable<ICliente[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<ICliente[]>(this.apiUrl, { headers });
  }

  // ✅ Buscar clientes por texto y empresa
  buscar(texto: string, empresa: string): Observable<ICliente[]> {
    const headers = this.getAuthHeaders();
    const params = empresa
      ? `?texto=${texto}&empresa=${empresa}`
      : `?texto=${texto}`;
    return this.http.get<ICliente[]>(`${this.apiUrl}/buscar${params}`, { headers });
  }

  // ✅ Crear cliente
  crear(cliente: ICliente): Observable<ICliente> {
    const headers = this.getAuthHeaders();
    return this.http.post<ICliente>(this.apiUrl, cliente, { headers });
  }

  // ✅ Actualizar cliente
  actualizar(id: number, cliente: ICliente): Observable<ICliente> {
    const headers = this.getAuthHeaders();
    return this.http.put<ICliente>(`${this.apiUrl}/${id}`, cliente, { headers });
  }

  // ✅ Eliminar cliente
  eliminar(id: number): Observable<void> {
    const headers = this.getAuthHeaders();
    return this.http.delete<void>(`${this.apiUrl}/${id}`, { headers });
  }
}
