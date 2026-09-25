import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

import { LlamadasService } from '../../services/llamadas.service';
import { TareasService } from '../../services/tareas.service';
import { VisitasService } from '../../services/visitas.service';

import { ILlamada } from '../../interfaces/illamda';
import { ILlamadaRequest } from '../../interfaces/illamada-request';
import { ITarea } from '../../interfaces/itarea';
import { IVisita } from '../../interfaces/ivisita';
import { IEventoCalendario } from '../../interfaces/ievento-calendario';
import { DialogEditarCalendarioComponent } from '../../components/dialog-editar-calendario/dialog-editar-calendario.component';

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

  nuevaLlamada: ILlamadaRequest = this.crearRequestVacio();

  nuevoTitulo = '';
  nuevoNombre = '';
  nuevaDireccion = '';
  nuevaObservacion = '';

  private fechasConEventos = new Set<string>();

  filtroNombre = '';
  filtroDireccion = '';
  filtroFecha: Date | null = null;

  llamadasRealizadas: ILlamada[] = [];
  tareasRealizadas: ITarea[] = [];
  visitasRealizadas: IVisita[] = [];

  buscandoRealizadas = false;
  busquedaRealizada = false;

  get realizadas(): Array<ILlamada | ITarea | IVisita> {
    if (this.tipoCalendario === 'llamadas') return this.llamadasRealizadas;
    if (this.tipoCalendario === 'tareas') return this.tareasRealizadas;
    return this.visitasRealizadas;
  }

  get etiquetaTipo(): string {
    if (this.tipoCalendario === 'llamadas') return 'llamadas';
    if (this.tipoCalendario === 'tareas') return 'tareas';
    return 'visitas';
  }

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
    this.limpiarFiltrosRealizadas();
    this.cargarDatosDia();
  }

  private crearRequestVacio(): ILlamadaRequest {
    return {
      empresa: 'ARGASA',
      nombre: '',
      direccion: '',
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
      if (this.selectedDate) {
        this.fechaNueva = new Date(this.selectedDate);
      } else {
        return;
      }
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
        for (const evento of eventos) {
          const ymd = evento.start?.substring(0, 10);
          if (ymd) this.fechasConEventos.add(ymd);
        }
      },
      error: (err) =>
        console.error('Error cargando eventos de llamadas', err),
    });

    this.tareasService.getAll().subscribe({
      next: (tareas) => {
        tareas.forEach((tarea) => {
          const ymd = tarea.fecha?.substring(0, 10);
          if (ymd) this.fechasConEventos.add(ymd);
        });
      },
      error: (err) =>
        console.error('Error cargando eventos de tareas', err),
    });

    this.visitasService.getAll().subscribe({
      next: (visitas) => {
        visitas.forEach((visita) => {
          const ymd = visita.fecha?.substring(0, 10);
          if (ymd) this.fechasConEventos.add(ymd);
        });
      },
      error: (err) =>
        console.error('Error cargando eventos de visitas', err),
    });
  }

  dateClass = (date: Date) => {
    const ymd = this.toYmd(date);
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
      this.llamadasService
        .getLlamadasDia(this.fechaSeleccionadaStr)
        .subscribe({
          next: (llamadas) => {
            this.llamadasDelDia = llamadas.filter(
              (llamada) =>
                llamada.estado !== 'realizada' &&
                llamada.estado !== 'cancelada',
            );
          },
          error: (err) => console.error('Error llamadas del día', err),
        });
    }

    if (this.tipoCalendario === 'tareas') {
      this.tareasService
        .getTareasDia(this.fechaSeleccionadaStr)
        .subscribe({
          next: (tareas) => {
            this.tareasDelDia = tareas.filter(
              (tarea) =>
                tarea.estado !== 'realizada' &&
                tarea.estado !== 'cancelada',
            );
          },
          error: (err) => console.error('Error tareas del día', err),
        });
    }

    if (this.tipoCalendario === 'visitas') {
      this.visitasService
        .getVisitasDia(this.fechaSeleccionadaStr)
        .subscribe({
          next: (visitas) => {
            this.visitasDelDia = visitas.filter(
              (visita) =>
                visita.estado !== 'realizada' &&
                visita.estado !== 'cancelada',
            );
          },
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
          nombre: this.nuevoNombre,
          direccion: this.nuevaDireccion,
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
          nombre: this.nuevoNombre,
          direccion: this.nuevaDireccion,
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

    this.nuevaLlamada.fecha =
      this.nuevaLlamada.fecha.substring(0, 16);

    this.llamadasService
      .crearLlamada(this.nuevaLlamada)
      .subscribe({
        next: () => this.resetFormulario(),
        error: (err) => console.error('Error guardando llamada', err),
      });
  }

  private resetFormulario(): void {
    this.cargarDatosDia();
    this.cargarFechasConEventos();

    const ymd = this.fechaSeleccionadaStr!;

    this.nuevaLlamada = this.crearRequestVacio();
    this.nuevoTitulo = '';
    this.nuevoNombre = '';
    this.nuevaDireccion = '';
    this.nuevaObservacion = '';

    this.preCargarHoraDefault(ymd);
  }

  trackByLlamadaId(
    _: number,
    item: ILlamada | ITarea | IVisita,
  ): number {
    return item.id;
  }

  trackByTareaId(_: number, item: ITarea): number {
    return item.id;
  }

  trackByVisitaId(_: number, item: IVisita): number {
    return item.id;
  }

  cambiarEstadoLlamada(
    llamada: ILlamada,
    estado: 'pendiente' | 'en_progreso' | 'realizada' | 'cancelada',
  ): void {
    const body: ILlamadaRequest = {
      empresa: '',
      nombre: llamada.nombre || '',
      direccion: llamada.direccion || '',
      motivo: llamada.motivo,
      fecha: llamada.fecha.substring(0, 16),
      estado,
      observaciones: llamada.observaciones || '',
      clienteId: llamada.clienteId ?? null,
    };

    this.llamadasService
      .actualizarLlamada(llamada.id, body)
      .subscribe({
        next: () => {
          this.cargarDatosDia();
          this.cargarFechasConEventos();
        },
        error: (err) =>
          console.error('Error cambiando estado llamada', err),
      });
  }

  cambiarEstadoTarea(
    tarea: ITarea,
    estado: 'pendiente' | 'en_progreso' | 'realizada' | 'cancelada',
  ): void {
    this.tareasService
      .actualizarTarea(tarea.id, {
        empresa: '',
        titulo: tarea.titulo,
        nombre: tarea.nombre || '',
        direccion: tarea.direccion || '',
        fecha: tarea.fecha.substring(0, 16),
        estado,
        observaciones: tarea.observaciones || '',
      })
      .subscribe({
        next: () => {
          this.cargarDatosDia();
          this.cargarFechasConEventos();
        },
        error: (err) =>
          console.error('Error cambiando estado tarea', err),
      });
  }

  cambiarEstadoVisita(
    visita: IVisita,
    estado: 'pendiente' | 'en_progreso' | 'realizada' | 'cancelada',
  ): void {
    this.visitasService
      .actualizarVisita(visita.id, {
        empresa: '',
        titulo: visita.titulo,
        nombre: visita.nombre || '',
        direccion: visita.direccion || '',
        fecha: visita.fecha.substring(0, 16),
        estado,
        observaciones: visita.observaciones || '',
      })
      .subscribe({
        next: () => {
          this.cargarDatosDia();
          this.cargarFechasConEventos();
        },
        error: (err) =>
          console.error('Error cambiando estado visita', err),
      });
  }

  editar(llamada: ILlamada): void {
    const dialogRef = this.dialog.open(
      DialogEditarCalendarioComponent,
      {
        width: '520px',
        maxWidth: '95vw',
        data: {
          tipo: 'llamadas',
          item: llamada,
        },
      },
    );

    dialogRef.afterClosed().subscribe((result: any | null) => {
      if (!result) return;

      this.llamadasService
        .actualizarLlamada(result.id, {
          empresa: '',
          nombre: result.nombre || '',
          direccion: result.direccion || '',
          motivo: result.motivo,
          fecha: result.fecha.substring(0, 16),
          estado: result.estado,
          observaciones: result.observaciones || '',
          clienteId: result.clienteId ?? null,
        })
        .subscribe({
          next: () => {
            this.cargarDatosDia();
            this.cargarFechasConEventos();
          },
          error: (err) =>
            console.error('Error actualizando llamada', err),
        });
    });
  }

  editarTarea(tarea: ITarea): void {
    const dialogRef = this.dialog.open(
      DialogEditarCalendarioComponent,
      {
        width: '520px',
        maxWidth: '95vw',
        data: {
          tipo: 'tareas',
          item: tarea,
        },
      },
    );

    dialogRef.afterClosed().subscribe((result: any | null) => {
      if (!result) return;

      this.tareasService
        .actualizarTarea(result.id, {
          empresa: '',
          titulo: result.titulo,
          nombre: result.nombre || '',
          direccion: result.direccion || '',
          fecha: result.fecha.substring(0, 16),
          estado: result.estado,
          observaciones: result.observaciones || '',
        })
        .subscribe({
          next: () => {
            this.cargarDatosDia();
            this.cargarFechasConEventos();
          },
          error: (err) =>
            console.error('Error actualizando tarea', err),
        });
    });
  }

  editarVisita(visita: IVisita): void {
    const dialogRef = this.dialog.open(
      DialogEditarCalendarioComponent,
      {
        width: '520px',
        maxWidth: '95vw',
        data: {
          tipo: 'visitas',
          item: visita,
        },
      },
    );

    dialogRef.afterClosed().subscribe((result: any | null) => {
      if (!result) return;

      this.visitasService
        .actualizarVisita(result.id, {
          empresa: '',
          titulo: result.titulo,
          nombre: result.nombre || '',
          direccion: result.direccion || '',
          fecha: result.fecha.substring(0, 16),
          estado: result.estado,
          observaciones: result.observaciones || '',
        })
        .subscribe({
          next: () => {
            this.cargarDatosDia();
            this.cargarFechasConEventos();
          },
          error: (err) =>
            console.error('Error actualizando visita', err),
        });
    });
  }

  toggleEstadoLlamada(llamada: ILlamada): void {
    const nuevoEstado =
      llamada.estado === 'pendiente'
        ? 'en_progreso'
        : llamada.estado === 'en_progreso'
          ? 'realizada'
          : llamada.estado;

    if (nuevoEstado === llamada.estado) return;

    this.cambiarEstadoLlamada(llamada, nuevoEstado);
  }

  toggleEstadoTarea(tarea: ITarea): void {
    const nuevoEstado =
      tarea.estado === 'pendiente'
        ? 'en_progreso'
        : tarea.estado === 'en_progreso'
          ? 'realizada'
          : tarea.estado;

    if (nuevoEstado === tarea.estado) return;

    this.cambiarEstadoTarea(tarea, nuevoEstado);
  }

  toggleEstadoVisita(visita: IVisita): void {
    const nuevoEstado =
      visita.estado === 'pendiente'
        ? 'en_progreso'
        : visita.estado === 'en_progreso'
          ? 'realizada'
          : visita.estado;

    if (nuevoEstado === visita.estado) return;

    this.cambiarEstadoVisita(visita, nuevoEstado);
  }

  esPasada(fecha: string): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const fechaElemento = new Date(fecha);
    fechaElemento.setHours(0, 0, 0, 0);

    return fechaElemento < hoy;
  }

  buscarRealizadas(): void {
    const fecha = this.filtroFecha
      ? this.toYmd(this.filtroFecha)
      : undefined;

    this.buscandoRealizadas = true;
    this.busquedaRealizada = false;

    const tipoBuscado = this.tipoCalendario;

    const consulta: Observable<
      ILlamada[] | ITarea[] | IVisita[]
    > =
      tipoBuscado === 'llamadas'
        ? this.llamadasService.getLlamadasRealizadas(
            this.filtroNombre,
            fecha,
            this.filtroDireccion,
          )
        : tipoBuscado === 'tareas'
          ? this.tareasService.getRealizadas(
              this.filtroNombre,
              fecha,
              this.filtroDireccion,
            )
          : this.visitasService.getRealizadas(
              this.filtroNombre,
              fecha,
              this.filtroDireccion,
            );

    consulta.subscribe({
      next: (resultados) => {
        if (tipoBuscado === 'llamadas') {
          this.llamadasRealizadas = resultados as ILlamada[];
        } else if (tipoBuscado === 'tareas') {
          this.tareasRealizadas = resultados as ITarea[];
        } else {
          this.visitasRealizadas = resultados as IVisita[];
        }

        this.buscandoRealizadas = false;
        this.busquedaRealizada = true;
      },
      error: (err) => {
        console.error('Error buscando elementos realizados', err);
        this.buscandoRealizadas = false;
        this.busquedaRealizada = true;
      },
    });
  }

  limpiarFiltrosRealizadas(): void {
    this.filtroNombre = '';
    this.filtroDireccion = '';
    this.filtroFecha = null;

    this.llamadasRealizadas = [];
    this.tareasRealizadas = [];
    this.visitasRealizadas = [];

    this.busquedaRealizada = false;
  }
}