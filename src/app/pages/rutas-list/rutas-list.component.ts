import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../interfaces/iruta';
import {FormsModule} from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';


@Component({
  selector: 'app-rutas-list',
  standalone: true,
  templateUrl: './rutas-list.component.html',
  imports: [FormsModule, NgIf, NgFor],
  styleUrls: ['./rutas-list.component.scss']
})
export class RutasListComponent implements OnInit {

  rutas: Ruta[] = [];
  filtroEstado: string = '';
  filtroNombre: string = '';
  filtroFecha: string = '';

  cargando = false;
  error = '';

  constructor(
    private rutaService: RutaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarRutas();
  }

  cargarRutas(): void {
    this.cargando = true;
    this.error = '';

    this.rutaService.getRutas().subscribe({
      next: (data) => {
        this.rutas = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar las rutas';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    if (this.filtroEstado) {
      this.rutaService.filtrarPorEstado(this.filtroEstado).subscribe(r => this.rutas = r);
    } else if (this.filtroNombre) {
      this.rutaService.filtrarPorTransportista(this.filtroNombre).subscribe(r => this.rutas = r);
    } else if (this.filtroFecha) {
      this.rutaService.filtrarPorFecha(this.filtroFecha).subscribe(r => this.rutas = r);
    } else {
      this.cargarRutas();
    }
  }

  nuevaRuta(): void {
    this.router.navigate(['/rutas/nueva']);
  }

  editarRuta(ruta: Ruta): void {
    if (ruta.id) {
      this.router.navigate(['/rutas/editar', ruta.id]);
    }
  }

  eliminarRuta(ruta: Ruta): void {
    if (!ruta.id) return;
    if (confirm(`¿Seguro que quieres eliminar la ruta ${ruta.id}?`)) {
      this.rutaService.eliminarRuta(ruta.id).subscribe(() => {
        this.cargarRutas();
      });
    }
  }

  cerrarRuta(ruta: Ruta): void {
    if (!ruta.id) return;
    if (confirm(`¿Cerrar la ruta ${ruta.id}?`)) {
      this.rutaService.cerrarRuta(ruta.id).subscribe(() => {
        this.cargarRutas();
      });
    }
  }

  filtrarNombre(): void {
  if (!this.filtroNombre || this.filtroNombre.trim() === '') {
    this.cargarRutas();
    return;
  }

  this.rutaService
    .filtrarPorTransportista(this.filtroNombre)
    .subscribe(r => this.rutas = r);
}

filtrarEstado(): void {
  if (!this.filtroEstado) {
    this.cargarRutas();
    return;
  }

  this.rutaService
    .filtrarPorEstado(this.filtroEstado)
    .subscribe(r => this.rutas = r);
}

filtrarFecha(): void {
  if (!this.filtroFecha) {
    this.cargarRutas();
    return;
  }

  this.rutaService
    .filtrarPorFecha(this.filtroFecha)
    .subscribe(r => this.rutas = r);
}

}
