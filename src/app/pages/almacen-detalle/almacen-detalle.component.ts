import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { IInventario, IInventarioLinea } from '../../interfaces/iinventario';
import { InventarioService } from '../../services/inventario.service';

@Component({
  selector: 'app-almacen-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './almacen-detalle.component.html',
  styleUrls: ['./almacen-detalle.component.css'],
})
export class AlmacenDetalleComponent implements OnInit {
  inventario?: IInventario;
  cargando = false;
  mensaje = '';

  constructor(
    private route: ActivatedRoute,
    private inventarioService: InventarioService
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.mensaje = 'Inventario no válido';
      return;
    }

    this.cargarInventario(id);
  }

  cargarInventario(id: number): void {
    this.cargando = true;

    this.inventarioService.buscarPorId(id).subscribe({
      next: (data) => {
        this.inventario = data;
        this.cargando = false;
      },
      error: (error) => {
        console.error(error);
        this.mensaje = 'Error al cargar el detalle del inventario';
        this.cargando = false;
      },
    });
  }

  get lineas(): IInventarioLinea[] {
    return this.inventario?.lineas || [];
  }

  productosCorrectos(): number {
    return this.lineas.filter((l) => Number(l.diferencia || 0) === 0).length;
  }

  productosConFalta(): number {
    return this.lineas.filter((l) => Number(l.diferencia || 0) < 0).length;
  }

  productosConSobrante(): number {
    return this.lineas.filter((l) => Number(l.diferencia || 0) > 0).length;
  }

  unidadesDiferencia(): number {
    return this.lineas.reduce((total, l) => {
      return total + Number(l.diferencia || 0);
    }, 0);
  }

  valorDiferencia(): number {
    return this.lineas.reduce((total, l) => {
      return total + Number(l.diferencia || 0) * Number(l.precioUnitario || 0);
    }, 0);
  }

  imprimir(): void {
    window.print();
  }
}