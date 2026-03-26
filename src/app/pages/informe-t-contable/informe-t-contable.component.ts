import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InformesSaldosService } from '../../services/informes-saldos.service';
import { ClientesService } from '../../services/cliente.service';
import {
  HistorialTContableResponse,
  TContableLinea,
} from '../../interfaces/t-contable.interface';
import { ICliente } from '../../interfaces/icliente';

@Component({
  selector: 'app-informe-t-contable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informe-t-contable.component.html',
  styleUrl: './informe-t-contable.component.css',
})
export class InformeTContableComponent implements OnInit {
  private informesSaldosService = inject(InformesSaldosService);
  private clienteService = inject(ClientesService);

  clientes: ICliente[] = [];
  clienteSeleccionadoId: number | null = null;

  informe: HistorialTContableResponse | null = null;
  filas: { debe: TContableLinea | null; haber: TContableLinea | null }[] = [];

  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data: ICliente[]) => {
        this.clientes = data;
      },
      error: () => {
        this.error = 'No se pudieron cargar los clientes';
      },
    });
  }

  buscarInforme(): void {
    if (!this.clienteSeleccionadoId) {
      this.error = 'Debes seleccionar un cliente';
      this.informe = null;
      this.filas = [];
      return;
    }

    this.cargando = true;
    this.error = '';
    this.informe = null;
    this.filas = [];

    this.informesSaldosService
      .obtenerTContablePorCliente(this.clienteSeleccionadoId)
      .subscribe({
        next: (data: HistorialTContableResponse) => {
          this.informe = data;
          this.generarFilas();
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error cargando T contable:', err);
          this.error = 'No se pudo cargar el informe T contable';
          this.cargando = false;
        },
      });
  }

  generarFilas(): void {
    if (!this.informe) {
      this.filas = [];
      return;
    }

    const max = Math.max(this.informe.debe.length, this.informe.haber.length);
    this.filas = [];

    for (let i = 0; i < max; i++) {
      this.filas.push({
        debe: this.informe.debe[i] || null,
        haber: this.informe.haber[i] || null,
      });
    }
  }

  imprimir(): void {
    window.print();
  }

  formatearImporte(valor: number | null | undefined): string {
    return `${(valor ?? 0).toFixed(2)} €`;
  }

  getClaseEstado(estado: string | undefined): string {
    switch (estado) {
      case 'PENDIENTE':
        return 'text-danger fw-bold';
      case 'A_FAVOR':
        return 'text-success fw-bold';
      case 'SALDADO':
        return 'text-primary fw-bold';
      default:
        return '';
    }
  }
}
