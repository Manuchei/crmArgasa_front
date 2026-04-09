import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IProducto } from '../../interfaces/iproducto';

@Component({
  selector: 'app-ver-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ver-proveedor.component.html',
  styleUrls: ['./ver-proveedor.component.css'],
})
export class VerProveedorComponent implements OnInit {
  proveedor: any;
  trabajos: any[] = [];

  nuevoTrabajo = {
    descripcion: '',
    importe: 0,
    importePagado: 0,
  };

  nuevoProducto: IProducto = {
    codigo: '',
    nombre: '',
    modelo: '',
    stock: 0,
    empresa: '',
    precioSinIva: 0,
  };

  totalImporte = 0;
  totalPagado = 0;
  totalPendiente = 0;

  guardandoProducto = false;
  guardandoTrabajo = false;

  constructor(
    private route: ActivatedRoute,
    private proveedorService: ProveedorService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarProveedor();
  }

  cargarProveedor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.proveedorService.getProveedorById(id).subscribe({
      next: (data) => {
        this.proveedor = data;

        if (!this.proveedor.productos) {
          this.proveedor.productos = [];
        }

        this.cargarTrabajos();
      },
      error: (err) => {
        console.error('Error cargando proveedor', err);
        alert('No se pudo cargar el proveedor');
      },
    });
  }

  cargarTrabajos() {
    if (!this.proveedor?.id) return;

    this.proveedorService.getTrabajosByProveedor(this.proveedor.id).subscribe({
      next: (data) => {
        this.trabajos = data;
        this.calcularTotales();
      },
      error: (err) => {
        console.error('Error cargando trabajos', err);
        alert('No se pudieron cargar los trabajos');
      },
    });
  }

  guardarTrabajo() {
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
      importe: Number(this.nuevoTrabajo.importe) || 0,
      importePagado: Number(this.nuevoTrabajo.importePagado) || 0,
    };

    this.guardandoTrabajo = true;

    this.proveedorService
      .crearTrabajoProveedor(this.proveedor.id, payload)
      .subscribe({
        next: (res) => {
          console.log('Trabajo guardado correctamente', res);

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

  eliminarTrabajo(id: number) {
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

  guardarProducto() {
    if (!this.proveedor) return;

    if (
      !this.nuevoProducto.codigo.trim() ||
      !this.nuevoProducto.nombre.trim()
    ) {
      alert('Código y nombre del producto son obligatorios');
      return;
    }

    const existeCodigo = (this.proveedor.productos || []).some(
      (p: IProducto) =>
        p.codigo?.trim().toLowerCase() ===
        this.nuevoProducto.codigo.trim().toLowerCase(),
    );

    if (existeCodigo) {
      alert('Ya existe un producto con ese código en este proveedor');
      return;
    }

    const productoAInsertar: IProducto = {
      codigo: this.nuevoProducto.codigo.trim(),
      nombre: this.nuevoProducto.nombre.trim(),
      modelo: this.nuevoProducto.modelo?.trim() || '',
      stock: Number(this.nuevoProducto.stock) || 0,
      precioSinIva: Number(this.nuevoProducto.precioSinIva) || 0,
      empresa: '',
    };

    if (!this.proveedor.productos) {
      this.proveedor.productos = [];
    }

    this.proveedor.productos = [...this.proveedor.productos, productoAInsertar];

    this.guardandoProducto = true;

    this.proveedorService
      .actualizarProveedor(this.proveedor.id, this.proveedor)
      .subscribe({
        next: (proveedorActualizado) => {
          this.proveedor = proveedorActualizado;

          if (!this.proveedor.productos) {
            this.proveedor.productos = [];
          }

          this.nuevoProducto = {
            codigo: '',
            nombre: '',
            modelo: '',
            stock: 0,
            empresa: '',
            precioSinIva: 0,
          };

          this.guardandoProducto = false;
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

  eliminarProducto(index: number) {
    if (!this.proveedor || !this.proveedor.productos) return;

    const producto = this.proveedor.productos[index];
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
          if (!this.proveedor.productos) {
            this.proveedor.productos = [];
          }
        },
        error: (err) => {
          console.error('Error al eliminar producto', err);
          alert('No se pudo eliminar el producto');
          this.cargarProveedor();
        },
      });
  }

  calcularTotales() {
    this.totalImporte = 0;
    this.totalPagado = 0;

    this.trabajos.forEach((t) => {
      this.totalImporte += Number(t.importe) || 0;
      this.totalPagado += Number(t.importePagado) || 0;
    });

    this.totalPendiente = this.totalImporte - this.totalPagado;
  }

  volver() {
    this.router.navigate(['/app/proveedores']);
  }

  irEditar() {
    this.router.navigate(['/app/proveedores/editar', this.proveedor.id]);
  }
}
