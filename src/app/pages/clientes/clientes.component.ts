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

  textoBusqueda: string = '';

  generandoFacturaId: number | null = null;

  constructor(
    private clienteService: ClientesService,
    private facturasService: FacturasClientesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data: ICliente[]) => {
        this.clientes = (data ?? [])
          .filter((c: any) => c != null)
          .map((cliente: any) => {
            let totalServicios = 0;
            let totalPagado = 0;
            let facturableSinFactura = 0;

            if (Array.isArray(cliente.trabajos) && cliente.trabajos.length > 0) {
              cliente.trabajos.forEach((t: any) => {
                const importe = Number(t?.importe ?? 0);
                totalServicios += importe;

                const importePagado = Number(t?.importePagado ?? 0);
                if (importePagado > 0) totalPagado += importePagado;
                else if (t?.pagado === true) totalPagado += importe;

                const sinFactura = (t?.factura == null);
                if (sinFactura) facturableSinFactura += importe;
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
      error: (err: any) => console.error('Error al cargar los clientes:', err),
    });
  }

  buscar(): void {
    const texto = (this.textoBusqueda ?? '').toLowerCase().trim();

    this.clientesFiltrados = (this.clientes ?? []).filter((c: any) => {
      if (!c) return false;

      const nombre = (c.nombreApellidos ?? '').toLowerCase();
      const doc = (c.cifDni ?? '').toLowerCase();
      const email = (c.email ?? '').toLowerCase();
      const tel = (c.telefono ?? '').toLowerCase();
      const mov = (c.movil ?? '').toLowerCase();

      return (nombre + ' ' + doc + ' ' + email + ' ' + tel + ' ' + mov).includes(texto);
    });
  }

  editarCliente(id: number): void {
    this.router.navigate(['/app/clientes/editar', id]);
  }

  eliminarCliente(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este cliente?')) {
      this.clienteService.eliminarCliente(id).subscribe({
        next: () => {
          this.clientes = this.clientes.filter((c) => c?.id !== id);
          this.buscar();
          alert('Cliente eliminado correctamente.');
        },
        error: (err) => console.error('Error al eliminar cliente:', err),
      });
    }
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

    // ✅ Ya NO pasamos "empresa" aquí.
    // El backend sabe la empresa por el header X-Empresa (TenantContext)
    this.generandoFacturaId = clienteId;

    this.facturasService
      .generar(clienteId)
      .pipe(finalize(() => (this.generandoFacturaId = null)))
      .subscribe({
        next: (factura: any) => {
          if (!factura) {
            alert('No se pudo generar la factura (no hay servicios sin factura).');
            return;
          }
          alert(`Factura generada (#${factura.id}) por ${factura.totalImporte} €`);
          this.cargarClientes();
        },
        error: (err) => {
          console.error('Error generando factura:', err);
          alert('No se pudo generar la factura.');
        },
      });
  }
}
