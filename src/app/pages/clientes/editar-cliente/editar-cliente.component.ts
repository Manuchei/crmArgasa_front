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
      this.cliente.numeroCuenta?.replace(/\D/g, '').trim() || '';

    if (
      this.cliente.numeroCuenta &&
      !/^\d{20}$/.test(this.cliente.numeroCuenta)
    ) {
      alert('El número de cuenta debe tener 20 dígitos.');
      return;
    }

    this.cliente.iban = this.cliente.numeroCuenta
      ? this.generarIbanEspanol(this.cliente.numeroCuenta)
      : '';
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

  formatearNumeroCuenta(value: string): void {
    if (!this.cliente) return;

    let limpio = (value || '').replace(/\D/g, '');

    if (limpio.length > 20) {
      limpio = limpio.substring(0, 20);
    }

    this.cliente.numeroCuenta = limpio;

    this.cliente.iban =
      limpio.length === 20 ? this.generarIbanEspanol(limpio) : '';
  }

  generarIbanEspanol(numeroCuenta: string): string {
    const cuenta = (numeroCuenta || '').replace(/\D/g, '');

    if (!/^\d{20}$/.test(cuenta)) {
      return '';
    }

    const rearranged = cuenta + '142800';
    const resto = this.mod97(rearranged);
    const dc = 98 - resto;

    return `ES${dc.toString().padStart(2, '0')}${cuenta}`;
  }

  private mod97(numero: string): number {
    let resto = 0;

    for (const char of numero) {
      resto = (resto * 10 + Number(char)) % 97;
    }

    return resto;
  }

  formatearIbanVisual(iban?: string): string {
    return (iban || '').match(/.{1,4}/g)?.join(' ') || '';
  }
}
