import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class PagosService {
  private apiUrl = `${environment.apiUrl}/pagos`;

  constructor(private http: HttpClient) {}

  listarPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?clienteId=${clienteId}`);
  }

  registrarPago(trabajoId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/trabajo/${trabajoId}`, payload);
  }
}
