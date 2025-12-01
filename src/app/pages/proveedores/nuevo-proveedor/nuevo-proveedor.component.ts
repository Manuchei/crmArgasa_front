import { Component } from '@angular/core';
import { ProveedorService } from '../../../services/proveedor.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nuevo-proveedor',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './nuevo-proveedor.component.html'
})
export class NuevoProveedorComponent {

  proveedor: any = {
    nombre: '',
    apellido: '',
    oficio: '',
    telefono: '',
    email: '',
    trabajaEnArgasa: false,
    trabajaEnLuga: false,
    observaciones: '',
    importeTotal: 0,
    importePagado: 0
  };

  oficios: string[] = [
  'Fontanero',
  'Electricista',
  'Carpintero',
  'Programador',
  'Pintor',
  'Cerrajero',
  'Albañil',
  'Jardinero'
];


  constructor(
    private proveedorService: ProveedorService,
    private router: Router
  ) {}

  guardar() {
    this.proveedorService.crearProveedor(this.proveedor).subscribe({
      next: () => {
        alert('Proveedor guardado correctamente');
        this.router.navigate(['/proveedores']);
      },
      error: () => alert('Error al guardar el proveedor')
    });
  }
}
