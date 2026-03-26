import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InformesSaldosService } from '../../services/informes-saldos.service';
import { HistorialSaldoResponse } from '../../interfaces/historial-saldo';
import { ClientesService } from '../../services/cliente.service';

@Component({
  selector: 'app-informe-saldos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informe-saldos.component.html',
  styleUrl: './informe-saldos.component.css',
})
export class InformeSaldosComponent implements OnInit {
  private informesSaldosService = inject(InformesSaldosService);
  private clienteService = inject(ClientesService);

  clientes: any[] = [];
  clienteSeleccionadoId: number | null = null;

  informe: HistorialSaldoResponse | null = null;
  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => {
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
      return;
    }

    this.cargando = true;
    this.error = '';
    this.informe = null;

    this.informesSaldosService
      .obtenerHistorialPorCliente(this.clienteSeleccionadoId)
      .subscribe({
        next: (data) => {
          this.informe = data;
          this.cargando = false;
        },
        error: () => {
          this.error = 'No se pudo cargar el historial de saldos';
          this.cargando = false;
        },
      });
  }

  imprimir(): void {
    window.print();
  }

  getClaseEstado(estado: string): string {
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

  formatearImporte(valor: number | null | undefined): string {
    return (valor ?? 0).toFixed(2) + ' €';
  }
}
