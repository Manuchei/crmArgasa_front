import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  PendientesFacturacionDTO,
  CrearFacturaV2Request,
  FacturaV2Response,
  ActualizarFacturaV2Request,
} from '../interfaces/facturacion-v2';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FacturacionV2Service {
  private baseUrl = `${environment.apiUrl}/facturacion-v2`;

  constructor(private http: HttpClient) {}

  getPendientes(clienteId: number): Observable<PendientesFacturacionDTO> {
    return this.http.get<PendientesFacturacionDTO>(
      `${this.baseUrl}/pendientes/cliente/${clienteId}`,
    );
  }

  crearFactura(req: CrearFacturaV2Request): Observable<FacturaV2Response> {
    return this.http.post<FacturaV2Response>(`${this.baseUrl}/facturas`, req);
  }

  actualizarFactura(
    facturaId: number,
    payload: ActualizarFacturaV2Request,
  ): Observable<FacturaV2Response> {
    return this.http.put<FacturaV2Response>(
      `${this.baseUrl}/facturas/${facturaId}`,
      payload,
    );
  }

  cancelarBorrador(facturaId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/facturas/${facturaId}`);
  }

  emitirFactura(facturaId: number): Observable<FacturaV2Response> {
    return this.http.post<FacturaV2Response>(
      `${this.baseUrl}/facturas/${facturaId}/emitir`,
      {},
    );
  }

  listarFacturas(
    estado?: string,
    clienteId?: number,
  ): Observable<FacturaV2Response[]> {
    const params: any = {};
    if (estado) params.estado = estado;
    if (clienteId != null) params.clienteId = clienteId;

    return this.http.get<FacturaV2Response[]>(`${this.baseUrl}/facturas`, {
      params,
    });
  }

  getFacturaById(id: number): Observable<FacturaV2Response> {
    return this.http.get<FacturaV2Response>(`${this.baseUrl}/facturas/${id}`);
  }

  marcarComoPagada(id: number) {
    return this.http.post<FacturaV2Response>(
      `${this.baseUrl}/facturas/${id}/marcar-pagada`,
      {},
    );
  }
}
