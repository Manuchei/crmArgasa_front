import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private api = 'http://localhost:9018/api';

  constructor(private http: HttpClient) {}

  getUserStats(): Observable<{
    clientes: number;
    proveedores: number;
    productos: number;
  }> {
    return forkJoin({
      clientes: this.http.get<any[]>(`${this.api}/clientes`),
      proveedores: this.http.get<any[]>(`${this.api}/proveedores`),
      productos: this.http.get<any[]>(`${this.api}/productos`),
    }).pipe(
      map((res) => ({
        clientes: res.clientes?.length ?? 0,
        proveedores: res.proveedores?.length ?? 0,
        productos: res.productos?.length ?? 0,
      })),
    );
  }
}
