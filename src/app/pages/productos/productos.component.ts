import { ProductoServiceService } from './../../services/producto-service.service';
import { Component, OnInit } from '@angular/core';
import { IProducto } from '../../interfaces/iproducto';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-productos',
  imports: [CommonModule, FormsModule],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css',
})
export class ProductosComponent implements OnInit {
  productos: IProducto[] = [];

  // si tú ya tienes empresa seleccionada en app, úsala aquí
  empresaSeleccionada: string = 'ARGASA';

  form: IProducto = {
    codigo: '',
    nombre: '',
    stock: 5,
    empresa: 'ARGASA',
    precioSinIva: 0,
  };

  // ✅ ajuste por productoId
  ajusteMap: Record<number, number> = {};

  loading = false;

  constructor(private productosService: ProductoServiceService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.productosService.list(this.empresaSeleccionada).subscribe((res) => {
      this.productos = res;
    });
  }

  crear() {
    if (!this.form.codigo?.trim() || !this.form.nombre?.trim()) {
      alert('Código y nombre son obligatorios');
      return;
    }
    if (this.form.stock < 0) {
      alert('El stock no puede ser negativo');
      return;
    }

    this.loading = true;

    const payload: IProducto = {
      codigo: this.form.codigo.trim(),
      nombre: this.form.nombre.trim(),
      stock: this.form.stock,
      empresa: this.empresaSeleccionada,
      precioSinIva: this.form.precioSinIva, // ✅ AÑADIR
    };

    console.log('ENVIANDO:', payload);

    this.productosService.create(payload).subscribe({
      next: (nuevo) => {
        this.productos.unshift(nuevo);
        this.form = {
          codigo: '',
          nombre: '',
          stock: 5,
          empresa: this.empresaSeleccionada,
          precioSinIva: 0,
        }; // reset form
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
  // ✅ mapa de ajustes por productoId (cantidad a subir/bajar)

// ✅ getter seguro para el input
getAjuste(productoId: any): number {
  const id = Number(productoId);
  const v = Number(this.ajusteMap[id] ?? 1);
  return isNaN(v) || v <= 0 ? 1 : v;
}

// ✅ setter seguro (normaliza a >= 1)
setAjuste(productoId: any, value: any): void {
  const id = Number(productoId);
  let v = Number(value);
  if (isNaN(v) || v <= 0) v = 1;
  this.ajusteMap[id] = v;
}

// ✅ subir N unidades
subirStock(p: any): void {
  const id = Number(p?.id);
  if (!id) return;

  const cant = this.getAjuste(id);

  this.productosService.ajustarStock(id, +cant).subscribe({
    next: (prodActualizado) => {
      p.stock = prodActualizado.stock;
      this.ajusteMap[id] = 1; // reset
    },
    error: (err) => {
      console.error(err);
      alert('No se pudo subir el stock');
    }
  });
}

// ✅ bajar N unidades (no permite negativo)
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
      this.ajusteMap[id] = 1; // reset
    },
    error: (err) => {
      console.error(err);
      alert('No se pudo bajar el stock');
    }
  });
}

}
