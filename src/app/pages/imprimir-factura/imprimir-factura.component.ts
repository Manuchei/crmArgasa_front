import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
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

  private baseUrl = environment.apiUrl;

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
    this.loading = true;
    this.error = null;
    this.factura = null;
    this.cargarFacturaCliente(id);
  }

  private cargarFacturaCliente(id: number): void {
    this.http
      .get(`${this.baseUrl}/facturacion-v2/facturas/${id}`, {
        responseType: 'text',
      })
      .subscribe({
        next: (raw) => {
          try {
            this.factura = JSON.parse(raw);
            this.guardarEmpresa();
            this.loading = false;
          } catch {
            this.cargarFacturaProveedor(id);
          }
        },
        error: () => {
          this.cargarFacturaProveedor(id);
        },
      });
  }

  private cargarFacturaProveedor(id: number): void {
    this.http
      .get(`${this.baseUrl}/facturas/${id}`, {
        responseType: 'text',
      })
      .subscribe({
        next: (raw) => {
          try {
            this.factura = JSON.parse(raw);
            this.guardarEmpresa();
            this.loading = false;
          } catch {
            this.loading = false;
            this.error =
              'La respuesta de la factura no tiene un formato JSON válido.';
          }
        },
        error: (err) => {
          this.loading = false;

          const backendText = typeof err?.error === 'string' ? err.error : null;

          this.error =
            err?.error?.message ??
            backendText ??
            `No se pudo cargar la factura (HTTP ${err?.status ?? '?'})`;
        },
      });
  }

  private guardarEmpresa(): void {
    if (this.factura?.empresa) {
      localStorage.setItem('empresa', String(this.factura.empresa));
    }
  }

  private redondearImporte(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  imprimirManual(): void {
    window.print();
  }

  esFacturaProveedor(): boolean {
    return !!this.factura?.albaranProveedor || !!this.factura?.numeroInterno;
  }

  getEmisorVisualFactura(): any {
    const empresa = String(this.factura?.empresa || '')
      .trim()
      .toLowerCase();

    return EMPRESAS[empresa as keyof typeof EMPRESAS] || null;
  }

  getNumeroDocumento(): string {
    if (!this.factura) {
      return '';
    }

    if (this.esFacturaProveedor()) {
      return this.factura.numeroInterno || '-';
    }

    const numero = this.factura.numero ?? this.factura.id;
    const fecha = this.factura.fechaEmision
      ? new Date(this.factura.fechaEmision)
      : new Date();

    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();

    return `FC-${numero}-${mes}-${anio}`;
  }

  getFechaDocumento(): string {
    return this.factura?.fechaEmision || '-';
  }

  getFechaVencimientoDocumento(): string {
    return this.factura?.fechaVencimiento || '-';
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
    const descuento = this.getLineasDocumento().reduce(
      (total: number, linea: any) => {
        const bruto =
          this.getCantidadLinea(linea) * this.getPrecioLinea(linea);

        return total +
          (bruto * this.getDescuentoLinea(linea)) / 100;
      },
      0
    );

    return Math.round((descuento + Number.EPSILON) * 100) / 100;
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
