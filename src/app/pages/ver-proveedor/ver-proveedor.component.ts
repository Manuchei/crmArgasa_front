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
    private productoService: ProductoServiceService,
    private facturasProveedoresService: FacturasProveedoresService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarProveedor();
  }

  setActiveTab(tab: 'datos' | 'albaranes' | 'facturacion' | 'productos'): void {
    this.activeTab = tab;
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

    this.proveedorService.listarAlbaranesProveedor(this.proveedor.id).subscribe({
      next: (data) => {
        this.albaranes = data || [];
      },
      error: (err) => {
        console.error('Error cargando albaranes', err);
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

    this.proveedorService.crearTrabajoProveedor(this.proveedor.id, payload).subscribe({
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

    const codigo = this.trim(this.nuevoProducto.codigo);
    const nombre = this.trim(this.nuevoProducto.nombre);
    const modelo = this.trim(this.nuevoProducto.modelo);

    if (!codigo || !nombre) {
      alert('Código y nombre del producto son obligatorios');
      return;
    }

    this.asegurarProductos();

    const existeCodigo = this.proveedor.productos.some(
      (p: IProducto) => this.trim(p.codigo).toLowerCase() === codigo.toLowerCase(),
    );

    if (existeCodigo) {
      alert('Ya existe un producto con ese código en este proveedor');
      return;
    }

    const payload: IProducto = {
      codigo,
      nombre,
      modelo,
      stock: this.normalizarNumero(this.nuevoProducto.stock),
      precioSinIva: this.normalizarNumero(this.nuevoProducto.precioSinIva),
      empresa: '',
      proveedor: { id: this.proveedor.id } as any,
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
      `¿Seguro que deseas eliminar el producto "${producto.nombre}"?`,
    );
    if (!confirmar) return;

    alert('La eliminación de productos debe hacerse con su endpoint específico.');
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

    this.proveedorService.crearAlbaranProveedor(this.proveedor.id, payload).subscribe({
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
        : `¿Seguro que deseas eliminar el albarán #${albaran.id}?`
    );

    if (!confirmar) return;

    this.proveedorService.eliminarAlbaranProveedor(albaran.id).subscribe({
      next: () => {
        this.cargarAlbaranes();
      },
      error: (err) => {
        console.error('Error al eliminar albarán', err);
        alert(
          err?.error?.message ||
          err?.error ||
          'No se pudo eliminar el albarán'
        );
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