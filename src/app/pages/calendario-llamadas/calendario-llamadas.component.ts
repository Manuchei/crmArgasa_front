import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FormsModule } from '@angular/forms';
import { LlamadasService } from '../../services/llamadas.service';

@Component({
  selector: 'app-calendario-llamadas',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule],
  templateUrl: './calendario-llamadas.component.html',
  styleUrls: ['./calendario-llamadas.component.css'],
})
export class CalendarioLlamadasComponent implements OnInit {
  calendarOptions!: CalendarOptions;
  llamadas: any[] = [];
  llamadasDelDia: any[] = [];
  fechaSeleccionada: string | null = null;

  nuevaLlamada = {
    motivo: '',
    fechaHora: '',
    estado: 'pendiente',
    observaciones: '',
    clienteId: null,
  };

  constructor(private llamadaService: LlamadasService) {}

  ngOnInit(): void {
    // Inicializamos el calendario para que se vea incluso antes de cargar datos
    this.calendarOptions = {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      locale: 'es',
      height: 'auto',
      events: [],
      dateClick: (info) => this.mostrarLlamadasDelDia(info.dateStr),
    };

    // Luego cargamos los eventos reales
    this.cargarEventos();
  }

  cargarEventos() {
    this.llamadaService.listarTodas().subscribe((data) => {
      this.llamadas = data;

      // Actualizamos los eventos en el calendario
      this.calendarOptions = {
        ...this.calendarOptions,
        events: this.llamadas.map((l) => ({
          title: l.motivo,
          date: l.fechaHora,
          color:
            l.estado === 'pendiente'
              ? '#f8c146'
              : l.estado === 'realizada'
              ? '#28a745'
              : '#dc3545', // Colores según estado
        })),
      };
    });
  }

  mostrarLlamadasDelDia(fecha: string) {
    this.fechaSeleccionada = fecha;
    this.llamadasDelDia = this.llamadas.filter(
      (l) => l.fechaHora.slice(0, 10) === fecha
    );
    this.nuevaLlamada.fechaHora = fecha + 'T09:00';
  }

  guardarLlamada() {
    this.llamadaService.crearLlamada(this.nuevaLlamada).subscribe(() => {
      this.nuevaLlamada = {
        motivo: '',
        fechaHora: '',
        estado: 'pendiente',
        observaciones: '',
        clienteId: null,
      };
      this.cargarEventos();
      if (this.fechaSeleccionada)
        this.mostrarLlamadasDelDia(this.fechaSeleccionada);
    });
  }
}
