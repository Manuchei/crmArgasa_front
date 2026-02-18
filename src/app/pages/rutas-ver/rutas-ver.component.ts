import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf, NgFor } from '@angular/common';
import { RutaService } from '../../services/ruta.service';

@Component({
  selector: 'app-rutas-ver',
  standalone: true,
  imports: [NgIf, NgFor],
  templateUrl: './rutas-ver.component.html',
  styleUrls: ['./rutas-ver.component.css'],
})
export class RutasVerComponent implements OnInit {
  idRuta!: number;
  cargando = false;
  error = '';
  ruta: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rutaService: RutaService
  ) {}

  ngOnInit(): void {
    this.idRuta = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.idRuta) {
      this.error = 'ID de ruta no válido.';
      return;
    }
    this.cargarRuta(this.idRuta);
  }

  cargarRuta(id: number): void {
    this.cargando = true;
    this.error = '';

    this.rutaService.getRuta(id).subscribe({
      next: (data: any) => {
        this.ruta = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar la ruta.';
        this.cargando = false;
      },
    });
  }

  volver(): void {
    this.router.navigate(['/app/rutas']);
  }

  getNombreProducto(linea: any): string {
    // soporta: linea.producto (obj) o linea.productoId
    if (linea?.producto?.codigo && linea?.producto?.nombre) {
      return `${linea.producto.codigo} - ${linea.producto.nombre}`;
    }
    if (linea?.productoId) return `Producto ${linea.productoId}`;
    return 'Producto';
  }
}
