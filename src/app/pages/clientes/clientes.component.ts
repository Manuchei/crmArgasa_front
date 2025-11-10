import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { ICliente } from '../../interfaces/icliente';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  clientes: ICliente[] = [];
  clientesFiltrados: ICliente[] = [];

  textoBusqueda: string = '';
  empresaSeleccionada: string = '';

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe({
      next: (data) => {
        this.clientes = data;
        this.clientesFiltrados = data;
      },
      error: (err) => console.error('Error al cargar los clientes:', err)
    });
  }

  buscar(): void {
    const texto = this.textoBusqueda.toLowerCase();

    this.clientesFiltrados = this.clientes.filter(c => {
      const coincideTexto =
        (c.nombre + ' ' + (c.apellido || '')).toLowerCase().includes(texto);

      const coincideEmpresa =
        !this.empresaSeleccionada || c.empresa === this.empresaSeleccionada;

      return coincideTexto && coincideEmpresa;
    });
  }

  verDetalles(id: number): void {
    console.log('Ver detalles del cliente con ID:', id);
  }
}
