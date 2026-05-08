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
    fecha: ClienteDetalleComponent.hoyISO(),
    importe: 0,
    metodo: '',
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
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (isNaN(id) || id <= 0) {
      alert('ID inválido');
      this.router.navigate(['/app/clientes']);
      return;
    }

    this.clienteId = id;

    this.activarPestanaDesdeNavegacion();

    this.cargarCliente(id);
    this.cargarTrabajos(id);
    this.cargarAlbaranes(id);
    this.cargarPagos(id);
    this.cargarClienteProductos(id);
  }

  cambiarPestana(
    pestana:
      | 'datos'
      | 'albaranes'
      | 'facturacion'
      | 'pagos'
      | 'productos-trabajos',
  ): void {
    this.pestanaActiva = pestana;
  }

  private activarPestanaDesdeNavegacion(): void {
    const state = history.state;

    if (state?.volverA === 'albaranes') {
      this.pestanaActiva = 'albaranes';
      return;
    }

    const saved = localStorage.getItem('clienteDetallePestana');

    if (saved === 'albaranes') {
      this.pestanaActiva = 'albaranes';
      localStorage.removeItem('clienteDetallePestana');
    }
  }

  private static hoyISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');

    return `${yyyy}-${mm}-${dd}`;
  }

  private hoyISO(): string {
    return ClienteDetalleComponent.hoyISO();
  }

  private static toNumber(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  private static safeText(v: any): string {
    return v == null ? '' : String(v);
  }

  private static safeTrim(v: any): string {
    return ClienteDetalleComponent.safeText(v).trim();
  }

  private static isValidISODate(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  private clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }

  private getEmpresaActual(): string {
    const empresaCliente = ClienteDetalleComponent.safeTrim(
      this.cliente?.empresa,
    );

    if (empresaCliente) {
      return empresaCliente;
    }

    const empresaLS = ClienteDetalleComponent.safeTrim(
      localStorage.getItem('empresa_activa'),
    );

    return empresaLS || 'ARGASA';
  }

  private getEmpresaHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-Empresa': this.getEmpresaActual(),
    });
  }

  private logHttpError(contexto: string, err: any): void {
    console.error(`Error en ${contexto}:`, err);

    if (err instanceof HttpErrorResponse) {
      console.error(`[${contexto}] status:`, err.status);
      console.error(`[${contexto}] statusText:`, err.statusText);
      console.error(`[${contexto}] message:`, err.message);
      console.error(`[${contexto}] error:`, err.error);
      console.error(`[${contexto}] url:`, err.url);
    }
  }

  getQty(productoId: number): number {
    if (!productoId) {
      return 1;
    }

    const v = Number(this.qtyMap[productoId] ?? 1);

    return isNaN(v) || v <= 0 ? 1 : Math.floor(v);
  }

  setQty(productoId: number, value: any, unidades: any): void {
    if (!productoId) {
      return;
    }

    const maxUnidades = Number(unidades ?? 0);
    const valueNumber = Number(value);
    const qty = isNaN(valueNumber) ? 1 : Math.floor(valueNumber);

    this.qtyMap[productoId] = this.clamp(qty, 1, Math.max(1, maxUnidades || 1));
  }

  getDto(productoId: number): number {
    if (!productoId) {
      return 0;
    }

    const v = Number(this.dtoMap[productoId] ?? 0);

    if (isNaN(v)) {
      return 0;
    }

    return this.clamp(v, 0, 100);
  }

  setDto(productoId: number, value: any): void {
    if (!productoId) {
      return;
    }

    const v = Number(value);

    this.dtoMap[productoId] = isNaN(v) ? 0 : this.clamp(v, 0, 100);
  }

  getPagado(productoId: number): number {
    if (!productoId) {
      return 0;
    }

    const v = Number(this.pagadoMap[productoId] ?? 0);

    if (isNaN(v)) {
      return 0;
    }

    return Math.max(0, v);
  }

  setPagado(productoId: number, value: any): void {
    if (!productoId) {
      return;
    }

    const v = Number(value);

    this.pagadoMap[productoId] = isNaN(v) ? 0 : Math.max(0, v);
  }

  volverAClientes(): void {
    this.router.navigate(['/app/clientes']);
  }

  cargarCliente(id: number): void {
    this.http
      .get(`${this.apiUrl}/clientes/${id}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (data: any) => {
          this.cliente = data;
          this.calcularTotales();
          this.cargarProductos();
        },
        error: (err) => this.logHttpError('cargar cliente', err),
      });
  }

  cargarClienteProductos(clienteId: number): void {
    const empresa = this.getEmpresaActual();

    this.cpService.getProductosCliente(clienteId, empresa).subscribe({
      next: (data: any[]) => {
        this.clienteProductos = (data ?? []).map((x) => ({
          ...x,
          entregado: x?.entregado === true,
        }));
      },
      error: (err) => {
        this.logHttpError('cargar productos del cliente', err);
        this.clienteProductos = [];
      },
    });
  }

  isEntregado(cp: any): boolean {
    return cp?.entregado === true;
  }

  eliminarProductoCliente(cp: any): void {
    if (!cp || this.isEntregado(cp)) {
      alert('No se puede eliminar: el producto ya está entregado.');
      return;
    }

    const productoId = Number(cp.productoId);

    if (!productoId) {
      return;
    }

    if (!confirm('¿Seguro que deseas eliminar este producto del cliente?')) {
      return;
    }

    this.cpService
      .deleteProductoCliente(
        this.clienteId,
        productoId,
        this.getEmpresaActual(),
      )
      .subscribe({
        next: () => {
          this.cargarClienteProductos(this.clienteId);
          this.cargarTrabajos(this.clienteId);
          this.cargarProductos();
          this.cargarCliente(this.clienteId);
        },
        error: (err) => {
          this.logHttpError('eliminar producto del cliente', err);
          alert('No se pudo eliminar el producto del cliente.');
          this.cargarProductos();
        },
      });
  }

  getFechaEntrega(cp: any): string {
    return cp?.fechaEntrega || cp?.fecha_entrega || cp?.fechaEntregaReal || '-';
  }

  cargarProductos(): void {
    this.productosService.list().subscribe({
      next: (res: IProducto[]) => {
        this.productos = res ?? [];

        for (const prod of this.productos) {
          const id = Number(prod.id);

          if (!isNaN(id) && id > 0) {
            if (this.qtyMap[id] == null) {
              this.qtyMap[id] = 1;
            }

            if (this.dtoMap[id] == null) {
              this.dtoMap[id] = 0;
            }

            if (this.pagadoMap[id] == null) {
              this.pagadoMap[id] = 0;
            }
          }
        }
      },
      error: (err) => {
        this.logHttpError('cargar productos', err);
        this.productos = [];
      },
    });
  }

  cargarTrabajos(clienteId: number): void {
    this.http
      .get<any[]>(`${this.apiUrl}/trabajos/cliente/${clienteId}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (data) => {
          this.trabajos = data ?? [];
          this.normalizarTrabajos();
          this.calcularTotales();
        },
        error: (err) => this.logHttpError('cargar trabajos', err),
      });
  }

  private normalizarTrabajos(): void {
    this.trabajos = (this.trabajos ?? []).map((t) => {
      const descripcion =
        t?.descripcion != null && String(t.descripcion).trim().length > 0
          ? t.descripcion
          : (t?.nombre ?? '');

      const unidadesRaw = t?.unidades != null ? t.unidades : t?.cantidad;
      const unidades =
        unidadesRaw != null ? ClienteDetalleComponent.toNumber(unidadesRaw) : 1;

      const precioUnitario =
        t?.precioUnitario != null
          ? ClienteDetalleComponent.toNumber(t.precioUnitario)
          : 0;

      const descuento =
        t?.descuento != null
          ? ClienteDetalleComponent.toNumber(t.descuento)
          : 0;

      const importePagado =
        t?.importePagado != null
          ? ClienteDetalleComponent.toNumber(t.importePagado)
          : t?.pagado != null
            ? ClienteDetalleComponent.toNumber(t.pagado)
            : 0;

      const entregado = t?.entregado === true;
      const fechaEntrega = t?.fechaEntrega ?? t?.fecha_entrega ?? null;

      return {
        ...t,
        descripcion,
        unidades: unidades <= 0 ? 1 : unidades,
        precioUnitario: precioUnitario < 0 ? 0 : precioUnitario,
        descuento: descuento < 0 ? 0 : descuento,
        importePagado: importePagado < 0 ? 0 : importePagado,
        entregado,
        fechaEntrega,
      };
    });
  }

  getBrutoTrabajo(t: any): number {
    const unidades = ClienteDetalleComponent.toNumber(t?.unidades);
    const precio = ClienteDetalleComponent.toNumber(t?.precioUnitario);

    return Math.max(0, unidades) * Math.max(0, precio);
  }

  getNetoTrabajo(t: any): number {
    const bruto = this.getBrutoTrabajo(t);
    const descuento = ClienteDetalleComponent.toNumber(t?.descuento);
    const factor = 1 - descuento / 100;

    return Math.max(0, bruto * (isFinite(factor) ? factor : 1));
  }

  getNetoNuevoTrabajo(): number {
    const unidades = Math.max(
      0,
      ClienteDetalleComponent.toNumber(this.nuevoTrabajo.unidades),
    );

    const precioUnitario = Math.max(
      0,
      ClienteDetalleComponent.toNumber(this.nuevoTrabajo.precioUnitario),
    );

    const descuento = ClienteDetalleComponent.toNumber(
      this.nuevoTrabajo.descuento,
    );
    const dto = Math.min(100, Math.max(0, descuento));
    const bruto = unidades * precioUnitario;
    const neto = bruto * (1 - dto / 100);

    return Math.round((Math.max(0, neto) + Number.EPSILON) * 100) / 100;
  }

  onNuevoTrabajoChange(): void {
    this.calcularTotales();
  }

  agregarTrabajo(): void {
    if (!this.cliente?.id) {
      return;
    }

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

    if (!descripcion || unidades <= 0 || precioUnitario <= 0) {
      alert(
        'Debes introducir descripción, unidades (>0) y precio unitario (>0).',
      );
      return;
    }

    if (descuento < 0 || descuento > 100) {
      alert('El descuento debe estar entre 0 y 100.');
      return;
    }

    const trabajoAEnviar: any = {
      descripcion,
      importe: this.getNetoNuevoTrabajo(),
      unidades,
      precioUnitario,
      descuento,
      importePagado,
      pagado: false,
      entregado: false,
      fechaEntrega: null,
    };

    this.http
      .post(
        `${this.apiUrl}/trabajos/cliente/${this.cliente.id}`,
        trabajoAEnviar,
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

          this.cargarTrabajos(this.clienteId);
          this.cargarClienteProductos(this.clienteId);
          this.cargarProductos();
          this.cargarCliente(this.clienteId);
        },
        error: (err) => {
          this.logHttpError('agregar trabajo', err);
          alert('No se pudo añadir el trabajo.');
        },
      });
  }

  eliminarTrabajo(t: any): void {
    if (!this.cliente?.id) {
      return;
    }

    if (t?.entregado === true) {
      alert('No se puede eliminar: este trabajo ya está entregado.');
      return;
    }

    if (!confirm('¿Seguro que deseas eliminar este trabajo?')) {
      return;
    }

    const id = Number(t?.id);

    if (!id) {
      return;
    }

    this.http.delete(`${this.apiUrl}/trabajos/${id}`).subscribe({
      next: () => {
        this.cargarTrabajos(this.clienteId);
        this.cargarClienteProductos(this.clienteId);
        this.cargarProductos();
        this.cargarCliente(this.clienteId);
      },
      error: (err) => {
        this.logHttpError('eliminar trabajo', err);
        alert('No se pudo eliminar el trabajo.');
      },
    });
  }

  sumarUnidadTrabajo(t: any): void {
    if (!t || t.entregado === true) {
      return;
    }

    const productoId = Number(t?.productoId);

    if (!productoId) {
      alert('Este trabajo no está vinculado a un producto.');
      return;
    }

    const producto = this.productos.find((p) => Number(p.id) === productoId);
    const unidadesDisponibles = Number(producto?.unidades ?? 0);

    if (unidadesDisponibles <= 0) {
      alert('No hay unidades disponibles para añadir una unidad más.');
      return;
    }

    const nuevaCantidad = Math.max(1, Number(t?.unidades ?? 1) + 1);

    this.actualizarCantidadTrabajo(t, nuevaCantidad);
  }

  restarUnidadTrabajo(t: any): void {
    if (!t || t.entregado === true) {
      return;
    }

    const productoId = Number(t?.productoId);

    if (!productoId) {
      alert('Este trabajo no está vinculado a un producto.');
      return;
    }

    const actual = Math.max(1, Number(t?.unidades ?? 1));
    const nuevaCantidad = actual - 1;

    if (nuevaCantidad <= 0) {
      if (
        !confirm(
          'La cantidad quedará en 0. ¿Quieres eliminar esta línea completa?',
        )
      ) {
        return;
      }
    }

    this.actualizarCantidadTrabajo(t, nuevaCantidad);
  }

  private actualizarCantidadTrabajo(t: any, nuevaCantidad: number): void {
    const productoId = Number(t?.productoId);

    if (!productoId) {
      return;
    }

    this.http
      .put(
        `${this.apiUrl}/clientes/${this.clienteId}/productos/${productoId}/cantidad?cantidad=${nuevaCantidad}`,
        {},
        {
          headers: this.getEmpresaHeaders(),
        },
      )
      .subscribe({
        next: () => {
          this.cargarTrabajos(this.clienteId);
          this.cargarClienteProductos(this.clienteId);
          this.cargarProductos();
          this.cargarCliente(this.clienteId);
        },
        error: (err: any) => {
          this.logHttpError('actualizar cantidad de trabajo', err);

          const msg =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.message || 'Error al actualizar cantidad';

          alert(msg);
          this.cargarProductos();
        },
      });
  }

  addProducto(p: IProducto): void {
    if (!this.clienteId) {
      return;
    }

    const productoId = Number(p.id);

    if (!productoId) {
      return;
    }

    const unidadesDisponibles = Number(p.unidades ?? 0);

    if (unidadesDisponibles <= 0) {
      alert('No hay unidades disponibles.');
      return;
    }

    const cantidad = this.getQty(productoId);

    if (cantidad > unidadesDisponibles) {
      alert('No hay unidades suficientes para esa cantidad.');
      return;
    }

    const descuento = this.getDto(productoId);
    const importePagado = this.getPagado(productoId);
    const empresa = this.getEmpresaActual();

    this.cpService
      .addProducto(
        this.clienteId,
        productoId,
        cantidad,
        descuento,
        importePagado,
        empresa,
      )
      .subscribe({
        next: () => {
          p.unidades = unidadesDisponibles - cantidad;

          this.qtyMap[productoId] = 1;
          this.dtoMap[productoId] = 0;
          this.pagadoMap[productoId] = 0;

          this.cargarTrabajos(this.clienteId);
          this.cargarClienteProductos(this.clienteId);
          this.cargarProductos();
          this.cargarCliente(this.clienteId);
        },
        error: (err: HttpErrorResponse) => {
          this.logHttpError('addProducto', err);

          const msg =
            typeof err?.error === 'string'
              ? err.error
              : err?.error?.message || 'No se pudo añadir el producto';

          alert(msg);
          this.cargarProductos();
        },
      });
  }

  verAlbaran(a: any): void {
    if (!a?.id) {
      return;
    }

    if (this.cliente?.id) {
      localStorage.setItem('clienteIdFromAlbaran', String(this.cliente.id));
      localStorage.setItem('clienteDetallePestana', 'albaranes');
    }

    this.router.navigate(['/app/albaranes', a.id], {
      queryParams: { clienteId: this.cliente?.id },
      state: { clienteId: this.cliente?.id, volverA: 'albaranes' },
    });
  }

  imprimirAlbaran(a: any): void {
    if (!a?.id) {
      return;
    }

    const url = `${window.location.origin}/imprimir/albaran/${a.id}`;
    window.open(url, '_blank');
  }

  imprimirComprobantePago(pago: any): void {
    if (!pago?.id) {
      return;
    }

    const url = `${window.location.origin}/imprimir/pago/${pago.id}`;
    window.open(url, '_blank');
  }

  cargarAlbaranes(clienteId: number): void {
    this.http
      .get<any[]>(`${this.apiUrl}/albaranes`, {
        params: { clienteId } as any,
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (data) => {
          this.albaranes = data ?? [];
        },
        error: (err) => this.logHttpError('cargar albaranes', err),
      });
  }

  crearAlbaran(): void {
    if (!this.cliente?.id) {
      return;
    }

    this.creandoAlbaran = true;
    localStorage.setItem('clienteDetallePestana', 'albaranes');

    this.http
      .post<any>(
        `${this.apiUrl}/albaranes/clientes/${this.cliente.id}`,
        {},
        {
          headers: this.getEmpresaHeaders(),
        },
      )
      .subscribe({
        next: (albaran) => {
          this.creandoAlbaran = false;

          if (!albaran?.id) {
            alert('No se pudo crear el albarán.');
            return;
          }

          this.cargarAlbaranes(this.clienteId);

          this.router.navigate(['/app/albaranes', albaran.id], {
            queryParams: { clienteId: this.cliente?.id },
            state: { clienteId: this.cliente?.id, volverA: 'albaranes' },
          });
        },
        error: (err) => {
          this.creandoAlbaran = false;
          this.logHttpError('crear albarán', err);
          alert('No se pudo crear el albarán.');
        },
      });
  }

  eliminarAlbaran(a: any): void {
    if (!a?.id) {
      return;
    }

    const confirmado = confirm(
      `¿Seguro que deseas eliminar el albarán #${a.id}?`,
    );

    if (!confirmado) {
      return;
    }

    this.http
      .delete(`${this.apiUrl}/albaranes/${a.id}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: () => {
          this.albaranes = this.albaranes.filter((alb) => alb.id !== a.id);
          alert('Albarán eliminado correctamente.');
        },
        error: (err) => {
          this.logHttpError('eliminar albarán', err);
          alert('No se pudo eliminar el albarán.');
        },
      });
  }

  cargarPagos(clienteId: number): void {
    this.http
      .get<any[]>(`${this.apiUrl}/pagos/cliente/${clienteId}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: (data) => {
          this.pagos = data ?? [];
          this.calcularTotales();
        },
        error: (err) => this.logHttpError('cargar pagos', err),
      });
  }

  agregarPago(): void {
    if (!this.cliente?.id) {
      return;
    }

    const fecha = ClienteDetalleComponent.safeTrim(this.nuevoPago.fecha);
    const importe = ClienteDetalleComponent.toNumber(this.nuevoPago.importe);
    const metodo = ClienteDetalleComponent.safeTrim(this.nuevoPago.metodo);
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

  eliminarPago(pagoId: number): void {
    if (!this.cliente?.id) {
      return;
    }

    if (!confirm('¿Seguro que deseas eliminar este pago?')) {
      return;
    }

    this.http
      .delete(`${this.apiUrl}/pagos/${pagoId}`, {
        headers: this.getEmpresaHeaders(),
      })
      .subscribe({
        next: () => {
          this.pagos = (this.pagos ?? []).filter(
            (p) => ClienteDetalleComponent.toNumber(p?.id) !== pagoId,
          );

          this.calcularTotales();
        },
        error: (err) => {
          this.logHttpError('eliminar pago', err);
          alert('No se pudo eliminar el pago.');
        },
      });
  }

  calcularTotales(): void {
    const totalTrabajos = (this.trabajos ?? []).reduce(
      (acc, t) => acc + this.getNetoTrabajo(t),
      0,
    );

    const descripcionBorrador = ClienteDetalleComponent.safeTrim(
      this.nuevoTrabajo.descripcion,
    );

    const unidadesBorrador = ClienteDetalleComponent.toNumber(
      this.nuevoTrabajo.unidades,
    );

    const precioBorrador = ClienteDetalleComponent.toNumber(
      this.nuevoTrabajo.precioUnitario,
    );

    const incluirBorrador =
      descripcionBorrador.length > 0 &&
      unidadesBorrador > 0 &&
      precioBorrador > 0;

    const netoBorrador = incluirBorrador ? this.getNetoNuevoTrabajo() : 0;

    const pagadoHistorial = (this.pagos ?? []).reduce(
      (acc, pago) => acc + ClienteDetalleComponent.toNumber(pago?.importe),
      0,
    );

    const pagadoInicialTrabajos = (this.trabajos ?? []).reduce(
      (acc, trabajo) =>
        acc + ClienteDetalleComponent.toNumber(trabajo?.importePagado),
      0,
    );

    const pagadoBorrador = incluirBorrador
      ? Math.max(
          0,
          ClienteDetalleComponent.toNumber(this.nuevoTrabajo.importePagado),
        )
      : 0;

    const totalImporte = totalTrabajos + netoBorrador;
    const totalPagado =
      pagadoHistorial + pagadoInicialTrabajos + pagadoBorrador;

    this.cliente = {
      ...(this.cliente ?? {}),
      totalImporte,
      totalPagado,
      saldoPendiente: totalImporte - totalPagado,
    };
  }
}
