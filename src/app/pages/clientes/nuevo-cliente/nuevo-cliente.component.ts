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
import { HttpErrorResponse } from '@angular/common/http';
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
    nombreApellidos: '',
    direccion: '',
    codigoPostal: '',
    poblacion: '',
    provincia: '',

    direccionEntrega: '',
    codigoPostalEntrega: '',
    poblacionEntrega: '',
    provinciaEntrega: '',

    telefono: '',
    movil: '',
    cifDni: '',
    email: '',
    numeroCuenta: '',
    totalImporte: 0,
    totalPagado: 0,
    trabajos: [],
  };

  nuevoTrabajo: ITrabajo = {
    descripcion: '',
    unidades: 1,
    precioUnitario: 0,
    descuento: 0,
    importe: 0,
    importePagado: 0,
    pagado: false,
  };

  constructor(
    private clienteService: ClientesService,
    private router: Router,
  ) {}

  esIbanEspanolValido(iban: string): boolean {
    const limpio = (iban || '').replace(/\s+/g, '').toUpperCase();
    return /^ES\d{22}$/.test(limpio);
  }

  formatearIBAN(): void {
    let value = this.cliente.numeroCuenta || '';

    value = value.replace(/\s+/g, '').toUpperCase();

    value = value.replace(/(.{4})/g, '$1 ').trim();

    this.cliente.numeroCuenta = value;
  }

  private toNumber(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  private trim(value: any): string {
    return typeof value === 'string' ? value.trim() : '';
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

  getNetoNuevoTrabajo(): number {
    const u = Math.max(0, this.toNumber(this.nuevoTrabajo.unidades ?? 1));
    const p = Math.max(0, this.toNumber(this.nuevoTrabajo.precioUnitario ?? 0));
    const dto = Math.min(
      100,
      Math.max(0, this.toNumber(this.nuevoTrabajo.descuento ?? 0)),
    );

    const bruto = u * p;
    const neto = bruto * (1 - dto / 100);
    return this.round2(Math.max(0, neto));
  }

  agregarTrabajo(): void {
    const desc = String(this.nuevoTrabajo.descripcion ?? '').trim();
    const unidades = this.toNumber(this.nuevoTrabajo.unidades ?? 1);
    const precioUnitario = this.toNumber(this.nuevoTrabajo.precioUnitario ?? 0);
    const descuento = this.toNumber(this.nuevoTrabajo.descuento ?? 0);
    const importePagado = this.toNumber(this.nuevoTrabajo.importePagado ?? 0);

    if (!desc || unidades <= 0 || precioUnitario <= 0) {
      alert(
        'Debes introducir descripción, unidades (>0) y precio unitario (>0).',
      );
      return;
    }

    if (descuento < 0 || descuento > 100) {
      alert('El descuento debe estar entre 0 y 100.');
      return;
    }

    const neto = this.getNetoNuevoTrabajo();

    const trabajo: ITrabajo = {
      descripcion: desc,
      unidades,
      precioUnitario,
      descuento,
      importe: neto,
      importePagado,
      pagado: importePagado >= neto,
    };

    this.cliente.trabajos.push(trabajo);
    this.recalcularTotales();

    this.nuevoTrabajo = {
      descripcion: '',
      unidades: 1,
      precioUnitario: 0,
      descuento: 0,
      importe: 0,
      importePagado: 0,
      pagado: false,
    };
  }

  recalcularTotales(): void {
    this.cliente.totalImporte = this.cliente.trabajos.reduce(
      (sum: number, t: ITrabajo) => sum + (this.toNumber(t.importe) || 0),
      0,
    );

    this.cliente.totalPagado = this.cliente.trabajos.reduce(
      (sum: number, t: ITrabajo) => sum + (this.toNumber(t.importePagado) || 0),
      0,
    );
  }

  private buildClientePayload(): ICliente {
    return {
      ...this.cliente,
      nombreApellidos: this.trim(this.cliente.nombreApellidos),
      direccion: this.trim(this.cliente.direccion),
      codigoPostal: this.trim(this.cliente.codigoPostal),
      poblacion: this.trim(this.cliente.poblacion),
      provincia: this.trim(this.cliente.provincia),
      direccionEntrega: this.trim(this.cliente.direccionEntrega),
      codigoPostalEntrega: this.trim(this.cliente.codigoPostalEntrega),
      poblacionEntrega: this.trim(this.cliente.poblacionEntrega),
      provinciaEntrega: this.trim(this.cliente.provinciaEntrega),
      telefono: this.trim(this.cliente.telefono),
      movil: this.trim(this.cliente.movil),
      cifDni: this.trim(this.cliente.cifDni),
      email: this.trim(this.cliente.email),
      numeroCuenta: this.trim(this.cliente.numeroCuenta)
        .replace(/\s+/g, '')
        .toUpperCase(),
      empresa: undefined,
    };
  }

  guardarCliente(formCliente: any): void {
    if (formCliente.invalid) {
      formCliente.form.markAllAsTouched();
      return;
    }

    const payload = this.buildClientePayload();

    if (!this.esIbanEspanolValido(payload.numeroCuenta || '')) {
      alert('El IBAN no es válido. Debe empezar por ES y tener 22 números.');
      return;
    }

    this.clienteService.crearCliente(payload).subscribe({
      next: () => {
        alert('✅ Cliente añadido correctamente.');
        this.router.navigate(['/app/clientes']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error al crear cliente:', err);
        alert(
          '❌ ' + this.getErrorMessage(err, 'No se pudo crear el cliente.'),
        );
      },
    });
  }
}
