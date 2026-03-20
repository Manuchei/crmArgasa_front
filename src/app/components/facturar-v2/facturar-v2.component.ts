import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FacturacionV2Service } from '../../services/facturacion-v2.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  PendientesFacturacionDTO,
  FacturaV2Response,
} from '../../interfaces/facturacion-v2';

@Component({
  selector: 'app-facturar-v2',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './facturar-v2.component.html',
  styleUrls: ['./facturar-v2.component.css'],
})
export class FacturarV2Component implements OnInit, OnChanges {
  @Input() clienteId!: number;

  pendientes: PendientesFacturacionDTO | null = null;

  selectedServicios = new Set<number>();
  selectedLineas = new Set<number>();

  serie: string = 'A';
  loading = false;
  error: string | null = null;

  factura: FacturaV2Response | null = null;
  facturasCliente: FacturaV2Response[] = [];

  modoEdicion = false;
  facturaEdit: any = null;

  constructor(private factService: FacturacionV2Service) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.resetEstadoVista();
      this.cargarPendientes();
      this.cargarFacturasCliente();
    }
  }

  get haySeleccion(): boolean {
    return this.selectedServicios.size > 0 || this.selectedLineas.size > 0;
  }

  get serviciosPendientes(): any[] {
    return (
      (this.pendientes as any)?.servicios ??
      (this.pendientes as any)?.serviciosPendientes ??
      []
    );
  }

  get lineasPendientes(): any[] {
    return (
      (this.pendientes as any)?.lineasAlbaran ??
      (this.pendientes as any)?.lineasAlbaranPendientes ??
      (this.pendientes as any)?.lineas ??
      []
    );
  }

  limpiarSeleccion(): void {
    this.selectedServicios.clear();
    this.selectedLineas.clear();
  }

  onSerieChange(): void {
    this.resetVistaFactura();
    this.cargarPendientes();
    this.cargarFacturasCliente();
  }

  private resetEstadoVista(): void {
    this.pendientes = null;
    this.factura = null;
    this.facturasCliente = [];
    this.error = null;
    this.loading = false;
    this.modoEdicion = false;
    this.facturaEdit = null;
    this.limpiarSeleccion();
  }

  onServicioChange(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    checked
      ? this.selectedServicios.add(id)
      : this.selectedServicios.delete(id);
  }

  onLineaChange(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    checked ? this.selectedLineas.add(id) : this.selectedLineas.delete(id);
  }

  cargarPendientes(): void {
    if (!this.clienteId) return;

    this.loading = true;
    this.error = null;

    this.factService.getPendientes(this.clienteId).subscribe({
      next: (data) => {
        this.pendientes = data ?? null;
        this.limpiarSeleccion();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error cargando pendientes';
      },
    });
  }

  cargarFacturasCliente(): void {
    if (!this.clienteId) return;

    this.factService.listarFacturas(undefined, this.clienteId).subscribe({
      next: (list) => {
        this.facturasCliente = list ?? [];
      },
      error: (err) => {
        console.error('Error listando facturas:', err);
      },
    });
  }

  crearBorrador(): void {
    if (!this.haySeleccion) {
      this.error =
        'Debes seleccionar al menos un servicio o una línea de albarán';
      return;
    }

    const req: any = {
      clienteId: this.clienteId,
      serie: this.serie,
      servicioId: Array.from(this.selectedServicios),
      lineasAlbaranIds: Array.from(this.selectedLineas),
    };

    this.loading = true;
    this.error = null;

    this.factService.crearFactura(req).subscribe({
      next: (fact) => {
        this.factura = fact;
        this.loading = false;
        this.modoEdicion = false;
        this.facturaEdit = null;
        this.cargarPendientes();
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error creando factura borrador';
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
      lineas: (this.factura.lineas ?? []).map((l: any) => ({
        id: l.id,
        descripcion: l.descripcion,
        cantidad: l.cantidad,
        precioUnitario: l.precioUnitario,
        ivaPct: l.ivaPct,
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
      if (Number(l.ivaPct) < 0) {
        this.error = 'El IVA no puede ser negativo';
        return;
      }
    }
    const payload = {
      fechaEmision: this.facturaEdit.fechaEmision,
      lineas: lineas.map((l: any) => ({
        id: l.id,
        descripcion: String(l.descripcion).trim(),
        cantidad: Number(l.cantidad),
        precioUnitario: Number(l.precioUnitario),
        ivaPct: Number(l.ivaPct),
      })),
    };
    this.loading = true;
    this.error = null;

    this.factService.actualizarFactura(this.factura.id, payload).subscribe({
      next: (factActualizada) => {
        this.factura = factActualizada;
        this.modoEdicion = false;
        this.facturaEdit = null;
        this.loading = false;
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.message ?? 'Error guardando cambios en la factura';
      },
    });
  }

  onLineaEditChange(): void {
    this.recalcularVistaEdicion();
  }

  private recalcularVistaEdicion(): void {
    if (!this.facturaEdit?.lineas) return;

    for (const l of this.facturaEdit.lineas) {
      const cantidad = Number(l.cantidad) || 0;
      const precioUnitario = Number(l.precioUnitario) || 0;
      const ivaPct = Number(l.ivaPct) || 0;

      l.subtotal = this.round2(cantidad * precioUnitario);
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

  eliminarFacturaActual(): void {
    if (!this.factura?.id) return;

    if (this.factura.estado !== 'BORRADOR') {
      this.error = 'Solo se puede eliminar una factura en borrador';
      return;
    }

    if (
      !confirm(
        `¿Seguro que deseas eliminar la factura ${this.factura.serie}-${this.factura.numero}?`,
      )
    ) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.factService.cancelarBorrador(this.factura.id).subscribe({
      next: () => {
        this.factura = null;
        this.loading = false;
        this.modoEdicion = false;
        this.facturaEdit = null;
        this.cargarPendientes();
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error eliminando factura';
      },
    });
  }

  eliminarFactura(f: FacturaV2Response): void {
    if (!f?.id) return;

    if (f.estado !== 'BORRADOR') {
      this.error = 'Solo se puede eliminar una factura en borrador';
      return;
    }

    if (
      !confirm(`¿Seguro que deseas eliminar la factura ${f.serie}-${f.numero}?`)
    ) {
      return;
    }

    this.loading = true;
    this.error = null;

    this.factService.cancelarBorrador(f.id).subscribe({
      next: () => {
        if (this.factura?.id === f.id) {
          this.factura = null;
          this.modoEdicion = false;
          this.facturaEdit = null;
        }

        this.loading = false;
        this.cargarPendientes();
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error eliminando factura';
      },
    });
  }

  emitir(): void {
    if (!this.factura) return;

    if (this.modoEdicion) {
      this.error = 'Guarda o cancela la edición antes de emitir la factura';
      return;
    }

    this.loading = true;
    this.error = null;

    this.factService.emitirFactura(this.factura.id).subscribe({
      next: (factEmitida) => {
        this.factura = factEmitida;
        this.loading = false;
        this.modoEdicion = false;
        this.facturaEdit = null;
        this.cargarPendientes();
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error emitiendo factura';
      },
    });
  }

  resetVistaFactura(): void {
    this.factura = null;
    this.modoEdicion = false;
    this.facturaEdit = null;
  }

  verFactura(f: FacturaV2Response): void {
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

    this.factService.getFacturaById(id).subscribe({
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

  emitirDesdeListado(f: FacturaV2Response): void {
    if (!f?.id) return;

    this.loading = true;
    this.error = null;

    this.factService.emitirFactura(f.id).subscribe({
      next: (emitida) => {
        if (this.factura?.id === f.id) {
          this.factura = emitida;
          this.modoEdicion = false;
          this.facturaEdit = null;
        }
        this.loading = false;
        this.cargarPendientes();
        this.cargarFacturasCliente();
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

    const emp = String(this.factura?.empresa || '').toUpperCase();
    if (emp === 'ARGASA' || emp === 'ELECTROLUGA') {
      localStorage.setItem('empresa_activa', emp);
      localStorage.setItem('empresa', emp);
    }

    const url = `${window.location.origin}/imprimir/factura/${this.factura.id}`;
    window.open(url, '_blank', 'noopener');
  }

  private round2(v: number): number {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  private toInputDate(value: any): string {
    if (!value) return '';
    return String(value).slice(0, 10);
  }
}
