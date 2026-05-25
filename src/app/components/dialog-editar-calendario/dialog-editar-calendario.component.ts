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
import { MatButtonModule } from '@angular/material/button';

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
    MatButtonModule,
  ],
  templateUrl: './dialog-editar-calendario.component.html',
  styleUrls: ['./dialog-editar-calendario.component.css'],
})
export class DialogEditarCalendarioComponent {
  tipo: TipoCalendarioDialog;

  id = 0;

  titulo = '';
  fecha = '';
  hora = '12:00';

  estado: EstadoCalendario = 'pendiente';

  observaciones = '';

  horasDisponibles: string[] = [];

  constructor(
    private dialogRef: MatDialogRef<DialogEditarCalendarioComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: DialogEditarCalendarioData,
  ) {
    this.tipo = data.tipo;

    const item = data.item;

    this.id = item.id;

    this.titulo = this.tipo === 'llamadas' ? item.motivo : item.titulo;

    this.fecha = item.fecha?.substring(0, 10) || '';

    this.hora = item.fecha?.substring(11, 16) || '12:00';

    this.estado = item.estado || 'pendiente';

    this.observaciones = item.observaciones || '';

    this.generarHoras();
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

    this.horasDisponibles = horas;
  }

  guardar(): void {
    const fechaCompleta = `${this.fecha}T${this.hora}`;

    // LLAMADAS
    if (this.tipo === 'llamadas') {
      this.dialogRef.close({
        id: this.id,
        motivo: this.titulo,
        fecha: fechaCompleta,
        estado: this.estado,
        observaciones: this.observaciones,
        clienteId: this.data.item.clienteId ?? null,
      });

      return;
    }

    // TAREAS / VISITAS
    this.dialogRef.close({
      id: this.id,
      titulo: this.titulo,
      fecha: fechaCompleta,
      estado: this.estado,
      observaciones: this.observaciones,
    });
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }
}
