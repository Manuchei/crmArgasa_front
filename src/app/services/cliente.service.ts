import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICliente } from '../interfaces/icliente';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:9018/api/clientes';

  constructor(private http: HttpClient) {}

  listar(): Observable<ICliente[]> {
    return this.http.get<ICliente[]>(this.apiUrl);
  }

  buscar(texto: string, empresa: string): Observable<ICliente[]> {
    const params = empresa
      ? `?texto=${texto}&empresa=${empresa}`
      : `?texto=${texto}`;
    return this.http.get<ICliente[]>(`${this.apiUrl}/buscar${params}`);
  }

  crear(cliente: any): Observable<ICliente> {
    return this.http.post<ICliente>(this.apiUrl, cliente);
  }

  actualizar(id: number, cliente: ICliente): Observable<ICliente> {
    return this.http.put<ICliente>(`${this.apiUrl}/${id}`, cliente);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

