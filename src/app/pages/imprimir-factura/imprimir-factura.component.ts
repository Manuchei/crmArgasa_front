import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
      .get(`${this.baseUrl}/facturacion-v2/facturas/${id}`, {
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
            console.error('Respuesta no válida al cargar factura cliente:', raw);
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
            console.error('Respuesta no válida al cargar factura proveedor:', raw);
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
      .toUpperCase();

    if (emp === 'ARGASA') {
      return {
        nombre: 'Argasa Garrido S.L.',
        cif: 'B36879617',
        direccion: 'Rúa Pintor Laxeiro Nº15 Bajo',
        codigoPostal: '36211',
        poblacion: 'Vigo',
        provincia: 'Pontevedra',
        telefono: '607472159',
        email: 'argasaluis@gmail.com',
        logoUrl: '/assets/logos/argasa.png',
      };
    }

    if (emp === 'ELECTROLUGA' || emp === 'LUGA') {
      return {
        nombre: 'ELECTROLUGA, S.L.U',
        cif: 'B42722389',
        direccion: 'Rúa Pintor Laxeiro Nº15 Bajo',
        codigoPostal: '36211',
        poblacion: 'Vigo',
        provincia: 'Pontevedra',
        telefono: '607472159',
        email: 'electrolugaslu@gmail.com',
        logoUrl: '/assets/logos/luga.png',
      };
    }

    return this.factura?.emisor || null;
  }

 getNumeroDocumento(): string {
  if (!this.factura) {
    return '';
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

  getEstadoDocumento(): string {
    if (this.esFacturaProveedor()) {
      return this.factura?.pagada ? 'PAGADA' : 'PENDIENTE';
    }

    return this.factura?.estado || '-';
  }

  getTituloReceptor(): string {
    return this.esFacturaProveedor() ? 'Proveedor' : 'Cliente';
  }

  getNombreReceptor(): string {
    if (this.esFacturaProveedor()) {
      const proveedor = this.factura?.proveedor || {};
      return `${proveedor?.nombre || ''} ${proveedor?.apellido || ''}`.trim() || '—';
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
      const cp = p?.codigoPostal || '';
      const localidad = p?.localidad || '';
      const provincia = p?.provincia || '';

      return `${cp} ${localidad} ${provincia ? `(${provincia})` : ''}`.trim();
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
      return this.factura?.albaranProveedor?.lineas || [];
    }

    return this.factura?.lineas || [];
  }

  getCantidadLinea(linea: any): number {
    if (this.esFacturaProveedor()) {
      return Number(linea?.unidades || 0);
    }

    return Number(linea?.cantidad || 0);
  }

  getPrecioLinea(linea: any): number {
    if (this.esFacturaProveedor()) {
      return Number(linea?.precio || 0);
    }

    return Number(linea?.precioUnitario || 0);
  }

  getSubtotalLinea(linea: any): number {
    if (this.esFacturaProveedor()) {
      return Number(linea?.baseLinea || 0);
    }

    return Number(linea?.subtotal || 0);
  }

  getIvaLinea(linea: any): string {
    if (this.esFacturaProveedor()) {
      return '-';
    }

    return `${linea?.ivaPct ?? 0}%`;
  }

  getTotalLinea(linea: any): number {
    if (this.esFacturaProveedor()) {
      return Number(linea?.totalLinea || 0);
    }

    return Number(linea?.totalLinea || 0);
  }

  getBaseImponible(): number {
    if (this.esFacturaProveedor()) {
      return Number(this.factura?.albaranProveedor?.subtotal || this.factura?.totalImporte || 0);
    }

    return Number(this.factura?.baseImponible || 0);
  }

  getIvaTotal(): number {
    if (this.esFacturaProveedor()) {
      return 0;
    }

    return Number(this.factura?.ivaTotal || 0);
  }

  getTotalDocumento(): number {
    if (this.esFacturaProveedor()) {
      return Number(this.factura?.totalImporte || 0);
    }

    return Number(this.factura?.total || 0);
  }
}