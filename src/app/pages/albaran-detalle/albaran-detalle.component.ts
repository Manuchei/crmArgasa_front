import { AlbaranesService } from './../../services/albaranes.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-albaran-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './albaran-detalle.component.html',
})
export class AlbaranDetalleComponent implements OnInit {
  albaran: any;

  nuevaLinea = {
    codigo: '',
    descripcion: '',
    unidades: 1,
    precio: 0,
    dtoPct: 0,
  };

  cargando = false;

  constructor(private route: ActivatedRoute, private albaranesService: AlbaranesService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!isNaN(id)) this.cargar(id);
  }

  cargar(id: number): void {
    this.cargando = true;
    this.albaranesService.getById(id).subscribe({
      next: (data) => {
        this.albaran = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando albarán:', err);
        this.cargando = false;
      },
    });
  }

  agregarLinea(): void {
    if (!this.albaran?.id) return;

    if (!this.nuevaLinea.descripcion?.trim()) {
      alert('La descripción es obligatoria');
      return;
    }

    const linea = {
      codigo: this.nuevaLinea.codigo?.trim() || null,
      descripcion: this.nuevaLinea.descripcion.trim(),
      unidades: Number(this.nuevaLinea.unidades || 0),
      precio: Number(this.nuevaLinea.precio || 0),
      dtoPct: Number(this.nuevaLinea.dtoPct || 0),
    };

    this.albaranesService.agregarLinea(this.albaran.id, linea).subscribe({
      next: (albaranActualizado) => {
        this.albaran = albaranActualizado;
        this.nuevaLinea = { codigo: '', descripcion: '', unidades: 1, precio: 0, dtoPct: 0 };
      },
      error: (err) => {
        console.error('Error agregando línea:', err);
        alert('No se pudo añadir la línea');
      },
    });
  }

  eliminarLinea(lineaId: number): void {
    if (!this.albaran?.id) return;
    if (!confirm('¿Eliminar esta línea?')) return;

    this.albaranesService.eliminarLinea(this.albaran.id, lineaId).subscribe({
      next: (albaranActualizado) => (this.albaran = albaranActualizado),
      error: (err) => {
        console.error('Error eliminando línea:', err);
        alert('No se pudo eliminar la línea');
      },
    });
  }

  confirmar(): void {
    if (!this.albaran?.id) return;
    if (!confirm('¿Confirmar este albarán?')) return;

    this.albaranesService.confirmar(this.albaran.id).subscribe({
      next: (albaranActualizado) => (this.albaran = albaranActualizado),
      error: (err) => {
        console.error('Error confirmando:', err);
        alert('No se pudo confirmar');
      },
    });
  }
}
