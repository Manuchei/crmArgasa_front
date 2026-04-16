import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-imprimir-factura-proveedor',
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

    return null;
  }

  getNumeroInterno(): string {
    return this.factura?.numeroInterno || '-';
  }

  getNumeroFacturaProveedor(): string {
    return (
      this.factura?.numeroFacturaProveedor ||
      this.factura?.albaranProveedor?.numeroProveedor ||
      '-'
    );
  }

  getFechaEmision(): string {
    return this.factura?.fechaEmision || '-';
  }

  getEstado(): string {
    return this.factura?.pagada ? 'PAGADA' : 'PENDIENTE';
  }

  getProveedor(): any {
    return this.factura?.proveedor || {};
  }

  getNombreProveedor(): string {
    const p = this.getProveedor();
    return `${p?.nombre || ''} ${p?.apellido || ''}`.trim() || '—';
  }

  getCifProveedor(): string {
    return this.getProveedor()?.cif || '-';
  }

  getDireccionProveedor(): string {
    return this.getProveedor()?.direccion || '-';
  }

  getLocalidadProveedor(): string {
    const p = this.getProveedor();
    return `${p?.codigoPostal || ''} ${p?.localidad || ''} ${p?.provincia ? `(${p.provincia})` : ''}`.trim();
  }

  getTelefonoProveedor(): string {
    return this.getProveedor()?.telefono || '-';
  }

  getEmailProveedor(): string {
    return this.getProveedor()?.email || '-';
  }

  getAlbaran(): any {
    return this.factura?.albaranProveedor || {};
  }

  getLineas(): any[] {
    return this.getAlbaran()?.lineas || [];
  }

  getBaseImponible(): number {
    return Number(this.getAlbaran()?.subtotal || this.factura?.totalImporte || 0);
  }

  getDescuentoTotal(): number {
    return Number(this.getAlbaran()?.totalDescuento || 0);
  }

  getIvaTotal(): number {
    return 0;
  }

  getTotal(): number {
    return Number(this.factura?.totalImporte || 0);
  }
}