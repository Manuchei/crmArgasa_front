import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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

  cargando = true;
  guardando = false;
  errorCarga = '';
  errorGuardado = '';

  private clienteId = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clienteService: ClientesService,
  ) {}

  ngOnInit(): void {
    this.clienteId = Number(this.route.snapshot.paramMap.get('id'));

    if (!Number.isInteger(this.clienteId) || this.clienteId <= 0) {
      this.cargando = false;
      this.errorCarga = 'El identificador del cliente no es válido.';
      return;
    }

    this.cargarCliente(this.clienteId);
  }

  get tieneContacto(): boolean {
    return !!(this.cliente?.telefono?.trim() || this.cliente?.movil?.trim());
  }

  cargarCliente(id: number): void {
    if (!Number.isInteger(id) || id <= 0) return;

    this.cargando = true;
    this.errorCarga = '';

    this.clienteService.getCliente(id).subscribe({
      next: (data) => {
        this.cliente = data;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.errorCarga =
          'No se pudo cargar el cliente. Comprueba la conexión e inténtalo de nuevo.';
      },
    });
  }

  reintentarCarga(): void {
    this.cargarCliente(this.clienteId);
  }

  guardarCambios(formCliente: NgForm): void {
    if (this.guardando || !this.cliente) return;

    this.errorGuardado = '';

    if (formCliente.invalid) {
      formCliente.form.markAllAsTouched();
      return;
    }

    const nombre = (this.cliente.nombreApellidos || '').trim();
    const telefono = (this.cliente.telefono || '').trim();
    const movil = (this.cliente.movil || '').trim();

    if (!nombre) {
      this.errorGuardado = 'Introduce el nombre del cliente o la razón social.';
      return;
    }

    if (!telefono && !movil) {
      this.errorGuardado =
        'Introduce al menos un teléfono o móvil de contacto.';
      return;
    }

    const cuenta = (this.cliente.numeroCuenta || '').replace(/\s/g, '').trim();

    if (cuenta && !/^\d{20}$/.test(cuenta)) {
      this.errorGuardado =
        'Si introduces una cuenta, debe tener exactamente 20 dígitos.';
      return;
    }

    const payload: ICliente = {
      ...this.cliente,
      nombreApellidos: nombre,
      telefono,
      movil,
      cifDni: (this.cliente.cifDni || '').trim(),
      email: (this.cliente.email || '').trim(),

      direccion: (this.cliente.direccion || '').trim(),
      codigoPostal: (this.cliente.codigoPostal || '').trim(),
      poblacion: (this.cliente.poblacion || '').trim(),
      provincia: (this.cliente.provincia || '').trim(),

      direccionEntrega: (this.cliente.direccionEntrega || '').trim(),
      codigoPostalEntrega: (this.cliente.codigoPostalEntrega || '').trim(),
      poblacionEntrega: (this.cliente.poblacionEntrega || '').trim(),
      provinciaEntrega: (this.cliente.provinciaEntrega || '').trim(),

      numeroCuenta: cuenta,
      iban: cuenta ? this.generarIbanEspanol(cuenta) : '',
    };

    this.guardando = true;

    this.clienteService.actualizarCliente(this.clienteId, payload).subscribe({
      next: () => {
        this.guardando = false;
        void this.router.navigate(['/app/clientes']);
      },
      error: (err: HttpErrorResponse) => {
        this.guardando = false;
        this.errorGuardado = this.getErrorMessage(
          err,
          'No se pudo actualizar el cliente.',
        );
      },
    });
  }

  cancelar(): void {
    if (this.guardando) return;

    void this.router.navigate(['/app/clientes']);
  }

  formatearNumeroCuenta(value: string): void {
    if (!this.cliente) return;

    const limpio = (value || '').replace(/\D/g, '').slice(0, 20);

    this.cliente.numeroCuenta = limpio;
    this.cliente.iban =
      limpio.length === 20 ? this.generarIbanEspanol(limpio) : '';
  }

  generarIbanEspanol(numeroCuenta: string): string {
    const cuenta = (numeroCuenta || '').replace(/\D/g, '');

    if (!/^\d{20}$/.test(cuenta)) return '';

    const resto = this.mod97(cuenta + '142800');
    const dc = 98 - resto;

    return `ES${dc.toString().padStart(2, '0')}${cuenta}`;
  }

  private mod97(numero: string): number {
    let resto = 0;

    for (const caracter of numero) {
      resto = (resto * 10 + Number(caracter)) % 97;
    }

    return resto;
  }

  formatearIbanVisual(iban?: string): string {
    return (iban || '').match(/.{1,4}/g)?.join(' ') || '';
  }

  private getErrorMessage(err: HttpErrorResponse, fallback: string): string {
    if (err.status === 0) {
      return 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
    }

    const body = err.error;

    if (typeof body === 'string' && body.trim()) {
      return body;
    }

    for (const campo of [
      'nombreApellidos',
      'telefono',
      'movil',
      'numeroCuenta',
      'email',
      'message',
      'error',
    ]) {
      if (typeof body?.[campo] === 'string' && body[campo].trim()) {
        return body[campo];
      }
    }

    return fallback;
  }
}
