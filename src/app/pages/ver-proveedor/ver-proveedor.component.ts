import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import { FacturasProveedoresService } from '../../services/facturas-proveedores.service';
import { ProductoServiceService } from '../../services/producto-service.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IProducto } from '../../interfaces/iproducto';
import { FacturarProveedorComponent } from '../facturar-proveedor/facturar-proveedor.component';

@Component({
  selector: 'app-ver-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule, FacturarProveedorComponent],
  templateUrl: './ver-proveedor.component.html',
  styleUrls: ['./ver-proveedor.component.css'],
})
export class VerProveedorComponent implements OnInit {
  proveedor: any = null;
  trabajos: any[] = [];
  albaranes: any[] = [];

  numeroAlbaranProveedor = '';
  creandoAlbaran = false;
  albaranGenerandoFacturaId: number | null = null;

  activeTab: 'datos' | 'albaranes' | 'facturacion' | 'productos' = 'datos';

  nuevoTrabajo = this.obraVacia();

  obraDetalle: any = null;
  cargandoObra = false;
  guardandoObraDetalle = false;
  estadoSeleccionado = '';

  nuevoArticuloObra = {
    fecha: this.fechaHoy(),
    descripcion: '',
    cantidad: 1,
    precioUnitario: 0,
  };

  nuevoPagoObra = {
    fecha: this.fechaHoy(),
    importe: 0,
    concepto: '',
  };

  nuevoProducto: IProducto = this.getNuevoProductoVacio();

  totalImporte = 0;
  totalPagado = 0;
  totalPendiente = 0;

  guardandoProducto = false;
  guardandoTrabajo = false;

  constructor(
    private route: ActivatedRoute,
    private proveedorService: ProveedorService,
    private productoService: ProductoServiceService,
    private facturasProveedoresService: FacturasProveedoresService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('tab') === 'albaranes') {
      this.activeTab = 'albaranes';
    }

    this.cargarProveedor();
  }

  setActiveTab(tab: 'datos' | 'albaranes' | 'facturacion' | 'productos'): void {
    this.activeTab = tab;
  }

  private getNuevoProductoVacio(): IProducto {
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
      empresa: '',
    };
  }

  private asegurarProductos(): void {
    if (!this.proveedor) return;

    if (!Array.isArray(this.proveedor.productos)) {
      this.proveedor.productos = [];
    }
  }

  private normalizarNumero(valor: any): number {
    const numero = Number(valor);
    return isNaN(numero) ? 0 : numero;
  }

  private trim(valor: any): string {
    return typeof valor === 'string' ? valor.trim() : '';
  }

  cargarProveedor(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      alert('Id de proveedor no válido');
      return;
    }

    this.proveedorService.getProveedorById(id).subscribe({
      next: (data) => {
        this.proveedor = data;
        this.asegurarProductos();
        this.calcularTotales();
        this.cargarTrabajos();
        this.cargarAlbaranes();
      },
      error: (err) => {
        console.error('Error cargando proveedor', err);
        alert('No se pudo cargar el proveedor');
      },
    });
  }

  cargarTrabajos(): void {
    if (!this.proveedor?.id) return;

    this.proveedorService.getTrabajosByProveedor(this.proveedor.id).subscribe({
      next: (data) => {
        this.trabajos = data || [];
        this.calcularTotales();
      },
      error: (err) => {
        console.error('Error cargando trabajos', err);
        alert('No se pudieron cargar los trabajos');
      },
    });
  }

  cargarAlbaranes(): void {
    if (!this.proveedor?.id) return;

    this.proveedorService
      .listarAlbaranesProveedor(this.proveedor.id)
      .subscribe({
        next: (data) => {
          this.albaranes = data || [];
        },
        error: (err) => {
          console.error('Error cargando albaranes', err);
        },
      });
  }

  guardarTrabajo(): void {
    if (!this.proveedor?.id || this.guardandoTrabajo) return;

    const t = this.nuevoTrabajo;

    if (
      !t.descripcion.trim() ||
      !t.fecha ||
      !t.nombreContacto.trim() ||
      !t.direccionObra.trim() ||
      !t.telefonoObra.trim()
    ) {
      alert('Completa nombre de obra, fecha, contacto, dirección y teléfono.');
      return;
    }

    this.guardandoTrabajo = true;

    this.proveedorService
      .crearObra(this.proveedor.id, {
        descripcion: t.descripcion.trim(),
        fecha: t.fecha,
        nombreContacto: t.nombreContacto.trim(),
        direccionObra: t.direccionObra.trim(),
        telefonoObra: t.telefonoObra.trim(),
      })
      .subscribe({
        next: (obra) => {
          this.guardandoTrabajo = false;
          this.nuevoTrabajo = this.obraVacia();
          this.cargarTrabajos();
          this.abrirObra(obra);
        },
        error: (err) => {
          this.guardandoTrabajo = false;
          this.errorObra(err);
        },
      });
  }
  eliminarTrabajo(id: number): void {
    this.proveedorService.eliminarTrabajo(id).subscribe({
      next: () => {
        this.cargarTrabajos();
      },
      error: (err) => {
        console.error('Error al eliminar trabajo', err);
        alert('No se pudo eliminar el trabajo');
      },
    });
  }

  guardarProducto(): void {
    if (!this.proveedor?.id) {
      alert('Proveedor no cargado');
      return;
    }

    const gama = this.trim(this.nuevoProducto.gama);
    const marca = this.trim(this.nuevoProducto.marca);
    const modelo = this.trim(this.nuevoProducto.modelo);
    const familia = this.trim(this.nuevoProducto.familia);
    const subfamilia = this.trim(this.nuevoProducto.subfamilia);
    const descripcion = this.trim(this.nuevoProducto.descripcion);
    const precioSinIva = this.normalizarNumero(this.nuevoProducto.precioSinIva);
    const unidades = this.normalizarNumero(this.nuevoProducto.unidades);

    if (!gama || !marca || !modelo || !familia || !subfamilia || !descripcion) {
      alert(
        'Gama, marca, modelo, familia, subfamilia y descripción son obligatorios',
      );
      return;
    }

    if (precioSinIva < 0) {
      alert('El precio no puede ser negativo');
      return;
    }

    if (unidades < 0) {
      alert('Las unidades no pueden ser negativas');
      return;
    }

    const payload: IProducto = {
      fechaAlta: this.nuevoProducto.fechaAlta || undefined,
      gama,
      marca,
      modelo,
      familia,
      subfamilia,
      descripcion,
      unidades,
      precioSinIva,
      empresa: '',
      proveedor: { id: this.proveedor.id },
      referencia: '',
    };

    this.guardandoProducto = true;

    this.productoService.crearProducto(payload).subscribe({
      next: () => {
        this.nuevoProducto = this.getNuevoProductoVacio();
        this.guardandoProducto = false;
        this.cargarProveedor();
        alert('Producto añadido correctamente');
      },
      error: (err) => {
        console.error('Error al guardar producto', err);
        this.guardandoProducto = false;
        alert(
          err?.error?.message || err?.error || 'Error al añadir el producto',
        );
      },
    });
  }

  eliminarProducto(index: number): void {
    if (!this.proveedor?.id) return;

    this.asegurarProductos();

    const producto = this.proveedor.productos[index];
    if (!producto) return;

    const confirmar = confirm(
      `¿Seguro que deseas eliminar el producto "${producto.descripcion}"?`,
    );

    if (!confirmar) return;

    alert(
      'La eliminación de productos debe hacerse con su endpoint específico.',
    );
  }

  generarAlbaran(): void {
    if (!this.proveedor?.id) {
      alert('Proveedor no cargado');
      return;
    }

    this.creandoAlbaran = true;

    const payload = {
      numeroProveedor: this.numeroAlbaranProveedor?.trim() || null,
      fechaEmision: this.fechaHoy(),
    };

    this.proveedorService
      .crearAlbaranProveedor(this.proveedor.id, payload)
      .subscribe({
        next: (albaran) => {
          this.creandoAlbaran = false;
          this.numeroAlbaranProveedor = '';

          alert('Albarán generado correctamente');
          this.cargarAlbaranes();

          if (albaran?.id) {
            this.verAlbaran(albaran);
          }
        },
        error: (err) => {
          console.error('Error al generar albarán', err);
          this.creandoAlbaran = false;
          alert(
            err?.error?.message || err?.error || 'Error al generar el albarán',
          );
        },
      });
  }

  generarFacturaDesdeAlbaran(albaran: any): void {
    if (!albaran?.id) {
      alert('Albarán no válido');
      return;
    }

    if (!albaran.confirmado) {
      alert('Primero debes confirmar el albarán');
      return;
    }

    this.albaranGenerandoFacturaId = albaran.id;

    this.facturasProveedoresService.generarDesdeAlbaran(albaran.id).subscribe({
      next: (factura) => {
        this.albaranGenerandoFacturaId = null;

        if (!factura?.id) {
          alert('No se ha podido generar la factura');
          return;
        }

        alert('Factura generada correctamente');
        this.activeTab = 'facturacion';
      },
      error: (err) => {
        console.error('Error al generar factura desde albarán', err);
        this.albaranGenerandoFacturaId = null;
        alert(
          err?.error?.message ||
            err?.error ||
            'Error al generar la factura desde el albarán',
        );
      },
    });
  }

  verAlbaran(albaran: any): void {
    if (!albaran?.id) return;

    this.router.navigate(['/app/albaranes-proveedor', albaran.id], {
      queryParams: { proveedorId: this.proveedor?.id },
      state: { proveedorId: this.proveedor?.id, volverA: 'albaranes' },
    });
  }

  editarAlbaran(albaran: any): void {
    if (!albaran?.id) return;

    this.router.navigate(['/app/albaranes-proveedor/editar', albaran.id], {
      queryParams: { proveedorId: this.proveedor?.id },
      state: { proveedorId: this.proveedor?.id, volverA: 'albaranes' },
    });
  }

  eliminarAlbaran(albaran: any): void {
    if (!albaran?.id) return;

    const confirmar = confirm(
      albaran.confirmado
        ? `Este albarán está CONFIRMADO. ¿Seguro que deseas eliminar el albarán #${albaran.id}?`
        : `¿Seguro que deseas eliminar el albarán #${albaran.id}?`,
    );

    if (!confirmar) return;

    this.proveedorService.eliminarAlbaranProveedor(albaran.id).subscribe({
      next: () => {
        this.cargarAlbaranes();
      },
      error: (err) => {
        console.error('Error al eliminar albarán', err);
        alert(
          err?.error?.message || err?.error || 'No se pudo eliminar el albarán',
        );
      },
    });
  }

  calcularTotales(): void {
    let totalProductos = 0;
    let totalTrabajos = 0;
    let totalPagadoTrabajos = 0;

    const productos = Array.isArray(this.proveedor?.productos)
      ? this.proveedor.productos
      : [];

    productos.forEach((p: any) => {
      const precio = this.normalizarNumero(p.precioSinIva);
      const unidades = this.normalizarNumero(p.unidades);

      totalProductos += precio * unidades;
    });

    this.trabajos.forEach((t) => {
      const importe = this.normalizarNumero(t.importe);
      const pagado = this.normalizarNumero(t.importePagado);

      totalTrabajos += importe;
      totalPagadoTrabajos += pagado;
    });

    this.totalImporte = this.redondear2(totalProductos + totalTrabajos);
    this.totalPagado = this.redondear2(totalPagadoTrabajos);
    this.totalPendiente = this.redondear2(this.totalImporte - this.totalPagado);

    if (this.totalPendiente < 0) {
      this.totalPendiente = 0;
    }
  }

  private redondear2(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  volver(): void {
    this.router.navigate(['/app/proveedores']);
  }

  irEditar(): void {
    if (!this.proveedor?.id) return;
    this.router.navigate(['/app/proveedores/editar', this.proveedor.id]);
  }

  formatearIbanVisual(iban?: string): string {
    return (iban || '').match(/.{1,4}/g)?.join(' ') || '';
  }

  private fechaHoy(): string {
    const fecha = new Date();
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private obraVacia() {
    return {
      descripcion: '',
      fecha: this.fechaHoy(),
      nombreContacto: '',
      direccionObra: '',
      telefonoObra: '',
    };
  }

  private errorObra(err: any): void {
    const mensaje = err?.error?.message;

    alert(
      mensaje && mensaje !== 'No message available'
        ? mensaje
        : 'No se pudo completar la operación. Revisa la respuesta del backend.',
    );
  }

  abrirObra(t: any): void {
    if (this.cargandoObra || this.guardandoObraDetalle) return;

    this.cargandoObra = true;
    this.obraDetalle = null;

    this.proveedorService.getObra(t.id).subscribe({
      next: (detalle) => {
        this.obraDetalle = detalle;
        this.estadoSeleccionado = detalle.trabajo.estadoObra;
        this.cargandoObra = false;
      },
      error: (err) => {
        this.cargandoObra = false;
        this.errorObra(err);
      },
    });
  }

  cerrarObra(): void {
    if (this.guardandoObraDetalle) return;
    this.obraDetalle = null;
  }

  private actualizarDetalleObra(detalle: any): void {
    this.obraDetalle = detalle;
    this.estadoSeleccionado = detalle.trabajo.estadoObra;
    this.guardandoObraDetalle = false;
    this.cargarTrabajos();
  }

  guardarArticuloObra(): void {
    if (!this.obraDetalle || this.guardandoObraDetalle) return;

    const a = this.nuevoArticuloObra;
    const cantidad = Number(a.cantidad);
    const precio = Number(a.precioUnitario);

    if (
      !a.fecha ||
      !a.descripcion.trim() ||
      !Number.isFinite(cantidad) ||
      cantidad <= 0 ||
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      alert('Introduce fecha, artículo, cantidad válida y precio.');
      return;
    }

    this.guardandoObraDetalle = true;

    this.proveedorService
      .agregarArticuloObra(this.obraDetalle.trabajo.id, {
        fecha: a.fecha,
        descripcion: a.descripcion.trim(),
        cantidad,
        precioUnitario: precio,
      })
      .subscribe({
        next: (detalle) => {
          this.nuevoArticuloObra = {
            fecha: this.fechaHoy(),
            descripcion: '',
            cantidad: 1,
            precioUnitario: 0,
          };
          this.actualizarDetalleObra(detalle);
        },
        error: (err) => {
          this.guardandoObraDetalle = false;
          this.errorObra(err);
        },
      });
  }

  guardarPagoObra(): void {
    if (!this.obraDetalle || this.guardandoObraDetalle) return;

    const p = this.nuevoPagoObra;
    const importe = Number(p.importe);

    if (!p.fecha || !Number.isFinite(importe) || importe <= 0) {
      alert('Introduce una fecha y un pago mayor que cero.');
      return;
    }

    this.guardandoObraDetalle = true;

    this.proveedorService
      .agregarPagoObra(this.obraDetalle.trabajo.id, {
        fecha: p.fecha,
        importe,
        concepto: p.concepto.trim(),
      })
      .subscribe({
        next: (detalle) => {
          this.nuevoPagoObra = {
            fecha: this.fechaHoy(),
            importe: 0,
            concepto: '',
          };
          this.actualizarDetalleObra(detalle);
        },
        error: (err) => {
          this.guardandoObraDetalle = false;
          this.errorObra(err);
        },
      });
  }

  guardarEstadoObra(): void {
    if (!this.obraDetalle || this.guardandoObraDetalle) return;

    this.guardandoObraDetalle = true;

    this.proveedorService
      .cambiarEstadoObra(this.obraDetalle.trabajo.id, this.estadoSeleccionado)
      .subscribe({
        next: (detalle) => this.actualizarDetalleObra(detalle),
        error: (err) => {
          this.guardandoObraDetalle = false;
          this.errorObra(err);
        },
      });
  }
}
