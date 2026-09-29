import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { ProveedorService } from '../../services/proveedor.service';
import { Proveedor } from '../../interfaces/iproveedor';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css',
})
export class ProveedoresComponent implements OnInit {
  proveedores: Proveedor[] = [];
  filtroSaldo: 'todos' | 'pendientes' | 'aldia' = 'todos';

  filtros = {
    texto: '',
    oficio: '',
  };

  constructor(
    private proveedorService: ProveedorService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => this.cargarProveedores());

    this.cargarProveedores();
  }

  get proveedoresVisibles(): Proveedor[] {
    if (this.filtroSaldo === 'pendientes') {
      return this.proveedores.filter(
        (p) => Number(p.importePendiente ?? 0) > 0.009,
      );
    }

    if (this.filtroSaldo === 'aldia') {
      return this.proveedores.filter(
        (p) => Number(p.importePendiente ?? 0) <= 0.009,
      );
    }

    return this.proveedores;
  }

  get proveedoresConSaldo(): number {
    return this.proveedores.filter(
      (p) => Number(p.importePendiente ?? 0) > 0.009,
    ).length;
  }

  get proveedoresAlDia(): number {
    return this.proveedores.filter(
      (p) => Number(p.importePendiente ?? 0) <= 0.009,
    ).length;
  }

  get comprasVisibles(): number {
    return this.proveedoresVisibles.reduce(
      (total, p) => total + Number(p.importeTotal ?? 0),
      0,
    );
  }

  get pagadoVisible(): number {
    return this.proveedoresVisibles.reduce(
      (total, p) => total + Number(p.importePagado ?? 0),
      0,
    );
  }

  get pendienteVisible(): number {
    return this.proveedoresVisibles.reduce(
      (total, p) => total + Number(p.importePendiente ?? 0),
      0,
    );
  }

  cargarProveedores(): void {
    this.proveedorService.getProveedores().subscribe({
      next: (data) => {
        this.proveedores = (data ?? []).map((p) => this.normalizarProveedor(p));
      },
      error: (err) => {
        console.error('Error al cargar proveedores:', err);
      },
    });
  }

  filtrar(): void {
    const texto = this.filtros.texto.trim();
    const oficio = this.filtros.oficio;

    if (!texto && !oficio) {
      this.cargarProveedores();
      return;
    }

    // La empresa activa ya se aplica en el backend.
    // El segundo argumento queda vacío para no filtrar Argasa/Electroluga.
    this.proveedorService.buscar(texto, '', oficio).subscribe({
      next: (data) => {
        this.proveedores = (data ?? []).map((p) => this.normalizarProveedor(p));
      },
      error: (err) => {
        console.error('Error al buscar proveedores:', err);
      },
    });
  }

  limpiarFiltros(): void {
    this.filtros = { texto: '', oficio: '' };
    this.filtroSaldo = 'todos';
    this.cargarProveedores();
  }

  private normalizarProveedor(p: Proveedor): Proveedor {
    const totalCompra = Number(p.importeTotal) || 0;
    const totalPagado = Number(p.importePagado) || 0;

    let pendientePago = Number(p.importePendiente);

    if (Number.isNaN(pendientePago)) {
      pendientePago = totalCompra - totalPagado;
    }

    return {
      ...p,
      importeTotal: totalCompra,
      importePagado: totalPagado,
      importePendiente: Math.max(pendientePago, 0),
    };
  }

  getNombreCompleto(p: Proveedor): string {
    return String(p.nombre ?? '').trim();
  }

  verProveedor(id: number): void {
    this.router.navigate(['/app/proveedores', id]);
  }

  editarProveedor(id: number): void {
    this.router.navigate(['/app/proveedores/editar', id]);
  }

  eliminarProveedor(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este proveedor?')) {
      return;
    }

    this.proveedorService.deleteProveedor(id).subscribe({
      next: () => this.filtrar(),
      error: (err) => {
        console.error('Error al eliminar proveedor:', err);
      },
    });
  }
}
