import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProveedorService } from '../../services/proveedor.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ver-proveedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ver-proveedor.component.html',
  styleUrls: ['./ver-proveedor.component.css']
})
export class VerProveedorComponent implements OnInit {

  proveedor: any;
  trabajos: any[] = [];

  // Campos correctos (importePagado)
  nuevoTrabajo = {
    descripcion: '',
    importe: 0,
    importePagado: 0
  };

  totalImporte = 0;
  totalPagado = 0;
  totalPendiente = 0;

  constructor(
    private route: ActivatedRoute,
    private proveedorService: ProveedorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.proveedorService.getProveedorById(id).subscribe((data) => {
      this.proveedor = data;
      this.cargarTrabajos();
    });
  }

  cargarTrabajos() {
    this.proveedorService.getTrabajosByProveedor(this.proveedor.id).subscribe({
      next: (data) => {
        this.trabajos = data;
        this.calcularTotales();
      },
      error: (err) => console.error("Error cargando trabajos", err)
    });
  }

  guardarTrabajo() {
    if (!this.nuevoTrabajo.descripcion.trim()) return;

    this.proveedorService.crearTrabajoProveedor(this.proveedor.id, this.nuevoTrabajo)
      .subscribe({
        next: () => {
          // Reset formulario
          this.nuevoTrabajo = { descripcion: '', importe: 0, importePagado: 0 };

          // Recargar trabajos
          this.cargarTrabajos();
        },
        error: (err) => console.error('Error al guardar trabajo', err)
      });
  }

  eliminarTrabajo(id: number) {
    this.proveedorService.eliminarTrabajo(id).subscribe(() => {
      this.cargarTrabajos();
    });
  }

  // CÁLCULO REAL DE TOTALES
  calcularTotales() {
    this.totalImporte = 0;
    this.totalPagado = 0;

    this.trabajos.forEach(t => {
      this.totalImporte += Number(t.importe) || 0;
      this.totalPagado += Number(t.importePagado) || 0;
    });

    this.totalPendiente = this.totalImporte - this.totalPagado;
  }

  volver() {
    this.router.navigate(['/proveedores']);
  }

  irEditar() {
    this.router.navigate(['/proveedores/editar', this.proveedor.id]);
  }
}
