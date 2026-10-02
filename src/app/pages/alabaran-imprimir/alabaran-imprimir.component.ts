import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { environment } from '../../../environments/environment';
import { EMPRESAS } from '../../shared/config/empresa-config';

@Component({
  selector: 'app-albaran-imprimir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alabaran-imprimir.component.html',
  styleUrls: ['./alabaran-imprimir.component.css'],
})
export class AlbaranImprimirComponent implements OnInit {
  // Conservamos "factura" para mantener compatibilidad con la plantilla.
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
      this.error = 'ID de albarán inválido';
      return;
    }

    this.cargarAlbaran(id);
  }

  cargarAlbaran(id: number): void {
    this.loading = true;
    this.error = null;
    this.factura = null;

    this.http.get<any>(`${this.baseUrl}/albaranes/${id}`).subscribe({
      next: (data) => {
        this.factura = data;

        if (this.factura?.empresa) {
          localStorage.setItem('empresa', String(this.factura.empresa));
        }

        this.loading = false;
      },
      error: (err) => {
        this.loading = false;

        const mensajeBackend =
          typeof err?.error === 'string' ? err.error : err?.error?.message;

        this.error =
          mensajeBackend ||
          `No se pudo cargar el albarán (HTTP ${err?.status ?? '?'})`;
      },
    });
  }

  imprimirManual(): void {
    window.print();
  }

  private redondearImporte(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
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

    if (this.factura.numero) {
      return String(this.factura.numero);
    }

    return this.factura.id ? `AL-${this.factura.id}` : '-';
  }

  getFechaDocumento(): string {
    return this.factura?.fechaEmision || '-';
  }

  getFechaVencimientoDocumento(): string {
    return this.factura?.fechaValor || this.factura?.fechaEmision || '-';
  }

  getEstadoDocumento(): string {
    if (!this.factura) {
      return '-';
    }

    if (this.factura.confirmado === true) {
      return 'CONFIRMADO';
    }

    if (this.factura.confirmado === false) {
      return 'PENDIENTE';
    }

    return (
      String(this.factura.estado || this.factura.estadoAlbaran || '')
        .trim()
        .toUpperCase() || 'PENDIENTE'
    );
  }

  documentoPagado(): boolean {
    return this.getEstadoDocumento() === 'CONFIRMADO';
  }

  getTituloReceptor(): string {
    return 'Cliente';
  }

  getNombreReceptor(): string {
    return (
      this.factura?.nombreComercial ||
      this.factura?.nombreApellidos ||
      this.factura?.cliente?.nombreComercial ||
      this.factura?.cliente?.nombreApellidos ||
      '—'
    );
  }

  getCifDniReceptor(): string | null {
    return this.factura?.cifDni || this.factura?.cliente?.cifDni || null;
  }

  getDireccionReceptor(): string | null {
    return this.factura?.direccion || this.factura?.cliente?.direccion || null;
  }

  getLocalidadReceptor(): string {
    const codigoPostal =
      this.factura?.codigoPostal || this.factura?.cliente?.codigoPostal || '';

    const poblacion =
      this.factura?.poblacion || this.factura?.cliente?.poblacion || '';

    const provincia =
      this.factura?.provincia || this.factura?.cliente?.provincia || '';

    return [codigoPostal, poblacion, provincia ? `(${provincia})` : '']
      .filter(Boolean)
      .join(' ');
  }

  getTelefonoReceptor(): string | null {
    return (
      this.factura?.telefono ||
      this.factura?.movil ||
      this.factura?.cliente?.telefono ||
      this.factura?.cliente?.movil ||
      null
    );
  }

  getEmailReceptor(): string | null {
    return this.factura?.email || this.factura?.cliente?.email || null;
  }

  getLineasDocumento(): any[] {
    return Array.isArray(this.factura?.lineas) ? this.factura.lineas : [];
  }

  getCantidadLinea(linea: any): number {
    return Number(linea?.unidades ?? linea?.cantidad ?? 0);
  }

  getPrecioLinea(linea: any): number {
    return Number(linea?.precio ?? linea?.precioUnitario ?? 0);
  }

  getDescuentoLinea(linea: any): number {
    return Number(linea?.dtoPct ?? linea?.descuentoPct ?? 0);
  }

  getSubtotalLinea(linea: any): number {
    // En este albarán, totalLinea contiene el importe con descuento.
    const importe = linea?.totalLinea ?? linea?.subtotal;

    if (importe !== null && importe !== undefined) {
      return Number(importe);
    }

    const bruto = this.getCantidadLinea(linea) * this.getPrecioLinea(linea);

    return this.redondearImporte(
      bruto * (1 - this.getDescuentoLinea(linea) / 100),
    );
  }

  getIvaLinea(linea: any): string {
    return `${Number(linea?.ivaPct ?? 0)}%`;
  }

  getTotalLinea(linea: any): number {
    return this.getSubtotalLinea(linea);
  }

  getTotalUnidades(): number {
    return this.getLineasDocumento().reduce(
      (total: number, linea: any) => total + this.getCantidadLinea(linea),
      0,
    );
  }

  getBaseImponible(): number {
    const total = this.getLineasDocumento().reduce(
      (acumulado: number, linea: any) =>
        acumulado + this.getSubtotalLinea(linea),
      0,
    );

    return this.redondearImporte(total);
  }

  getDescuentoTotal(): number {
    const descuento = this.getLineasDocumento().reduce(
      (total: number, linea: any) => {
        const bruto = this.getCantidadLinea(linea) * this.getPrecioLinea(linea);

        return total + (bruto * this.getDescuentoLinea(linea)) / 100;
      },
      0,
    );

    return this.redondearImporte(descuento);
  }

  getIvaTotal(): number {
    return Number(this.factura?.totalIva ?? this.factura?.ivaTotal ?? 0);
  }

  getTotalDocumento(): number {
    const total = this.factura?.totalImporte ?? this.factura?.total;

    if (total !== null && total !== undefined) {
      return Number(total);
    }

    return this.getBaseImponible();
  }
}
