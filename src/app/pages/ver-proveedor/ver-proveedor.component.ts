import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import { FacturasProveedoresService } from '../../services/facturas-proveedores.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IProducto } from '../../interfaces/iproducto';
import { IfacturaProveedor } from '../../interfaces/ifactura-proveedor';

@Component({
  selector: 'app-ver-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ver-proveedor.component.html',
  styleUrls: ['./ver-proveedor.component.css'],
})
export class VerProveedorComponent implements OnInit {
  proveedor: any = null;
  trabajos: any[] = [];
  albaranes: any[] = [];
  facturas: IfacturaProveedor[] = [];

  numeroAlbaranProveedor = '';
  creandoAlbaran = false;
  generandoFactura = false;
  cargandoFacturas = false;

  nuevoTrabajo = {
    descripcion: '',
    importe: 0,
    importePagado: 0,
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
    private facturasProveedoresService: FacturasProveedoresService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarProveedor();
  }

  private getNuevoProductoVacio(): IProducto {
    return {
      codigo: '',
      nombre: '',
      modelo: '',
      stock: 0,
      empresa: '',
      precioSinIva: 0,
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
        this.cargarFacturas();
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

  cargarFacturas(): void {
    if (!this.proveedor?.id) return;

    this.cargandoFacturas = true;

    this.facturasProveedoresService
      .getByProveedor(this.proveedor.id)
      .subscribe({
        next: (data) => {
          this.facturas = (data || []).map((f) => ({
            ...f,
            numeroFacturaProveedor: f.numeroFacturaProveedor ?? '',
          }));
          this.cargandoFacturas = false;
        },
        error: (err) => {
          console.error('Error cargando facturas', err);
          this.cargandoFacturas = false;
        },
      });
  }

  guardarTrabajo(): void {
    if (!this.proveedor?.id) {
      alert('Proveedor no cargado');
      return;
    }

    if (!this.nuevoTrabajo.descripcion.trim()) {
      alert('La descripción es obligatoria');
      return;
    }

    const payload = {
      descripcion: this.nuevoTrabajo.descripcion.trim(),
      importe: this.normalizarNumero(this.nuevoTrabajo.importe),
      importePagado: this.normalizarNumero(this.nuevoTrabajo.importePagado),
    };

    this.guardandoTrabajo = true;

    this.proveedorService
      .crearTrabajoProveedor(this.proveedor.id, payload)
      .subscribe({
        next: () => {
          this.nuevoTrabajo = {
            descripcion: '',
            importe: 0,
            importePagado: 0,
          };

          this.guardandoTrabajo = false;
          this.cargarTrabajos();
        },
        error: (err) => {
          console.error('Error al guardar trabajo', err);
          this.guardandoTrabajo = false;
          alert(
            err?.error?.message || err?.error || 'Error al guardar el trabajo',
          );
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

    const codigo = this.nuevoProducto.codigo?.trim();
    const nombre = this.nuevoProducto.nombre?.trim();
    const modelo = this.nuevoProducto.modelo?.trim() || '';

    if (!codigo || !nombre) {
      alert('Código y nombre del producto son obligatorios');
      return;
    }

    this.asegurarProductos();

    const existeCodigo = this.proveedor.productos.some(
      (p: IProducto) => p.codigo?.trim().toLowerCase() === codigo.toLowerCase(),
    );

    if (existeCodigo) {
      alert('Ya existe un producto con ese código en este proveedor');
      return;
    }

    const productoAInsertar: IProducto = {
      codigo,
      nombre,
      modelo,
      stock: this.normalizarNumero(this.nuevoProducto.stock),
      precioSinIva: this.normalizarNumero(this.nuevoProducto.precioSinIva),
      empresa: '',
    };

    this.proveedor.productos = [...this.proveedor.productos, productoAInsertar];
    this.guardandoProducto = true;

    this.proveedorService
      .actualizarProveedor(this.proveedor.id, this.proveedor)
      .subscribe({
        next: (proveedorActualizado) => {
          this.proveedor = proveedorActualizado;
          this.asegurarProductos();

          this.nuevoProducto = this.getNuevoProductoVacio();
          this.guardandoProducto = false;
          this.calcularTotales();

          alert('Producto añadido correctamente');
        },
        error: (err) => {
          console.error('Error al guardar producto', err);
          this.guardandoProducto = false;
          alert(
            err?.error?.message || err?.error || 'Error al añadir el producto',
          );
          this.cargarProveedor();
        },
      });
  }

  eliminarProducto(index: number): void {
    if (!this.proveedor?.id) return;

    this.asegurarProductos();

    const producto = this.proveedor.productos[index];
    if (!producto) return;

    const confirmar = confirm(
      `¿Seguro que deseas eliminar el producto "${producto.nombre}"?`,
    );

    if (!confirmar) return;

    this.proveedor.productos.splice(index, 1);
    this.proveedor.productos = [...this.proveedor.productos];

    this.proveedorService
      .actualizarProveedor(this.proveedor.id, this.proveedor)
      .subscribe({
        next: (proveedorActualizado) => {
          this.proveedor = proveedorActualizado;
          this.asegurarProductos();
          this.calcularTotales();
        },
        error: (err) => {
          console.error('Error al eliminar producto', err);
          alert('No se pudo eliminar el producto');
          this.cargarProveedor();
        },
      });
  }

  generarAlbaran(): void {
    if (!this.proveedor?.id) {
      alert('Proveedor no cargado');
      return;
    }

    if (!this.numeroAlbaranProveedor.trim()) {
      alert('Introduce el nº de albarán del proveedor');
      return;
    }

    this.creandoAlbaran = true;

    const payload = {
      numeroProveedor: this.numeroAlbaranProveedor.trim(),
      fechaEmision: new Date().toISOString().slice(0, 10),
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

  generarFacturaProveedor(): void {
    if (!this.proveedor?.id) {
      alert('Proveedor no cargado');
      return;
    }

    this.generandoFactura = true;

    this.facturasProveedoresService.generar(this.proveedor.id).subscribe({
      next: () => {
        this.generandoFactura = false;
        alert('Factura generada correctamente');
        this.cargarFacturas();
        this.cargarTrabajos();
      },
      error: (err) => {
        console.error('Error al generar factura', err);
        this.generandoFactura = false;
        alert(
          err?.error?.message || err?.error || 'Error al generar la factura',
        );
      },
    });
  }

  guardarNumeroFacturaProveedor(factura: IfacturaProveedor): void {
    if (!factura?.id) return;

    const numero = (factura.numeroFacturaProveedor || '').trim();

    this.facturasProveedoresService
      .actualizarNumeroFacturaProveedor(factura.id, numero)
      .subscribe({
        next: (facturaActualizada) => {
          factura.numeroFacturaProveedor =
            facturaActualizada.numeroFacturaProveedor || '';
          alert('Número de factura del proveedor guardado correctamente');
        },
        error: (err) => {
          console.error('Error guardando número de factura proveedor', err);
          alert(
            err?.error?.message ||
              err?.error ||
              'No se pudo guardar el número de factura del proveedor',
          );
        },
      });
  }

  pagarFactura(factura: IfacturaProveedor): void {
    if (!factura?.id) return;

    this.facturasProveedoresService.pagar(factura.id).subscribe({
      next: () => {
        alert('Factura marcada como pagada');
        this.cargarFacturas();
        this.cargarTrabajos();
      },
      error: (err) => {
        console.error('Error al pagar factura', err);
        alert(
          err?.error?.message || err?.error || 'No se pudo pagar la factura',
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
      `¿Seguro que deseas eliminar el albarán #${albaran.id}?`,
    );
    if (!confirmar) return;

    this.proveedorService.eliminarAlbaranProveedor(albaran.id).subscribe({
      next: () => {
        this.cargarAlbaranes();
      },
      error: (err) => {
        console.error('Error al eliminar albarán', err);
        alert('No se pudo eliminar el albarán');
      },
    });
  }

  calcularTotales(): void {
    this.totalImporte = 0;
    this.totalPagado = 0;

    this.trabajos.forEach((t) => {
      this.totalImporte += this.normalizarNumero(t.importe);
      this.totalPagado += this.normalizarNumero(t.importePagado);
    });

    (this.proveedor?.productos || []).forEach((p: IProducto) => {
      const precio = this.normalizarNumero(p.precioSinIva);
      const stock = this.normalizarNumero(p.stock);
      this.totalImporte += precio * stock;
    });

    this.totalPendiente = this.totalImporte - this.totalPagado;

    if (this.totalPendiente < 0) {
      this.totalPendiente = 0;
    }
  }

  volver(): void {
    this.router.navigate(['/app/proveedores']);
  }

  irEditar(): void {
    if (!this.proveedor?.id) return;
    this.router.navigate(['/app/proveedores/editar', this.proveedor.id]);
  }
}
