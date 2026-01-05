import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

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
    MatButtonModule,
  ],
  templateUrl: './dialog-editar-llamada.component.html',
})
export class DialogEditarLlamadaComponent {
  llamada: ILlamada;

  constructor(
    private dialogRef: MatDialogRef<DialogEditarLlamadaComponent>,
    @Inject(MAT_DIALOG_DATA) data: ILlamada
  ) {
    // copia para no mutar la lista si cancelas
    this.llamada = { ...data };
  }

  cancelar(): void {
    this.dialogRef.close(null);
  }

  guardar(): void {
    // ✅ normaliza yyyy-MM-ddTHH:mm
    this.llamada.fecha = this.llamada.fecha?.substring(0, 16);
    this.dialogRef.close(this.llamada);
  }
}
