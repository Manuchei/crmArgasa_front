import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ClientesService } from '../../services/cliente.service';
import { ICliente } from '../../interfaces/icliente';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit {
  clientes: ICliente[] = [];
  clientesFiltrados: ICliente[] = [];

  textoBusqueda: string = '';
  empresaSeleccionada: string = '';

  constructor(
    private clienteService: ClientesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data: ICliente[]) => {
        this.clientes = data.map((cliente) => {
          let saldoDebe = 0;
          let saldoPagado = 0;

          if (cliente.trabajos && cliente.trabajos.length > 0) {
            cliente.trabajos.forEach((trabajo) => {
              saldoDebe += trabajo.importe || 0;
              saldoPagado += trabajo.importePagado || 0;
            });
          }

          return {
            ...cliente,
            saldoDebe,
            saldoPagado,
          };
        });

        this.clientesFiltrados = this.clientes;
      },
      error: (err: any) => console.error('Error al cargar los clientes:', err),
    });
  }

  buscar(): void {
    const texto = this.textoBusqueda.toLowerCase();

    this.clientesFiltrados = this.clientes.filter((c) => {
      const coincideTexto = (c.nombre + ' ' + (c.apellido || ''))
        .toLowerCase()
        .includes(texto);

      const coincideEmpresa =
        !this.empresaSeleccionada || c.empresa === this.empresaSeleccionada;

      return coincideTexto && coincideEmpresa;
    });
  }

  verDetalles(id: number): void {
    console.log('Ver detalles del cliente con ID:', id);
  }
  editarCliente(id: number): void {
    this.router.navigate(['/clientes/editar', id]);
  }

  eliminarCliente(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este cliente?')) {
      this.clienteService.eliminarCliente(id).subscribe({
        next: () => {
          this.clientes = this.clientes.filter((c) => c.id !== id);
          this.buscar();
          alert('Cliente eliminado correctamente.');
        },
        error: (err) => console.error('Error al eliminar cliente:', err),
      });
    }
  }
}
