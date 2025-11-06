import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ClienteService } from '../../../services/cliente.service';
import { ICliente } from '../../../interfaces/icliente';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-nuevo-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nuevo-cliente.component.html',
  styleUrls: ['./nuevo-cliente.component.css']
})
export class NuevoClienteComponent {
  cliente: ICliente = {
    nombre: '',
    apellido: '',
    empresa: '',
    telefono: '',
    email: '',
    saldoDebe: 0,
    saldoPagado: 0
  };

  compras: { descripcion: string; precio: number; pagado: number }[] = [];
  nuevaCompra = { descripcion: '', precio: 0, pagado: 0 };

  constructor(private clienteService: ClienteService, private router: Router) {}

  agregarCompra(): void {
    if (!this.nuevaCompra.descripcion || this.nuevaCompra.precio <= 0) {
      alert('Debes indicar una descripción y un precio válido.');
      return;
    }

    this.compras.push({ ...this.nuevaCompra });
    this.nuevaCompra = { descripcion: '', precio: 0, pagado: 0 };

    this.calcularTotales();
  }

  eliminarCompra(index: number): void {
    this.compras.splice(index, 1);
    this.calcularTotales();
  }

  calcularTotales(): void {
    this.cliente.saldoDebe = this.compras.reduce((sum, c) => sum + c.precio, 0);
    this.cliente.saldoPagado = this.compras.reduce((sum, c) => sum + c.pagado, 0);
  }

  diferencia(compra: any): number {
    return (compra.precio || 0) - (compra.pagado || 0);
  }

  guardar(): void {
    if (!this.cliente.nombre || !this.cliente.empresa) {
      alert('El nombre y la empresa son obligatorios');
      return;
    }

    this.clienteService.crear(this.cliente).subscribe({
      next: () => {
        alert('Cliente creado correctamente');
        this.router.navigate(['/clientes']);
      },
      error: (err: any) => {
        console.error('Error al crear el cliente:', err);
        alert('Error al crear el cliente');
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}
