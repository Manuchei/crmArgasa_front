import { ProductoServiceService } from './../../services/producto-service.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { IProducto } from '../../interfaces/iproducto';
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

  empresaActiva: Empresa | null = null;

  form: IProducto = {
    codigo: '',
    nombre: '',
    stock: 5,
    empresa: 'ARGASA',
    precioSinIva: 0,
  };

  ajusteMap: Record<number, number> = {};
  loading = false;

  private empresaSub?: Subscription;

  constructor(
    private productosService: ProductoServiceService,
    private empresaService: EmpresaService,
  ) {}

  ngOnInit(): void {
    // empresa actual
    this.empresaActiva = this.empresaService.getEmpresa();

    // recarga si cambia
    this.empresaSub = this.empresaService.empresa$.subscribe((empresa) => {
      this.empresaActiva = empresa;
      if (empresa) this.cargar();
    });

    if (this.empresaActiva) this.cargar();
  }

  ngOnDestroy(): void {
    this.empresaSub?.unsubscribe();
  }

  cargar() {
    // ✅ ya no se pasa empresa: va por header X-Empresa (interceptor)
    this.productosService.list().subscribe((res) => {
      this.productos = res;
    });
  }

  crear() {
    if (!this.empresaActiva) {
      alert('Empresa no seleccionada');
      return;
    }

    if (!this.form.codigo?.trim() || !this.form.nombre?.trim()) {
      alert('Código y nombre son obligatorios');
      return;
    }
    if (this.form.stock < 0) {
      alert('El stock no puede ser negativo');
      return;
    }

    this.loading = true;

    // ✅ Aunque mandes empresa, el backend debería forzar la del tenant
    const payload: IProducto = {
      codigo: this.form.codigo.trim(),
      nombre: this.form.nombre.trim(),
      stock: this.form.stock,
      empresa: this.empresaActiva,
      precioSinIva: this.form.precioSinIva,
    };

    this.productosService.create(payload).subscribe({
      next: (nuevo) => {
        this.productos.unshift(nuevo);
        this.form = {
          codigo: '',
          nombre: '',
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

  getAjuste(productoId: any): number {
    const id = Number(productoId);
    const v = Number(this.ajusteMap[id] ?? 1);
    return isNaN(v) || v <= 0 ? 1 : v;
  }

  setAjuste(productoId: any, value: any): void {
    const id = Number(productoId);
    let v = Number(value);
    if (isNaN(v) || v <= 0) v = 1;
    this.ajusteMap[id] = v;
  }

  subirStock(p: any): void {
    const id = Number(p?.id);
    if (!id) return;

    const cant = this.getAjuste(id);

    this.productosService.ajustarStock(id, +cant).subscribe({
      next: (prodActualizado) => {
        p.stock = prodActualizado.stock;
        this.ajusteMap[id] = 1;
      },
      error: () => alert('No se pudo subir el stock'),
    });
  }

  bajarStock(p: any): void {
    const id = Number(p?.id);
    if (!id) return;

    const cant = this.getAjuste(id);
    const stock = Number(p?.stock ?? 0);

    if (cant > stock) {
      alert('No puedes bajar más de lo que hay en stock.');
      return;
    }

    this.productosService.ajustarStock(id, -cant).subscribe({
      next: (prodActualizado) => {
        p.stock = prodActualizado.stock;
        this.ajusteMap[id] = 1;
      },
      error: () => alert('No se pudo bajar el stock'),
    });
  }
}
