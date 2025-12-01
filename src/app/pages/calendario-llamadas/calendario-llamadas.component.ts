import { Component, OnInit, ViewChild } from '@angular/core';

import { CommonModule } from '@angular/common';
import {
  FullCalendarComponent,
  FullCalendarModule,
} from '@fullcalendar/angular';

import { CalendarOptions } from '@fullcalendar/core';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import dayGridPlugin from '@fullcalendar/daygrid';

import * as bootstrap from 'bootstrap';

import { LlamadasService } from '../../services/llamadas.service';
import { ILlamada } from '../../interfaces/illamda';

import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-calendario-llamadas',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './calendario-llamadas.component.html',
  styleUrls: ['./calendario-llamadas.component.css'],
})
export class CalendarioLlamadasComponent implements OnInit {
  @ViewChild('calendar') calendarRef!: FullCalendarComponent;

  llamadas: ILlamada[] = [];
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


  // ============================
  //    CALENDAR OPTIONS
  // ============================
  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    locale: 'es',
    dateClick: (args) => this.handleDateClick(args),
    eventClick: (info) => this.handleEventClick(info),
    events: [],
  };

  constructor(private llamadasService: LlamadasService) {}

  ngOnInit(): void {
    this.cargarEventosCalendario();
  }

  // ======================================================
  //              CARGAR EVENTOS CALENDARIO
  // ======================================================
  private cargarEventosCalendario(): void {
    this.llamadasService.getEventosCalendario().subscribe({
      next: (eventos) => {
        const api = this.calendarRef.getApi();
        api.removeAllEvents();

        const fcEvents = eventos.map((e) => ({
          id: e.id.toString(),
          title: e.motivo,
          start: e.fecha, 
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

  // ======================================================
  //                   CLICK EN DÍA
  // ======================================================
  handleDateClick(arg: DateClickArg): void {
    this.fechaSeleccionada = arg.dateStr;

    // Pre-cargar fecha en el formulario
    this.nuevaLlamada.fecha = arg.dateStr + "T12:00"; // hora por defecto

    this.cargarLlamadasDelDia(arg.dateStr);
  }

  // ======================================================
  //                CLICK EVENTO (MODAL)
  // ======================================================
  handleEventClick(info: any): void {
    const id = Number(info.event.id);

    this.llamadasService.getById(id).subscribe({
      next: (llamada) => {
        this.llamadaSeleccionada = { ...llamada };

        // Convertir LocalDateTime → datetime-local
        this.llamadaSeleccionada.fecha = llamada.fecha.replace(" ", "T");

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

  // ======================================================
  //                   GUARDAR NUEVA
  // ======================================================
  guardarLlamada(): void {
    // FORMATO ISO para LocalDateTime
    this.nuevaLlamada.fecha = this.nuevaLlamada.fecha.replace(" ", "T");

    this.llamadasService.crearLlamada(this.nuevaLlamada).subscribe({
      next: () => {
        if (this.fechaSeleccionada) {
          this.cargarLlamadasDelDia(this.fechaSeleccionada);
        }

        setTimeout(() => this.cargarEventosCalendario(), 100);

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
      error: (err) => console.error("Error guardando llamada", err)
    });
  }

  // ======================================================
  //                   ACTUALIZAR
  // ======================================================
  actualizarLlamada(): void {
    if (!this.llamadaSeleccionada) return;

    this.llamadaSeleccionada.fecha =
      this.llamadaSeleccionada.fecha.replace(" ", "T");

    this.llamadasService
      .actualizarLlamada(this.llamadaSeleccionada.id, this.llamadaSeleccionada)
      .subscribe({
        next: () => {
          this.cerrarModal();
          if (this.fechaSeleccionada)
            this.cargarLlamadasDelDia(this.fechaSeleccionada);

          this.cargarEventosCalendario();
        },
      });
  }

  // ======================================================
  //                   ELIMINAR
  // ======================================================
  eliminarLlamada(): void {
    if (!this.llamadaSeleccionada) return;

    this.llamadasService
      .eliminarLlamada(this.llamadaSeleccionada.id)
      .subscribe({
        next: () => {
          this.cerrarModal();
          if (this.fechaSeleccionada)
            this.cargarLlamadasDelDia(this.fechaSeleccionada);

          this.cargarEventosCalendario();
        },
      });
  }

  // ======================================================
  //                   CERRAR MODAL
  // ======================================================
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
    error: (err) => console.error(err)
  });
}

}
