import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { FacturacionV2Service } from '../../../services/facturacion-v2.service';
import { FacturaV2Response } from '../../../interfaces/facturacion-v2';

@Component({
  selector: 'app-facturas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NgIf, NgFor],
  templateUrl: './facturas-list.component.html',
})
export class FacturasListComponent implements OnInit {

  facturas: FacturaV2Response[] = [];
  cargando = false;
  error = '';

  // Filtro estado V2
  filtroEstado = ''; // '', 'BORRADOR', 'EMITIDA', 'PAGADA', 'ANULADA'

  constructor(private facturasV2Service: FacturacionV2Service) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    const estado = this.filtroEstado ? this.filtroEstado : undefined;

    this.facturasV2Service.listarFacturas(estado).subscribe({
      next: (res) => {
        this.facturas = res ?? [];
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar facturas V2';
        this.cargando = false;
      },
    });
  }

  aplicarFiltros(): void {
    this.cargar();
  }
}
