import { ProductoServiceService } from './../../services/producto-service.service';
import { ClienteProductoService } from '../../services/cliente-producto.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturarV2Component } from '../../components/facturar-v2/facturar-v2.component';
import { IProducto } from '../../interfaces/iproducto';

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FacturarV2Component],
  templateUrl: './cliente-detalle.component.html',
  styleUrls: ['./cliente-detalle.component.css'],
})
export class ClienteDetalleComponent implements OnInit {
  cliente: any;
  trabajos: any[] = [];
  albaranes: any[] = [];
  pagos: any[] = [];
  productos: IProducto[] = [];
  clienteId!: number;

  // ✅ productos comprados del cliente (cliente_producto)
  // Backend: [{ productoId, codigo, nombre, cantidad, entregado, fechaEntrega }]
  clienteProductos: any[] = [];

  // ✅ Maps por productoId
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

  private apiUrl = 'http://localhost:9018/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
    private cpService: ClienteProductoService,
    private productosService: ProductoServiceService,
  ) {}

  // ---------- helpers ----------
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

  private clamp(n: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, n));
  }

  private getEmpresaActual(): string {
    const fromCliente = ClienteDetalleComponent.safeTrim(this.cliente?.empresa);
    if (fromCliente) return fromCliente;

    const fromLS = ClienteDetalleComponent.safeTrim(
      localStorage.getItem('empresa_activa'),
    );
    return fromLS || 'ARGASA';
  }

  // ---------------- PRODUCTOS: qty/dto/pagado helpers ----------------
  getQty(productoId: number): number {
    if (!productoId) return 1;
    const v = Number(this.qtyMap[productoId] ?? 1);
    return isNaN(v) || v <= 0 ? 1 : Math.floor(v);
  }

  setQty(productoId: number, value: any, stock: any): void {
    if (!productoId) return;

    const s = Number(stock ?? 0);
    const v = Number(value);

    const qty = isNaN(v) ? 1 : Math.floor(v);
    this.qtyMap[productoId] = this.clamp(qty, 1, Math.max(1, s || 1));
  }

  getDto(productoId: number): number {
    if (!productoId) return 0;
    const v = Number(this.dtoMap[productoId] ?? 0);
    if (isNaN(v)) return 0;
    return this.clamp(v, 0, 100);
  }

  setDto(productoId: number, value: any): void {
    if (!productoId) return;
    const v = Number(value);
    this.dtoMap[productoId] = isNaN(v) ? 0 : this.clamp(v, 0, 100);
  }

  getPagado(productoId: number): number {
    if (!productoId) return 0;
    const v = Number(this.pagadoMap[productoId] ?? 0);
    if (isNaN(v)) return 0;
    return Math.max(0, v);
  }

  setPagado(productoId: number, value: any): void {
    if (!productoId) return;
    const v = Number(value);
    this.pagadoMap[productoId] = isNaN(v) ? 0 : Math.max(0, v);
  }

  // ---------------- Navegación ----------------
  volverAClientes(): void {
    this.router.navigate(['/app/clientes']);
  }

  // ---------------- INIT ----------------
  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id) || id <= 0) {
      alert('ID inválido');
      this.router.navigate(['/app/clientes']);
      return;
    }

    this.clienteId = id;

    this.cargarCliente(id);
    this.cargarTrabajos(id);
    this.cargarAlbaranes(id);
    this.cargarPagos(id);

    // ✅ cargar cliente_producto
    this.cargarClienteProductos(id);
  }

  // ---------------- CLIENTE ----------------
  cargarCliente(id: number): void {
    this.http.get(`${this.apiUrl}/clientes/${id}`).subscribe({
      next: (data: any) => {
        this.cliente = data;
        this.calcularTotales();
        this.cargarProductos(); // catálogo
      },
      error: (err) => console.error('Error al cargar cliente:', err),
    });
  }

  // ---------------- CLIENTE_PRODUCTO (Comprados) ----------------
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
        console.error('Error cargando productos del cliente:', err);
        this.clienteProductos = [];
      },
    });
  }

  isEntregado(cp: any): boolean {
    return cp?.entregado === true;
  }

  // ✅ MODIFICADO: ahora recarga clienteProductos + catálogo + trabajos
  eliminarProductoCliente(cp: any): void {
    if (!cp || this.isEntregado(cp)) {
      alert('No se puede eliminar: el producto ya está entregado.');
      return;
    }

    const productoId = Number(cp.productoId);
    if (!productoId) return;

    if (!confirm('¿Seguro que deseas eliminar este producto del cliente?'))
      return;

    this.cpService
      .deleteProductoCliente(
        this.clienteId,
        productoId,
        this.getEmpresaActual(),
      )
      .subscribe({
        next: () => {
          this.cargarClienteProductos(this.clienteId);
          this.cargarProductos(); // ✅ stock real
          this.cargarTrabajos(this.clienteId);
        },
        error: (err) => {
          console.error(err);
          alert('No se pudo eliminar el producto del cliente.');
        },
      });
  }

  getFechaEntrega(cp: any): string {
    return cp?.fechaEntrega || cp?.fecha_entrega || cp?.fechaEntregaReal || '-';
  }

  // ---------------- TRABAJOS ----------------
  private normalizarTrabajos(): void {
    this.trabajos = (this.trabajos ?? []).map((t) => {
      const importeLegacy = ClienteDetalleComponent.toNumber(t?.importe);

      const unidades =
        t?.unidades != null ? ClienteDetalleComponent.toNumber(t.unidades) : 1;

      const precioUnitario =
        t?.precioUnitario != null
          ? ClienteDetalleComponent.toNumber(t.precioUnitario)
          : t?.importeUnitario != null
            ? ClienteDetalleComponent.toNumber(t.importeUnitario)
            : importeLegacy;

      const descuento =
        t?.descuento != null
          ? ClienteDetalleComponent.toNumber(t.descuento)
          : 0;

      const entregado = t?.entregado === true;
      const fechaEntrega = t?.fechaEntrega ?? t?.fecha_entrega ?? null;

      return {
        ...t,
        unidades: unidades <= 0 ? 1 : unidades,
        precioUnitario: precioUnitario < 0 ? 0 : precioUnitario,
        descuento: descuento < 0 ? 0 : descuento,
        entregado,
        fechaEntrega,
      };
    });
  }

  cargarTrabajos(clienteId: number): void {
    this.http
      .get<any[]>(`${this.apiUrl}/trabajos/cliente/${clienteId}`)
      .subscribe({
        next: (data) => {
          this.trabajos = data ?? [];
          this.normalizarTrabajos();
          this.calcularTotales();
        },
        error: (err) => console.error('Error al cargar trabajos:', err),
      });
  }

  getBrutoTrabajo(t: any): number {
    const u = ClienteDetalleComponent.toNumber(t?.unidades);
    const p = ClienteDetalleComponent.toNumber(t?.precioUnitario);
    return Math.max(0, u) * Math.max(0, p);
  }

  getNetoTrabajo(t: any): number {
    const bruto = this.getBrutoTrabajo(t);
    const dto = ClienteDetalleComponent.toNumber(t?.descuento);
    const factor = 1 - dto / 100;
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
    if (!this.cliente?.id) return;

    const desc = ClienteDetalleComponent.safeTrim(this.nuevoTrabajo.descripcion);
    const unidades = ClienteDetalleComponent.toNumber(this.nuevoTrabajo.unidades);
    const precioUnitario = ClienteDetalleComponent.toNumber(this.nuevoTrabajo.precioUnitario);
    const descuento = ClienteDetalleComponent.toNumber(this.nuevoTrabajo.descuento);
    const pagadoInicial = ClienteDetalleComponent.toNumber(this.nuevoTrabajo.importePagado);

    if (!desc || unidades <= 0 || precioUnitario <= 0) {
      alert('Debes introducir descripción, unidades (>0) y precio unitario (>0).');
      return;
    }
    if (descuento < 0 || descuento > 100) {
      alert('El descuento debe estar entre 0 y 100.');
      return;
    }

    const neto = this.getNetoNuevoTrabajo();

    const trabajoAEnviar: any = {
      descripcion: desc,
      importe: neto,
      unidades,
      precioUnitario,
      descuento,
      importePagado: pagadoInicial,
      pagado: false,
      entregado: false,
      fechaEntrega: null,
    };

    const empresa = this.getEmpresaActual();

    this.http
      .post(`${this.apiUrl}/trabajos/cliente/${this.cliente.id}`, trabajoAEnviar, {
        headers: { 'X-Empresa': empresa },
      })
      .subscribe({
        next: () => {
          this.cargarTrabajos(this.cliente.id);

          this.nuevoTrabajo = {
            descripcion: '',
            unidades: 1,
            precioUnitario: 0,
            descuento: 0,
            importePagado: 0,
            pagado: false,
          };

          this.calcularTotales();
        },
        error: (err) => {
          console.error('Error al agregar trabajo:', err);
          alert('No se pudo añadir el trabajo (revisa empresa / backend).');
        },
      });
  }

  // ✅ MODIFICADO: al borrar trabajo, también recarga productos
  eliminarTrabajo(t: any): void {
    if (!this.cliente?.id) return;

    if (t?.entregado === true) {
      alert('No se puede eliminar: este trabajo ya está entregado.');
      return;
    }

    const id = Number(t?.id);
    if (!id) return;

    if (!confirm('¿Seguro que deseas eliminar este trabajo?')) return;

    this.http.delete(`${this.apiUrl}/trabajos/${id}`).subscribe({
      next: () => {
        this.cargarTrabajos(this.cliente.id);
        this.cargarProductos(); // ✅ stock real
      },
      error: (err) => console.error('Error al eliminar trabajo:', err),
    });
  }

  // ---------------- ALBARANES ----------------
  verAlbaran(a: any): void {
    if (!a?.id) return;

    if (this.cliente?.id) {
      localStorage.setItem('clienteIdFromAlbaran', String(this.cliente.id));
    }

    this.router.navigate(['/app/albaranes', a.id], {
      queryParams: { clienteId: this.cliente?.id },
    });
  }

  imprimirAlbaran(a: any): void {
    if (!a?.id) return;
    const url = `${window.location.origin}/app/imprimir/albaran/${a.id}`;
    window.open(url, '_blank');
  }

  cargarAlbaranes(clienteId: number): void {
    this.http
      .get<any[]>(`${this.apiUrl}/albaranes`, { params: { clienteId } as any })
      .subscribe({
        next: (data) => (this.albaranes = data ?? []),
        error: (err) => console.error('Error al cargar albaranes:', err),
      });
  }

  crearAlbaran(): void {
    if (!this.cliente?.id) return;

    this.creandoAlbaran = true;

    this.http
      .post<any>(`${this.apiUrl}/albaranes/clientes/${this.cliente.id}`, {})
      .subscribe({
        next: (albaran) => {
          this.creandoAlbaran = false;

          if (!albaran?.id) {
            alert('No se pudo crear el albarán.');
            return;
          }

          this.cargarAlbaranes(this.cliente.id);
          this.router.navigate(['/app/albaranes', albaran.id]);
        },
        error: (err) => {
          this.creandoAlbaran = false;
          console.error('Error creando albarán:', err);
          alert('No se pudo crear el albarán.');
        },
      });
  }

  // ---------------- PAGOS ----------------
  cargarPagos(clienteId: number): void {
    this.http
      .get<any[]>(`${this.apiUrl}/pagos/cliente/${clienteId}`)
      .subscribe({
        next: (data) => {
          this.pagos = data ?? [];
          this.calcularTotales();
        },
        error: (err) => console.error('Error al cargar pagos:', err),
      });
  }

  agregarPago(): void {
    if (!this.cliente?.id) return;

    const fecha = ClienteDetalleComponent.safeTrim(this.nuevoPago.fecha);
    const importe = ClienteDetalleComponent.toNumber(this.nuevoPago.importe);
    const metodo = ClienteDetalleComponent.safeTrim(this.nuevoPago.metodo);
    const observaciones = ClienteDetalleComponent.safeTrim(this.nuevoPago.observaciones);

    if (!ClienteDetalleComponent.isValidISODate(fecha)) {
      alert('Fecha inválida.');
      return;
    }
    if (importe <= 0) {
      alert('El importe del pago debe ser mayor que 0.');
      return;
    }

    this.creandoPago = true;
    const payload = { fecha, importe, metodo, observaciones };

    this.http
      .post<any>(`${this.apiUrl}/pagos/cliente/${this.cliente.id}`, payload)
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
        },
        error: (err) => {
          this.creandoPago = false;
          console.error('Error al registrar pago:', err);
          alert('No se pudo registrar el pago.');
        },
      });
  }

  eliminarPago(pagoId: number): void {
    if (!this.cliente?.id) return;

    if (!confirm('¿Seguro que deseas eliminar este pago?')) return;

    this.http.delete(`${this.apiUrl}/pagos/${pagoId}`).subscribe({
      next: () => {
        this.pagos = (this.pagos ?? []).filter(
          (p) => ClienteDetalleComponent.toNumber(p?.id) !== pagoId,
        );
        this.calcularTotales();
      },
      error: (err) => {
        console.error('Error al eliminar pago:', err);
        alert('No se pudo eliminar el pago.');
      },
    });
  }

  getTotalPagos(): number {
    return (this.pagos ?? []).reduce(
      (acc, p) => acc + ClienteDetalleComponent.toNumber(p?.importe),
      0,
    );
  }

  // ---------------- TOTALES ----------------
  calcularTotales(): void {
    const totalTrabajos = (this.trabajos ?? []).reduce(
      (acc, t) => acc + this.getNetoTrabajo(t),
      0,
    );

    const desc = ClienteDetalleComponent.safeTrim(this.nuevoTrabajo.descripcion);
    const u = ClienteDetalleComponent.toNumber(this.nuevoTrabajo.unidades);
    const p = ClienteDetalleComponent.toNumber(this.nuevoTrabajo.precioUnitario);

    const incluirBorrador = desc.length > 0 && u > 0 && p > 0;
    const netoBorrador = incluirBorrador ? this.getNetoNuevoTrabajo() : 0;

    const pagadoHistorial = (this.pagos ?? []).reduce(
      (acc, pg) => acc + ClienteDetalleComponent.toNumber(pg?.importe),
      0,
    );
    const pagadoInicialTrabajos = (this.trabajos ?? []).reduce(
      (acc, t) => acc + ClienteDetalleComponent.toNumber(t?.importePagado),
      0,
    );

    const pagadoBorrador = incluirBorrador
      ? Math.max(0, ClienteDetalleComponent.toNumber(this.nuevoTrabajo.importePagado))
      : 0;

    const totalImporte = totalTrabajos + netoBorrador;
    const totalPagado = pagadoHistorial + pagadoInicialTrabajos + pagadoBorrador;

    this.cliente = {
      ...this.cliente,
      totalImporte,
      totalPagado,
      saldoPendiente: totalImporte - totalPagado,
    };
  }

  getTotalImporte(): number {
    return ClienteDetalleComponent.toNumber(this.cliente?.totalImporte);
  }

  getTotalPagado(): number {
    return ClienteDetalleComponent.toNumber(this.cliente?.totalPagado);
  }

  getSaldoPendiente(): number {
    return ClienteDetalleComponent.toNumber(this.cliente?.saldoPendiente);
  }

  // ---------------- CATÁLOGO PRODUCTOS ----------------
  cargarProductos(): void {
    const empresa = this.getEmpresaActual();
    this.productosService.list(empresa).subscribe({
      next: (res) => {
        this.productos = res ?? [];

        for (const prod of this.productos) {
          const id = Number((prod as any)?.id);
          if (!isNaN(id) && id > 0) {
            if (this.qtyMap[id] == null) this.qtyMap[id] = 1;
            if (this.dtoMap[id] == null) this.dtoMap[id] = 0;
            if (this.pagadoMap[id] == null) this.pagadoMap[id] = 0;
          }
        }
      },
      error: (err) => {
        console.error('Error cargando productos:', err);
        this.productos = [];
      },
    });
  }

  // ✅ MODIFICADO: ahora recarga productos al final
  addProducto(p: IProducto): void {
    if (!this.clienteId) return;

    const productoId = Number((p as any)?.id);
    if (!productoId) return;

    const stock = Number((p as any)?.stock ?? 0);
    if (stock <= 0) return;

    const cantidad = this.getQty(productoId);
    if (cantidad > stock) {
      alert('No hay stock suficiente para esa cantidad.');
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
        next: (trabajoCreado: any) => {
          (p as any).stock = stock - cantidad;

          this.qtyMap[productoId] = 1;
          this.dtoMap[productoId] = 0;
          this.pagadoMap[productoId] = 0;

          if (trabajoCreado) {
            this.trabajos = [trabajoCreado, ...(this.trabajos ?? [])];
            this.normalizarTrabajos();
            this.calcularTotales();
          } else {
            this.cargarTrabajos(this.clienteId);
          }

          this.cargarClienteProductos(this.clienteId);

          // ✅ CLAVE: recargar catálogo para stock REAL
          this.cargarProductos();
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error addProducto:', err);

          const msg =
            typeof (err as any)?.error === 'string'
              ? (err as any).error
              : ((err as any)?.error?.message ?? 'No se pudo añadir el producto');

          alert(msg);
          this.cargarProductos();
        },
      });
  }
}