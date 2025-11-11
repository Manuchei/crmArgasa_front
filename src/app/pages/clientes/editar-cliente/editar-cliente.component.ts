import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientesService } from '../../../services/cliente.service';
import { ICliente } from '../../../interfaces/icliente';

@Component({
  selector: 'app-editar-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './editar-cliente.component.html',
  styleUrls: ['./editar-cliente.component.css'],
})
export class EditarClienteComponent implements OnInit {
  cliente: ICliente | null = null; // ✅ Inicializamos como null para controlar la carga

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClientesService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      alert('ID de cliente no válido.');
      this.router.navigate(['/clientes']);
      return;
    }
    this.cargarCliente(id);
  }

  cargarCliente(id: number): void {
    this.clienteService.getCliente(id).subscribe({
      next: (data) => (this.cliente = data),
      error: (err) => {
        console.error('Error al cargar cliente:', err);
        alert('No se pudo cargar el cliente.');
        this.router.navigate(['/clientes']);
      },
    });
  }

  guardarCambios(): void {
    if (!this.cliente || !this.cliente.id) return;

    this.clienteService.actualizarCliente(this.cliente.id, this.cliente).subscribe({
      next: () => {
        alert('✅ Cliente actualizado correctamente');
        this.router.navigate(['/clientes']);
      },
      error: (err) => {
        console.error('Error al actualizar cliente:', err);
        alert('❌ No se pudo actualizar el cliente.');
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/clientes']);
  }
}
