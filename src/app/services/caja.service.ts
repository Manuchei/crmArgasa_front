import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CajaService {
  private base = `${environment.apiUrl}/caja`;

  constructor(private http: HttpClient) {}

  actual() {
    return this.http.get<any>(`${this.base}/actual`);
  }

  abrir() {
    return this.http.post<any>(`${this.base}/abrir`, {});
  }

  cerrar(id: number, efectivoContado: number, observaciones: string) {
    return this.http.post<any>(`${this.base}/${id}/cerrar`, {
      efectivoContado,
      observaciones,
    });
  }

  ver(id: number) {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  historial(desde: string, hasta: string, pagina: number) {
    const params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta)
      .set('pagina', pagina);

    return this.http.get<any>(this.base, { params });
  }
}
