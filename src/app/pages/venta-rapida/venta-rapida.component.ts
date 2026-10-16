import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { ProductoServiceService } from '../../services/producto-service.service';
import { AuthService } from '../../services/auth.service';
import { EmpresaService } from '../../services/empresa.service';
import { IProducto } from '../../interfaces/iproducto';
import { EMPRESAS } from '../../shared/config/empresa-config';
import { environment } from '../../../environments/environment';

interface LineaTicket {
  productoId?: number;
  articulo: string;
  cantidad: number;
  precio: number;
  iva: number;
}

interface SolicitudTicket {
  solicitud: string;
  cliente: string;
  fecha: string;
  formaPago: string;
  entregado: number | null;
  lineas: {
    productoId: number | null;
    articulo: string;
    cantidad: number;
    precio: number;
    iva: number;
  }[];
}

@Component({
  selector: 'app-venta-rapida',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './venta-rapida.component.html',
  styleUrls: ['./venta-rapida.component.css'],
})
export class VentaRapidaComponent implements OnInit {
  productos: IProducto[] = [];
  lineas: LineaTicket[] = [];

  busqueda = '';
  filtroReferencia = '';
  filtroMarca = '';
  filtroFamilia = '';
  soloDisponibles = false;

  numero = '';
  cliente = 'CLIENTES CONTADO';
  empleado = '';
  fecha = this.fechaLocal();

  formaPago = 'EFECTIVO';
  entregado: number | null = null;

  cargando = false;
  cargandoUsuario = false;
  generando = false;
  vistaPrevia = false;

  error = '';
  errorProductos = '';
  errorUsuario = '';

  private solicitudTicket = crypto.randomUUID();

  /*
   * Conserva los datos exactos ante una respuesta incierta.
   * Así un reintento no crea otra venta.
   */
  private solicitudPendiente: SolicitudTicket | null = null;

  get cobroPendiente(): boolean {
    return this.solicitudPendiente !== null && !this.numero;
  }

  get editorBloqueado(): boolean {
    return this.generando || !!this.numero || this.cobroPendiente;
  }

  constructor(
    private productosService: ProductoServiceService,
    private auth: AuthService,
    private empresas: EmpresaService,
    private http: HttpClient,
  ) {}

  get empresa() {
    return this.empresas.getEmpresa() === 'ELECTROLUGA'
      ? EMPRESAS.electroluga
      : EMPRESAS.argasa;
  }

  ngOnInit(): void {
    this.cargarUsuario();
    this.cargarProductos();
  }

  private cabeceras(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.auth.getToken() || ''}`,
      'X-Empresa': this.empresas.getEmpresa() || '',
    });
  }

  cargarUsuario(): void {
    if (this.editorBloqueado) return;

    this.cargandoUsuario = true;
    this.errorUsuario = '';
    this.empleado = '';

    this.http
      .get<{
        nombre: string;
      }>(`${environment.apiUrl}/auth/me`, { headers: this.cabeceras() })
      .subscribe({
        next: (usuario) => {
          this.cargandoUsuario = false;
          this.empleado = usuario.nombre?.trim() || '';

          if (!this.empleado) {
            this.errorUsuario = 'El usuario no tiene un nombre configurado.';
          }
        },
        error: () => {
          this.cargandoUsuario = false;
          this.errorUsuario = 'No se ha podido obtener el nombre del usuario.';
        },
      });
  }

  cargarProductos(): void {
    if (this.cargando) return;

    this.cargando = true;
    this.errorProductos = '';

    this.productosService.getProductos().subscribe({
      next: (productos) => {
        this.productos = productos || [];
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.errorProductos = 'No se han podido cargar los productos.';
      },
    });
  }

  private fechaLocal(): string {
    const ahora = new Date();
    const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60000);

    return local.toISOString().slice(0, 16);
  }

  get fechaTexto(): string {
    const fecha = new Date(this.fecha);

    return Number.isNaN(fecha.getTime())
      ? ''
      : fecha.toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
  }

  private normalizar(valor: unknown): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  get marcas(): string[] {
    return [
      ...new Set(
        this.productos.map((producto) => producto.marca).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, 'es'));
  }

  get familias(): string[] {
    return [
      ...new Set(
        this.productos.map((producto) => producto.familia).filter(Boolean),
      ),
    ].sort((a, b) => a.localeCompare(b, 'es'));
  }

  get resultados(): IProducto[] {
    const palabras = this.normalizar(this.busqueda)
      .split(/\s+/)
      .filter(Boolean);

    const referencia = this.normalizar(this.filtroReferencia);

    return this.productos.filter((producto) => {
      const contenido = this.normalizar(
        [
          producto.referencia,
          producto.descripcion,
          producto.marca,
          producto.modelo,
          producto.familia,
          producto.subfamilia,
          producto.gama,
        ].join(' '),
      );

      return (
        palabras.every((palabra) => contenido.includes(palabra)) &&
        this.normalizar(producto.referencia).includes(referencia) &&
        (!this.filtroMarca || producto.marca === this.filtroMarca) &&
        (!this.filtroFamilia || producto.familia === this.filtroFamilia) &&
        (!this.soloDisponibles || this.disponibles(producto) > 0)
      );
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroReferencia = '';
    this.filtroMarca = '';
    this.filtroFamilia = '';
    this.soloDisponibles = false;
  }

  precioProducto(producto: IProducto): number {
    return this.redondear(Number(producto.precioSinIva) * 1.21);
  }

  private stockProducto(producto: IProducto): number {
    const stock = Number(producto.unidades);

    return Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
  }

  disponibles(producto: IProducto): number {
    if (producto.id == null) return 0;

    const cantidadTicket = this.lineas
      .filter((linea) => linea.productoId === producto.id)
      .reduce((total, linea) => total + Number(linea.cantidad || 0), 0);

    return Math.max(0, this.stockProducto(producto) - cantidadTicket);
  }

  maximoLinea(linea: LineaTicket): number {
    if (linea.productoId == null) return 1000000;

    const producto = this.productos.find(
      (item) => item.id === linea.productoId,
    );

    if (!producto) return 0;

    const otrasUnidades = this.lineas
      .filter((item) => item !== linea && item.productoId === linea.productoId)
      .reduce((total, item) => total + Number(item.cantidad || 0), 0);

    return Math.max(0, this.stockProducto(producto) - otrasUnidades);
  }

  cambiarCantidad(linea: LineaTicket, valor: number | string | null): void {
    if (this.editorBloqueado) return;

    const cantidad = Number(valor);
    const maximo = this.maximoLinea(linea);

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 1000000) {
      this.error = 'Introduce una cantidad entera mayor que cero.';
      return;
    }

    if (cantidad > maximo) {
      this.error = `Solo hay ${maximo} unidades disponibles para este artículo.`;
      return;
    }

    linea.cantidad = cantidad;
    this.error = '';
  }

  agregar(producto: IProducto): void {
    if (this.editorBloqueado || this.cargando) return;

    if (producto.id == null) {
      this.error = 'El producto no tiene un identificador válido.';
      return;
    }

    if (this.disponibles(producto) < 1) {
      this.error = 'No quedan unidades disponibles de este producto.';
      return;
    }

    const precio = this.precioProducto(producto);

    if (!Number.isFinite(precio) || precio < 0) {
      this.error = 'El producto no tiene un precio válido.';
      return;
    }

    const existente = this.lineas.find(
      (linea) => linea.productoId === producto.id,
    );

    if (existente) {
      existente.cantidad = Number(existente.cantidad) + 1;
    } else {
      this.lineas.push({
        productoId: producto.id,
        articulo:
          producto.descripcion ||
          `${producto.marca || ''} ${producto.modelo || ''}`.trim(),
        cantidad: 1,
        precio,
        iva: 21,
      });
    }

    this.error = '';
  }

  validarStock(): boolean {
    const cantidades = new Map<number, number>();

    for (const linea of this.lineas) {
      if (linea.productoId == null) continue;

      const cantidad = Number(linea.cantidad);

      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        this.error = 'Revisa las cantidades del ticket.';
        return false;
      }

      cantidades.set(
        linea.productoId,
        (cantidades.get(linea.productoId) || 0) + cantidad,
      );
    }

    for (const [id, cantidad] of cantidades) {
      const producto = this.productos.find((item) => item.id === id);

      if (!producto || cantidad > this.stockProducto(producto)) {
        this.error = `Stock insuficiente para ${
          producto?.descripcion || 'uno de los productos'
        }. Actualiza los productos y revisa las cantidades.`;

        return false;
      }
    }

    return true;
  }

  agregarManual(): void {
    if (this.editorBloqueado) return;

    this.lineas.push({
      articulo: '',
      cantidad: 1,
      precio: 0,
      iva: 21,
    });
  }

  eliminar(indice: number): void {
    if (this.editorBloqueado) return;

    this.lineas.splice(indice, 1);
    this.error = '';
  }

  private redondear(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  importe(linea: LineaTicket): number {
    const valor = Number(linea.cantidad) * Number(linea.precio);

    return Number.isFinite(valor) ? this.redondear(valor) : 0;
  }

  get total(): number {
    return this.redondear(
      this.lineas.reduce((suma, linea) => suma + this.importe(linea), 0),
    );
  }

  get desglose(): {
    iva: number;
    base: number;
    cuota: number;
  }[] {
    const grupos = new Map<number, number>();

    for (const linea of this.lineas) {
      const iva = Number(linea.iva);

      if (!Number.isFinite(iva) || iva < 0 || iva > 100) {
        continue;
      }

      grupos.set(iva, (grupos.get(iva) || 0) + this.importe(linea));
    }

    return [...grupos.entries()]
      .sort(([a], [b]) => a - b)
      .map(([iva, importe]) => {
        const bruto = this.redondear(importe);
        const base = this.redondear(bruto / (1 + iva / 100));

        return {
          iva,
          base,
          cuota: this.redondear(bruto - base),
        };
      });
  }

  get cambio(): number {
    if (this.formaPago !== 'EFECTIVO') return 0;

    return this.redondear(
      Math.max(0, Number(this.entregado || 0) - this.total),
    );
  }

  get nombreFormaPago(): string {
    switch (this.formaPago) {
      case 'TPV':
        return 'Tarjeta / TPV';
      case 'TRANSFERENCIA':
        return 'Transferencia';
      default:
        return 'Efectivo';
    }
  }

  dinero(valor: number): string {
    return valor.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  validar(): boolean {
    this.error = '';

    if (!this.cliente.trim() || this.cliente.trim().length > 250) {
      this.error = 'Introduce un cliente de hasta 250 caracteres.';
    } else if (!this.empleado.trim()) {
      this.error = 'No se ha podido identificar al empleado.';
    } else if (!this.fecha || Number.isNaN(new Date(this.fecha).getTime())) {
      this.error = 'Introduce una fecha válida.';
    } else if (!this.lineas.length || this.lineas.length > 500) {
      this.error = 'Añade entre 1 y 500 artículos.';
    } else if (
      this.lineas.some((linea) => {
        const precio = Number(linea.precio);
        const cantidad = Number(linea.cantidad);
        const iva = Number(linea.iva);

        return (
          !linea.articulo.trim() ||
          linea.articulo.trim().length > 1000 ||
          !Number.isInteger(cantidad) ||
          cantidad <= 0 ||
          cantidad > 1000000 ||
          linea.precio == null ||
          !Number.isFinite(precio) ||
          precio < 0 ||
          precio > 999999999.99 ||
          Math.abs(precio - this.redondear(precio)) > 0.0000001 ||
          linea.iva == null ||
          !Number.isFinite(iva) ||
          iva < 0 ||
          iva > 100
        );
      })
    ) {
      this.error =
        'Revisa artículos, cantidades, precios e IVA. ' +
        'Los precios admiten dos decimales.';
    } else if (
      !Number.isFinite(this.total) ||
      this.total <= 0 ||
      this.total > 99999999999999.99
    ) {
      this.error = 'El importe total no es válido.';
    } else if (!['EFECTIVO', 'TPV', 'TRANSFERENCIA'].includes(this.formaPago)) {
      this.error = 'Selecciona una forma de pago válida.';
    } else if (
      this.formaPago === 'EFECTIVO' &&
      (this.entregado === null ||
        !Number.isFinite(Number(this.entregado)) ||
        Number(this.entregado) < this.total)
    ) {
      this.error = 'El efectivo entregado debe cubrir el total.';
    }

    return !this.error;
  }

  generar(): void {
    if (this.generando) return;

    if (this.numero) {
      this.vistaPrevia = true;
      return;
    }

    /*
     * Un reintento utiliza la misma solicitud sin volver a
     * comprobar stock local: el cobro podría haberse guardado.
     */
    if (!this.solicitudPendiente) {
      if (this.cargando || this.errorProductos) {
        this.error = 'Carga los productos antes de confirmar la venta.';
        return;
      }

      if (!this.validar() || !this.validarStock()) return;

      this.solicitudPendiente = {
        solicitud: this.solicitudTicket,
        cliente: this.cliente.trim(),
        fecha: this.fecha,
        formaPago: this.formaPago,
        entregado:
          this.formaPago === 'EFECTIVO' ? Number(this.entregado) : null,
        lineas: this.lineas.map((linea) => ({
          productoId: linea.productoId ?? null,
          articulo: linea.articulo.trim(),
          cantidad: Number(linea.cantidad),
          precio: this.redondear(Number(linea.precio)),
          iva: Number(linea.iva),
        })),
      };
    }

    this.generando = true;
    this.error = '';

    this.http
      .post<{
        numero: string;
        total: number;
      }>(`${environment.apiUrl}/tickets/cobrar`, this.solicitudPendiente, { headers: this.cabeceras() })
      .subscribe({
        next: (respuesta) => {
          this.generando = false;

          if (!respuesta.numero?.trim()) {
            this.error =
              'No se ha recibido el número. ' +
              'Pulsa Reintentar cobro sin iniciar otra venta.';
            return;
          }

          this.numero = respuesta.numero;
          this.solicitudPendiente = null;
          this.vistaPrevia = true;
        },
        error: (error) => {
          this.generando = false;

          /*
           * Un 400/403/422 o un conflicto de validación permite
           * corregir la venta. Un conflicto por venta ya cobrada
           * conserva la solicitud para no tratarla como una nueva.
           */
          const mensaje = String(error.error?.message || '');
          const conflictoCorregible =
            error.status === 409 && !mensaje.includes('Esta venta ya se cobró');

          if ([400, 403, 422].includes(error.status) || conflictoCorregible) {
            this.solicitudPendiente = null;
          }

          this.error =
            mensaje ||
            'No se ha podido confirmar el cobro. ' +
              'Reintenta esta misma venta.';
        },
      });
  }

  nuevoTicket(): void {
    if (this.generando || this.cobroPendiente) return;

    if (!confirm('¿Empezar otro ticket? Se limpiará el contenido actual.')) {
      return;
    }

    this.numero = '';
    this.solicitudTicket = crypto.randomUUID();
    this.solicitudPendiente = null;

    this.lineas = [];
    this.cliente = 'CLIENTES CONTADO';
    this.fecha = this.fechaLocal();
    this.formaPago = 'EFECTIVO';
    this.entregado = null;

    this.error = '';
    this.vistaPrevia = false;

    this.limpiarFiltros();
    this.cargarProductos();
  }

  async imprimir(): Promise<void> {
    // Reimprimir no consulta ni modifica el inventario.
    if (!this.numero) return;

    const ticket = document.querySelector<HTMLElement>(
      'app-venta-rapida .ticket',
    );

    if (!ticket) {
      this.error = 'No se encuentra el ticket para imprimir.';
      return;
    }

    const copia = ticket.cloneNode(true) as HTMLElement;

    copia.querySelectorAll<HTMLImageElement>('img').forEach((imagen) => {
      imagen.src = new URL(
        imagen.getAttribute('src') || '',
        document.baseURI,
      ).href;

      imagen.loading = 'eager';
    });

    const marco = document.createElement('iframe');

    marco.title = 'Impresión del ticket';
    marco.style.position = 'fixed';
    marco.style.left = '-10000px';
    marco.style.top = '0';
    marco.style.width = '80mm';
    marco.style.height = '600px';
    marco.style.border = '0';

    document.body.appendChild(marco);

    const documento = marco.contentDocument;
    const ventana = marco.contentWindow;

    if (!documento || !ventana) {
      marco.remove();
      this.error = 'No se ha podido preparar la impresión.';
      return;
    }

    documento.open();
    documento.write(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <title>Ticket</title>
          <style>
            @page { size: auto; margin: 0; }
            * { box-sizing: border-box; }

            html, body {
              margin: 0;
              padding: 0;
              background: white;
              color: black;
            }

            body {
              width: 100%;
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.45;
            }

            .ticket {
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
              padding: 4mm;
              overflow-wrap: anywhere;
            }

            .empresa-ticket {
              display: block !important;
              visibility: visible !important;
              text-align: center;
            }

            .empresa-ticket img {
              display: block !important;
              visibility: visible !important;
              width: 44mm;
              max-width: 100%;
              height: auto;
              max-height: 22mm;
              object-fit: contain;
              margin: 0 auto 4mm;
            }

            .empresa-ticket h2 {
              margin: 0 0 2mm;
              font-size: 13px;
            }

            p { margin: 2px 0; }

            .datos-ticket {
              margin-top: 4mm;
              padding-top: 3mm;
              border-top: 1px dashed black;
            }

            .datos-ticket > small,
            .datos-ticket > strong {
              display: block;
            }

            .datos-ticket > strong { margin-bottom: 3mm; }
            .numero-ticket { font-weight: bold; }

            .fila {
              display: flex;
              justify-content: space-between;
              gap: 8px;
            }

            table {
              width: 100%;
              margin-top: 4mm;
              border-collapse: collapse;
              font-size: inherit;
            }

            th, td {
              padding: 2mm 1mm;
              text-align: left;
              vertical-align: top;
            }

            th {
              border-bottom: 1px solid black;
              font-size: 10px;
            }

            .articulos-ticket td:first-child { width: 9mm; }

            .articulos-ticket th:last-child,
            .articulos-ticket td:last-child,
            .iva-ticket th:not(:first-child),
            .iva-ticket td:not(:first-child) {
              text-align: right;
            }

            .articulos-ticket td:last-child {
              white-space: nowrap;
            }

            .total-ticket {
              margin-top: 4mm;
              padding: 3mm 0;
              border-top: 2px solid black;
              border-bottom: 1px solid black;
              font-size: 13px;
            }

            .total-ticket > strong:last-child {
              white-space: nowrap;
            }

            .pago-ticket { margin-top: 3mm; }
            .pago-ticket .fila { margin: 2mm 0; }
            .pago-ticket .fila > :last-child { text-align: right; }
            .iva-ticket { font-size: 10px; }

            footer {
              display: block;
              margin-top: 7mm;
              text-align: center;
              font-size: 10px;
              font-weight: bold;
              letter-spacing: 1px;
            }

            thead { display: table-header-group; }

            tr, .empresa-ticket, .total-ticket,
            .pago-ticket, footer {
              break-inside: avoid;
            }
          </style>
        </head>
        <body></body>
      </html>
    `);
    documento.close();

    documento.body.appendChild(documento.importNode(copia, true));

    try {
      await documento.fonts.ready;

      await Promise.all(
        Array.from(documento.images).map((imagen) => imagen.decode()),
      );

      if (
        Array.from(documento.images).some((imagen) => imagen.naturalWidth === 0)
      ) {
        throw new Error('Logo no disponible');
      }

      ventana.addEventListener('afterprint', () => marco.remove(), {
        once: true,
      });

      ventana.focus();
      ventana.print();
    } catch {
      marco.remove();
      this.error =
        'No se ha podido cargar el logo. ' +
        'Revisa la imagen en empresa-config.ts.';
    }
  }
}
