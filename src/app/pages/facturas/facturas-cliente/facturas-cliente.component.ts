import { IfacturaCliente } from './../../../interfaces/ifactura-cliente';
import { FacturasClientesService } from './../../../services/facturas-clientes.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-facturas-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './facturas-cliente.component.html',
})
export class FacturasClienteComponent implements OnInit {
  clienteId!: number;
  facturas: IfacturaCliente[] = [];

  empresa: string = 'Argasa'; // default
  cargando = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private facturasService: FacturasClientesService
  ) {}

  ngOnInit(): void {
    this.clienteId = Number(this.route.snapshot.paramMap.get('id'));
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.facturasService.getByCliente(this.clienteId).subscribe({
      next: (res) => {
        this.facturas = res ?? [];
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error cargando facturas del cliente';
        this.cargando = false;
      },
    });
  }

  generarFactura(): void {
    this.cargando = true;
    this.error = '';

    this.facturasService.generar(this.clienteId, this.empresa).subscribe({
      next: (factura) => {
        // la añadimos arriba
        this.facturas = [factura, ...this.facturas];
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'No se pudo generar la factura (¿hay servicios pendientes?)';
        this.cargando = false;
      },
    });
  }

  pagarFactura(f: IfacturaCliente): void {
    if (f.pagada) return;

    this.facturasService.pagar(f.id).subscribe({
      next: () => {
        this.facturas = this.facturas.map(x => x.id === f.id ? { ...x, pagada: true } : x);
      },
      error: (err) => console.error(err),
    });
  }
}
