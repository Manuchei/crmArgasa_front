import { CommonModule } from '@angular/common';
import { ProveedorService } from './../../services/proveedor.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Proveedor } from '../../interfaces/iproveedor';

@Component({
  selector: 'app-proveedores',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css',
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];

  filtros = {
    texto: '',
    empresa: '',
    oficio: '',
  };

  totalCompras = 0;
  totalPagado = 0;
  totalPendientePago = 0;

  constructor(
    private proveedorService: ProveedorService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.cargarProveedores();
      });

    this.cargarProveedores();
  }

  cargarProveedores(): void {
    this.proveedorService.getProveedores().subscribe((data) => {
      this.proveedores = (data ?? []).map((p) => this.normalizarProveedor(p));
      this.calcularTotales();
    });
  }

  filtrar(): void {
    if (!this.filtros.texto && !this.filtros.empresa && !this.filtros.oficio) {
      this.cargarProveedores();
      return;
    }

    this.proveedorService
      .buscar(this.filtros.texto, this.filtros.empresa, this.filtros.oficio)
      .subscribe((data) => {
        this.proveedores = (data ?? []).map((p) => this.normalizarProveedor(p));
        this.calcularTotales();
      });
  }

  limpiarFiltros(): void {
    this.filtros = { texto: '', empresa: '', oficio: '' };
    this.cargarProveedores();
  }

  private normalizarProveedor(p: Proveedor): Proveedor {
    const totalCompra = Number(p.importeTotal) || 0;
    const totalPagado = Number(p.importePagado) || 0;

    let pendientePago = Number(p.importePendiente);
    if (isNaN(pendientePago)) {
      pendientePago = totalCompra - totalPagado;
    }

    if (pendientePago < 0) {
      pendientePago = 0;
    }

    return {
      ...p,
      importeTotal: totalCompra,
      importePagado: totalPagado,
      importePendiente: pendientePago,
    };
  }

  calcularTotales(): void {
    this.totalCompras = this.proveedores.reduce(
      (sum, p) => sum + (Number(p.importeTotal) || 0),
      0,
    );

    this.totalPagado = this.proveedores.reduce(
      (sum, p) => sum + (Number(p.importePagado) || 0),
      0,
    );

    this.totalPendientePago = this.proveedores.reduce(
      (sum, p) => sum + (Number(p.importePendiente) || 0),
      0,
    );
  }

  getEmpresaLabel(p: Proveedor): string {
    const empresa = (p.empresa || '').trim().toUpperCase();

    if (empresa === 'ARGASA') return 'Argasa';
    if (empresa === 'ELECTROLUGA' || empresa === 'LUGA') return 'Electroluga';

    if (p.trabajaEnArgasa) return 'Argasa';
    if (p.trabajaEnLuga) return 'Electroluga';

    return '-';
  }

  getNombreCompleto(p: Proveedor): string {
    return `${p.nombre || ''}`.trim();
  }

  verProveedor(id: number): void {
    this.router.navigate(['app/proveedores', id]);
  }

  editarProveedor(id: number): void {
    this.router.navigate(['app/proveedores/editar', id]);
  }

  eliminarProveedor(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este proveedor?')) {
      this.proveedorService.deleteProveedor(id).subscribe(() => {
        this.cargarProveedores();
      });
    }
  }
}
