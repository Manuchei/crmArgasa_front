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
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { MatDialog } from '@angular/material/dialog';
import { DialogEditarLlamadaComponent } from '../../components/dialog-editar-llamada/dialog-editar-llamada.component';

import { LlamadasService } from '../../services/llamadas.service';
import { TareasService } from '../../services/tareas.service';
import { VisitasService } from '../../services/visitas.service';

import { ILlamada } from '../../interfaces/illamda';
import { ILlamadaRequest } from '../../interfaces/illamada-request';
import { ITarea } from '../../interfaces/itarea';
import { IVisita } from '../../interfaces/ivisita';
import { IEventoCalendario } from '../../interfaces/ievento-calendario';

type TipoCalendario = 'llamadas' | 'tareas' | 'visitas';

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
    MatButtonToggleModule,
  ],
  templateUrl: './calendario-llamadas2.component.html',
  styleUrls: ['./calendario-llamadas2.component.css'],
})
export class CalendarioLlamadas2Component implements AfterViewInit {
  selectedDate: Date | null = null;
  fechaSeleccionadaStr: string | null = null;

  tipoCalendario: TipoCalendario = 'llamadas';

  llamadasDelDia: ILlamada[] = [];
  tareasDelDia: ITarea[] = [];
  visitasDelDia: IVisita[] = [];

  fechaNueva: Date | null = null;
  horasDisponibles: string[] = [];
  horaNueva = '12:00';

  nuevaLlamada: ILlamadaRequest = this.crearRequestLlamadaVacio();

  nuevoTitulo = '';
  nuevaObservacion = '';

  private fechasConEventos = new Set<string>();

  constructor(
    private llamadasService: LlamadasService,
    private tareasService: TareasService,
    private visitasService: VisitasService,
    private dialog: MatDialog,
  ) {}

  ngAfterViewInit(): void {
    this.generarHoras();
    this.cargarFechasConEventos();
    this.seleccionarHoy();
  }

  private seleccionarHoy(): void {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    this.onSelectDate(hoy);
  }

  cambiarTipo(tipo: TipoCalendario): void {
    this.tipoCalendario = tipo;
    this.cargarDatosDia();
  }

  private crearRequestLlamadaVacio(): ILlamadaRequest {
    return {
      empresa: 'ARGASA',
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

  syncFechaHora(): void {
    if (!this.fechaNueva) {
      if (this.selectedDate) this.fechaNueva = new Date(this.selectedDate);
      else return;
    }

    const ymd = this.toYmd(this.fechaNueva);
    const time =
      this.horaNueva && /^\d{2}:\d{2}$/.test(this.horaNueva)
        ? this.horaNueva
        : '12:00';

    this.nuevaLlamada.fecha = `${ymd}T${time}`;
  }

  private obtenerFechaHora(): string {
    this.syncFechaHora();
    return this.nuevaLlamada.fecha.substring(0, 16);
  }

  private preCargarHoraDefault(ymd: string): void {
    this.fechaNueva = new Date(`${ymd}T00:00:00`);
    this.horaNueva = '12:00';
    this.syncFechaHora();
  }

  private cargarFechasConEventos(): void {
    this.fechasConEventos.clear();

    this.llamadasService.getEventosCalendario().subscribe({
      next: (eventos: IEventoCalendario[]) => {
        for (const e of eventos) {
          const ymd = e.start?.substring(0, 10);
          if (ymd) this.fechasConEventos.add(ymd);
        }
      },
      error: (err) => console.error('Error cargando eventos de llamadas', err),
    });

    this.tareasService.getAll().subscribe({
      next: (tareas) => {
        tareas.forEach((t) => {
          const ymd = t.fecha?.substring(0, 10);
          if (ymd) this.fechasConEventos.add(ymd);
        });
      },
      error: (err) => console.error('Error cargando eventos de tareas', err),
    });

    this.visitasService.getAll().subscribe({
      next: (visitas) => {
        visitas.forEach((v) => {
          const ymd = v.fecha?.substring(0, 10);
          if (ymd) this.fechasConEventos.add(ymd);
        });
      },
      error: (err) => console.error('Error cargando eventos de visitas', err),
    });
  }

  dateClass = (d: Date) => {
    const ymd = this.toYmd(d);
    return this.fechasConEventos.has(ymd) ? 'dia-con-evento' : '';
  };

  onSelectDate(date: Date | null): void {
    if (!date) return;

    this.selectedDate = date;

    const ymd = this.toYmd(date);
    this.fechaSeleccionadaStr = ymd;

    this.preCargarHoraDefault(ymd);
    this.cargarDatosDia();
  }

  cargarDatosDia(): void {
    if (!this.fechaSeleccionadaStr) return;

    if (this.tipoCalendario === 'llamadas') {
      this.llamadasService.getLlamadasDia(this.fechaSeleccionadaStr).subscribe({
        next: (llamadas) => (this.llamadasDelDia = llamadas),
        error: (err) => console.error('Error llamadas del día', err),
      });
    }

    if (this.tipoCalendario === 'tareas') {
      this.tareasService.getTareasDia(this.fechaSeleccionadaStr).subscribe({
        next: (tareas) => (this.tareasDelDia = tareas),
        error: (err) => console.error('Error tareas del día', err),
      });
    }

    if (this.tipoCalendario === 'visitas') {
      this.visitasService.getVisitasDia(this.fechaSeleccionadaStr).subscribe({
        next: (visitas) => (this.visitasDelDia = visitas),
        error: (err) => console.error('Error visitas del día', err),
      });
    }
  }

  guardarElementoCalendario(): void {
    if (!this.fechaSeleccionadaStr) return;

    if (this.tipoCalendario === 'llamadas') {
      this.guardarLlamada();
      return;
    }

    if (!this.nuevoTitulo.trim()) return;

    const fecha = this.obtenerFechaHora();

    if (this.tipoCalendario === 'tareas') {
      this.tareasService
        .crearTarea({
          empresa: 'ARGASA',
          titulo: this.nuevoTitulo,
          fecha,
          estado: 'pendiente',
          observaciones: this.nuevaObservacion || '',
        })
        .subscribe({
          next: () => this.resetFormulario(),
          error: (err) => console.error('Error guardando tarea', err),
        });
    }

    if (this.tipoCalendario === 'visitas') {
      this.visitasService
        .crearVisita({
          empresa: 'ARGASA',
          titulo: this.nuevoTitulo,
          fecha,
          estado: 'pendiente',
          observaciones: this.nuevaObservacion || '',
        })
        .subscribe({
          next: () => this.resetFormulario(),
          error: (err) => console.error('Error guardando visita', err),
        });
    }
  }

  guardarLlamada(): void {
    if (!this.fechaSeleccionadaStr) return;
    if (!this.nuevaLlamada.motivo?.trim()) return;

    this.syncFechaHora();
    if (!this.nuevaLlamada.fecha?.trim()) return;

    this.nuevaLlamada.fecha = this.nuevaLlamada.fecha.substring(0, 16);

    this.llamadasService.crearLlamada(this.nuevaLlamada).subscribe({
      next: () => this.resetFormulario(),
      error: (err) => console.error('Error guardando llamada', err),
    });
  }

  private resetFormulario(): void {
    this.cargarDatosDia();
    this.cargarFechasConEventos();

    const ymd = this.fechaSeleccionadaStr!;

    this.nuevaLlamada = this.crearRequestLlamadaVacio();
    this.nuevoTitulo = '';
    this.nuevaObservacion = '';

    this.preCargarHoraDefault(ymd);
  }

  editar(llamada: ILlamada): void {
    const dialogRef = this.dialog.open(DialogEditarLlamadaComponent, {
      width: '520px',
      maxWidth: '95vw',
      data: llamada,
    });

    dialogRef.afterClosed().subscribe((result: ILlamada | null) => {
      if (!result) return;

      this.llamadasService.actualizarLlamada(result.id, result).subscribe({
        next: () => {
          this.cargarDatosDia();
          this.cargarFechasConEventos();
        },
        error: (err) => console.error('Error actualizando llamada', err),
      });
    });
  }

  trackByLlamadaId(_: number, item: ILlamada) {
    return item.id;
  }

  trackByTareaId(_: number, item: ITarea) {
    return item.id;
  }

  trackByVisitaId(_: number, item: IVisita) {
    return item.id;
  }
}
