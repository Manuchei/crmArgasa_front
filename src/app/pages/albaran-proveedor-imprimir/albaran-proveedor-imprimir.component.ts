import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

import { environment } from '../../../environments/environment';
import { EMPRESAS } from '../../shared/config/empresa-config';

@Component({
  selector: 'app-albaran-proveedor-imprimir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './albaran-proveedor-imprimir.component.html',
  styleUrls: ['./albaran-proveedor-imprimir.component.css'],
})
export class AlbaranProveedorImprimirComponent implements OnInit {
  /*
   * Conservamos el nombre "factura" para no tener que cambiar
   * todo el HTML que ya utiliza factura.
   *
   * Aunque se llame factura, aquí contendrá el albarán.
   */
  factura: any = null;

  loading = false;
  error: string | null = null;

  private baseUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    const idTexto = this.route.snapshot.paramMap.get('id');
    const id = Number(idTexto);

    if (!idTexto || Number.isNaN(id) || id <= 0) {
      this.error = 'ID de albarán inválido';
      return;
    }

    this.cargarAlbaran(id);
  }

  cargarAlbaran(id: number): void {
    this.loading = true;
    this.error = null;
    this.factura = null;

    this.http
      .get<any>(`${this.baseUrl}/albaranes-proveedor/${id}`)
      .subscribe({
        next: (data) => {
          console.log('Albarán recibido:', data);

          this.factura = data;

          if (this.factura?.empresa) {
            localStorage.setItem(
              'empresa',
              String(this.factura.empresa),
            );
          }

          this.loading = false;
        },

        error: (err) => {
          console.error('Error cargando el albarán:', err);

          this.loading = false;

          const mensajeBackend =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.message;

          this.error =
            mensajeBackend ||
            `No se pudo cargar el albarán (HTTP ${err?.status ?? '?'})`;
        },
      });
  }

  imprimirManual(): void {
    setTimeout(() => {
  window.print();
}, 1000);
  }

  /*
   * EMPRESA EMISORA
   */

  getEmisorVisualFactura(): any {


    const empresa = String(this.factura?.empresa || '')
      .trim()
      .toLowerCase();

    

    return EMPRESAS[empresa as keyof typeof EMPRESAS] || null;
  }

  //emisor!: any;

  /*
   * DATOS DEL ALBARÁN
   */

  getNumeroDocumento(): string {
    if (!this.factura) {
      return '';
    }

    if (this.factura.numero) {
      return String(this.factura.numero);
    }

    if (this.factura.id) {
      return `AL-${this.factura.id}`;
    }

    return '-';
  }

  getFechaDocumento(): string {
    return this.factura?.fechaEmision || '-';
  }

  getFechaVencimientoDocumento(): string {
    /*
     * El albarán no tiene necesariamente fecha de vencimiento.
     * Para que el HTML siga funcionando, utilizamos la fecha
     * de emisión como fecha valor.
     */
    return (
      this.factura?.fechaValor ||
      this.factura?.fechaEmision ||
      '-'
    );
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

    const estado = String(this.factura?.estado || '')
      .trim()
      .toUpperCase();

    return estado || 'PENDIENTE';
  }

  documentoPagado(): boolean {
    /*
     * Se mantiene el método por compatibilidad con el HTML.
     * En un albarán comprobamos si está confirmado.
     */
    return this.getEstadoDocumento() === 'CONFIRMADO';
  }

  /*
   * DATOS DEL CLIENTE
   */

  getTituloReceptor(): string {
    return 'Cliente';
  }

  getNombreReceptor(): string {
  if (!this.factura) {
    return '—';
  }

  return (
    this.factura.nombre ||
    this.factura.proveedor?.nombre ||
    '—'
  );
}

  getCifDniReceptor(): string | null {
    return (
      this.factura?.cifDni ||
      this.factura?.cliente?.cifDni ||
      null
    );
  }

  getDireccionReceptor(): string | null {
    return (
      this.factura?.direccion ||
      this.factura?.cliente?.direccion ||
      null
    );
  }

  getLocalidadReceptor(): string {
    if (!this.factura) {
      return '';
    }

    const codigoPostal =
      this.factura.codigoPostal ||
      this.factura.cliente?.codigoPostal ||
      '';

    const poblacion =
      this.factura.poblacion ||
      this.factura.cliente?.poblacion ||
      '';

    const provincia =
      this.factura.provincia ||
      this.factura.cliente?.provincia ||
      '';

    return [
      codigoPostal,
      poblacion,
      provincia ? `(${provincia})` : '',
    ]
      .filter(Boolean)
      .join(' ')
      .trim();
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
    return (
      this.factura?.email ||
      this.factura?.cliente?.email ||
      null
    );
  }

  /*
   * LÍNEAS DEL ALBARÁN
   */

  getLineasDocumento(): any[] {
    return Array.isArray(this.factura?.lineas)
      ? this.factura.lineas
      : [];
  }

  getCantidadLinea(linea: any): number {
    return Number(
      linea?.unidades ??
      linea?.cantidad ??
      0,
    );
  }

  getPrecioLinea(linea: any): number {
    return Number(
      linea?.precio ??
      linea?.precioUnitario ??
      0,
    );
  }

  getDescuentoLinea(linea: any): number {
    return Number(
      linea?.dtoPct ??
      linea?.descuentoPct ??
      0,
    );
  }

  getSubtotalLinea(linea: any): number {
    /*
     * En el modelo del albarán el importe final de la línea
     * se llama totalLinea.
     */
    if (linea?.totalLinea !== null &&
        linea?.totalLinea !== undefined) {
      return Number(linea.totalLinea);
    }

    if (linea?.subtotal !== null &&
        linea?.subtotal !== undefined) {
      return Number(linea.subtotal);
    }

    const unidades = this.getCantidadLinea(linea);
    const precio = this.getPrecioLinea(linea);
    const descuento = this.getDescuentoLinea(linea);

    const bruto = unidades * precio;

    return bruto - bruto * (descuento / 100);
  }

  getIvaLinea(linea: any): string {
    return `${Number(linea?.ivaPct ?? 0)}%`;
  }

  getTotalLinea(linea: any): number {
    return this.getSubtotalLinea(linea);
  }

  /*
   * TOTALES DEL ALBARÁN
   */

  getTotalUnidades(): number {
    return this.getLineasDocumento().reduce(
      (total, linea) =>
        total + this.getCantidadLinea(linea),
      0,
    );
  }

  getBaseImponible(): number {
    if (
      this.factura?.subtotal !== null &&
      this.factura?.subtotal !== undefined
    ) {
      return Number(this.factura.subtotal);
    }

    return this.getLineasDocumento().reduce(
      (total, linea) =>
        total + this.getSubtotalLinea(linea),
      0,
    );
  }

  getDescuentoTotal(): number {
    return Number(
      this.factura?.totalDescuento ??
      this.factura?.descuentoTotal ??
      0,
    );
  }

  getIvaTotal(): number {
    return Number(
      this.factura?.totalIva ??
      this.factura?.ivaTotal ??
      0,
    );
  }

  getTotalDocumento(): number {
    if (
      this.factura?.totalImporte !== null &&
      this.factura?.totalImporte !== undefined
    ) {
      return Number(this.factura.totalImporte);
    }

    if (
      this.factura?.total !== null &&
      this.factura?.total !== undefined
    ) {
      return Number(this.factura.total);
    }

    return this.getBaseImponible();
  }
}