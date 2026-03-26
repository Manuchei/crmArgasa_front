import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ClientesService } from '../../services/cliente.service';
import { InformesSaldosService } from '../../services/informes-saldos.service';
import { EmpresaService, Empresa } from '../../services/empresa.service';

import { ICliente } from '../../interfaces/icliente';
import { HistorialSaldoResponse } from '../../interfaces/historial-saldo';
import {
  HistorialTContableResponse,
  TContableLinea,
} from '../../interfaces/t-contable.interface';

type TipoInforme = 'SALDOS' | 'T_CONTABLE';

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './informes.component.html',
  styleUrl: './informes.component.css',
})
export class InformesComponent implements OnInit, OnDestroy {
  private clientesService = inject(ClientesService);
  private informesService = inject(InformesSaldosService);
  private empresaService = inject(EmpresaService);

  empresa: Empresa | null = null;
  private empresaSub?: Subscription;

  clientes: ICliente[] = [];
  clientesFiltrados: ICliente[] = [];

  clienteSeleccionadoId: number | null = null;
  tipoInforme: TipoInforme = 'SALDOS';

  fechaInicio = '';
  fechaFin = '';

  informesSaldos: HistorialSaldoResponse[] = [];
  informeTContable: HistorialTContableResponse | null = null;

  filasTContable: {
    debe: TContableLinea | null;
    haber: TContableLinea | null;
  }[] = [];

  cargando = false;
  error = '';

  ngOnInit(): void {
    this.cargarClientes();

    this.empresaSub = this.empresaService.empresa$.subscribe((empresa) => {
      this.empresa = empresa;
    });
  }

  ngOnDestroy(): void {
    this.empresaSub?.unsubscribe();
  }

  cargarClientes(): void {
    this.clientesService.getClientes().subscribe({
      next: (data: ICliente[]) => {
        this.clientes = data;
        this.clientesFiltrados = data;
      },
      error: () => {
        this.error = 'No se pudieron cargar los clientes';
      },
    });
  }

  buscarInforme(): void {
    this.error = '';
    this.cargando = true;
    this.resetInformes();

    if (!this.empresa) {
      this.error = 'No hay empresa activa seleccionada';
      this.cargando = false;
      return;
    }

    if (this.tipoInforme === 'SALDOS') {
      this.buscarInformeSaldos();
      return;
    }

    if (this.tipoInforme === 'T_CONTABLE') {
      this.buscarInformeTContable();
      return;
    }
  }

  buscarInformeSaldos(): void {
    this.informesService
      .obtenerHistorialFiltrado(
        String(this.empresa),
        this.clienteSeleccionadoId,
        this.fechaInicio,
        this.fechaFin,
      )
      .subscribe({
        next: (data: HistorialSaldoResponse[]) => {
          this.informesSaldos = data;
          this.cargando = false;

          if (data.length === 0) {
            this.error = 'No hay resultados para los filtros seleccionados';
          }
        },
        error: (err) => {
          console.error('Error cargando informe de saldos:', err);
          this.error = 'No se pudo cargar el informe de saldos';
          this.cargando = false;
        },
      });
  }

  buscarInformeTContable(): void {
    if (!this.clienteSeleccionadoId) {
      this.error = 'Para T contable, por ahora debes seleccionar un cliente';
      this.cargando = false;
      return;
    }

    this.informesService
      .obtenerTContablePorCliente(this.clienteSeleccionadoId)
      .subscribe({
        next: (data: HistorialTContableResponse) => {
          this.informeTContable = data;
          this.generarFilasTContable();
          this.cargando = false;
        },
        error: (err) => {
          console.error('Error cargando T contable:', err);
          this.error = 'No se pudo cargar el informe T contable';
          this.cargando = false;
        },
      });
  }

  resetInformes(): void {
    this.informesSaldos = [];
    this.informeTContable = null;
    this.filasTContable = [];
  }

  generarFilasTContable(): void {
    if (!this.informeTContable) {
      this.filasTContable = [];
      return;
    }

    const max = Math.max(
      this.informeTContable.debe.length,
      this.informeTContable.haber.length,
    );

    this.filasTContable = [];

    for (let i = 0; i < max; i++) {
      this.filasTContable.push({
        debe: this.informeTContable.debe[i] || null,
        haber: this.informeTContable.haber[i] || null,
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

  getResumenSaldos(informe: HistorialSaldoResponse): string {
    const movimientos = informe.movimientos.length;

    let estadoTexto = '';
    switch (informe.estadoSaldo) {
      case 'PENDIENTE':
        estadoTexto = 'saldo pendiente';
        break;
      case 'A_FAVOR':
        estadoTexto = 'saldo a favor';
        break;
      default:
        estadoTexto = 'saldo saldado';
    }

    return `${informe.clienteNombre} (${informe.empresa}) tiene ${movimientos} movimiento(s) en el periodo seleccionado, con ${estadoTexto} de ${this.formatearImporte(informe.saldoFinal)}.`;
  }
}
