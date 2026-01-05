import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';

import * as bootstrap from 'bootstrap';

import { LlamadasService } from '../../services/llamadas.service';
import { ILlamada } from '../../interfaces/illamda';

@Component({
  selector: 'app-calendario-llamadas',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './calendario-llamadas.component.html',
  styleUrls: ['./calendario-llamadas.component.css'],
})
export class CalendarioLlamadasComponent implements AfterViewInit {
  @ViewChild('calendar') calendarRef!: FullCalendarComponent;

  llamadasDelDia: ILlamada[] = [];
  fechaSeleccionada: string | null = null;

  mostrarFormulario = false;

  nuevaLlamada: ILlamada = {
    id: 0,
    motivo: '',
    fecha: '',
    estado: 'pendiente',
    observaciones: '',
    clienteId: null,
  };

  llamadaSeleccionada: ILlamada | null = null;

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    locale: 'es',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    dateClick: (args) => this.handleDateClick(args),
    eventClick: (info) => this.handleEventClick(info),
    events: [],
  };

  constructor(private llamadasService: LlamadasService) {}

  ngAfterViewInit(): void {
    this.cargarEventosCalendario();
  }

  private cargarEventosCalendario(): void {
    this.llamadasService.getEventosCalendario().subscribe({
      next: (eventos) => {
        const api = this.calendarRef.getApi();
        api.removeAllEvents();

        const fcEvents = eventos.map((e: any) => ({
          id: String(e.id),
          title: e.title,
          start: e.start,
          backgroundColor:
            e.estado === 'pendiente'
              ? '#ffc23e'
              : e.estado === 'realizada'
              ? '#1cc88a'
              : '#e74a3b',
        }));

        api.addEventSource(fcEvents);
      },
      error: (err) => console.error('Error cargando eventos', err),
    });
  }

  handleDateClick(arg: DateClickArg): void {
    this.fechaSeleccionada = arg.dateStr;

    // ✅ ISO para datetime-local
    this.nuevaLlamada.fecha = `${arg.dateStr}T12:00`;

    this.cargarLlamadasDelDia(arg.dateStr);
    this.mostrarFormulario = true;
  }

  handleEventClick(info: any): void {
    const id = Number(info.event.id);

    this.llamadasService.getById(id).subscribe({
      next: (llamada) => {
        this.llamadaSeleccionada = { ...llamada };

        const modal = new bootstrap.Modal(
          document.getElementById('editarModal') as HTMLElement
        );
        modal.show();
      },
      error: (err) => console.error(err),
    });
  }

  private cargarLlamadasDelDia(fechaStr: string): void {
    this.llamadasService.getLlamadasDia(fechaStr).subscribe({
      next: (llamadas) => (this.llamadasDelDia = llamadas),
      error: (err) => console.error('Error llamadas del día', err),
    });
  }

  // ✅ Normaliza a yyyy-MM-ddTHH:mm si por algún motivo llega distinto
  private normalizarFechaIso(fecha: string): string {
    // si ya viene bien: 2026-01-05T13:30
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(fecha)) return fecha;

    // si viniera con segundos: 2026-01-05T13:30:00
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(fecha)) {
      return fecha.substring(0, 16);
    }

    // último recurso: intenta parsear (evita toLocaleString)
    const d = new Date(fecha);
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
    }

    return fecha; // si no puede, lo deja y backend lo rechazará
  }

  guardarLlamada(): void {
    // ✅ Validación mínima
    if (!this.nuevaLlamada.motivo?.trim()) return;
    if (!this.nuevaLlamada.fecha?.trim()) return;

    // ✅ asegurar ISO
    this.nuevaLlamada.fecha = this.normalizarFechaIso(this.nuevaLlamada.fecha);

    this.llamadasService.crearLlamada(this.nuevaLlamada).subscribe({
      next: () => {
        if (this.fechaSeleccionada) {
          this.cargarLlamadasDelDia(this.fechaSeleccionada);
        }

        this.cargarEventosCalendario();
        this.mostrarFormulario = false;

        this.nuevaLlamada = {
          id: 0,
          motivo: '',
          fecha: '',
          estado: 'pendiente',
          observaciones: '',
          clienteId: null,
        };
      },
      error: (err) => console.error('Error guardando llamada', err),
    });
  }

  actualizarLlamada(): void {
    if (!this.llamadaSeleccionada) return;

    // ✅ asegurar ISO
    this.llamadaSeleccionada.fecha = this.normalizarFechaIso(this.llamadaSeleccionada.fecha);

    this.llamadasService
      .actualizarLlamada(this.llamadaSeleccionada.id, this.llamadaSeleccionada)
      .subscribe({
        next: () => {
          this.cerrarModal();
          if (this.fechaSeleccionada)
            this.cargarLlamadasDelDia(this.fechaSeleccionada);

          this.cargarEventosCalendario();
        },
        error: (err) => console.error('Error actualizando llamada', err),
      });
  }

  eliminarLlamada(): void {
    if (!this.llamadaSeleccionada) return;

    this.llamadasService.eliminarLlamada(this.llamadaSeleccionada.id).subscribe({
      next: () => {
        this.cerrarModal();
        if (this.fechaSeleccionada)
          this.cargarLlamadasDelDia(this.fechaSeleccionada);

        this.cargarEventosCalendario();
      },
      error: (err) => console.error('Error eliminando llamada', err),
    });
  }

  cerrarModal(): void {
    const modalElement = document.getElementById('editarModal')!;
    const modal = bootstrap.Modal.getInstance(modalElement);
    modal?.hide();
  }

  abrirModalDesdeLista(id: number): void {
    this.llamadasService.getById(id).subscribe({
      next: (llamada) => {
        this.llamadaSeleccionada = { ...llamada };

        const modal = new bootstrap.Modal(
          document.getElementById('editarModal') as HTMLElement
        );
        modal.show();
      },
      error: (err) => console.error(err),
    });
  }
}
