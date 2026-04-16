import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FacturasProveedoresService } from '../../services/facturas-proveedores.service';
import { IfacturaProveedor } from '../../interfaces/ifactura-proveedor';

@Component({
  selector: 'app-factura-proveedor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-proveedor.component.html',
  styleUrls: ['./factura-proveedor.component.css'],
})
export class FacturaProveedorComponent implements OnInit {
  factura: IfacturaProveedor | null = null;
  cargando = true;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facturasProveedoresService: FacturasProveedoresService,
  ) {}

  ngOnInit(): void {
    this.cargarFactura();
  }

  cargarFactura(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.cargando = false;
      this.error = 'Id de factura no válido';
      return;
    }

    this.facturasProveedoresService.getById(id).subscribe({
      next: (data) => {
        this.factura = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando factura', err);
        this.error =
          err?.error?.message || err?.error || 'No se pudo cargar la factura';
        this.cargando = false;
      },
    });
  }

  imprimir(): void {
    window.print();
  }

  volver(): void {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    this.router.navigate(['/app/proveedores']);
  }

  formatearImporte(valor: number | null | undefined): string {
    const numero = Number(valor || 0);
    return numero.toFixed(2);
  }

  getNombreProveedor(): string {
    const proveedor: any = this.factura?.proveedor || {};
    const nombre = proveedor?.nombre || '';
    const apellido = proveedor?.apellido || '';
    const nombreCompleto = `${nombre} ${apellido}`.trim();
    return nombreCompleto || '-';
  }

  getCifProveedor(): string {
    const proveedor: any = this.factura?.proveedor || {};
    return proveedor?.cif || '-';
  }

  getTelefonoProveedor(): string {
    const proveedor: any = this.factura?.proveedor || {};
    return proveedor?.telefono || '-';
  }

  getEmailProveedor(): string {
    const proveedor: any = this.factura?.proveedor || {};
    return proveedor?.email || '-';
  }

  getDireccionProveedor(): string {
    const proveedor: any = this.factura?.proveedor || {};
    const direccion = proveedor?.direccion || '';
    const localidad = proveedor?.localidad || '';
    const provincia = proveedor?.provincia || '';
    const pais = proveedor?.pais || '';

    const partes = [direccion, localidad, provincia, pais]
      .map((p) => (p || '').trim())
      .filter((p) => p.length > 0);

    return partes.length ? partes.join(', ') : '-';
  }

  getAlbaran(): any {
    return (this.factura as any)?.albaranProveedor || null;
  }

  getLineasAlbaran(): any[] {
    const albaran = this.getAlbaran();
    return albaran?.lineas || [];
  }

  getSubtotalAlbaran(): number {
    const albaran = this.getAlbaran();
    return Number(albaran?.subtotal || 0);
  }

  getDescuentoAlbaran(): number {
    const albaran = this.getAlbaran();
    return Number(albaran?.totalDescuento || 0);
  }
}
