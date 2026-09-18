import { ProductoServiceService } from './../../services/producto-service.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IProducto } from '../../interfaces/iproducto';
import { IProductoMovimiento } from '../../interfaces/iproducto-movimiento';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import { Subscription } from 'rxjs';
import { ClientesService } from '../../services/cliente.service';
import { ClienteProductoService } from '../../services/cliente-producto.service';
import { AlbaranesService } from '../../services/albaranes.service';
import { ICliente } from '../../interfaces/icliente';
import { FacturacionV2Service } from '../../services/facturacion-v2.service';

@Component({
  selector: 'app-productos',
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent implements OnInit, OnDestroy {
  // ============================================================
  // PRODUCTOS
  // ============================================================

  productos: IProducto[] = [];
  movimientosProducto: IProductoMovimiento[] = [];
  productoSeleccionado: IProducto | null = null;

  empresaActiva: Empresa | null = null;

  form: IProducto = this.getFormVacio();

  ajusteMap: Record<number, number> = {};

  loading = false;

  filtroCodigo = '';
  filtroProducto = '';

  mostrarModalMovimientos = false;

  private empresaSub?: Subscription;

  // ============================================================
  // MODAL ASIGNAR PRODUCTO A CLIENTE
  // ============================================================

  mostrarModalAsignarCliente = false;

  productoRecienCreado: IProducto | null = null;

  clientes: ICliente[] = [];
  clienteSeleccionadoId: number | null = null;

  filtroCliente = '';

  cantidadAsignar = 1;
  descuentoAsignar = 0;
  importePagadoCliente = 0;

  asignandoProducto = false;

  // ============================================================
  // DOCUMENTACIÓN
  // ============================================================

  pasoAsignacion: 'cliente' | 'documentacion' = 'cliente';

  trabajoRecienCreado: any = null;

  generandoDocumento = false;

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private productosService: ProductoServiceService,
    private empresaService: EmpresaService,
    private clientesService: ClientesService,
    private clienteProductoService: ClienteProductoService,
    private albaranesService: AlbaranesService,
    private facturacionV2Service: FacturacionV2Service,
  ) {}

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {
    this.empresaActiva = this.empresaService.getEmpresa();

    this.empresaSub = this.empresaService.empresa$.subscribe(
      (empresa: Empresa | null) => {
        this.empresaActiva = empresa;

        if (empresa) {
          this.form.empresa = empresa;

          this.cargar();

          this.cerrarMovimientos();

          this.finalizarFlujoProducto();
        }
      },
    );

    if (this.empresaActiva) {
      this.form.empresa = this.empresaActiva;
      this.cargar();
    }
  }

  ngOnDestroy(): void {
    this.empresaSub?.unsubscribe();
  }

  // ============================================================
  // FORMULARIO VACÍO
  // ============================================================

  private getFormVacio(): IProducto {
    return {
      fechaAlta: '',
      referencia: '',
      gama: '',
      marca: '',
      modelo: '',
      familia: '',
      subfamilia: '',
      descripcion: '',
      unidades: 0,
      precioSinIva: 0,
      empresa: this.empresaActiva || 'ARGASA',
    };
  }

  // ============================================================
  // CARGAR PRODUCTOS
  // ============================================================

  cargar(): void {
    this.productosService.list().subscribe({
      next: (res: IProducto[]) => {
        this.productos = res;
      },

      error: (err: HttpErrorResponse) => {
        console.error(err);

        alert(
          err.error?.message ||
            err.error ||
            'No se pudieron cargar los productos',
        );
      },
    });
  }

  // ============================================================
  // CREAR PRODUCTO
  // ============================================================

  crear(): void {
    if (!this.empresaActiva) {
      alert('Empresa no seleccionada');
      return;
    }

    if (
      !this.form.gama?.trim() ||
      !this.form.marca?.trim() ||
      !this.form.modelo?.trim() ||
      !this.form.familia?.trim() ||
      !this.form.subfamilia?.trim() ||
      !this.form.descripcion?.trim()
    ) {
      alert(
        'Gama, marca, modelo, familia, subfamilia y descripción son obligatorios',
      );
      return;
    }

    if ((this.form.unidades || 0) < 0) {
      alert('Las unidades no pueden ser negativas');
      return;
    }

    if ((this.form.precioSinIva || 0) < 0) {
      alert('El precio sin IVA no puede ser negativo');
      return;
    }

    this.loading = true;

    const payload: IProducto = {
      fechaAlta: this.form.fechaAlta || undefined,
      gama: this.form.gama.trim(),
      marca: this.form.marca.trim(),
      modelo: this.form.modelo.trim(),
      familia: this.form.familia.trim(),
      subfamilia: this.form.subfamilia.trim(),
      descripcion: this.form.descripcion.trim(),
      unidades: this.form.unidades || 0,
      precioSinIva: this.form.precioSinIva || 0,
      empresa: this.empresaActiva,
      referencia: '',
    };

    this.productosService.create(payload).subscribe({
      next: (nuevo: IProducto) => {
        this.productos.unshift(nuevo);

        this.form = this.getFormVacio();
        this.form.empresa = this.empresaActiva!;

        this.loading = false;

        this.abrirAsignacionCliente(nuevo);
      },

      error: (err: HttpErrorResponse) => {
        this.loading = false;

        console.error(err);

        alert(
          err.error?.message || err.error || 'No se pudo crear el producto',
        );
      },
    });
  }

  // ============================================================
  // AJUSTES DE STOCK
  // ============================================================

  getAjuste(productoId: number | string): number {
    const id = Number(productoId);

    const v = Number(this.ajusteMap[id] ?? 1);

    return isNaN(v) || v <= 0 ? 1 : v;
  }

  setAjuste(productoId: number | string, value: number | string): void {
    const id = Number(productoId);

    let v = Number(value);

    if (isNaN(v) || v <= 0) {
      v = 1;
    }

    this.ajusteMap[id] = v;
  }

  subirUnidades(p: IProducto): void {
    const id = Number(p?.id);

    if (!id) {
      return;
    }

    const cant = this.getAjuste(id);

    const motivo = prompt('Motivo de la subida de unidades (opcional):') || '';

    this.productosService.ajustarStock(id, cant, motivo).subscribe({
      next: (prodActualizado: IProducto) => {
        p.unidades = prodActualizado.unidades;

        this.ajusteMap[id] = 1;

        if (this.productoSeleccionado?.id === id) {
          this.verMovimientos(p);
        }
      },

      error: (err: HttpErrorResponse) => {
        console.error(err);

        alert(
          err.error?.message ||
            err.error ||
            'No se pudieron subir las unidades',
        );
      },
    });
  }

  bajarUnidades(p: IProducto): void {
    const id = Number(p?.id);

    if (!id) {
      return;
    }

    const cant = this.getAjuste(id);

    const motivo = prompt('Motivo de la bajada de unidades (opcional):') || '';

    this.productosService.ajustarStock(id, -cant, motivo).subscribe({
      next: (prodActualizado: IProducto) => {
        p.unidades = prodActualizado.unidades;

        this.ajusteMap[id] = 1;

        if (this.productoSeleccionado?.id === id) {
          this.verMovimientos(p);
        }
      },

      error: (err: HttpErrorResponse) => {
        console.error(err);

        alert(
          err.error?.message ||
            err.error ||
            'No se pudieron bajar las unidades',
        );
      },
    });
  }

  // ============================================================
  // MOVIMIENTOS
  // ============================================================

  verMovimientos(p: IProducto): void {
    const id = Number(p?.id);

    if (!id) {
      return;
    }

    this.productoSeleccionado = p;
    this.filtroCodigo = '';
    this.mostrarModalMovimientos = true;

    this.productosService.getMovimientosPorProducto(id).subscribe({
      next: (res: IProductoMovimiento[]) => {
        this.movimientosProducto = res;
      },

      error: (err: HttpErrorResponse) => {
        console.error(err);

        alert(
          err.error?.message ||
            err.error ||
            'No se pudieron cargar los movimientos',
        );
      },
    });
  }

  cerrarMovimientos(): void {
    this.mostrarModalMovimientos = false;
    this.productoSeleccionado = null;
    this.movimientosProducto = [];
    this.filtroCodigo = '';
  }

  get movimientosFiltrados(): IProductoMovimiento[] {
    const filtro = this.filtroCodigo.trim().toLowerCase();

    if (!filtro) {
      return this.movimientosProducto;
    }

    return this.movimientosProducto.filter((m) =>
      (m.producto?.referencia || '').toLowerCase().includes(filtro),
    );
  }

  // ============================================================
  // FILTRO PRODUCTOS
  // ============================================================

  get productosFiltrados(): IProducto[] {
    const filtro = this.filtroProducto.trim().toLowerCase();

    if (!filtro) {
      return this.productos;
    }

    return this.productos.filter(
      (p) =>
        (p.referencia || '').toLowerCase().includes(filtro) ||
        (p.gama || '').toLowerCase().includes(filtro) ||
        (p.marca || '').toLowerCase().includes(filtro) ||
        (p.modelo || '').toLowerCase().includes(filtro) ||
        (p.familia || '').toLowerCase().includes(filtro) ||
        (p.subfamilia || '').toLowerCase().includes(filtro) ||
        (p.descripcion || '').toLowerCase().includes(filtro),
    );
  }

  // ============================================================
  // FILTRO CLIENTES
  // ============================================================

  get clientesFiltrados(): ICliente[] {
    const filtro = this.normalizarTexto(this.filtroCliente);

    // No enseñamos 200 clientes nada más abrir el modal.
    // Los resultados aparecen cuando el usuario empieza a escribir.
    if (!filtro) {
      return [];
    }

    return this.clientes
      .filter((cliente) => {
        const valores = [
          cliente.nombreApellidos,
          cliente.cifDni,
          cliente.telefono,
          cliente.movil,
          cliente.email,
        ];

        return valores.some((valor) =>
          this.normalizarTexto(valor).includes(filtro),
        );
      })
      .slice(0, 20);
  }

  private normalizarTexto(valor: any): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  get clienteSeleccionado(): ICliente | null {
    if (!this.clienteSeleccionadoId) {
      return null;
    }

    return (
      this.clientes.find(
        (cliente) => cliente.id === this.clienteSeleccionadoId,
      ) ?? null
    );
  }

  seleccionarCliente(cliente: ICliente): void {
    if (!cliente?.id) {
      return;
    }

    this.clienteSeleccionadoId = cliente.id;
    this.filtroCliente = '';
  }

  quitarClienteSeleccionado(): void {
    if (this.asignandoProducto) {
      return;
    }

    this.clienteSeleccionadoId = null;
    this.filtroCliente = '';
  }

  // ============================================================
  // ABRIR ASIGNACIÓN
  // ============================================================

  abrirAsignacionCliente(producto: IProducto): void {
    this.productoRecienCreado = producto;

    this.pasoAsignacion = 'cliente';

    this.trabajoRecienCreado = null;

    this.clienteSeleccionadoId = null;

    this.filtroCliente = '';

    this.cantidadAsignar = 1;

    this.descuentoAsignar = 0;

    this.importePagadoCliente = 0;

    this.asignandoProducto = false;

    this.generandoDocumento = false;

    this.mostrarModalAsignarCliente = true;

    this.clientesService.getClientes().subscribe({
      next: (clientes: ICliente[]) => {
        this.clientes = clientes;
      },

      error: (err: HttpErrorResponse) => {
        console.error(err);

        alert(
          err.error?.message ||
            err.error ||
            'No se pudieron cargar los clientes',
        );
      },
    });
  }

  // ============================================================
  // CERRAR ASIGNACIÓN
  // ============================================================

  cerrarAsignacionCliente(): void {
    if (this.asignandoProducto || this.generandoDocumento) {
      return;
    }

    this.finalizarFlujoProducto();
  }

  // ============================================================
  // ASIGNAR PRODUCTO
  // ============================================================

  asignarProductoACliente(): void {
    const producto = this.productoRecienCreado;

    if (!producto?.id) {
      alert('No se ha podido identificar el producto.');
      return;
    }

    if (!this.clienteSeleccionadoId) {
      alert('Selecciona un cliente.');
      return;
    }

    if (
      !Number.isFinite(Number(this.cantidadAsignar)) ||
      Number(this.cantidadAsignar) <= 0
    ) {
      alert('La cantidad debe ser mayor que 0.');
      return;
    }

    if (Number(this.cantidadAsignar) > Number(producto.unidades || 0)) {
      alert('No puedes asignar más unidades de las disponibles.');
      return;
    }

    if (
      !Number.isFinite(Number(this.descuentoAsignar)) ||
      Number(this.descuentoAsignar) < 0 ||
      Number(this.descuentoAsignar) > 100
    ) {
      alert('El descuento debe estar entre 0 y 100.');
      return;
    }

    if (
      !Number.isFinite(Number(this.importePagadoCliente)) ||
      Number(this.importePagadoCliente) < 0
    ) {
      alert('El importe pagado no puede ser negativo.');
      return;
    }

    if (!this.empresaActiva) {
      alert('Empresa no seleccionada.');
      return;
    }

    this.asignandoProducto = true;

    this.clienteProductoService
      .addProducto(
        this.clienteSeleccionadoId,
        Number(producto.id),
        Number(this.cantidadAsignar),
        Number(this.descuentoAsignar),
        Number(this.importePagadoCliente),
        this.empresaActiva as any,
      )
      .subscribe({
        next: (trabajoCreado: any) => {
          this.asignandoProducto = false;

          producto.unidades =
            Number(producto.unidades || 0) - Number(this.cantidadAsignar);

          this.trabajoRecienCreado = trabajoCreado;

          console.log('Trabajo creado:', trabajoCreado);

          this.pasoAsignacion = 'documentacion';
        },

        error: (err: HttpErrorResponse) => {
          this.asignandoProducto = false;

          console.error(err);

          alert(
            err.error?.message ||
              err.error ||
              'No se pudo asignar el producto al cliente',
          );
        },
      });
  }

  // ============================================================
  // OBTENER EMPRESA PARA ALBARÁN
  // ============================================================

  private obtenerEmpresaParaPeticion(): string {
    if (!this.empresaActiva) {
      return '';
    }

    if (typeof this.empresaActiva === 'string') {
      return this.empresaActiva;
    }

    const empresa = this.empresaActiva as any;

    return empresa.nombre || empresa.codigo || empresa.razonSocial || '';
  }

  // ============================================================
  // GENERAR ALBARÁN DEL PRODUCTO
  // ============================================================

  generarAlbaranProducto(): void {
    const trabajoId = Number(this.trabajoRecienCreado?.id);

    if (!trabajoId) {
      alert('No se ha podido identificar el trabajo creado.');
      return;
    }

    if (!this.empresaActiva) {
      alert('Empresa no seleccionada.');
      return;
    }

    if (this.generandoDocumento) {
      return;
    }

    const empresa = this.obtenerEmpresaParaPeticion();

    if (!empresa) {
      console.error(
        'No se pudo obtener el identificador de empresa:',
        this.empresaActiva,
      );

      alert('No se ha podido identificar la empresa activa.');

      return;
    }

    this.generandoDocumento = true;

    this.albaranesService.crearDesdeTrabajo(trabajoId, empresa).subscribe({
      next: (albaran: any) => {
        this.generandoDocumento = false;

        console.log('Albarán creado:', albaran);

        alert(
          albaran?.numero
            ? `Albarán ${albaran.numero} generado correctamente.`
            : 'Albarán generado correctamente.',
        );

        this.finalizarFlujoProducto();
      },

      error: (err: HttpErrorResponse) => {
        this.generandoDocumento = false;

        console.error('Error generando albarán:', err);

        alert(
          err.error?.message || err.error || 'No se pudo generar el albarán.',
        );
      },
    });
  }

  // ============================================================
  // FINALIZAR FLUJO
  // ============================================================

  finalizarFlujoProducto(): void {
    this.mostrarModalAsignarCliente = false;

    this.productoRecienCreado = null;

    this.trabajoRecienCreado = null;

    this.clienteSeleccionadoId = null;

    this.filtroCliente = '';

    this.cantidadAsignar = 1;

    this.descuentoAsignar = 0;

    this.importePagadoCliente = 0;

    this.pasoAsignacion = 'cliente';

    this.asignandoProducto = false;

    this.generandoDocumento = false;
  }
  generarFacturaProducto(): void {
    const trabajoId = Number(this.trabajoRecienCreado?.id);

    if (!trabajoId) {
      alert('No se ha podido identificar el trabajo creado.');
      return;
    }

    if (this.generandoDocumento) {
      return;
    }

    this.generandoDocumento = true;

    this.facturacionV2Service.crearFacturaDesdeTrabajo(trabajoId).subscribe({
      next: (factura) => {
        this.generandoDocumento = false;

        console.log('Factura creada:', factura);

        alert(
          factura?.numero
            ? `Factura ${factura.serie}-${factura.numero} creada correctamente en BORRADOR.`
            : 'Factura creada correctamente en BORRADOR.',
        );

        this.finalizarFlujoProducto();
      },

      error: (err: HttpErrorResponse) => {
        this.generandoDocumento = false;

        console.error('Error generando factura:', err);

        alert(
          err.error?.message || err.error || 'No se pudo generar la factura.',
        );
      },
    });
  }
}
