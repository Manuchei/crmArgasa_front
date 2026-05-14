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

  form: IProducto = this.getFormVacio();

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
          this.form.empresa = empresa;
          this.cargar();
          this.cerrarMovimientos();
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

  private getFormVacio(): IProducto {
    return {
      fechaAlta: '',
      referencia: '',
      marca: '',
      modelo: '',
      familia: '',
      subfamilia: '',
      descripcion: '',
      unidades: 0,
      empresa: this.empresaActiva || 'ARGASA',
      precioSinIva: 0,
    };
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

    if (
      !this.form.referencia?.trim() ||
      !this.form.marca?.trim() ||
      !this.form.modelo?.trim() ||
      !this.form.familia?.trim() ||
      !this.form.subfamilia?.trim() ||
      !this.form.descripcion?.trim()
    ) {
      alert(
        'Referencia, marca, modelo, familia, subfamilia y descripción son obligatorios',
      );
      return;
    }

    if ((this.form.unidades || 0) < 0) {
      alert('Las unidades no pueden ser negativas');
      return;
    }

    this.loading = true;

    const payload: IProducto = {
      fechaAlta: this.form.fechaAlta || undefined,
      referencia: this.form.referencia.trim(),
      marca: this.form.marca.trim(),
      modelo: this.form.modelo.trim(),
      familia: this.form.familia.trim(),
      subfamilia: this.form.subfamilia.trim(),
      descripcion: this.form.descripcion.trim(),
      unidades: this.form.unidades || 0,
      empresa: this.empresaActiva,
      precioSinIva: 0,
    };

    this.productosService.create(payload).subscribe({
      next: (nuevo: IProducto) => {
        this.productos.unshift(nuevo);
        this.form = this.getFormVacio();
        this.form.empresa = this.empresaActiva!;
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

  subirUnidades(p: IProducto): void {
    const id = Number(p?.id);
    if (!id) return;

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
    if (!id) return;

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

    if (!filtro) {
      return this.movimientosProducto;
    }

    return this.movimientosProducto.filter((m) =>
      (m.producto?.referencia || '').toLowerCase().includes(filtro),
    );
  }

  get productosFiltrados(): IProducto[] {
    const filtro = this.filtroProducto.trim().toLowerCase();

    if (!filtro) {
      return this.productos;
    }

    return this.productos.filter(
      (p) =>
        (p.referencia || '').toLowerCase().includes(filtro) ||
        (p.marca || '').toLowerCase().includes(filtro) ||
        (p.modelo || '').toLowerCase().includes(filtro) ||
        (p.familia || '').toLowerCase().includes(filtro) ||
        (p.subfamilia || '').toLowerCase().includes(filtro) ||
        (p.descripcion || '').toLowerCase().includes(filtro),
    );
  }
}
