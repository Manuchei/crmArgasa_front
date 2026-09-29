import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { ClientesService } from '../../services/cliente.service';
import { ICliente } from '../../interfaces/icliente';
import { FacturasClientesService } from '../../services/facturas-clientes.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit {
  clientes: any[] = [];
  clientesFiltrados: any[] = [];

  textoBusqueda = '';
  filtroSaldo: 'todos' | 'pendientes' | 'aldia' = 'todos';
  generandoFacturaId: number | null = null;

  constructor(
    private clienteService: ClientesService,
    private facturasService: FacturasClientesService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  get totalClientes(): number {
    return this.clientes.length;
  }

  get clientesConSaldo(): number {
    return this.clientes.filter((cliente) => this.saldoCliente(cliente) > 0.009)
      .length;
  }

  get clientesAlDia(): number {
    return this.clientes.filter(
      (cliente) => this.saldoCliente(cliente) <= 0.009,
    ).length;
  }

  get importeVisible(): number {
    return this.clientesFiltrados.reduce(
      (total, cliente) => total + Number(cliente.totalImporte ?? 0),
      0,
    );
  }

  get cobradoVisible(): number {
    return this.clientesFiltrados.reduce(
      (total, cliente) => total + Number(cliente.totalPagado ?? 0),
      0,
    );
  }

  get pendienteCobroVisible(): number {
    return this.clientesFiltrados.reduce(
      (total, cliente) => total + Math.max(this.saldoCliente(cliente), 0),
      0,
    );
  }

  saldoCliente(cliente: any): number {
    return (
      Number(cliente?.totalImporte ?? 0) - Number(cliente?.totalPagado ?? 0)
    );
  }

  cambiarFiltro(filtro: 'todos' | 'pendientes' | 'aldia'): void {
    this.filtroSaldo = filtro;
    this.buscar();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data: ICliente[]) => {
        this.clientes = (data ?? [])
          .filter((cliente: any) => cliente != null)
          .map((cliente: any) => {
            let totalServicios = 0;
            let totalPagado = 0;
            let facturableSinFactura = 0;

            if (Array.isArray(cliente.trabajos)) {
              cliente.trabajos.forEach((trabajo: any) => {
                const importe = Number(trabajo?.importe ?? 0);
                totalServicios += importe;

                const importePagado = Number(trabajo?.importePagado ?? 0);

                if (importePagado > 0) {
                  totalPagado += importePagado;
                } else if (trabajo?.pagado === true) {
                  totalPagado += importe;
                }

                if (trabajo?.factura == null) {
                  facturableSinFactura += importe;
                }
              });
            }

            return {
              ...cliente,
              saldoDebe: totalServicios,
              saldoPagado: totalPagado,
              pendiente: facturableSinFactura,
            };
          });

        this.buscar();
      },
      error: (err) => {
        console.error('Error al cargar los clientes:', err);
      },
    });
  }

  buscar(): void {
    const texto = (this.textoBusqueda ?? '').toLowerCase().trim();

    this.clientesFiltrados = this.clientes.filter((cliente: any) => {
      const datos = [
        cliente.nombreApellidos,
        cliente.nombreComercial,
        cliente.cifDni,
        cliente.email,
        cliente.telefono,
        cliente.movil,
      ]
        .map((valor) => String(valor ?? '').toLowerCase())
        .join(' ');

      const coincideBusqueda = datos.includes(texto);
      const saldo = this.saldoCliente(cliente);

      const coincideSaldo =
        this.filtroSaldo === 'todos' ||
        (this.filtroSaldo === 'pendientes' && saldo > 0.009) ||
        (this.filtroSaldo === 'aldia' && saldo <= 0.009);

      return coincideBusqueda && coincideSaldo;
    });
  }

  editarCliente(id: number): void {
    this.router.navigate(['/app/clientes/editar', id]);
  }

  eliminarCliente(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este cliente?')) {
      return;
    }

    this.clienteService.eliminarCliente(id).subscribe({
      next: () => {
        this.clientes = this.clientes.filter((cliente) => cliente?.id !== id);
        this.buscar();
        alert('Cliente eliminado correctamente.');
      },
      error: (err) => {
        console.error('Error al eliminar cliente:', err);
      },
    });
  }

  generarFactura(cliente: any): void {
    if (!cliente || cliente.id == null) {
      console.error('generarFactura() llamado con cliente inválido:', cliente);
      alert('No se pudo generar la factura: cliente inválido.');
      return;
    }

    const clienteId = Number(cliente.id);
    const facturable = Number(cliente.pendiente ?? 0);

    if (facturable <= 0) {
      alert('Este cliente no tiene servicios sin factura.');
      return;
    }

    this.generandoFacturaId = clienteId;

    this.facturasService
      .generar(clienteId)
      .pipe(finalize(() => (this.generandoFacturaId = null)))
      .subscribe({
        next: (factura: any) => {
          if (!factura) {
            alert(
              'No se pudo generar la factura (no hay servicios sin factura).',
            );
            return;
          }

          alert(
            `Factura generada (#${factura.id}) por ${factura.totalImporte} €`,
          );
          this.cargarClientes();
        },
        error: (err) => {
          console.error('Error generando factura:', err);
          alert('No se pudo generar la factura.');
        },
      });
  }
}
