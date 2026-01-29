import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  PendientesFacturacionDTO,
  CrearFacturaV2Request,
  FacturaV2Response
} from '../interfaces/facturacion-v2';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FacturacionV2Service {
  private baseUrl = 'http://localhost:9018/api/facturacion-v2';

  constructor(private http: HttpClient) {}

  getPendientes(clienteId: number): Observable<PendientesFacturacionDTO> {
    return this.http.get<PendientesFacturacionDTO>(`${this.baseUrl}/pendientes/cliente/${clienteId}`);
  }

  crearFactura(req: CrearFacturaV2Request): Observable<FacturaV2Response> {
    return this.http.post<FacturaV2Response>(`${this.baseUrl}/facturas`, req);
  }

  cancelarBorrador(facturaId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/facturas/${facturaId}`);
  }

  emitirFactura(facturaId: number): Observable<FacturaV2Response> {
    return this.http.post<FacturaV2Response>(`${this.baseUrl}/facturas/${facturaId}/emitir`, {});
  }

  listarFacturas(estado?: string, clienteId?: number) {
  const params: any = {};
  if (estado) params.estado = estado;
  if (clienteId != null) params.clienteId = clienteId;

  return this.http.get<FacturaV2Response[]>(`${this.baseUrl}/facturas`, { params });
}

getFacturaById(id: number) {
  return this.http.get<FacturaV2Response>(`${this.baseUrl}/facturas-v2/${id}`)
}

}
