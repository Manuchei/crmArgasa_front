import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { toDataURL } from 'qrcode';

import { environment } from '../../../environments/environment';
import { EMPRESAS } from '../../shared/config/empresa-config';

@Component({
  selector: 'app-imprimir-factura',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imprimir-factura.component.html',
  styleUrls: ['./imprimir-factura.component.css'],
})
export class ImprimirFacturaComponent implements OnInit {
  factura: any = null;
  loading = false;
  error: string | null = null;

  qrImagen: string | null = null;
  qrUrl: string | null = null;
  generandoQr = false;
  errorQr: string | null = null;

  private baseUrl = environment.apiUrl;
  private cargaActual = 0;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(id) || id <= 0) {
      this.error = 'ID de factura inválido';
      return;
    }

    this.cargarFactura(id);
  }

  cargarFactura(id: number): void {
    const carga = ++this.cargaActual;

    this.loading = true;
    this.error = null;
    this.factura = null;
    this.qrImagen = null;
    this.qrUrl = null;
    this.errorQr = null;
    this.generandoQr = false;

    this.cargarFacturaCliente(id, carga);
  }

  private cargarFacturaCliente(id: number, carga: number): void {
    this.http
      .get(`${this.baseUrl}/facturacion-v2/facturas/${id}`, {
        responseType: 'text',
      })
      .subscribe({
        next: (raw) => {
          if (carga !== this.cargaActual) return;

          try {
            const factura = JSON.parse(raw);
            this.recibirFactura(factura, carga);
          } catch {
            this.loading = false;
            this.error =
              'La respuesta de la factura no tiene un formato JSON válido.';
          }
        },
        error: (err) => {
          if (carga !== this.cargaActual) return;

          if (err?.status === 404) {
            this.cargarFacturaProveedor(id, carga);
            return;
          }

          this.loading = false;
          this.error = this.getMensajeError(err);
        },
      });
  }

  private cargarFacturaProveedor(id: number, carga: number): void {
    this.http
      .get(`${this.baseUrl}/facturas/${id}`, {
        responseType: 'text',
      })
      .subscribe({
        next: (raw) => {
          if (carga !== this.cargaActual) return;

          try {
            const factura = JSON.parse(raw);
            this.recibirFactura(factura, carga);
          } catch {
            this.loading = false;
            this.error =
              'La respuesta de la factura no tiene un formato JSON válido.';
          }
        },
        error: (err) => {
          if (carga !== this.cargaActual) return;

          this.loading = false;
          this.error = this.getMensajeError(err);
        },
      });
  }

  private recibirFactura(factura: any, carga: number): void {
    if (!factura || typeof factura !== 'object' || Array.isArray(factura)) {
      this.loading = false;
      this.error = 'La respuesta no contiene una factura válida.';
      return;
    }

    this.factura = factura;
    this.guardarEmpresa();
    this.loading = false;

    void this.generarQr(carga);
  }

  private getMensajeError(err: any): string {
    if (typeof err?.error === 'string') {
      try {
        const respuesta = JSON.parse(err.error);
        return respuesta.message || respuesta.error || err.error;
      } catch {
        return err.error;
      }
    }

    return (
      err?.error?.message ||
      `No se pudo cargar la factura (HTTP ${err?.status ?? '?'})`
    );
  }

  private guardarEmpresa(): void {
    if (this.factura?.empresa) {
      localStorage.setItem('empresa', String(this.factura.empresa));
    }
  }

  private async generarQr(carga: number): Promise<void> {
    if (
      this.esFacturaProveedor() ||
      this.esBorrador() ||
      !this.factura?.facturaDirectaId
    ) {
      return;
    }

    const valor = String(this.factura?.verifactuQrUrl || '').trim();

    if (!valor) {
      this.errorQr = 'La factura no tiene una URL de verificación guardada.';
      return;
    }

    try {
      const url = new URL(valor);

      if (
        url.protocol !== 'https:' ||
        !(url.hostname === 'aeat.es' || url.hostname.endsWith('.aeat.es'))
      ) {
        throw new Error('URL de verificación no válida');
      }

      this.qrUrl = valor;
      this.generandoQr = true;

      const imagen = await toDataURL(valor, {
        errorCorrectionLevel: 'M',
        margin: 4,
        width: 300,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      if (carga !== this.cargaActual) return;

      this.qrImagen = imagen;
    } catch {
      if (carga !== this.cargaActual) return;

      this.qrUrl = null;
      this.errorQr = 'No se pudo generar el QR de verificación.';
    } finally {
      if (carga === this.cargaActual) {
        this.generandoQr = false;
      }
    }
  }

  private redondearImporte(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  imprimirManual(): void {
    if (!this.factura || this.loading || this.generandoQr) return;

    window.print();
  }

  esFacturaProveedor(): boolean {
    return !!this.factura?.albaranProveedor || !!this.factura?.numeroInterno;
  }

  esBorrador(): boolean {
    return (
      !this.esFacturaProveedor() && this.getEstadoDocumento() === 'BORRADOR'
    );
  }

  esFacturaDePrueba(): boolean {
    return (
      !this.esFacturaProveedor() &&
      String(this.factura?.facturaDirectaCompanyId || '').startsWith(
        'com_sandbox_',
      )
    );
  }

  getEmisorVisualFactura(): any {
    const empresa = String(this.factura?.empresa || '')
      .trim()
      .toLowerCase();

    return (
      EMPRESAS[empresa as keyof typeof EMPRESAS] ||
      this.factura?.emisor || {
        nombre: this.factura?.empresa || 'Empresa emisora',
      }
    );
  }

  getNumeroDocumento(): string {
    if (!this.factura) return '';

    if (this.esFacturaProveedor()) {
      return this.factura.numeroInterno || '-';
    }

    const remoto = String(this.factura.facturaDirectaNumero || '').trim();

    return remoto || this.getReferenciaLocal();
  }

  getReferenciaLocal(): string {
    if (!this.factura) return '';

    const numero = this.factura.numero ?? this.factura.id;
    const fecha = String(this.factura.fechaEmision || '');
    const partes = /^(\d{4})-(\d{2})-\d{2}/.exec(fecha);

    if (!partes) {
      return `FC-${numero}`;
    }

    return `FC-${numero}-${partes[2]}-${partes[1]}`;
  }

  getFechaDocumento(): string {
    return this.factura?.fechaEmision || '';
  }

  getFechaVencimientoDocumento(): string {
    return this.factura?.fechaVencimiento || this.getFechaDocumento();
  }

  getEstadoDocumento(): string {
    if (this.esFacturaProveedor() && this.factura?.pagada) {
      return 'PAGADA';
    }

    const estado = String(
      this.factura?.estado || this.factura?.estadoFactura || '',
    )
      .trim()
      .toUpperCase();

    return estado || 'PENDIENTE';
  }

  getEstadoVerifactu(): string {
    switch (this.factura?.verifactuEstado) {
      case 'CREACION_EN_CURSO':
        return 'Preparación pendiente de confirmar';

      case 'BORRADOR_REMOTO':
        return 'Borrador preparado en FacturaDirecta';

      case 'EMISION_EN_CURSO':
        return 'Emisión pendiente de confirmar';

      case 'PENDIENTE_CONFIRMACION_AEAT':
        return 'Emitida · aceptación AEAT pendiente de sincronizar';

      default:
        return this.factura?.verifactuEstado || 'Sin estado sincronizado';
    }
  }

  documentoPagado(): boolean {
    return this.getEstadoDocumento() === 'PAGADA';
  }

  getTituloReceptor(): string {
    return this.esFacturaProveedor() ? 'Proveedor' : 'Cliente';
  }

  getNombreReceptor(): string {
    if (this.esFacturaProveedor()) {
      const proveedor = this.factura?.proveedor || {};

      return (
        `${proveedor.nombre || ''} ${proveedor.apellido || ''}`.trim() || '—'
      );
    }

    return (
      this.factura?.cliente?.nombreComercial ||
      this.factura?.cliente?.nombreApellidos ||
      '—'
    );
  }

  getCifDniReceptor(): string | null {
    return this.esFacturaProveedor()
      ? this.factura?.proveedor?.cif || null
      : this.factura?.cliente?.cifDni || null;
  }

  getDireccionReceptor(): string | null {
    return this.esFacturaProveedor()
      ? this.factura?.proveedor?.direccion || null
      : this.factura?.cliente?.direccion || null;
  }

  getLocalidadReceptor(): string {
    const receptor = this.esFacturaProveedor()
      ? this.factura?.proveedor || {}
      : this.factura?.cliente || {};

    const poblacion = this.esFacturaProveedor()
      ? receptor.localidad
      : receptor.poblacion;

    return [
      receptor.codigoPostal || '',
      poblacion || '',
      receptor.provincia ? `(${receptor.provincia})` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  getTelefonoReceptor(): string | null {
    return this.esFacturaProveedor()
      ? this.factura?.proveedor?.telefono || null
      : this.factura?.cliente?.telefono || null;
  }

  getEmailReceptor(): string | null {
    return this.esFacturaProveedor()
      ? this.factura?.proveedor?.email || null
      : this.factura?.cliente?.email || null;
  }

  getLineasDocumento(): any[] {
    const lineas = this.esFacturaProveedor()
      ? (this.factura?.albaranProveedor?.lineas ?? this.factura?.lineas)
      : this.factura?.lineas;

    return Array.isArray(lineas) ? lineas : [];
  }

  getCantidadLinea(linea: any): number {
    return Number(
      this.esFacturaProveedor()
        ? (linea?.unidades ?? linea?.cantidad ?? 0)
        : (linea?.cantidad ?? linea?.unidades ?? 0),
    );
  }

  getPrecioLinea(linea: any): number {
    return Number(
      this.esFacturaProveedor()
        ? (linea?.precio ?? linea?.precioUnitario ?? 0)
        : (linea?.precioUnitario ?? linea?.precio ?? 0),
    );
  }

  getDescuentoLinea(linea: any): number {
    return Number(linea?.descuentoPct ?? linea?.dtoPct ?? 0);
  }

  getIvaPorcentajeLinea(linea: any): number {
    return Number(linea?.ivaPct ?? (this.esFacturaProveedor() ? 21 : 0));
  }

  getIvaLinea(linea: any): string {
    return `${this.getIvaPorcentajeLinea(linea)}%`;
  }

  getSubtotalLinea(linea: any): number {
    const subtotal = linea?.baseLinea ?? linea?.subtotal;

    if (subtotal !== null && subtotal !== undefined) {
      return Number(subtotal);
    }

    const bruto = this.getCantidadLinea(linea) * this.getPrecioLinea(linea);

    return this.redondearImporte(
      bruto * (1 - this.getDescuentoLinea(linea) / 100),
    );
  }

  getTotalLinea(linea: any): number {
    if (linea?.totalLinea !== null && linea?.totalLinea !== undefined) {
      return Number(linea.totalLinea);
    }

    return this.redondearImporte(
      this.getSubtotalLinea(linea) *
        (1 + this.getIvaPorcentajeLinea(linea) / 100),
    );
  }

  getTotalUnidades(): number {
    return this.getLineasDocumento().reduce(
      (total: number, linea: any) => total + this.getCantidadLinea(linea),
      0,
    );
  }

  getDescuentoTotal(): number {
    return this.redondearImporte(
      this.getLineasDocumento().reduce((total: number, linea: any) => {
        const bruto = this.getCantidadLinea(linea) * this.getPrecioLinea(linea);

        return total + (bruto * this.getDescuentoLinea(linea)) / 100;
      }, 0),
    );
  }

  getBaseImponible(): number {
    if (
      this.factura?.baseImponible !== null &&
      this.factura?.baseImponible !== undefined
    ) {
      return Number(this.factura.baseImponible);
    }

    return this.redondearImporte(
      this.getLineasDocumento().reduce(
        (total: number, linea: any) => total + this.getSubtotalLinea(linea),
        0,
      ),
    );
  }

  getIvaTotal(): number {
    const iva = this.factura?.ivaTotal ?? this.factura?.totalIva;

    if (iva !== null && iva !== undefined) {
      return Number(iva);
    }

    return this.redondearImporte(
      this.getLineasDocumento().reduce(
        (total: number, linea: any) =>
          total +
          this.redondearImporte(
            (this.getSubtotalLinea(linea) * this.getIvaPorcentajeLinea(linea)) /
              100,
          ),
        0,
      ),
    );
  }

  getTotalDocumento(): number {
    const total = this.esFacturaProveedor()
      ? (this.factura?.totalImporte ?? this.factura?.total)
      : this.factura?.total;

    if (total !== null && total !== undefined) {
      return Number(total);
    }

    return this.redondearImporte(this.getBaseImponible() + this.getIvaTotal());
  }
}
