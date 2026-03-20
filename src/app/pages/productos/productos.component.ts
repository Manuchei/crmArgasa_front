import { ProductoServiceService } from './../../services/producto-service.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IProducto } from '../../interfaces/iproducto';
import { IProductoMovimiento } from '../../interfaces/iproducto-movimiento';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-productos',
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent implements OnInit, OnDestroy {
  productos: IProducto[] = [];
  movimientosProducto: IProductoMovimiento[] = [];
  productoSeleccionado: IProducto | null = null;

  empresaActiva: Empresa | null = null;

  form: IProducto = {
    codigo: '',
    nombre: '',
    modelo: '',
    stock: 5,
    empresa: 'ARGASA',
    precioSinIva: 0,
  };

  ajusteMap: Record<number, number> = {};
  loading = false;
  filtroCodigo = '';
  filtroProducto = '';
  mostrarModalMovimientos = false;

  private empresaSub?: Subscription;

  constructor(
    private productosService: ProductoServiceService,
    private empresaService: EmpresaService,
  ) {}

  ngOnInit(): void {
    this.empresaActiva = this.empresaService.getEmpresa();

    this.empresaSub = this.empresaService.empresa$.subscribe(
      (empresa: Empresa | null) => {
        this.empresaActiva = empresa;
        if (empresa) {
          this.cargar();
          this.cerrarMovimientos();
        }
      },
    );

    if (this.empresaActiva) {
      this.cargar();
    }
  }

  ngOnDestroy(): void {
    this.empresaSub?.unsubscribe();
  }

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

  crear(): void {
    if (!this.empresaActiva) {
      alert('Empresa no seleccionada');
      return;
    }

    if (!this.form.codigo?.trim() || !this.form.nombre?.trim()) {
      alert('Código y nombre son obligatorios');
      return;
    }

    if (this.form.precioSinIva < 0) {
      alert('El precio no puede ser negativo');
      return;
    }

    this.loading = true;

    const payload: IProducto = {
      codigo: this.form.codigo.trim(),
      nombre: this.form.nombre.trim(),
      modelo: this.form.modelo?.trim() || '',
      stock: this.form.stock,
      empresa: this.empresaActiva,
      precioSinIva: this.form.precioSinIva,
    };

    this.productosService.create(payload).subscribe({
      next: (nuevo: IProducto) => {
        this.productos.unshift(nuevo);
        this.form = {
          codigo: '',
          nombre: '',
          modelo: '',
          stock: 5,
          empresa: this.empresaActiva!,
          precioSinIva: 0,
        };
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        alert(
          err.error?.message || err.error || 'No se pudo crear el producto',
        );
      },
    });
  }

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

  subirStock(p: IProducto): void {
    const id = Number(p?.id);
    if (!id) return;

    const cant = this.getAjuste(id);
    const motivo = prompt('Motivo de la subida de stock (opcional):') || '';

    this.productosService.ajustarStock(id, cant, motivo).subscribe({
      next: (prodActualizado: IProducto) => {
        p.stock = prodActualizado.stock;
        this.ajusteMap[id] = 1;

        if (this.productoSeleccionado?.id === id) {
          this.verMovimientos(p);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        alert(err.error?.message || err.error || 'No se pudo subir el stock');
      },
    });
  }

  bajarStock(p: IProducto): void {
    const id = Number(p?.id);
    if (!id) return;

    const cant = this.getAjuste(id);
    const motivo = prompt('Motivo de la bajada de stock (opcional):') || '';

    this.productosService.ajustarStock(id, -cant, motivo).subscribe({
      next: (prodActualizado: IProducto) => {
        p.stock = prodActualizado.stock;
        this.ajusteMap[id] = 1;

        if (this.productoSeleccionado?.id === id) {
          this.verMovimientos(p);
        }
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        alert(err.error?.message || err.error || 'No se pudo bajar el stock');
      },
    });
  }

  verMovimientos(p: IProducto): void {
    const id = Number(p?.id);
    if (!id) return;

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

    if (!filtro) return this.movimientosProducto;

    return this.movimientosProducto.filter((m) =>
      (m.producto?.codigo || '').toLowerCase().includes(filtro),
    );
  }

  get productosFiltrados(): IProducto[] {
    const filtro = this.filtroProducto.trim().toLowerCase();

    if (!filtro) {
      return this.productos;
    }

    return this.productos.filter(
      (p) =>
        (p.codigo || '').toLowerCase().includes(filtro) ||
        (p.nombre || '').toLowerCase().includes(filtro) ||
        (p.modelo || '').toLowerCase().includes(filtro),
    );
  }
}
