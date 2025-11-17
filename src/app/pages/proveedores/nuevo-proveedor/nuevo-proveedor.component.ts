import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ProveedorService } from '../../../services/proveedor.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nuevo-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-proveedor.component.html',
  styleUrls: ['./nuevo-proveedor.component.css']
})
export class NuevoProveedorComponent {

  // CAMPOS DEL FORMULARIO
  nombre: string = '';
  apellido: string = '';
  oficio: string = '';
  telefono: string = '';
  email: string = '';
  observaciones: string = '';

  trabajaEnArgasa: boolean = false;
  trabajaEnLuga: boolean = false;
proveedor: any;

  constructor(
    private proveedorService: ProveedorService,
    private router: Router
  ) {}

  guardar() {
    const proveedor = {
      nombre: this.nombre,
      apellido: this.apellido,
      oficio: this.oficio,
      telefono: this.telefono,
      email: this.email,
      observaciones: this.observaciones,
      trabajaEnArgasa: this.trabajaEnArgasa,
      trabajaEnLuga: this.trabajaEnLuga,
      empresa:
        this.trabajaEnArgasa && this.trabajaEnLuga
          ? 'ambas'
          : this.trabajaEnArgasa
          ? 'argasa'
          : 'luga'
    };

    this.proveedorService.crearProveedor(proveedor).subscribe({
      next: () => {
        alert('Proveedor guardado correctamente');
        this.router.navigate(['/proveedores']);
      },
      error: () => {
        alert('Error al guardar el proveedor');
      }
    });
  }
}
