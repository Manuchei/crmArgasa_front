import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IInventario } from '../interfaces/iinventario';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InventarioService {
  private readonly apiUrl = `${environment.apiUrl}/inventarios`;

  constructor(private http: HttpClient) {}

  listar(): Observable<IInventario[]> {
    return this.http.get<IInventario[]>(this.apiUrl);
  }

  prepararInventario(): Observable<IInventario> {
    return this.http.get<IInventario>(`${this.apiUrl}/preparar`);
  }

  buscarPorId(id: number): Observable<IInventario> {
    return this.http.get<IInventario>(`${this.apiUrl}/${id}`);
  }

  crear(inventario: IInventario): Observable<IInventario> {
    return this.http.post<IInventario>(this.apiUrl, inventario);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
