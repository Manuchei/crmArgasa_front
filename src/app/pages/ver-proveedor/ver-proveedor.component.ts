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
  styleUrl: './ver-proveedor.component.css'
})
export class VerProveedorComponent implements OnInit {

  proveedor: any;
  trabajos: any[] = [];

  nuevoTrabajo = {
    descripcion: '',
    importe: 0,
    pagado: 0
  };

  totalImporte: number = 0;
  totalPagado: number = 0;

  constructor(
    private route: ActivatedRoute,
    private proveedorService: ProveedorService,
    private router: Router
  ) {}

ngOnInit() {
  const id = this.route.snapshot.params['id'];

  this.proveedorService.getProveedorById(id).subscribe(data => {
    this.proveedor = data;
    this.cargarTrabajos();
  });
}


  calcularTotales() {
    this.totalImporte = this.trabajos.reduce((sum, t) => sum + (t.importe || 0), 0);
    this.totalPagado = this.trabajos.reduce((sum, t) => sum + (t.pagado || 0), 0);
  }

 guardarTrabajo() {

  if (!this.nuevoTrabajo.descripcion.trim()) {
    alert("La descripción es obligatoria");
    return;
  }

  const trabajo = {
    descripcion: this.nuevoTrabajo.descripcion,
    importe: this.nuevoTrabajo.importe,
    pagado: this.nuevoTrabajo.pagado,
    proveedorId: this.proveedor.id
  };

  this.proveedorService.guardarTrabajo(trabajo).subscribe({
    next: () => {
      this.cargarTrabajos();
      this.nuevoTrabajo = { descripcion: '', importe: 0, pagado: 0 };
    },
    error: err => {
      console.error("Error al guardar trabajo", err);
    }
  });
}


 eliminarTrabajo(id: number) {
  this.proveedorService.eliminarTrabajo(id).subscribe(() => {
    this.cargarTrabajos();
  });
}


  volver() {
    this.router.navigate(['/proveedores']);
  }

  irEditar() {
    this.router.navigate(['/proveedores/editar', this.proveedor.id]);
  }

cargarTrabajos() {
  this.proveedorService.getTrabajosByProveedor(this.proveedor.id)
    .subscribe(trabajos => {
      this.trabajos = trabajos;
      this.calcularTotales();
    });
}


}
