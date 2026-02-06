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
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {

  productos: IProducto[] = [];

  // si tú ya tienes empresa seleccionada en app, úsala aquí
  empresaSeleccionada: string = 'ARGASA';

  form: IProducto = {
    codigo: '',
    nombre: '',
    stock: 5,
    empresa: 'ARGASA'
  };

  loading = false;

  constructor(private productosService: ProductoServiceService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar() {
    this.productosService.list(this.empresaSeleccionada).subscribe(res => {
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
    empresa: this.empresaSeleccionada
  };

  console.log('ENVIANDO:', payload);

  this.productosService.create(payload).subscribe({
    next: (nuevo) => {
      this.productos.unshift(nuevo);
      this.form = { codigo: '', nombre: '', stock: 5, empresa: this.empresaSeleccionada };
      this.loading = false;
    },
    error: (err: HttpErrorResponse) => {
      this.loading = false;
      alert(err.error?.message || err.error || 'No se pudo crear el producto');
    }
  });
}
}