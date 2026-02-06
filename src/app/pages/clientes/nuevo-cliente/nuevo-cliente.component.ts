import { Router } from '@angular/router';
import { NgFor, NgIf, CurrencyPipe, DecimalPipe, NgClass } from '@angular/common';
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
    nombreApellidos: '',
    direccion: '',
    codigoPostal: '',
    poblacion: '',
    provincia: '',
    telefono: '',
    movil: '',
    cifDni: '',
    email: '',
    totalImporte: 0,
    totalPagado: 0,
    trabajos: [],
  };

  // ✅ ahora: uds + precio/u + dto
  nuevoTrabajo: ITrabajo = {
    descripcion: '',
    unidades: 1,
    precioUnitario: 0,
    descuento: 0,
    importe: 0, // lo usaremos como NETO al guardar
    importePagado: 0,
    pagado: false,
  };

  constructor(private clienteService: ClientesService, private router: Router) {}

  private toNumber(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  // ✅ neto del formulario
  getNetoNuevoTrabajo(): number {
    const u = Math.max(0, this.toNumber(this.nuevoTrabajo.unidades ?? 1));
    const p = Math.max(0, this.toNumber(this.nuevoTrabajo.precioUnitario ?? 0));
    const dto = Math.min(100, Math.max(0, this.toNumber(this.nuevoTrabajo.descuento ?? 0)));

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
      alert('Debes introducir descripción, unidades (>0) y precio unitario (>0).');
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
      importe: neto, // ✅ guardamos el neto en importe (legacy)
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
      0
    );

    this.cliente.totalPagado = this.cliente.trabajos.reduce(
      (sum: number, t: ITrabajo) => sum + (this.toNumber(t.importePagado) || 0),
      0
    );
  }

  guardarCliente(): void {
    if (!this.cliente.nombreApellidos) {
      alert('Por favor, completa el campo obligatorio (Nombre y apellidos o Empresa).');
      return;
    }

    // ✅ Seguridad extra: nunca mandar empresa desde el front
    const payload: ICliente = {
      ...this.cliente,
      empresa: undefined,
    };

    this.clienteService.crearCliente(payload).subscribe({
      next: () => {
        alert('✅ Cliente añadido correctamente.');
        this.router.navigate(['/app/clientes']);
      },
      error: (err) => {
        console.error('Error al crear cliente:', err);
        alert('❌ No se pudo crear el cliente.');
      },
    });
  }
}
