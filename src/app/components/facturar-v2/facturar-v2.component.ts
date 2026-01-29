import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FacturacionV2Service } from '../../services/facturacion-v2.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  PendientesFacturacionDTO,
  FacturaV2Response
} from '../../interfaces/facturacion-v2';

@Component({
  selector: 'app-facturar-v2',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './facturar-v2.component.html',
  styleUrls: ['./facturar-v2.component.css']
})
export class FacturarV2Component implements OnInit, OnChanges {

  @Input() clienteId!: number;

  pendientes: PendientesFacturacionDTO | null = null;

  selectedServicios = new Set<number>();
  selectedLineas = new Set<number>();

  serie: string = 'A';
  loading = false;
  error: string | null = null;

  // factura en vista (cuando creas/abres)
  factura: FacturaV2Response | null = null;

  // listado de facturas del cliente
  facturasCliente: FacturaV2Response[] = [];

  constructor(private factService: FacturacionV2Service) {}

  ngOnInit(): void {
    // ⚠️ No cargues aquí porque a veces clienteId aún no está listo
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.resetEstadoVista();
      this.cargarPendientes();
      this.cargarFacturasCliente();
    }
  }

  // ---------- UI helpers ----------
  get haySeleccion(): boolean {
    return this.selectedServicios.size > 0 || this.selectedLineas.size > 0;
  }

  limpiarSeleccion(): void {
    this.selectedServicios.clear();
    this.selectedLineas.clear();
  }

  private resetEstadoVista(): void {
    this.pendientes = null;
    this.factura = null;
    this.facturasCliente = [];
    this.error = null;
    this.loading = false;
    this.limpiarSeleccion();
  }

  // ---------- checkbox handlers ----------
  onServicioChange(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    checked ? this.selectedServicios.add(id) : this.selectedServicios.delete(id);
  }

  onLineaChange(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    checked ? this.selectedLineas.add(id) : this.selectedLineas.delete(id);
  }

  // ---------- data loading ----------
  cargarPendientes(): void {
    if (!this.clienteId) return;

    this.loading = true;
    this.error = null;

    this.factService.getPendientes(this.clienteId).subscribe({
      next: (data) => {
        this.pendientes = data ?? null;
        this.limpiarSeleccion(); // siempre limpia selección al refrescar
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error cargando pendientes';
      }
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
        // no bloqueamos UI por esto
      }
    });
  }

  // ---------- actions ----------
  crearBorrador(): void {
    if (!this.haySeleccion) {
      this.error = 'Debes seleccionar al menos un servicio o una línea de albarán';
      return;
    }

    const req: any = {
      clienteId: this.clienteId,
      serie: this.serie,
      // ✅ nombres tal cual dijiste que espera tu backend
      servicioId: Array.from(this.selectedServicios),
      lineasAlbaranIds: Array.from(this.selectedLineas)
    };

    this.loading = true;
    this.error = null;

    this.factService.crearFactura(req).subscribe({
      next: (fact) => {
        this.factura = fact;
        this.loading = false;

        this.cargarPendientes();
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error creando factura borrador';
      }
    });
  }

  cancelarBorrador(): void {
    if (!this.factura) return;

    this.loading = true;
    this.error = null;

    this.factService.cancelarBorrador(this.factura.id).subscribe({
      next: () => {
        this.factura = null;
        this.loading = false;

        this.cargarPendientes();
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error cancelando borrador';
      }
    });
  }

  emitir(): void {
    if (!this.factura) return;

    this.loading = true;
    this.error = null;

    this.factService.emitirFactura(this.factura.id).subscribe({
      next: (factEmitida) => {
        this.factura = factEmitida;
        this.loading = false;

        this.cargarPendientes();
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'Error emitiendo factura';
      }
    });
  }



  resetVistaFactura(): void {
    this.factura = null;
  }

  abrirFactura(id: number): void {
  this.loading = true;
  this.error = null;

  this.factService.getFacturaById(id).subscribe({
    next: (full) => {
      this.factura = full;
      this.loading = false;
    },
    error: (err) => {
      this.loading = false;
      this.error = err?.error?.message ?? 'Error cargando detalle de factura';
    }
  });
}

// ✅ cambia verFactura para que cargue detalle real
verFactura(f: FacturaV2Response): void {
  if (!f?.id) return;

  this.loading = true;
  this.error = null;

  this.factService.getFacturaById(f.id).subscribe({
    next: (full) => {
      this.factura = full;   // ✅ viene con lineas
      this.loading = false;
    },
    error: (err) => {
      this.loading = false;
      this.error = err?.error?.message ?? 'No se pudo cargar el detalle de la factura';
    }
  });
}


// ✅ emitir directamente una factura del listado
emitirDesdeListado(f: FacturaV2Response): void {
  if (!f?.id) return;

  this.loading = true;
  this.error = null;

  this.factService.emitirFactura(f.id).subscribe({
    next: (emitida) => {
      // si justo estabas viendo esa factura, actualiza vista
      if (this.factura?.id === f.id) {
        this.factura = emitida;
      }
      this.loading = false;
      this.cargarPendientes();
      this.cargarFacturasCliente();
    },
    error: (err) => {
      this.loading = false;
      this.error = err?.error?.message ?? 'Error emitiendo factura';
    }
  });
}

}
