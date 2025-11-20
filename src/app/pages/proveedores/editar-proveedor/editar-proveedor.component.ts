import { ProveedorService } from './../../../services/proveedor.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-editar-proveedor',
  imports: [FormsModule],
  templateUrl: './editar-proveedor.component.html',
  styleUrl: './editar-proveedor.component.css',
})
export class EditarProveedorComponent implements OnInit {
  proveedor: any = {};

  constructor(
    private route: ActivatedRoute,
    private proveedorService: ProveedorService,
    private router: Router
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.proveedorService.getProveedorById(id).subscribe((data) => {
      this.proveedor = data;
    });
  }

  guardar() {
    this.proveedor.importePendiente =
      this.proveedor.importeTotal - this.proveedor.importePagado;

    this.proveedorService
      .actualizarProveedor(this.proveedor.id, this.proveedor)
      .subscribe(() => {
        this.router.navigate(['/proveedores', ]);
      });
  }

  cancelar() {
    this.router.navigate(['/proveedores']);
  }
}
