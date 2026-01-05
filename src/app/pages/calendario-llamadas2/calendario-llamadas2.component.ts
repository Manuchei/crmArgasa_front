import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';

import { MatDialog } from '@angular/material/dialog';
import { DialogEditarLlamadaComponent } from '../../components/dialog-editar-llamada/dialog-editar-llamada.component';

import { LlamadasService } from '../../services/llamadas.service';
import { ILlamada } from '../../interfaces/illamda';
import { ILlamadaRequest } from '../../interfaces/illamada-request';
import { IEventoCalendario } from '../../interfaces/ievento-calendario';

@Component({
  selector: 'app-calendario-llamadas2',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatListModule,
    MatDialogModule,
  ],
  templateUrl: './calendario-llamadas2.component.html',
  styleUrls: ['./calendario-llamadas2.component.css'],
})
export class CalendarioLlamadas2Component implements AfterViewInit {
  selectedDate: Date | null = null;
  fechaSeleccionadaStr: string | null = null; // yyyy-MM-dd

  llamadasDelDia: ILlamada[] = [];

  // ✅ NUEVO: inputs del formulario (fecha + hora)
  fechaNueva: Date | null = null; // datepicker
  horaNueva: string = '12:00';     // input type="time"

  nuevaLlamada: ILlamadaRequest = this.crearRequestVacio();

  private fechasConEventos = new Set<string>(); // yyyy-MM-dd

  constructor(
    private llamadasService: LlamadasService,
    private dialog: MatDialog
  ) {}

  ngAfterViewInit(): void {
    this.cargarFechasConEventos();
  }

  private crearRequestVacio(): ILlamadaRequest {
    return {
      motivo: '',
      fecha: '',
      estado: 'pendiente',
      observaciones: '',
      clienteId: null,
    };
  }

  private toYmd(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  // ✅ NUEVO: sincroniza fechaNueva + horaNueva => nuevaLlamada.fecha (yyyy-MM-ddTHH:mm)
  syncFechaHora(): void {
    // Si no hay fechaNueva, intentamos usar el día seleccionado del calendario
    if (!this.fechaNueva) {
      if (this.selectedDate) this.fechaNueva = new Date(this.selectedDate);
      else return;
    }

    const ymd = this.toYmd(this.fechaNueva);

    // Asegurar HH:mm
    const time = (this.horaNueva && /^\d{2}:\d{2}$/.test(this.horaNueva))
      ? this.horaNueva
      : '12:00';

    this.nuevaLlamada.fecha = `${ymd}T${time}`;
  }

  // ✅ reemplaza tu "preCargarHoraDefault" para trabajar con el nuevo sistema
  private preCargarHoraDefault(ymd: string): void {
    // setear valores de UI
    this.fechaNueva = new Date(`${ymd}T00:00:00`);
    this.horaNueva = '12:00';
    // setear valor real que se manda al backend
    this.syncFechaHora();
  }

  private cargarFechasConEventos(): void {
    this.llamadasService.getEventosCalendario().subscribe({
      next: (eventos: IEventoCalendario[]) => {
        this.fechasConEventos.clear();
        for (const e of eventos) {
          const ymd = e.start?.substring(0, 10);
          if (ymd) this.fechasConEventos.add(ymd);
        }
      },
      error: (err) => console.error('Error cargando eventos', err),
    });
  }

  // ✅ marcar días con eventos
  dateClass = (d: Date) => {
    const ymd = this.toYmd(d);
    return this.fechasConEventos.has(ymd) ? 'dia-con-evento' : '';
  };

  // ✅ click en el mat-calendar grande
  onSelectDate(date: Date | null): void {
    if (!date) return;

    this.selectedDate = date;

    const ymd = this.toYmd(date);
    this.fechaSeleccionadaStr = ymd;

    // ✅ precarga UI y fecha real
    this.preCargarHoraDefault(ymd);

    this.cargarLlamadasDelDia(ymd);
  }

  private cargarLlamadasDelDia(ymd: string): void {
    this.llamadasService.getLlamadasDia(ymd).subscribe({
      next: (llamadas) => (this.llamadasDelDia = llamadas),
      error: (err) => console.error('Error llamadas del día', err),
    });
  }

  guardarLlamada(): void {
    if (!this.fechaSeleccionadaStr) return;
    if (!this.nuevaLlamada.motivo?.trim()) return;

    // ✅ asegurar que la fecha se calcule desde los inputs
    this.syncFechaHora();
    if (!this.nuevaLlamada.fecha?.trim()) return;

    // ✅ Asegurar yyyy-MM-ddTHH:mm
    this.nuevaLlamada.fecha = this.nuevaLlamada.fecha.substring(0, 16);

    this.llamadasService.crearLlamada(this.nuevaLlamada).subscribe({
      next: () => {
        // refrescar lista y marcas
        this.cargarLlamadasDelDia(this.fechaSeleccionadaStr!);
        this.cargarFechasConEventos();

        // reset del form, manteniendo el día seleccionado
        const ymd = this.fechaSeleccionadaStr!;
        this.nuevaLlamada = this.crearRequestVacio();
        this.preCargarHoraDefault(ymd);
      },
      error: (err) => console.error('Error guardando llamada', err),
    });
  }

  editar(llamada: ILlamada): void {
    const dialogRef = this.dialog.open(DialogEditarLlamadaComponent, {
      width: '520px',
      data: llamada,
    });

    dialogRef.afterClosed().subscribe((result: ILlamada | null) => {
      if (!result) return;

      this.llamadasService.actualizarLlamada(result.id, result).subscribe({
        next: () => {
          if (this.fechaSeleccionadaStr) {
            this.cargarLlamadasDelDia(this.fechaSeleccionadaStr);
          }
          this.cargarFechasConEventos();
        },
        error: (err) => console.error('Error actualizando llamada', err),
      });
    });
  }

  trackByLlamadaId(_: number, item: ILlamada) {
    return item.id;
  }
}
