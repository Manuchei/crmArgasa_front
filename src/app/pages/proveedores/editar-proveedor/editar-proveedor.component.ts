import { ProveedorService } from './../../../services/proveedor.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../interfaces/iproveedor';
import { IProducto } from '../../../interfaces/iproducto';

@Component({
  selector: 'app-editar-proveedor',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './editar-proveedor.component.html',
  styleUrl: './editar-proveedor.component.css',
})
export class EditarProveedorComponent implements OnInit {
  proveedor: Proveedor = {
    nombre: '',
    apellido: '',
    oficio: '',
    telefono: '',
    email: '',
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
    importePendiente: 0,
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
    private route: ActivatedRoute,
    private proveedorService: ProveedorService,
    private router: Router,
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.params['id']);

    this.proveedorService.getProveedorById(id).subscribe({
      next: (data) => {
        this.proveedor = {
          ...data,
          fechaAltaProveedor: data.fechaAltaProveedor || '',
          productos: data.productos || [],
        };
      },
      error: (err) => {
        console.error('Error al cargar proveedor', err);
        alert('No se pudo cargar el proveedor');
      },
    });
  }

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
    this.proveedor.importePendiente =
      (Number(this.proveedor.importeTotal) || 0) -
      (Number(this.proveedor.importePagado) || 0);

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

    this.proveedorService
      .actualizarProveedor(this.proveedor.id!, this.proveedor)
      .subscribe({
        next: () => {
          alert('Proveedor actualizado correctamente');
          this.router.navigate(['/app/proveedores']);
        },
        error: (err) => {
          console.error('Error al actualizar proveedor', err);
          alert('Error al actualizar el proveedor');
        },
      });
  }

  cancelar() {
    this.router.navigate(['/app/proveedores']);
  }
}
