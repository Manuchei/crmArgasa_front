import { Router } from '@angular/router';
import {
  NgFor,
  NgIf,
  CurrencyPipe,
  DecimalPipe,
  NgClass,
} from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component } from '@angular/core';
import { ClientesService } from '../../../services/cliente.service';
import { ICliente } from '../../../interfaces/icliente';
import { ITrabajo } from '../../../interfaces/itrabajo';

@Component({
  selector: 'app-nuevo-cliente',
  standalone: true,
  templateUrl: './nuevo-cliente.component.html',
  styleUrls: ['./nuevo-cliente.component.css'],
  imports: [FormsModule, NgFor, NgIf, CurrencyPipe, DecimalPipe, NgClass],
})
export class NuevoClienteComponent {
  cliente: ICliente = {
    nombre: '',
    apellido: '',
    empresa: '',
    telefono: '',
    email: '',
    totalImporte: 0,
    totalPagado: 0,
    trabajos: [],
  };

  nuevoTrabajo: ITrabajo = {
    descripcion: '',
    importe: 0,
    importePagado: 0,
    pagado: false,
  };

  constructor(
    private clienteService: ClientesService,
    private router: Router
  ) {}

  empresas: string[] = ['Argasa', 'Luga'];


  agregarTrabajo(): void {
    const trabajo: ITrabajo = { ...this.nuevoTrabajo };
    trabajo.pagado = trabajo.importePagado >= trabajo.importe;
    this.cliente.trabajos.push(trabajo);
    this.recalcularTotales();
    this.nuevoTrabajo = {
      descripcion: '',
      importe: 0,
      importePagado: 0,
      pagado: false,
    };
  }

  recalcularTotales(): void {
    this.cliente.totalImporte = this.cliente.trabajos.reduce(
      (sum: number, t: ITrabajo) => sum + (t.importe || 0),
      0
    );
    this.cliente.totalPagado = this.cliente.trabajos.reduce(
      (sum: number, t: ITrabajo) => sum + (t.importePagado || 0),
      0
    );
  }

  guardarCliente(): void {
    if (!this.cliente.nombre || !this.cliente.apellido || !this.cliente.empresa) {
      alert('Por favor, completa todos los campos obligatorios.');
      return;
    }

    this.clienteService.crearCliente(this.cliente).subscribe({
      next: () => {
        alert('✅ Cliente añadido correctamente.');
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        console.error('Error al crear cliente:', err);
        alert('❌ No se pudo crear el cliente.');
      },
    });
  }
}