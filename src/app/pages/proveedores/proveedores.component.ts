import { CommonModule } from '@angular/common';
import { ProveedorService } from './../../services/proveedor.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd } from "@angular/router";
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-proveedores',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit {

  proveedores: any[] = [];

  filtros = {
    texto: '',
    empresa: '',
    oficio: '',
  };

  totalDeuda: number = 0;
  totalPagado: number = 0;
  totalFacturado: number = 0;

  constructor(
    private proveedorService: ProveedorService,
    private router: Router
  ) {}

  ngOnInit() {

    // 🔥 Cuando vuelves de /proveedores/:id recargamos lista
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.cargarProveedores();
      });

    this.cargarProveedores();
  }

  cargarProveedores() {
    this.proveedorService.getProveedores().subscribe(data => {

      // ✅ Clonamos array para forzar refresco visual
      this.proveedores = [...data];

      // ✅ Calculamos importe pendiente
      this.proveedores.forEach(p => {
        const total = Number(p.importeTotal) || 0;
        const pagado = Number(p.importePagado) || 0;

        p.importePendiente = total - pagado;
      });

      this.calcularTotales();
    });
  }

  filtrar() {
    if (!this.filtros.texto && !this.filtros.empresa && !this.filtros.oficio) {
      this.cargarProveedores();
      return;
    }

    this.proveedorService.buscar(
      this.filtros.texto,
      this.filtros.empresa,
      this.filtros.oficio
    ).subscribe(data => {

      this.proveedores = [...data]; // ✅ nueva referencia

      this.proveedores.forEach(p => {
        const total = Number(p.importeTotal) || 0;
        const pagado = Number(p.importePagado) || 0;

        p.importePendiente = total - pagado;
      });

      this.calcularTotales();
    });
  }

  limpiarFiltros() {
    this.filtros = { texto: '', empresa: '', oficio: '' };
    this.cargarProveedores();
  }

  // ✅ Totales generales
  calcularTotales() {

    this.totalFacturado = this.proveedores.reduce(
      (sum, p) => sum + (Number(p.importeTotal) || 0),
      0
    );

    this.totalPagado = this.proveedores.reduce(
      (sum, p) => sum + (Number(p.importePagado) || 0),
      0
    );

    this.totalDeuda = this.proveedores.reduce(
      (sum, p) => sum + (Number(p.importePendiente) || 0),
      0
    );
  }

  verProveedor(id: number) {
    this.router.navigate(['/proveedores', id]);
  }

  editarProveedor(id: number) {
    this.router.navigate(['/proveedores/editar', id]);
  }

  eliminarProveedor(id: number) {
    if (confirm('¿Seguro que deseas eliminar este proveedor?')) {

      this.proveedorService.deleteProveedor(id).subscribe(() => {
        this.cargarProveedores();
      });

    }
  }
}
