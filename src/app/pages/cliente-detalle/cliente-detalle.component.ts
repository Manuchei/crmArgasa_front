import { ProductoServiceService } from './../../services/producto-service.service';
import { ClienteProductoService } from '../../services/cliente-producto.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturarV2Component } from '../../components/facturar-v2/facturar-v2.component';
import { IProducto } from '../../interfaces/iproducto';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FacturarV2Component],
  templateUrl: './cliente-detalle.component.html',
  styleUrls: ['./cliente-detalle.component.css'],
})
export class ClienteDetalleComponent implements OnInit {
  cliente: any = null;
  trabajos: any[] = [];
  albaranes: any[] = [];
  pagos: any[] = [];
  productos: IProducto[] = [];
  clienteProductos: any[] = [];

  clienteId!: number;

  pestanaActiva:
    | 'datos'
    | 'albaranes'
    | 'facturacion'
    | 'pagos'
    | 'productos-trabajos' = 'datos';

  qtyMap: Record<number, number> = {};
  dtoMap: Record<number, number> = {};
  pagadoMap: Record<number, number> = {};

  nuevoTrabajo = {
    descripcion: '',
    unidades: 1,
    precioUnitario: 0,
    descuento: 0,
    importePagado: 0,
    pagado: false,
  };

  nuevoPago = {
    fecha: '',
    importe: 0,
    metodo: '',
    numeroTalonario: '',
    observaciones: '',
  };

  creandoPago = false;
  creandoAlbaran = false;

  private apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cpService: ClienteProductoService,
    private productosService: ProductoServiceService,
  ) {}

  ngOnInit(): void {
    this.clienteId = Number(this.route.snapshot.paramMap.get('id'));

    this.nuevoPago.fecha = this.hoyISO();

    this.cargarCliente();
    this.cargarProductos();
    this.cargarTrabajos();
    this.cargarPagos();
  }

  private static safeTrim(value: any): string {
    return String(value ?? '').trim();
  }

  private static toNumber(value: any): number {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private static isValidISODate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  private hoyISO(): string {
    return new Date().toISOString().substring(0, 10);
  }

  private getEmpresa(): string {
    return localStorage.getItem('empresa') || 'ARGASA';
  }

  private getEmpresaHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Empresa': this.getEmpresa(),
    });
  }

  private logHttpError(contexto: string, err: unknown): void {
    if (err instanceof HttpErrorResponse) {
      console.error(`Error al ${contexto}:`, {
        status: err.status,
        statusText: err.statusText,
        message: err.message,
        error: err.error,
        url: err.url,
      });
      return;
    }

    console.error(`Error al ${contexto}:`, err);
  }

  cambiarPestana(pestana: typeof this.pestanaActiva): void {
    this.pestanaActiva = pestana;

    if (pestana === 'productos-trabajos') {
      this.cargarProductos();
    }
  }

  cargarCliente(): void {
    if (!this.clienteId) return;

    this.http
      .get<any>(`${this.apiUrl}/clientes/${this.clienteId}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (data) => {
          this.cliente = data;
          this.calcularTotales();
        },
        error: (err: any) => {
          this.logHttpError('cargar cliente', err);
          alert('No se pudo cargar el cliente.');
        },
      });
  }

  cargarPagos(): void {
    if (!this.clienteId) return;

    this.http
      .get<any[]>(`${this.apiUrl}/pagos/cliente/${this.clienteId}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (data: any[]) => {
          this.pagos = Array.isArray(data) ? data : [];
          this.calcularTotales();
        },
        error: (err: any) => {
          this.logHttpError('cargar pagos', err);
          this.pagos = [];
          this.calcularTotales();
        },
      });
  }

  cargarProductos(): void {
    this.productosService.getProductos().subscribe({
      next: (data) => {
        this.productos = Array.isArray(data) ? data : [];
      },
      error: (err) => {
        this.logHttpError('cargar productos', err);
        this.productos = [];
      },
    });
  }

  calcularTotales(): void {
    if (!this.cliente) return;

    const totalTrabajos = this.trabajos.reduce(
      (acc, t) => acc + this.getNetoTrabajo(t),
      0,
    );

    const totalPagadoTrabajos = this.trabajos.reduce(
      (acc, t) => acc + ClienteDetalleComponent.toNumber(t?.importePagado),
      0,
    );

    const totalPagos = this.pagos.reduce(
      (acc, p) => acc + ClienteDetalleComponent.toNumber(p?.importe),
      0,
    );

    const totalPagado = totalPagadoTrabajos + totalPagos;

    this.cliente.totalImporte = totalTrabajos;
    this.cliente.totalPagado = totalPagado;
    this.cliente.saldoPendiente = Math.max(totalTrabajos - totalPagado, 0);
  }

  getQty(id: number): number {
    return this.qtyMap[id] ?? 1;
  }

  setQty(id: number, value: any, max?: number): void {
    let n = ClienteDetalleComponent.toNumber(value);

    if (n < 1) n = 1;

    if (max !== undefined && max !== null && n > max) {
      n = max;
    }

    this.qtyMap[id] = n;
  }

  getDto(id: number): number {
    return this.dtoMap[id] ?? 0;
  }

  setDto(id: number, value: any): void {
    let n = ClienteDetalleComponent.toNumber(value);

    if (n < 0) n = 0;
    if (n > 100) n = 100;

    this.dtoMap[id] = n;
  }

  getPagado(id: number): number {
    return this.pagadoMap[id] ?? 0;
  }

  setPagado(id: number, value: any): void {
    let n = ClienteDetalleComponent.toNumber(value);

    if (n < 0) n = 0;

    this.pagadoMap[id] = n;
  }

  getNetoTrabajo(t: any): number {
    const unidades = ClienteDetalleComponent.toNumber(t?.unidades || 1);
    const precio = ClienteDetalleComponent.toNumber(t?.precioUnitario);
    const dto = ClienteDetalleComponent.toNumber(t?.descuento);

    const bruto = unidades * precio;
    return bruto - bruto * (dto / 100);
  }

  getNetoNuevoTrabajo(): number {
    return this.getNetoTrabajo(this.nuevoTrabajo);
  }

  onNuevoTrabajoChange(): void {
    const neto = this.getNetoNuevoTrabajo();

    if (this.nuevoTrabajo.importePagado > neto) {
      this.nuevoTrabajo.importePagado = neto;
    }
  }

  addProducto(p: IProducto): void {
    if (!this.cliente?.id || !p?.id) return;

    const cantidad = this.getQty(p.id);
    const descuento = this.getDto(p.id);
    const importePagado = this.getPagado(p.id);

    if (cantidad <= 0) {
      alert('La cantidad debe ser mayor que 0.');
      return;
    }

    if ((p.unidades || 0) <= 0) {
      alert('No hay unidades disponibles.');
      return;
    }

    if (cantidad > (p.unidades || 0)) {
      alert('No puedes añadir más unidades de las disponibles.');
      return;
    }

    this.cpService
      .addProducto(
        this.cliente.id,
        p.id!,
        cantidad,
        descuento,
        importePagado,
        this.getEmpresa(),
      )
      .subscribe({
        next: (trabajoCreado: any) => {
          this.qtyMap[p.id!] = 1;
          this.dtoMap[p.id!] = 0;
          this.pagadoMap[p.id!] = 0;

          this.trabajos.push({
            id: trabajoCreado.id,
            productoId: trabajoCreado.productoId,
            descripcion: trabajoCreado.descripcion || p.descripcion,
            unidades: trabajoCreado.unidades || cantidad,
            precioUnitario: trabajoCreado.precioUnitario || p.precioSinIva || 0,
            descuento: trabajoCreado.descuento || descuento,
            importe: trabajoCreado.importe || 0,
            importePagado: trabajoCreado.importePagado || importePagado,
            entregado: trabajoCreado.entregado || false,
          });

          this.cargarProductos();
          this.calcularTotales();
        },
        error: (err: any) => {
          this.logHttpError('añadir producto al cliente', err);
          alert('No se pudo añadir el producto.');
        },
      });
  }
  agregarTrabajo(): void {
    if (!this.cliente?.id) return;

    const descripcion = ClienteDetalleComponent.safeTrim(
      this.nuevoTrabajo.descripcion,
    );

    const unidades = ClienteDetalleComponent.toNumber(
      this.nuevoTrabajo.unidades,
    );

    const precioUnitario = ClienteDetalleComponent.toNumber(
      this.nuevoTrabajo.precioUnitario,
    );

    const descuento = ClienteDetalleComponent.toNumber(
      this.nuevoTrabajo.descuento,
    );

    const importePagado = ClienteDetalleComponent.toNumber(
      this.nuevoTrabajo.importePagado,
    );

    if (!descripcion) {
      alert('Debes indicar una descripción.');
      return;
    }

    if (unidades <= 0) {
      alert('Las unidades deben ser mayores que 0.');
      return;
    }

    if (precioUnitario < 0) {
      alert('El precio no puede ser negativo.');
      return;
    }

    const payload = {
      descripcion,
      unidades,
      precioUnitario,
      descuento,
      importePagado,
      pagado: importePagado >= this.getNetoNuevoTrabajo(),
    };

    this.http
      .post<any>(
        `${this.apiUrl}/trabajos/cliente/${this.cliente.id}`,
        payload,
        {
          headers: this.getEmpresaHeaders(),
        },
      )
      .subscribe({
        next: () => {
          this.nuevoTrabajo = {
            descripcion: '',
            unidades: 1,
            precioUnitario: 0,
            descuento: 0,
            importePagado: 0,
            pagado: false,
          };

          this.cargarCliente();
        },
        error: (err) => {
          this.logHttpError('añadir trabajo', err);
          alert('No se pudo añadir el trabajo.');
        },
      });
  }

  agregarPago(): void {
    if (!this.cliente?.id) {
      return;
    }

    const fecha = ClienteDetalleComponent.safeTrim(this.nuevoPago.fecha);
    const importe = ClienteDetalleComponent.toNumber(this.nuevoPago.importe);
    const metodo = ClienteDetalleComponent.safeTrim(this.nuevoPago.metodo);

    const numeroTalonario =
      metodo === 'GIRO'
        ? ClienteDetalleComponent.safeTrim(this.nuevoPago.numeroTalonario)
        : '';

    const observaciones = ClienteDetalleComponent.safeTrim(
      this.nuevoPago.observaciones,
    );

    if (!ClienteDetalleComponent.isValidISODate(fecha)) {
      alert('Fecha inválida.');
      return;
    }

    if (importe <= 0) {
      alert('El importe del pago debe ser mayor que 0.');
      return;
    }

    if (!metodo) {
      alert('Debes indicar el método de pago.');
      return;
    }

    this.creandoPago = true;

    const payload = {
      fecha,
      importe,
      metodo,
      numeroTalonario,
      observaciones,
    };

    this.http
      .post<any>(`${this.apiUrl}/pagos/cliente/${this.cliente.id}`, payload, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (pagoCreado) => {
          this.creandoPago = false;

          if (pagoCreado) {
            this.pagos = [...(this.pagos ?? []), pagoCreado].sort((a, b) => {
              const fa = String(a?.fecha ?? '');
              const fb = String(b?.fecha ?? '');

              if (fa < fb) return -1;
              if (fa > fb) return 1;

              return (
                ClienteDetalleComponent.toNumber(a?.id) -
                ClienteDetalleComponent.toNumber(b?.id)
              );
            });
          }

          this.calcularTotales();

          this.nuevoPago = {
            fecha: this.hoyISO(),
            importe: 0,
            metodo: '',
            numeroTalonario: '',
            observaciones: '',
          };

          if (pagoCreado?.id) {
            this.imprimirComprobantePago(pagoCreado);
          }
        },
        error: (err) => {
          this.creandoPago = false;
          this.logHttpError('registrar pago', err);
          alert('No se pudo registrar el pago.');
        },
      });
  }

  eliminarPago(id: number): void {
    if (!id) return;

    if (!confirm('¿Eliminar este pago?')) return;

    this.http
      .delete<void>(`${this.apiUrl}/pagos/${id}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: () => {
          this.pagos = this.pagos.filter((p) => p.id !== id);
          this.calcularTotales();
        },
        error: (err) => {
          this.logHttpError('eliminar pago', err);
          alert('No se pudo eliminar el pago.');
        },
      });
  }

  imprimirComprobantePago(pago: any): void {
    if (!pago?.id) return;

    window.open(`/imprimir/pago/${pago.id}`, '_blank');
  }

  restarUnidadTrabajo(t: any): void {
    if (!t?.id || t.entregado) return;

    if ((t.unidades || 1) <= 1) return;

    this.actualizarUnidadesTrabajo(t, (t.unidades || 1) - 1);
  }

  sumarUnidadTrabajo(t: any): void {
    if (!t?.id || t.entregado) return;

    this.actualizarUnidadesTrabajo(t, (t.unidades || 1) + 1);
  }

  private actualizarUnidadesTrabajo(t: any, unidades: number): void {
    if (!this.cliente?.id || !t?.productoId) {
      alert('No se pudieron actualizar las unidades.');
      return;
    }

    this.http
      .put<any>(
        `${this.apiUrl}/clientes/${this.cliente.id}/productos/${t.productoId}/cantidad?cantidad=${unidades}`,
        {},
        {
          headers: this.getEmpresaHeaders(),
        },
      )
      .subscribe({
        next: (trabajoActualizado: any) => {
          t.unidades = trabajoActualizado.unidades || unidades;

          t.precioUnitario =
            trabajoActualizado.precioUnitario || t.precioUnitario || 0;

          t.descuento = trabajoActualizado.descuento || t.descuento || 0;

          t.importe = trabajoActualizado.importe || t.importe || 0;

          t.importePagado =
            trabajoActualizado.importePagado || t.importePagado || 0;

          t.entregado = trabajoActualizado.entregado || false;

          this.cargarProductos();
          this.calcularTotales();
        },

        error: (err: any) => {
          this.logHttpError('actualizar unidades del trabajo', err);

          alert('No se pudieron actualizar las unidades.');
        },
      });
  }

  eliminarTrabajo(t: any): void {
    if (!t?.id || t.entregado) return;

    if (!confirm('¿Eliminar este trabajo/producto?')) return;

    this.http
      .delete<void>(`${this.apiUrl}/trabajos/${t.id}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: () => {
          this.trabajos = this.trabajos.filter((x) => x.id !== t.id);
          this.calcularTotales();
          this.cargarProductos();
        },
        error: (err) => {
          this.logHttpError('eliminar trabajo', err);
          alert('No se pudo eliminar el trabajo.');
        },
      });
  }

  crearAlbaran(): void {
    if (!this.cliente?.id) return;

    this.creandoAlbaran = true;

    this.http
      .post<any>(
        `${this.apiUrl}/albaranes/cliente/${this.cliente.id}`,
        {},
        {
          headers: this.getEmpresaHeaders(),
        },
      )
      .subscribe({
        next: (albaran) => {
          this.creandoAlbaran = false;

          if (albaran) {
            this.albaranes = [...this.albaranes, albaran];
          }

          this.cambiarPestana('albaranes');
        },
        error: (err) => {
          this.creandoAlbaran = false;
          this.logHttpError('crear albarán', err);
          alert('No se pudo crear el albarán.');
        },
      });
  }

  verAlbaran(a: any): void {
    if (!a?.id) return;

    this.router.navigate(['/albaranes', a.id]);
  }

  imprimirAlbaran(a: any): void {
    if (!a?.id) return;

    const url = `${this.apiUrl}/albaranes/${a.id}/pdf`;

    this.http
      .get(url, {
        headers: this.getEmpresaHeaders(),
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const fileURL = URL.createObjectURL(blob);
          window.open(fileURL, '_blank');
        },
        error: (err) => {
          this.logHttpError('imprimir albarán', err);
          alert('No se pudo imprimir el albarán.');
        },
      });
  }

  eliminarAlbaran(a: any): void {
    if (!a?.id) return;

    if (!confirm('¿Eliminar este albarán?')) return;

    this.http
      .delete<void>(`${this.apiUrl}/albaranes/${a.id}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: () => {
          this.albaranes = this.albaranes.filter((x) => x.id !== a.id);
        },
        error: (err) => {
          this.logHttpError('eliminar albarán', err);
          alert('No se pudo eliminar el albarán.');
        },
      });
  }

  volverAClientes(): void {
    this.router.navigate(['/clientes']);
  }

  cargarTrabajos(): void {
    if (!this.clienteId) return;

    this.http
      .get<any[]>(`${this.apiUrl}/trabajos/cliente/${this.clienteId}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (data: any[]) => {
          this.trabajos = (data || []).map((t: any) => ({
            id: t.id,
            productoId: t.productoId,
            descripcion: t.nombre || t.descripcion || '-',
            unidades: t.cantidad || t.unidades || 1,
            precioUnitario: t.precioUnitario || 0,
            descuento: t.descuento || 0,
            importe: t.importe || 0,
            importePagado: t.pagado || t.importePagado || 0,
            entregado: t.entregado || false,
          }));

          this.calcularTotales();
        },
        error: (err: any) => {
          this.logHttpError('cargar trabajos del cliente', err);
          this.trabajos = [];
          this.calcularTotales();
        },
      });
  }

  formatearIbanVisual(iban?: string): string {
    return (iban || '').match(/.{1,4}/g)?.join(' ') || '';
  }
}
