import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { ClientesService } from '../../services/cliente.service';
import { InformesSaldosService } from '../../services/informes-saldos.service';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import { ProveedorService } from '../../services/proveedor.service';

import { environment } from '../../../environments/environment';

import { ICliente } from '../../interfaces/icliente';
import { Proveedor } from '../../interfaces/iproveedor';
import { IfacturaProveedor } from '../../interfaces/ifactura-proveedor';

import { HistorialSaldoResponse } from '../../interfaces/historial-saldo';
import {
  HistorialTContableResponse,
  TContableLinea,
} from '../../interfaces/t-contable.interface';

type TipoInforme =
  | 'SALDOS'
  | 'T_CONTABLE'
  | 'FACTURAS_CLIENTES'
  | 'FACTURAS_PROVEEDORES';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes.component.html',
  styleUrl: './informes.component.css',
})
export class InformesComponent implements OnInit, OnDestroy {
  private clientesService = inject(ClientesService);
  private informesService = inject(InformesSaldosService);
  private empresaService = inject(EmpresaService);
  private proveedorService = inject(ProveedorService);
  private http = inject(HttpClient);

  empresa: Empresa | null = null;
  private empresaSub?: Subscription;

  clientes: ICliente[] = [];
  clientesFiltrados: ICliente[] = [];
  proveedores: Proveedor[] = [];

  clienteSeleccionadoId: number | null = null;
  tipoInforme: TipoInforme = 'SALDOS';

  fechaInicio = '';
  fechaFin = '';
  estadoFactura = '';

  informesSaldos: HistorialSaldoResponse[] = [];
  informeTContable: HistorialTContableResponse | null = null;

  facturasClientes: any[] = [];
  facturasProveedores: IfacturaProveedor[] = [];

  filasTContable: {
    debe: TContableLinea | null;
    haber: TContableLinea | null;
  }[] = [];

  cargando = false;
  error = '';

  private apiFacturasClientes = `${environment.apiUrl}/facturacion-v2/facturas`;
  private apiFacturasProveedores = `${environment.apiUrl}/facturas`;

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarProveedores();

    this.empresaSub = this.empresaService.empresa$.subscribe((empresa) => {
      this.empresa = empresa;
    });
  }

  ngOnDestroy(): void {
    this.empresaSub?.unsubscribe();
  }

  private getEmpresaHeaders(): HttpHeaders {
    const empresa = localStorage.getItem('empresa') || 'ARGASA';

    return new HttpHeaders({
      'X-Empresa': empresa,
    });
  }

  cargarClientes(): void {
    this.clientesService.getClientes().subscribe({
      next: (data: ICliente[]) => {
        this.clientes = data;
        this.clientesFiltrados = data;
      },
      error: () => {
        this.error = 'No se pudieron cargar los clientes';
      },
    });
  }

  cargarProveedores(): void {
    this.proveedorService.getProveedores().subscribe({
      next: (data: Proveedor[]) => {
        this.proveedores = data;
      },
      error: () => {
        this.error = 'No se pudieron cargar los proveedores';
      },
    });
  }

  cambiarTipoInforme(): void {
    this.clienteSeleccionadoId = null;
    this.estadoFactura = '';
    this.resetInformes();
    this.error = '';
  }

  buscarInforme(): void {
    this.error = '';
    this.cargando = true;
    this.resetInformes();

    if (!this.empresa) {
      this.error = 'No hay empresa activa seleccionada';
      this.cargando = false;
      return;
    }

    if (this.tipoInforme === 'SALDOS') {
      this.buscarInformeSaldos();
      return;
    }

    if (this.tipoInforme === 'T_CONTABLE') {
      this.buscarInformeTContable();
      return;
    }

    if (this.tipoInforme === 'FACTURAS_CLIENTES') {
      this.buscarFacturasClientes();
      return;
    }

    if (this.tipoInforme === 'FACTURAS_PROVEEDORES') {
      this.buscarFacturasProveedores();
      return;
    }
  }

  buscarInformeSaldos(): void {
    this.informesService
      .obtenerHistorialFiltrado(
        String(this.empresa),
        this.clienteSeleccionadoId,
        this.fechaInicio,
        this.fechaFin,
      )
      .subscribe({
        next: (data: HistorialSaldoResponse[]) => {
          this.informesSaldos = data;
          this.cargando = false;

          if (data.length === 0) {
            this.error = 'No hay resultados para los filtros seleccionados';
          }
        },
        error: (err) => {
          console.error('Error cargando informe de saldos:', err);
          this.error = 'No se pudo cargar el informe de saldos';
          this.cargando = false;
        },
      });
  }

  buscarInformeTContable(): void {
    if (!this.clienteSeleccionadoId) {
      this.error = 'Para T contable debes seleccionar un cliente';
      this.cargando = false;
      return;
    }

    this.informesService
      .obtenerTContablePorCliente(this.clienteSeleccionadoId)
      .subscribe({
        next: (data: HistorialTContableResponse) => {
          this.informeTContable = data;
          this.generarFilasTContable();
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error cargando T contable:', err);
          this.error = 'No se pudo cargar el informe T contable';
          this.cargando = false;
        },
      });
  }

  buscarFacturasClientes(): void {
    let params = new HttpParams();

    if (this.estadoFactura) {
      params = params.set('estado', this.estadoFactura);
    }

    if (this.clienteSeleccionadoId) {
      params = params.set('clienteId', this.clienteSeleccionadoId);
    }

    this.http
      .get<any[]>(this.apiFacturasClientes, {
        params,
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (data) => {
          let facturas = data || [];

          if (this.fechaInicio) {
            facturas = facturas.filter(
              (f) => f.fechaEmision && f.fechaEmision >= this.fechaInicio,
            );
          }

          if (this.fechaFin) {
            facturas = facturas.filter(
              (f) => f.fechaEmision && f.fechaEmision <= this.fechaFin,
            );
          }

          this.facturasClientes = facturas;
          this.cargando = false;

          if (facturas.length === 0) {
            this.error =
              'No hay facturas de clientes para los filtros seleccionados';
          }
        },
        error: (err) => {
          console.error('Error cargando facturas clientes:', err);
          this.error = 'No se pudo cargar el informe de facturas de clientes';
          this.cargando = false;
        },
      });
  }

  buscarFacturasProveedores(): void {
    let params = new HttpParams();

    if (this.estadoFactura) {
      params = params.set('estado', this.estadoFactura);
    }

    if (this.clienteSeleccionadoId) {
      params = params.set('proveedorId', this.clienteSeleccionadoId);
    }

    if (this.fechaInicio) {
      params = params.set('desde', this.fechaInicio);
    }

    if (this.fechaFin) {
      params = params.set('hasta', this.fechaFin);
    }

    this.http
      .get<IfacturaProveedor[]>(`${this.apiFacturasProveedores}/informe`, {
        params,
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (data) => {
          this.facturasProveedores = data || [];
          this.cargando = false;

          if (this.facturasProveedores.length === 0) {
            this.error =
              'No hay facturas de proveedores para los filtros seleccionados';
          }
        },
        error: (err) => {
          console.error('Error cargando facturas proveedores:', err);
          this.error =
            'No se pudo cargar el informe de facturas de proveedores';
          this.cargando = false;
        },
      });
  }

  resetInformes(): void {
    this.informesSaldos = [];
    this.informeTContable = null;
    this.filasTContable = [];
    this.facturasClientes = [];
    this.facturasProveedores = [];
  }

  generarFilasTContable(): void {
    if (!this.informeTContable) {
      this.filasTContable = [];
      return;
    }

    const max = Math.max(
      this.informeTContable.debe.length,
      this.informeTContable.haber.length,
    );

    this.filasTContable = [];

    for (let i = 0; i < max; i++) {
      this.filasTContable.push({
        debe: this.informeTContable.debe[i] || null,
        haber: this.informeTContable.haber[i] || null,
      });
    }
  }

  imprimir(): void {
    window.print();
  }

  puedeImprimir(): boolean {
    return (
      this.informesSaldos.length > 0 ||
      !!this.informeTContable ||
      this.facturasClientes.length > 0 ||
      this.facturasProveedores.length > 0
    );
  }

  formatearImporte(valor: number | null | undefined): string {
    return `${(valor ?? 0).toFixed(2)} €`;
  }

  getClaseEstado(estado: string | undefined): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'text-danger fw-bold';
      case 'A_FAVOR':
        return 'text-success fw-bold';
      case 'SALDADO':
        return 'text-primary fw-bold';
      case 'PAGADA':
        return 'text-success fw-bold';
      case 'EMITIDA':
        return 'text-warning fw-bold';
      case 'BORRADOR':
        return 'text-secondary fw-bold';
      case 'ANULADA':
        return 'text-danger fw-bold';
      default:
        return '';
    }
  }

  getNumeroFacturaCliente(factura: any): string {
    if (factura?.serie && factura?.numero && factura?.fechaEmision) {
      const fecha = new Date(factura.fechaEmision);
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const anio = fecha.getFullYear();
      return `${factura.serie}-${factura.numero}-${mes}-${anio}`;
    }

    if (factura?.serie && factura?.numero) {
      return `${factura.serie}-${factura.numero}`;
    }

    return factura?.numeroCompleto || factura?.id || '-';
  }

  getClienteNombreFactura(factura: any): string {
    return (
      factura?.clienteNombre ||
      factura?.cliente?.nombreApellidos ||
      factura?.cliente?.nombre ||
      '-'
    );
  }

  getTotalFacturasClientes(): number {
    return this.facturasClientes.reduce(
      (sum, factura) => sum + (factura.total || 0),
      0,
    );
  }

  getTotalFacturasProveedores(): number {
    return this.facturasProveedores.reduce(
      (sum, factura) => sum + (factura.totalImporte || 0),
      0,
    );
  }

  getResumenSaldos(informe: HistorialSaldoResponse): string {
    const movimientos = informe.movimientos.length;

    let estadoTexto = '';
    switch (informe.estadoSaldo) {
      case 'PENDIENTE':
        estadoTexto = 'saldo pendiente';
        break;
      case 'A_FAVOR':
        estadoTexto = 'saldo a favor';
        break;
      default:
        estadoTexto = 'saldo saldado';
    }

    return `${informe.clienteNombre} (${informe.empresa}) tiene ${movimientos} movimiento(s) en el periodo seleccionado, con ${estadoTexto} de ${this.formatearImporte(informe.saldoFinal)}.`;
  }
}
