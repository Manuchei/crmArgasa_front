import { Component } from '@angular/core';
import { ProveedorService } from '../../../services/proveedor.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../interfaces/iproveedor';
import { IProducto } from '../../../interfaces/iproducto';

@Component({
  selector: 'app-nuevo-proveedor',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './nuevo-proveedor.component.html',
})
export class NuevoProveedorComponent {
  proveedor: Proveedor = {
    nombre: '',
    apellido: '',
    oficio: '',
    telefono: '',
    email: '',
    trabajaEnArgasa: false,
    trabajaEnLuga: false,
    trabajoRealizado: '',
    direccion: '',
    cif: '',
    fechaAltaProveedor: '',
    localidad: '',
    codigoPostal: '',
    provincia: '',
    pais: '',
    contacto: '',
    datosBancarios: '',
    notas: '',
    contactos: '',
    importeTotal: 0,
    importePagado: 0,
    productos: [],
  };

  oficios: string[] = [
    'Fontanero',
    'Electricista',
    'Carpintero',
    'Programador',
    'Pintor',
    'Cerrajero',
    'Albañil',
    'Jardinero',
  ];

  constructor(
    private proveedorService: ProveedorService,
    private router: Router,
  ) {}

  agregarProducto() {
    if (!this.proveedor.productos) {
      this.proveedor.productos = [];
    }

    const nuevoProducto: IProducto = {
      codigo: '',
      nombre: '',
      modelo: '',
      stock: 0,
      empresa: '',
      precioSinIva: 0,
    };

    this.proveedor.productos.push(nuevoProducto);
  }

  eliminarProducto(index: number) {
    this.proveedor.productos?.splice(index, 1);
  }

  guardar() {
    if (this.proveedor.productos) {
      this.proveedor.productos = this.proveedor.productos
        .filter((p) => p.codigo?.trim() || p.nombre?.trim())
        .map((p) => ({
          ...p,
          codigo: p.codigo?.trim() || '',
          nombre: p.nombre?.trim() || '',
          modelo: p.modelo?.trim() || '',
          stock: Number(p.stock) || 0,
          precioSinIva: Number(p.precioSinIva) || 0,
          empresa: '',
        }));
    }

    this.proveedorService.crearProveedor(this.proveedor).subscribe({
      next: () => {
        alert('Proveedor guardado correctamente');
        this.router.navigate(['/app/proveedores']);
      },
      error: (err) => {
        console.error('Error al guardar proveedor', err);
        alert('Error al guardar el proveedor');
      },
    });
  }
}
