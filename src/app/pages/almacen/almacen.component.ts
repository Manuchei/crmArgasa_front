import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IInventario, IInventarioLinea } from '../../interfaces/iinventario';
import { InventarioService } from '../../services/inventario.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-almacen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './almacen.component.html',
  styleUrls: ['./almacen.component.css'],
})
export class AlmacenComponent implements OnInit {
  inventarios: IInventario[] = [];

  inventario: IInventario = {
    descripcion: '',
    realizadoPor: '',
    lineas: [],
  };
  

  cargando = false;
  mensaje = '';

  constructor(private inventarioService: InventarioService, private router: Router) {}

  ngOnInit(): void {
    this.cargarInventarios();
    this.prepararInventario();
  }

  cargarInventarios(): void {
    this.cargando = true;

    this.inventarioService.listar().subscribe({
      next: (data) => {
        this.inventarios = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error(error);
        this.mensaje = 'Error al cargar los inventarios';
        this.cargando = false;
      },
    });
  }

  prepararInventario(): void {
    this.inventarioService.prepararInventario().subscribe({
      next: (data) => {
        this.inventario = data;
      },
      error: (error) => {
        console.error(error);
        this.mensaje = 'Error al preparar inventario';
      },
    });
  }

  actualizarLinea(linea: IInventarioLinea): void {
    linea.diferencia =
      Number(linea.stockContado || 0) - Number(linea.stockSistema || 0);

    linea.precioTotal =
      Number(linea.stockContado || 0) * Number(linea.precioUnitario || 0);
  }

  guardarInventario(): void {
    if (!this.inventario.descripcion || !this.inventario.realizadoPor) {
      this.mensaje = 'Debes indicar descripción y persona responsable';
      return;
    }

    if (this.inventario.lineas.length === 0) {
      this.mensaje = 'No hay productos para inventariar';
      return;
    }

    this.inventario.totalUnidades = this.calcularTotalUnidades();
    this.inventario.totalInventario = this.calcularTotalInventario();

    this.inventarioService.crear(this.inventario).subscribe({
      next: () => {
        this.mensaje = 'Inventario guardado correctamente';
        this.cargarInventarios();
        this.prepararInventario();
      },
      error: (error) => {
        console.error(error);
        this.mensaje = 'Error al guardar el inventario';
      },
    });
  }

  eliminarInventario(id?: number): void {
    if (!id) return;

    if (!confirm('¿Seguro que deseas eliminar este inventario?')) {
      return;
    }

    this.inventarioService.eliminar(id).subscribe({
      next: () => {
        this.mensaje = 'Inventario eliminado correctamente';
        this.cargarInventarios();
      },
      error: (error) => {
        console.error(error);
        this.mensaje = 'Error al eliminar el inventario';
      },
    });
  }

  calcularTotalUnidades(): number {
    return this.inventario.lineas.reduce((total, linea) => {
      return total + Number(linea.stockContado || 0);
    }, 0);
  }

  calcularTotalInventario(): number {
    return this.inventario.lineas.reduce((total, linea) => {
      return total + Number(linea.precioTotal || 0);
    }, 0);
  }

  verDetalle(id?: number): void {
  if (!id) return;

  this.router.navigate(['/app/almacen/detalle', id]);
}
  
}
