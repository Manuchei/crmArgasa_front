import { Component, OnInit } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { ICliente } from '../../interfaces/icliente';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {
  clientes: ICliente[] = [];
  textoBusqueda = '';
  empresaSeleccionada = '';

  constructor(private clienteService: ClienteService, private router: Router) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.clienteService.listar().subscribe((data) => (this.clientes = data));
  }

  buscar(): void {
    if (this.textoBusqueda.trim()) {
      this.clienteService
        .buscar(this.textoBusqueda, this.empresaSeleccionada)
        .subscribe((data) => (this.clientes = data));
    } else {
      this.cargarClientes();
    }
  }

  verDetalles(clienteId: number): void {
    this.router.navigate(['/clientes', clienteId]);
  }
}
