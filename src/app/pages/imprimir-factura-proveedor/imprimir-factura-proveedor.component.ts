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
  templateUrl: './imprimir-factura-proveedor.component.html',
  styleUrls: ['./imprimir-factura-proveedor.component.css'],
})
export class ImprimirFacturaProveedorComponent implements OnInit {
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

    if (!id) {
      this.error = 'ID de factura inválido';
      return;
    }

    this.cargarFactura(id);
  }

  cargarFactura(id: number): void {
    this.loading = true;
    this.error = null;
    this.cargarFacturaCliente(id);
  }

  private cargarFacturaCliente(id: number): void {
    this.http
      .get(`${this.baseUrl}facturas-proveedor/${id}`, {
        responseType: 'text',
      })
      .subscribe({
        next: (raw) => {
          try {
            const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
            this.factura = data;

            if (this.factura?.empresa) {
              localStorage.setItem('empresa', String(this.factura.empresa));
            }

            this.loading = false;
          } catch (e) {
            console.error(
              'Respuesta no válida al cargar factura cliente:',
              raw,
            );
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
            const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
            this.factura = data;

            if (this.factura?.empresa) {
              localStorage.setItem('empresa', String(this.factura.empresa));
            }

            this.loading = false;
          } catch (e) {
            console.error(
              'Respuesta no válida al cargar factura proveedor:',
              raw,
            );
            this.loading = false;
            this.error =
              'La respuesta de la factura no tiene un formato JSON válido.';
          }
        },
        error: (err) => {
          console.error('Error cargando factura proveedor', err);
          this.loading = false;

          const backendText = typeof err?.error === 'string' ? err.error : null;

          this.error =
            err?.error?.message ??
            backendText ??
            `No se pudo cargar la factura (HTTP ${err?.status ?? '?'})`;
        },
      });
  }

  imprimirManual(): void {
    window.print();
  }

  esFacturaProveedor(): boolean {
    return !!this.factura?.albaranProveedor || !!this.factura?.numeroInterno;
  }

getEmisorVisualFactura(): any {
  const emp = String(this.factura?.empresa || '')
    .trim()
    .toLowerCase();

  return EMPRESAS[emp as keyof typeof EMPRESAS] || null;
}

  getNumeroDocumento(): string {
    if (!this.factura) return '';

    if (this.esFacturaProveedor()) {
      return this.factura?.numeroInterno || '-';
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
    if (this.esFacturaProveedor()) {
      return this.factura?.fechaVencimiento || '-';
    }

    return '-';
  }

  getEstadoDocumento(): string {
    if (this.esFacturaProveedor()) {
      return this.factura?.pagada ? 'PAGADA' : 'PENDIENTE';
    }

    const estado = String(this.factura?.estado || '').toUpperCase();

    if (estado === 'PAGADA') {
      return 'PAGADA';
    }

    if (estado === 'EMITIDA') {
      return 'PENDIENTE';
    }

    if (estado === 'BORRADOR') {
      return 'BORRADOR';
    }

    if (estado === 'ANULADA') {
      return 'ANULADA';
    }

    return estado || '-';
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
        `${proveedor?.nombre || ''} ${proveedor?.apellido || ''}`.trim() || '—'
      );
    }

    return (
      this.factura?.cliente?.nombreComercial ??
      this.factura?.cliente?.nombreApellidos ??
      '—'
    );
  }

  getCifDniReceptor(): string | null {
    if (this.esFacturaProveedor()) {
      return this.factura?.proveedor?.cif || null;
    }

    return this.factura?.cliente?.cifDni || null;
  }

  getDireccionReceptor(): string | null {
    if (this.esFacturaProveedor()) {
      return this.factura?.proveedor?.direccion || null;
    }

    return this.factura?.cliente?.direccion || null;
  }

  getLocalidadReceptor(): string {
    if (this.esFacturaProveedor()) {
      const p = this.factura?.proveedor || {};
      return `${p?.codigoPostal || ''} ${p?.localidad || ''} ${p?.provincia ? `(${p.provincia})` : ''}`.trim();
    }

    const c = this.factura?.cliente || {};
    return `${c?.codigoPostal || ''} ${c?.poblacion || ''} ${c?.provincia ? `(${c.provincia})` : ''}`.trim();
  }

  getTelefonoReceptor(): string | null {
    if (this.esFacturaProveedor()) {
      return this.factura?.proveedor?.telefono || null;
    }

    return this.factura?.cliente?.telefono || null;
  }

  getEmailReceptor(): string | null {
    if (this.esFacturaProveedor()) {
      return this.factura?.proveedor?.email || null;
    }

    return this.factura?.cliente?.email || null;
  }

  getLineasDocumento(): any[] {
    if (this.esFacturaProveedor()) {
      return (
        this.factura?.albaranProveedor?.lineas || this.factura?.lineas || []
      );
    }

    return this.factura?.lineas || [];
  }

  getCantidadLinea(linea: any): number {
    if (this.esFacturaProveedor()) {
      return Number(linea?.unidades ?? linea?.cantidad ?? 0);
    }

    return Number(linea?.cantidad || 0);
  }

  getPrecioLinea(linea: any): number {
    if (this.esFacturaProveedor()) {
      return Number(linea?.precio ?? linea?.precioUnitario ?? 0);
    }

    return Number(linea?.precioUnitario || 0);
  }

  getSubtotalLinea(linea: any): number {
    if (this.esFacturaProveedor()) {
      return Number(linea?.baseLinea ?? linea?.subtotal ?? 0);
    }

    return Number(linea?.subtotal || 0);
  }

  getIvaLinea(linea: any): string {
    if (this.esFacturaProveedor()) {
      return `${linea?.ivaPct ?? 21}%`;
    }

    return `${linea?.ivaPct ?? 0}%`;
  }

  getTotalLinea(linea: any): number {
    return Number(linea?.totalLinea || 0);
  }

  getBaseImponible(): number {
    if (this.esFacturaProveedor()) {
      return Number(
        this.factura?.baseImponible ??
          this.factura?.albaranProveedor?.subtotal ??
          this.factura?.totalImporte ??
          0,
      );
    }

    return Number(this.factura?.baseImponible || 0);
  }

  getIvaTotal(): number {
    if (this.esFacturaProveedor()) {
      return Number(this.factura?.ivaTotal || 0);
    }

    return Number(this.factura?.ivaTotal || 0);
  }

  getTotalDocumento(): number {
    if (this.esFacturaProveedor()) {
      return Number(this.factura?.totalImporte || this.factura?.total || 0);
    }

    return Number(this.factura?.total || 0);
  }
}
