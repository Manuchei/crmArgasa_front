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

  filtroEmpresa = '';
  filtroPagada = ''; // '', 'true', 'false'

  constructor(private facturasService: FacturasClientesService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.facturasService.getAll().subscribe({
      next: (res) => {
        this.facturas = res ?? [];
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar facturas';
        this.cargando = false;
      },
    });
  }

  aplicarFiltros(): void {
    // filtro empresa usa endpoint del back
    if (this.filtroEmpresa && this.filtroEmpresa.trim() !== '') {
      this.cargando = true;
      this.facturasService.getByEmpresa(this.filtroEmpresa.trim()).subscribe({
        next: (res) => {
          this.facturas = this.filtrarPagada(res ?? []);
          this.cargando = false;
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al filtrar por empresa';
          this.cargando = false;
        },
      });
      return;
    }

    // si no hay filtro empresa, cargamos todas y filtramos pagada en front
    this.cargar();
  }

  private filtrarPagada(list: IfacturaCliente[]): IfacturaCliente[] {
    if (this.filtroPagada === '') return list;
    const pagada = this.filtroPagada === 'true';
    return list.filter(f => f.pagada === pagada);
  }

  marcarPagada(f: IfacturaCliente): void {
    if (!f.id) return;
    if (f.pagada) return;

    this.facturasService.pagar(f.id).subscribe({
      next: (updated) => {
        // actualiza en memoria
        this.facturas = this.facturas.map(x => x.id === f.id ? { ...x, pagada: true } : x);
      },
      error: (err) => console.error(err),
    });
  }
}
