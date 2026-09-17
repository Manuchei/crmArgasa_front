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
import { ICliente } from '../../interfaces/icliente';

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

  /**
   * Importe pagado en la nueva asignación.
   *
   * IMPORTANTE:
   * No usamos "importePagadoAsignar" porque ese nombre estaba
   * entrando en conflicto con una propiedad anterior de tipo boolean.
   */
  importePagadoCliente = 0;

  /**
   * Indica si la petición HTTP para asignar el producto está
   * actualmente ejecutándose.
   */
  asignandoProducto = false;

  // ============================================================
  // SEGUNDO PASO: DOCUMENTACIÓN
  // ============================================================

  pasoAsignacion: 'cliente' | 'documentacion' = 'cliente';

  /**
   * Guardamos el Trabajo que devuelve el backend al asignar
   * el producto al cliente.
   *
   * Su ID será necesario para generar posteriormente
   * el albarán/factura.
   */
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

          // Si cambiamos de empresa mientras está abierto
          // el flujo de asignación, lo cerramos.
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

        // Arrancamos automáticamente el nuevo flujo.
        this.abrirAsignacionCliente(nuevo);
      },

      error: (err: HttpErrorResponse) => {
        this.loading = false;

        console.error(err);

        alert(
          err.error?.message ||
            err.error ||
            'No se pudo crear el producto',
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

  setAjuste(
    productoId: number | string,
    value: number | string,
  ): void {
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

    const motivo =
      prompt('Motivo de la subida de unidades (opcional):') || '';

    this.productosService
      .ajustarStock(id, cant, motivo)
      .subscribe({
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

    const motivo =
      prompt('Motivo de la bajada de unidades (opcional):') || '';

    this.productosService
      .ajustarStock(id, -cant, motivo)
      .subscribe({
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

    this.productosService
      .getMovimientosPorProducto(id)
      .subscribe({
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
    const filtro = this.filtroCodigo
      .trim()
      .toLowerCase();

    if (!filtro) {
      return this.movimientosProducto;
    }

    return this.movimientosProducto.filter((m) =>
      (m.producto?.referencia || '')
        .toLowerCase()
        .includes(filtro),
    );
  }

  // ============================================================
  // FILTRO PRODUCTOS
  // ============================================================

  get productosFiltrados(): IProducto[] {
    const filtro = this.filtroProducto
      .trim()
      .toLowerCase();

    if (!filtro) {
      return this.productos;
    }

    return this.productos.filter(
      (p) =>
        (p.referencia || '')
          .toLowerCase()
          .includes(filtro) ||
        (p.gama || '')
          .toLowerCase()
          .includes(filtro) ||
        (p.marca || '')
          .toLowerCase()
          .includes(filtro) ||
        (p.modelo || '')
          .toLowerCase()
          .includes(filtro) ||
        (p.familia || '')
          .toLowerCase()
          .includes(filtro) ||
        (p.subfamilia || '')
          .toLowerCase()
          .includes(filtro) ||
        (p.descripcion || '')
          .toLowerCase()
          .includes(filtro),
    );
  }

  // ============================================================
  // FILTRO CLIENTES
  // ============================================================

  get clientesFiltrados(): ICliente[] {
    const filtro = this.filtroCliente
      .trim()
      .toLowerCase();

    if (!filtro) {
      return this.clientes;
    }

    return this.clientes.filter((c) =>
      [
        c.nombreApellidos,
        c.cifDni,
        c.telefono,
        c.movil,
        c.email,
      ]
        .filter(Boolean)
        .some((valor) =>
          String(valor)
            .toLowerCase()
            .includes(filtro),
        ),
    );
  }

  // ============================================================
  // ABRIR MODAL DE ASIGNACIÓN
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
  // CERRAR MODAL
  // ============================================================

  cerrarAsignacionCliente(): void {
    if (
      this.asignandoProducto ||
      this.generandoDocumento
    ) {
      return;
    }

    this.finalizarFlujoProducto();
  }

  // ============================================================
  // ASIGNAR PRODUCTO A CLIENTE
  // ============================================================

  asignarProductoACliente(): void {
    const producto = this.productoRecienCreado;

    // ----------------------------------------------------------
    // Validar producto
    // ----------------------------------------------------------

    if (!producto?.id) {
      alert(
        'No se ha podido identificar el producto.',
      );
      return;
    }

    // ----------------------------------------------------------
    // Validar cliente
    // ----------------------------------------------------------

    if (!this.clienteSeleccionadoId) {
      alert('Selecciona un cliente.');
      return;
    }

    // ----------------------------------------------------------
    // Validar cantidad
    // ----------------------------------------------------------

    if (
      !Number.isFinite(Number(this.cantidadAsignar)) ||
      Number(this.cantidadAsignar) <= 0
    ) {
      alert(
        'La cantidad debe ser mayor que 0.',
      );
      return;
    }

    if (
      Number(this.cantidadAsignar) >
      Number(producto.unidades || 0)
    ) {
      alert(
        'No puedes asignar más unidades de las disponibles.',
      );
      return;
    }

    // ----------------------------------------------------------
    // Validar descuento
    // ----------------------------------------------------------

    if (
      !Number.isFinite(Number(this.descuentoAsignar)) ||
      Number(this.descuentoAsignar) < 0 ||
      Number(this.descuentoAsignar) > 100
    ) {
      alert(
        'El descuento debe estar entre 0 y 100.',
      );
      return;
    }

    // ----------------------------------------------------------
    // Validar importe pagado
    // ----------------------------------------------------------

    if (
      !Number.isFinite(Number(this.importePagadoCliente)) ||
      Number(this.importePagadoCliente) < 0
    ) {
      alert(
        'El importe pagado no puede ser negativo.',
      );
      return;
    }

    // ----------------------------------------------------------
    // Validar empresa
    // ----------------------------------------------------------

    if (!this.empresaActiva) {
      alert('Empresa no seleccionada.');
      return;
    }

    // ----------------------------------------------------------
    // Ejecutar asignación
    // ----------------------------------------------------------

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

          // ----------------------------------------------------
          // Actualizar stock visualmente
          // ----------------------------------------------------

          producto.unidades =
            Number(producto.unidades || 0) -
            Number(this.cantidadAsignar);

          // ----------------------------------------------------
          // Guardamos el Trabajo
          // ----------------------------------------------------

          this.trabajoRecienCreado =
            trabajoCreado;

          console.log(
            'Trabajo creado:',
            trabajoCreado,
          );

          // ----------------------------------------------------
          // Pasamos al segundo paso del modal
          // ----------------------------------------------------

          this.pasoAsignacion =
            'documentacion';
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
}