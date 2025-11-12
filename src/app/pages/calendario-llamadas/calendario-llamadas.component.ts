import {
  Component,
  OnInit,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg, EventInput } from '@fullcalendar/core';
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

  llamadaSeleccionada: any = null;
  mostrarFormulario = false;

  @ViewChild('editarModal') editarModal!: ElementRef<HTMLDivElement>;

  constructor(private llamadaService: LlamadasService) {}

  ngOnInit(): void {
    const hoy = new Date().toISOString().slice(0, 10);

    this.calendarOptions = {
      plugins: [dayGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      initialDate: hoy,
      locale: 'es',
      height: 'auto',
      nowIndicator: true,
      events: [],
      dateClick: (info) => this.mostrarLlamadasDelDia(info.dateStr),
      eventClick: (info) => this.onEventClick(info),
    };

    this.cargarEventos(hoy);
  }

  cargarEventos(fechaSeleccionada?: string) {
    this.llamadaService.getEventosCalendario().subscribe((data) => {
      // 🔹 Aseguramos que todos los eventos tengan un id
      this.llamadas = data.map((l: any) => ({
        ...l,
        id: String(l.id),
        start: l.fechaHora,
        end: l.fechaHora,
        title: l.motivo,
        color:
          l.estado === 'pendiente'
            ? '#f8c146'
            : l.estado === 'realizada'
            ? '#28a745'
            : '#dc3545',
      }));

      this.calendarOptions = {
        ...this.calendarOptions,
        events: this.llamadas as EventInput[],
      };

      if (fechaSeleccionada) {
        this.mostrarLlamadasDelDia(fechaSeleccionada);
      }
    });
  }

  mostrarLlamadasDelDia(fecha: string) {
    this.fechaSeleccionada = fecha;
    this.llamadasDelDia = this.llamadas.filter(
      (l) => l.fechaHora.slice(0, 10) === fecha
    );
    this.nuevaLlamada.fechaHora = fecha + 'T09:00';
  }

  onEventClick(info: EventClickArg) {
    const idEvento = info.event.id;
    const llamada = this.llamadas.find((l) => String(l.id) === String(idEvento));
    if (!llamada) return;

    this.llamadaSeleccionada = {
      ...llamada,
      // Aseguramos formato compatible con datetime-local
      fechaHora: this.formatFechaHora(llamada.fechaHora),
    };

    const modalEl = this.editarModal.nativeElement;
    const modal = new (window as any).bootstrap.Modal(modalEl);
    modal.show();
  }
  abrirDesdeLista(id: number | string) {
  const llamada = this.llamadas.find((l) => String(l.id) === String(id));
  if (!llamada) return;

  this.llamadaSeleccionada = {
    ...llamada,
    fechaHora: this.formatFechaHora(llamada.fechaHora),
  };

  const modalEl = this.editarModal.nativeElement;
  const modal = new (window as any).bootstrap.Modal(modalEl);
  modal.show();
}


  guardarLlamada() {
    this.llamadaService.crearLlamada(this.nuevaLlamada).subscribe((nueva) => {
      const evento = {
        id: String(nueva.id),
        title: nueva.motivo,
        start: nueva.fechaHora,
        end: nueva.fechaHora,
        estado: nueva.estado,
        color:
          nueva.estado === 'pendiente'
            ? '#f8c146'
            : nueva.estado === 'realizada'
            ? '#28a745'
            : '#dc3545',
      };

      this.llamadas.push(evento);
      this.calendarOptions = {
        ...this.calendarOptions,
        events: [...this.llamadas],
      };

      const fechaLlamada = nueva.fechaHora.slice(0, 10);
      if (this.fechaSeleccionada === fechaLlamada) {
        this.llamadasDelDia.push(nueva);
      }

      this.nuevaLlamada = {
        motivo: '',
        fechaHora: '',
        estado: 'pendiente',
        observaciones: '',
        clienteId: null,
      };
      this.mostrarFormulario = false;
      this.mostrarToast('📞 Llamada añadida correctamente');
    });
  }

  actualizarLlamada() {
    const actualizada = {
      ...this.llamadaSeleccionada,
      fechaHora: new Date(this.llamadaSeleccionada.fechaHora).toISOString(),
    };

    this.llamadaService
      .actualizarLlamada(actualizada.id, actualizada)
      .subscribe((resp: any) => {
        const index = this.llamadas.findIndex((l) => l.id === resp.id);
        if (index !== -1) {
          this.llamadas[index] = {
            ...resp,
            id: String(resp.id),
            title: resp.motivo,
            start: resp.fechaHora,
            end: resp.fechaHora,
            color:
              resp.estado === 'pendiente'
                ? '#f8c146'
                : resp.estado === 'realizada'
                ? '#28a745'
                : '#dc3545',
          };
        }

        this.calendarOptions = {
          ...this.calendarOptions,
          events: [...this.llamadas],
        };

        const modalEl = this.editarModal.nativeElement;
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.hide();

        this.mostrarToast('✅ Llamada actualizada correctamente');
        this.mostrarLlamadasDelDia(this.fechaSeleccionada!);
      });
  }

  eliminarLlamada() {
    if (!confirm('❌ ¿Seguro que deseas eliminar esta llamada?')) return;

    this.llamadaService
      .eliminarLlamada(this.llamadaSeleccionada.id)
      .subscribe(() => {
        this.llamadas = this.llamadas.filter(
          (l) => l.id !== this.llamadaSeleccionada.id
        );

        this.calendarOptions = {
          ...this.calendarOptions,
          events: [...this.llamadas],
        };

        const modalEl = this.editarModal.nativeElement;
        const modal = new (window as any).bootstrap.Modal(modalEl);
        modal.hide();

        this.mostrarToast('🗑️ Llamada eliminada correctamente');
        if (this.fechaSeleccionada)
          this.mostrarLlamadasDelDia(this.fechaSeleccionada);
      });
  }

  formatFechaHora(fecha: string): string {
    const d = new Date(fecha);
    const off = d.getTimezoneOffset();
    const ajustada = new Date(d.getTime() - off * 60000);
    return ajustada.toISOString().slice(0, 16);
  }

  mostrarToast(mensaje: string) {
    const toast = document.createElement('div');
    toast.className =
      'toast align-items-center text-bg-success border-0 position-fixed top-0 end-0 m-3';
    toast.style.zIndex = '1055';
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${mensaje}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>`;
    document.body.appendChild(toast);
    const bsToast = new (window as any).bootstrap.Toast(toast);
    bsToast.show();
    setTimeout(() => toast.remove(), 3000);
  }
}
