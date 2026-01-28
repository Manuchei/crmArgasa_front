import { FacturasClientesService } from './../../../services/facturas-clientes.service';
import { IfacturaCliente } from './../../../interfaces/ifactura-cliente';
import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-facturas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgIf, NgFor],
  templateUrl: './facturas-list.component.html',
})
export class FacturasListComponent implements OnInit {
  facturas: IfacturaCliente[] = [];
  cargando = false;
  error = '';

  // ❌ filtroEmpresa eliminado: ahora la empresa la decide X-Empresa (TenantContext)
  filtroPagada = ''; // '', 'true', 'false'

  constructor(private facturasService: FacturasClientesService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.facturasService.getAll().subscribe({
      next: (res: IfacturaCliente[]) => {
        this.facturas = this.filtrarPagada(res ?? []);
        this.cargando = false;
      },
      error: (err: unknown) => {
        console.error(err);
        this.error = 'Error al cargar facturas';
        this.cargando = false;
      },
    });
  }

  aplicarFiltros(): void {
    // ✅ Solo filtramos pagada en front
    this.cargar();
  }

  private filtrarPagada(list: IfacturaCliente[]): IfacturaCliente[] {
    if (this.filtroPagada === '') return list;
    const pagada = this.filtroPagada === 'true';
    return list.filter((f: IfacturaCliente) => f.pagada === pagada);
  }

  marcarPagada(f: IfacturaCliente): void {
    if (!f.id) return;
    if (f.pagada) return;

    this.facturasService.pagar(f.id).subscribe({
      next: (_updated: IfacturaCliente) => {
        this.facturas = this.facturas.map((x) =>
          x.id === f.id ? { ...x, pagada: true } : x
        );
      },
      error: (err: unknown) => {
        console.error(err);
        this.error = 'No se pudo marcar como pagada';
      },
    });
  }
}
