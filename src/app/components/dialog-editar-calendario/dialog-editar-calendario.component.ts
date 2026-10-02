import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

export type TipoCalendarioDialog = 'llamadas' | 'tareas' | 'visitas';

export type EstadoCalendario =
  | 'pendiente'
  | 'en_progreso'
  | 'realizada'
  | 'cancelada';

export interface DialogEditarCalendarioData {
  tipo: TipoCalendarioDialog;
  item: any;
}

@Component({
  selector: 'app-dialog-editar-calendario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './dialog-editar-calendario.component.html',
  styleUrls: ['./dialog-editar-calendario.component.css'],
})
export class DialogEditarCalendarioComponent {
  tipo: TipoCalendarioDialog;
  id = 0;

  nombre = '';
  direccion = '';
  titulo = '';
  fecha = '';
  hora = '12:00';
  estado: EstadoCalendario = 'pendiente';
  observaciones = '';

  horasDisponibles: string[] = [];
  error = '';

  constructor(
    private dialogRef: MatDialogRef<DialogEditarCalendarioComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogEditarCalendarioData,
  ) {
    this.tipo = data.tipo;

    const item = data.item;

    this.id = item.id;
    this.nombre = item.nombre || '';
    this.direccion = item.direccion || '';
    this.titulo = (this.tipo === 'llamadas' ? item.motivo : item.titulo) || '';
    this.fecha = item.fecha?.substring(0, 10) || '';
    this.hora = item.fecha?.substring(11, 16) || '12:00';
    this.estado = item.estado || 'pendiente';
    this.observaciones = item.observaciones || '';

    this.generarHoras();
  }

  get etiqueta(): string {
    if (this.tipo === 'llamadas') return 'llamada';
    if (this.tipo === 'tareas') return 'tarea';
    return 'visita';
  }

  private generarHoras(): void {
    const horas: string[] = [];

    for (let h = 8; h <= 22; h++) {
      for (let m = 0; m < 60; m += 5) {
        horas.push(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        );
      }
    }

    // Conserva también una hora existente fuera de los intervalos habituales.
    if (/^\d{2}:\d{2}$/.test(this.hora) && !horas.includes(this.hora)) {
      horas.push(this.hora);
      horas.sort();
    }

    this.horasDisponibles = horas;
  }

  guardar(): void {
    this.error = '';

    if (!this.titulo.trim()) {
      this.error = 'Indica el motivo de la actividad.';
      return;
    }

    if (!this.fecha || !this.hora) {
      this.error = 'Selecciona la fecha y la hora.';
      return;
    }

    const resultado = {
      ...this.data.item,
      id: this.id,
      nombre: this.nombre.trim(),
      direccion: this.direccion.trim(),
      fecha: `${this.fecha}T${this.hora}`,
      estado: this.estado,
      observaciones: this.observaciones.trim(),
    };

    if (this.tipo === 'llamadas') {
      this.dialogRef.close({
        ...resultado,
        motivo: this.titulo.trim(),
        clienteId: this.data.item.clienteId ?? null,
      });
      return;
    }

    this.dialogRef.close({
      ...resultado,
      titulo: this.titulo.trim(),
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
