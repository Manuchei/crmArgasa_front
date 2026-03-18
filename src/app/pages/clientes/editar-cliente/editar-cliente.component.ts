import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
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
  cliente: ICliente | null = null;

  empresas: string[] = ['Argasa', 'Luga'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClientesService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      alert('ID de cliente no válido.');
      this.router.navigate(['/app/clientes']);
      return;
    }
    this.cargarCliente(id);
  }

  cargarCliente(id: number): void {
    this.clienteService.getCliente(id).subscribe({
      next: (data) => (this.cliente = data),
      error: (err) => {
        console.error('Error al cargar cliente:', err);
        alert(this.getErrorMessage(err, 'No se pudo cargar el cliente.'));
        this.router.navigate(['/app/clientes']);
      },
    });
  }

  guardarCambios(): void {
    if (!this.cliente || !this.cliente.id) return;

    this.cliente.numeroCuenta =
      this.cliente.numeroCuenta?.replace(/\s+/g, '').toUpperCase().trim() || '';

    this.clienteService
      .actualizarCliente(this.cliente.id, this.cliente)
      .subscribe({
        next: () => {
          alert('✅ Cliente actualizado correctamente');
          this.router.navigate(['/app/clientes']);
        },
        error: (err: HttpErrorResponse) => {
          console.error('Error al actualizar cliente:', err);
          alert(
            '❌ ' +
              this.getErrorMessage(err, 'No se pudo actualizar el cliente.'),
          );
        },
      });
  }

  cancelar(): void {
    this.router.navigate(['/app/clientes']);
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (!err) return fallback;

    if (typeof err.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (err.error?.numeroCuenta) {
      return err.error.numeroCuenta;
    }

    if (err.error?.error) {
      return err.error.error;
    }

    if (err.error?.message) {
      return err.error.message;
    }

    if (err.message) {
      return err.message;
    }

    return fallback;
  }
}
