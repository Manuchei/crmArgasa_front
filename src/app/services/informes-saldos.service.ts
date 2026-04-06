import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HistorialSaldoResponse } from '../interfaces/historial-saldo';
import { HistorialTContableResponse } from '../interfaces/t-contable.interface';
import { environment } from '../../enviroments/enviroment';


@Injectable({
  providedIn: 'root',
})
export class InformesSaldosService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/informes/saldos`;

  obtenerHistorialPorCliente(
    clienteId: number,
  ): Observable<HistorialSaldoResponse> {
    return this.http.get<HistorialSaldoResponse>(
      `${this.apiUrl}/cliente/${clienteId}`,
    );
  }

  obtenerTContablePorCliente(
    clienteId: number,
  ): Observable<HistorialTContableResponse> {
    return this.http.get<HistorialTContableResponse>(
      `${this.apiUrl}/cliente/${clienteId}/t-contable`,
    );
  }

  obtenerHistorialFiltrado(
    empresa: string,
    clienteId?: number | null,
    fechaInicio?: string,
    fechaFin?: string,
  ) {
    let params = new HttpParams().set('empresa', empresa);

    if (clienteId !== null && clienteId !== undefined) {
      params = params.set('clienteId', clienteId);
    }

    if (fechaInicio) {
      params = params.set('fechaInicio', fechaInicio);
    }

    if (fechaFin) {
      params = params.set('fechaFin', fechaFin);
    }

    return this.http.get<HistorialSaldoResponse[]>(this.apiUrl, { params });
  }
}
