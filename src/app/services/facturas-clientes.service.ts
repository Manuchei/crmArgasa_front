import { Injectable } from '@angular/core';
import { HttpClient, HttpParams,HttpHeaders  } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IfacturaCliente } from '../interfaces/ifactura-cliente';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class FacturasClientesService {
  private baseUrl = `${environment.apiUrl}/facturas-clientes`;

  

  constructor(private http: HttpClient) {}

  getAll(): Observable<IfacturaCliente[]> {
    // ✅ el backend debería filtrar por empresa con X-Empresa (TenantContext)
    return this.http.get<IfacturaCliente[]>(this.baseUrl);
  }

  getByCliente(clienteId: number): Observable<IfacturaCliente[]> {
    return this.http.get<IfacturaCliente[]>(`${this.baseUrl}/cliente/${clienteId}`);
  }

  // ❌ Eliminado getByEmpresa(empresa) -> ya no se pasa empresa por URL
  // getByEmpresa(empresa: string): Observable<IfacturaCliente[]> { ... }

   generar(clienteId: number) {
    const empresa = localStorage.getItem('empresa') || ''; // o desde tu servicio de empresa seleccionada

    const headers = new HttpHeaders({
      'X-Empresa': empresa
    });

    return this.http.post(`${this.baseUrl}/generar/${clienteId}`, {}, { headers });
  }

  pagar(facturaId: number): Observable<IfacturaCliente> {
    return this.http.put<IfacturaCliente>(`${this.baseUrl}/pagar/${facturaId}`, {});
  }
}
