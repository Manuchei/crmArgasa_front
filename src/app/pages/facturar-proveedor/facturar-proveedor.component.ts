import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturasProveedoresService } from '../../services/facturas-proveedores.service';
import {
  IfacturaProveedor,
  ILineaFacturaProveedor,
} from '../../interfaces/ifactura-proveedor';

@Component({
  selector: 'app-facturar-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './facturar-proveedor.component.html',
  styleUrls: ['./facturar-proveedor.component.css'],
})
export class FacturarProveedorComponent implements OnChanges {
  @Input() proveedorId!: number;

  facturasProveedor: IfacturaProveedor[] = [];
  factura: IfacturaProveedor | null = null;

  loading = false;
  error: string | null = null;

  modoEdicion = false;
  facturaEdit: any = null;

  constructor(private facturasService: FacturasProveedoresService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['proveedorId'] && this.proveedorId) {
      this.resetVistaFactura();
      this.cargarFacturasProveedor();
    }
  }

  cargarFacturasProveedor(): void {
    if (!this.proveedorId) return;

    this.loading = true;
    this.error = null;

    this.facturasService.getByProveedor(this.proveedorId).subscribe({
      next: (list) => {
        this.facturasProveedor = list ?? [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ?? 'Error cargando facturas del proveedor';
      },
    });
  }

  verFactura(f: IfacturaProveedor): void {
    this.modoEdicion = false;
    this.facturaEdit = null;

    if ((f as any)?.lineas?.length) {
      this.factura = f;
      return;
    }

    this.abrirFacturaDetalle(f.id);
  }

  private abrirFacturaDetalle(id: number): void {
    this.loading = true;
    this.error = null;
    this.modoEdicion = false;
    this.facturaEdit = null;

    this.facturasService.getById(id).subscribe({
      next: (full) => {
        this.factura = full;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ?? 'No se pudo cargar el detalle de la factura';
      },
    });
  }

  iniciarEdicion(): void {
    if (!this.factura) return;

    if (this.factura.estado !== 'BORRADOR') {
      this.error = 'Solo se puede modificar una factura en borrador';
      return;
    }

    this.error = null;
    this.modoEdicion = true;
    this.facturaEdit = {
      fechaEmision: this.toInputDate(this.factura.fechaEmision),
      numeroFacturaProveedor: this.factura.numeroFacturaProveedor ?? '',
      lineas: (this.factura.lineas ?? []).map((l: ILineaFacturaProveedor) => ({
        id: l.id,
        tipoOrigen: l.tipoOrigen,
        origenId: l.origenId,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        descuentoPct: l.descuentoPct ?? 0,
        ivaPct: l.ivaPct ?? 0,
        subtotal: l.subtotal,
        totalLinea: l.totalLinea,
      })),
    };

    this.recalcularVistaEdicion();
  }

  cancelarEdicion(): void {
    this.modoEdicion = false;
    this.facturaEdit = null;
    this.error = null;
  }

  guardarEdicion(): void {
    if (!this.factura?.id || !this.facturaEdit) return;

    if (this.factura.estado !== 'BORRADOR') {
      this.error = 'Solo se puede modificar una factura en borrador';
      return;
    }

    const lineas = this.facturaEdit.lineas ?? [];

    if (!lineas.length) {
      this.error = 'La factura debe tener al menos una línea';
      return;
    }

    for (const l of lineas) {
      if (!String(l.descripcion ?? '').trim()) {
        this.error = 'La descripción no puede estar vacía';
        return;
      }
      if (Number(l.cantidad) <= 0) {
        this.error = 'La cantidad debe ser mayor que 0';
        return;
      }
      if (Number(l.precioUnitario) < 0) {
        this.error = 'El precio unitario no puede ser negativo';
        return;
      }
      if (Number(l.descuentoPct) < 0 || Number(l.descuentoPct) > 100) {
        this.error = 'El descuento debe estar entre 0 y 100';
        return;
      }
      if (Number(l.ivaPct) < 0) {
        this.error = 'El IVA no puede ser negativo';
        return;
      }
    }

    const payload = {
      fechaEmision: this.facturaEdit.fechaEmision,
      numeroFacturaProveedor: this.facturaEdit.numeroFacturaProveedor,
      lineas: lineas.map((l: any) => ({
        id: l.id,
        tipoOrigen: l.tipoOrigen,
        origenId: l.origenId,
        descripcion: String(l.descripcion).trim(),
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        descuentoPct: Number(l.descuentoPct),
        ivaPct: Number(l.ivaPct),
      })),
    };

    this.loading = true;
    this.error = null;

    this.facturasService.actualizarFactura(this.factura.id, payload).subscribe({
      next: (factActualizada) => {
        this.factura = factActualizada;
        this.modoEdicion = false;
        this.facturaEdit = null;
        this.loading = false;
        this.cargarFacturasProveedor();
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ?? 'Error guardando cambios en la factura';
      },
    });
  }

  emitir(): void {
    if (!this.factura?.id) return;

    if (this.modoEdicion) {
      this.error = 'Guarda o cancela la edición antes de emitir la factura';
      return;
    }

    this.loading = true;
    this.error = null;

    this.facturasService.emitirFactura(this.factura.id).subscribe({
      next: (factEmitida) => {
        this.factura = factEmitida;
        this.loading = false;
        this.modoEdicion = false;
        this.facturaEdit = null;
        this.cargarFacturasProveedor();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error emitiendo factura';
      },
    });
  }

  pagarFacturaActual(): void {
    if (!this.factura?.id) return;

    this.loading = true;
    this.error = null;

    this.facturasService.pagar(this.factura.id).subscribe({
      next: (factPagada) => {
        this.factura = factPagada;
        this.loading = false;
        this.cargarFacturasProveedor();
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ?? 'Error marcando factura como pagada';
      },
    });
  }

  eliminarFacturaActual(): void {
    if (!this.factura?.id) return;

    if (this.factura.estado !== 'BORRADOR') {
      this.error = 'Solo se puede eliminar una factura en borrador';
      return;
    }

    if (
      !confirm(
        `¿Seguro que deseas eliminar la factura ${this.factura.numeroInterno}?`,
      )
    ) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.facturasService.eliminarBorrador(this.factura.id).subscribe({
      next: () => {
        this.factura = null;
        this.loading = false;
        this.modoEdicion = false;
        this.facturaEdit = null;
        this.cargarFacturasProveedor();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error eliminando factura';
      },
    });
  }

  eliminarFactura(f: IfacturaProveedor): void {
    if (!f?.id) return;

    if (f.estado !== 'BORRADOR') {
      this.error = 'Solo se puede eliminar una factura en borrador';
      return;
    }

    if (
      !confirm(`¿Seguro que deseas eliminar la factura ${f.numeroInterno}?`)
    ) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.facturasService.eliminarBorrador(f.id).subscribe({
      next: () => {
        if (this.factura?.id === f.id) {
          this.factura = null;
          this.modoEdicion = false;
          this.facturaEdit = null;
        }

        this.loading = false;
        this.cargarFacturasProveedor();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error eliminando factura';
      },
    });
  }

  emitirDesdeListado(f: IfacturaProveedor): void {
    if (!f?.id) return;

    this.loading = true;
    this.error = null;

    this.facturasService.emitirFactura(f.id).subscribe({
      next: (emitida) => {
        if (this.factura?.id === f.id) {
          this.factura = emitida;
          this.modoEdicion = false;
          this.facturaEdit = null;
        }
        this.loading = false;
        this.cargarFacturasProveedor();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error emitiendo factura';
      },
    });
  }

  imprimir(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.factura?.id) return;

    const url = `${window.location.origin}/imprimir/factura-proveedor/${this.factura.id}`;
    window.open(url, '_blank', 'noopener');
  }

  onLineaEditChange(): void {
    this.recalcularVistaEdicion();
  }

  private recalcularVistaEdicion(): void {
    if (!this.facturaEdit?.lineas) return;

    for (const l of this.facturaEdit.lineas) {
      const cantidad = Number(l.cantidad) || 0;
      const precioUnitario = Number(l.precioUnitario) || 0;
      const descuentoPct = Number(l.descuentoPct) || 0;
      const ivaPct = Number(l.ivaPct) || 0;

      const bruto = cantidad * precioUnitario;
      const descuento = bruto * (descuentoPct / 100);
      l.subtotal = this.round2(bruto - descuento);
      l.totalLinea = this.round2(l.subtotal * (1 + ivaPct / 100));
    }
  }

  get baseImponibleEdit(): number {
    const lineas = this.facturaEdit?.lineas ?? [];
    return this.round2(
      lineas.reduce(
        (acc: number, l: any) => acc + (Number(l.subtotal) || 0),
        0,
      ),
    );
  }

  get ivaTotalEdit(): number {
    const lineas = this.facturaEdit?.lineas ?? [];
    return this.round2(
      lineas.reduce((acc: number, l: any) => {
        const subtotal = Number(l.subtotal) || 0;
        const ivaPct = Number(l.ivaPct) || 0;
        return acc + subtotal * (ivaPct / 100);
      }, 0),
    );
  }

  get totalEdit(): number {
    return this.round2(this.baseImponibleEdit + this.ivaTotalEdit);
  }

  resetVistaFactura(): void {
    this.factura = null;
    this.modoEdicion = false;
    this.facturaEdit = null;
  }

  private round2(v: number): number {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  private toInputDate(value: any): string {
    if (!value) return '';
    return String(value).slice(0, 10);
  }
}
