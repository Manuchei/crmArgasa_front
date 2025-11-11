import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICliente } from '../interfaces/icliente';
import { ITrabajo } from '../interfaces/itrabajo';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {

  private apiUrl = 'http://localhost:9018/api/clientes';

  constructor(private http: HttpClient) {}

  getClientes(): Observable<ICliente[]> {
    return this.http.get<ICliente[]>(this.apiUrl);
  }

  getCliente(id: number): Observable<ICliente> {
    return this.http.get<ICliente>(`${this.apiUrl}/${id}`);
  }

  crearCliente(cliente: ICliente): Observable<ICliente> {
    return this.http.post<ICliente>(this.apiUrl, cliente);
  }

  actualizarCliente(id: number, cliente: ICliente): Observable<ICliente> {
    return this.http.put<ICliente>(`${this.apiUrl}/${id}`, cliente);
  }

  eliminarCliente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  buscarClientes(texto: string, empresa?: string): Observable<ICliente[]> {
    const params = empresa ? `?texto=${texto}&empresa=${empresa}` : `?texto=${texto}`;
    return this.http.get<ICliente[]>(`${this.apiUrl}/buscar${params}`);
  }

  // ✅ Añadir un trabajo nuevo a un cliente existente
  agregarTrabajo(idCliente: number, trabajo: ITrabajo): Observable<ICliente> {
    return this.http.post<ICliente>(`${this.apiUrl}/${idCliente}/trabajos`, trabajo);
  }
}
