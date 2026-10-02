import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ILlamada } from '../../interfaces/illamda';

@Component({
  selector: 'app-dialog-editar-llamada',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './dialog-editar-llamada.component.html',
  styleUrls: ['./dialog-editar-llamada.component.css'],
})
export class DialogEditarLlamadaComponent {
  llamada: ILlamada;
  error = '';

  constructor(
    private dialogRef: MatDialogRef<DialogEditarLlamadaComponent>,
    @Inject(MAT_DIALOG_DATA) data: ILlamada,
  ) {
    this.llamada = {
      ...data,
      fecha: data.fecha?.substring(0, 16) || '',
    };
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  guardar(): void {
    this.error = '';

    if (!this.llamada.motivo?.trim()) {
      this.error = 'Indica el motivo de la llamada.';
      return;
    }

    if (!this.llamada.fecha) {
      this.error = 'Selecciona la fecha y la hora.';
      return;
    }

    this.dialogRef.close({
      ...this.llamada,
      nombre: this.llamada.nombre?.trim() || '',
      direccion: this.llamada.direccion?.trim() || '',
      motivo: this.llamada.motivo.trim(),
      fecha: this.llamada.fecha.substring(0, 16),
      observaciones: this.llamada.observaciones?.trim() || '',
    });
  }
}
