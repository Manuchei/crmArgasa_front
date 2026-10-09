import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { FacturacionV2Service } from '../../services/facturacion-v2.service';
import { ClientesService } from '../../services/cliente.service';
import { ICliente } from '../../interfaces/icliente';
import { EMPRESAS } from '../../shared/config/empresa-config';
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

  serie = 'A';
  loading = false;
  preparandoFacturaDirecta = false;
  error: string | null = null;

  factura: FacturaV2Response | null = null;
  clienteFactura: ICliente | null = null;
  facturasCliente: FacturaV2Response[] = [];

  modoEdicion = false;
  facturaEdit: any = null;

  constructor(
    private factService: FacturacionV2Service,
    private clientesService: ClientesService,
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.resetEstadoVista();
      this.cargarPendientes();
      this.cargarFacturasCliente();
      this.cargarClienteFactura();
    }
  }

  get empresaVisual() {
    return String(this.factura?.empresa || '').toUpperCase() === 'ELECTROLUGA'
      ? EMPRESAS.electroluga
      : EMPRESAS.argasa;
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

  private cargarClienteFactura(): void {
    this.clientesService.getCliente(this.clienteId).subscribe({
      next: (cliente) => {
        this.clienteFactura = cliente;
      },
      error: () => {
        this.clienteFactura = null;
      },
    });
  }

  limpiarSeleccion(): void {
    this.selectedServicios.clear();
    this.selectedLineas.clear();
  }

  onSerieChange(): void {
    if (this.loading || this.preparandoFacturaDirecta) return;

    this.resetVistaFactura();
    this.cargarPendientes();
    this.cargarFacturasCliente();
  }

  private resetEstadoVista(): void {
    this.pendientes = null;
    this.factura = null;
    this.clienteFactura = null;
    this.facturasCliente = [];
    this.error = null;
    this.loading = false;
    this.modoEdicion = false;
    this.facturaEdit = null;
    this.limpiarSeleccion();
  }

  onServicioChange(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedServicios.add(id);
    } else {
      this.selectedServicios.delete(id);
    }
  }

  onLineaChange(id: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (checked) {
      this.selectedLineas.add(id);
    } else {
      this.selectedLineas.delete(id);
    }
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
        this.error = this.mensajeError(err, 'Error cargando pendientes');
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
    if (this.loading || this.preparandoFacturaDirecta) return;

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
        this.error = this.mensajeError(err, 'Error creando factura borrador');
      },
    });
  }

  iniciarEdicion(): void {
    if (!this.factura || this.loading || this.preparandoFacturaDirecta) {
      return;
    }

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
        descuentoPct: Number(l.descuentoPct ?? 0),
        ivaPct: l.ivaPct,
        subtotal: l.subtotal,
        totalLinea: l.totalLinea,
        tipoOrigen: l.tipoOrigen,
        origenId: l.origenId,
      })),
    };

    this.recalcularVistaEdicion();
  }

  cancelarEdicion(): void {
    if (this.loading || this.preparandoFacturaDirecta) return;

    this.modoEdicion = false;
    this.facturaEdit = null;
    this.error = null;
  }

  guardarEdicion(): void {
    if (
      !this.factura?.id ||
      !this.facturaEdit ||
      this.loading ||
      this.preparandoFacturaDirecta
    ) {
      return;
    }

    if (this.factura.estado !== 'BORRADOR') {
      this.error = 'Solo se puede modificar una factura en borrador';
      return;
    }

    const lineas = this.facturaEdit.lineas ?? [];

    if (!lineas.length) {
      this.error = 'La factura debe tener al menos una línea';
      return;
    }

    if (!this.facturaEdit.fechaEmision) {
      this.error = 'Debes indicar la fecha de la factura';
      return;
    }

    for (const l of lineas) {
      if (!String(l.descripcion ?? '').trim()) {
        this.error = 'La descripción no puede estar vacía';
        return;
      }

      const cantidad = Number(l.cantidad);
      const precio = Number(l.precioUnitario);
      const descuento = Number(l.descuentoPct);
      const iva = Number(l.ivaPct);

      if (!Number.isFinite(cantidad) || cantidad <= 0) {
        this.error = 'La cantidad debe ser un número mayor que 0';
        return;
      }

      if (!Number.isFinite(precio) || precio < 0) {
        this.error = 'El precio unitario debe ser un número no negativo';
        return;
      }

      if (!Number.isFinite(descuento) || descuento < 0 || descuento > 100) {
        this.error = 'El descuento debe estar entre 0 y 100';
        return;
      }

      if (!Number.isFinite(iva) || iva < 0) {
        this.error = 'El IVA debe ser un número no negativo';
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
        descuentoPct: Number(l.descuentoPct),
        ivaPct: Number(l.ivaPct),
      })),
    };

    this.loading = true;
    this.error = null;

    this.factService.actualizarFactura(this.factura.id, payload).subscribe({
      next: (actualizada) => {
        this.factura = actualizada;
        this.modoEdicion = false;
        this.facturaEdit = null;
        this.loading = false;
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error = this.mensajeError(
          err,
          'Error guardando cambios en la factura',
        );
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
      const descuentoPct = Math.max(
        0,
        Math.min(100, Number(l.descuentoPct) || 0),
      );
      const ivaPct = Number(l.ivaPct) || 0;

      const bruto = cantidad * precioUnitario;
      const descuento = bruto * (descuentoPct / 100);
      const subtotal = this.round2(bruto - descuento);
      const totalLinea = subtotal + subtotal * (ivaPct / 100);

      l.descuentoPct = descuentoPct;
      l.subtotal = subtotal;
      l.totalLinea = this.round2(totalLinea);
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
    const lineas = this.facturaEdit?.lineas ?? [];

    return this.round2(
      lineas.reduce(
        (acc: number, l: any) => acc + (Number(l.totalLinea) || 0),
        0,
      ),
    );
  }

  eliminarFacturaActual(): void {
    if (!this.factura?.id || this.loading || this.preparandoFacturaDirecta) {
      return;
    }

    this.eliminarFactura(this.factura);
  }

  eliminarFactura(f: FacturaV2Response): void {
    if (!f?.id || this.loading || this.preparandoFacturaDirecta) {
      return;
    }

    if (f.estado !== 'BORRADOR') {
      this.error = 'Solo se puede eliminar una factura en borrador';
      return;
    }

    if (
      !confirm(
        `¿Seguro que deseas eliminar la factura ${this.getNumeroFacturaCliente(f)}?`,
      )
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
        this.error = this.mensajeError(err, 'Error eliminando factura');
      },
    });
  }

  confirmarEmision(): void {
    if (
      !this.factura ||
      this.factura.estado !== 'BORRADOR' ||
      this.loading ||
      this.preparandoFacturaDirecta
    ) {
      return;
    }

    if (this.modoEdicion) {
      this.error = 'Guarda o cancela la edición antes de emitir';
      return;
    }

    if (confirm(this.mensajeConfirmacionEmision(this.factura))) {
      this.emitir();
    }
  }

  emitir(): void {
    if (
      !this.factura?.id ||
      this.factura.estado !== 'BORRADOR' ||
      this.loading ||
      this.preparandoFacturaDirecta
    ) {
      return;
    }

    if (this.modoEdicion) {
      this.error = 'Guarda o cancela la edición antes de emitir';
      return;
    }

    this.ejecutarEmision(this.factura);
  }

  emitirDesdeListado(f: FacturaV2Response): void {
    if (
      !f?.id ||
      f.estado !== 'BORRADOR' ||
      this.loading ||
      this.preparandoFacturaDirecta
    ) {
      return;
    }

    if (this.modoEdicion) {
      this.error = 'Guarda o cancela la edición antes de emitir';
      return;
    }

    if (confirm(this.mensajeConfirmacionEmision(f))) {
      this.ejecutarEmision(f);
    }
  }

  private mensajeConfirmacionEmision(f: FacturaV2Response): string {
    return this.usaFacturaDirecta(f)
      ? '¿Emitir esta factura en FacturaDirecta, en el entorno de PRUEBAS?'
      : `¿Confirmar y emitir la factura ${this.getNumeroFacturaCliente(f)}?`;
  }

  usaFacturaDirecta(f: FacturaV2Response): boolean {
    const empresa = String(f.empresa ?? '')
      .trim()
      .toUpperCase();
    return empresa === 'ARGASA' || empresa === 'ELECTROLUGA';
  }

  private ejecutarEmision(f: FacturaV2Response): void {
    const usaIntegracion = this.usaFacturaDirecta(f);

    this.loading = true;
    this.error = null;

    const peticion = usaIntegracion
      ? this.factService.emitirFacturaDirecta(f.id)
      : this.factService.emitirFactura(f.id);

    peticion.subscribe({
      next: (emitida) => {
        if (this.factura?.id === f.id) {
          this.factura = emitida;
          this.modoEdicion = false;
          this.facturaEdit = null;
        }

        this.loading = false;
        this.cargarPendientes();
        this.cargarFacturasCliente();

        if (usaIntegracion) {
          alert(
            'Emisión de prueba completada en FacturaDirecta. ' +
              'La aceptación de la AEAT se actualizará mediante el webhook.',
          );
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = this.mensajeError(
          err,
          usaIntegracion
            ? 'No se pudo confirmar la emisión en FacturaDirecta. Comprueba el backend y el estado remoto antes de repetir.'
            : 'No se pudo emitir la factura',
        );
      },
    });
  }

  resetVistaFactura(): void {
    if (this.loading || this.preparandoFacturaDirecta) return;

    this.factura = null;
    this.modoEdicion = false;
    this.facturaEdit = null;
    this.error = null;
  }

  verFactura(f: FacturaV2Response): void {
    if (!f?.id || this.loading || this.preparandoFacturaDirecta) {
      return;
    }

    this.error = null;
    this.modoEdicion = false;
    this.facturaEdit = null;

    if (f.lineas?.length) {
      this.factura = f;
      return;
    }

    this.abrirFacturaDetalle(f.id);
  }

  editarFacturaDesdeListado(f: FacturaV2Response): void {
    if (this.loading || this.preparandoFacturaDirecta) return;

    if (!f?.id || f.estado !== 'BORRADOR') {
      this.error = 'Solo se puede modificar una factura en borrador';
      return;
    }

    this.loading = true;
    this.error = null;
    this.modoEdicion = false;
    this.facturaEdit = null;

    this.factService.getFacturaById(f.id).subscribe({
      next: (completa) => {
        this.factura = completa;
        this.loading = false;
        this.iniciarEdicion();

        setTimeout(() => {
          document
            .getElementById('factura-print')
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = this.mensajeError(
          err,
          'No se pudo cargar la factura para editar',
        );
      },
    });
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
        this.error = this.mensajeError(
          err,
          'No se pudo cargar el detalle de la factura',
        );
      },
    });
  }

  imprimir(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    if (!this.factura?.id || this.loading || this.preparandoFacturaDirecta) {
      return;
    }

    const emp = String(this.factura.empresa || '').toUpperCase();

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

  getNumeroFacturaCliente(factura: any): string {
    if (!factura) return '';

    const numero = factura.numero ?? factura.id;
    const fecha = factura.fechaEmision
      ? new Date(factura.fechaEmision)
      : new Date();

    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();

    return `FC-${numero}-${mes}-${anio}`;
  }

  marcarComoPagada(): void {
    if (!this.factura?.id || this.loading || this.preparandoFacturaDirecta) {
      return;
    }

    if (this.factura.estado !== 'EMITIDA') {
      this.error = 'Solo se puede marcar como pagada una factura emitida';
      return;
    }

    this.loading = true;
    this.error = null;

    this.factService.marcarComoPagada(this.factura.id).subscribe({
      next: (pagada) => {
        this.factura = pagada;
        this.loading = false;
        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.loading = false;
        this.error = this.mensajeError(
          err,
          'Error marcando factura como pagada',
        );
      },
    });
  }

  prepararFacturaDirecta(): void {
    if (!this.factura?.id || this.loading || this.preparandoFacturaDirecta) {
      return;
    }

    if (this.factura.estado !== 'BORRADOR') {
      this.error = 'La factura debe estar en borrador';
      return;
    }

    if (!this.usaFacturaDirecta(this.factura)) {
      this.error = 'FacturaDirecta no está habilitado para esta empresa';
      return;
    }

    if (this.modoEdicion) {
      this.error = 'Guarda o cancela la edición antes de continuar';
      return;
    }

    const facturaId = this.factura.id;

    this.preparandoFacturaDirecta = true;
    this.error = null;

    this.factService.prepararBorradorFacturaDirecta(facturaId).subscribe({
      next: (respuesta) => {
        this.preparandoFacturaDirecta = false;

        const id = respuesta?.content?.uuid;
        const borrador = respuesta?.content?.main?.draft;

        alert(
          `FacturaDirecta: ${id ?? 'ID no recibido'}\nBorrador: ${borrador}`,
        );

        this.cargarFacturasCliente();
      },
      error: (err) => {
        this.preparandoFacturaDirecta = false;
        this.error = this.mensajeError(
          err,
          'No se pudo confirmar el borrador. Revisa la consola del backend.',
        );
      },
    });
  }

  private mensajeError(err: any, defecto: string): string {
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (typeof err?.error?.message === 'string' && err.error.message.trim()) {
      return err.error.message;
    }

    return defecto;
  }
  esFacturaDePrueba(f: FacturaV2Response): boolean {
    return f.facturaDirectaCompanyId?.startsWith('com_sandbox_') === true;
  }

  getEstadoVerifactu(f: FacturaV2Response): string {
    switch (f.verifactuEstado) {
      case 'CREACION_EN_CURSO':
        return 'Preparación pendiente de confirmar';

      case 'BORRADOR_REMOTO':
        return 'Borrador preparado en FacturaDirecta';

      case 'EMISION_EN_CURSO':
        return 'Emisión pendiente de confirmar';

      case 'PENDIENTE_CONFIRMACION_AEAT':
        return 'Emitida · aceptación AEAT pendiente de sincronizar';

      case 'ACEPTADA_AEAT':
        return 'Aceptada por la AEAT';

      case 'ACEPTADA_AEAT_CON_ERRORES':
        return 'Aceptada por la AEAT con errores · revisar en FacturaDirecta';

      case 'RECHAZADA_AEAT':
        return 'Rechazada por la AEAT · revisar en FacturaDirecta';

      default:
        return f.verifactuEstado || 'Sin estado disponible';
    }
  }
}
