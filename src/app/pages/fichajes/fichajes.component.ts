import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import {
  FichajesService,
  MiEstadoFichaje,
  JornadaFichaje,
  EmpleadoFichaje,
  UsuarioFichaje,
  CorreccionFichaje,
} from '../../services/fichajes.service';

@Component({
  selector: 'app-fichajes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './fichajes.component.html',
  styleUrls: ['./fichajes.component.css'],
})
export class FichajesComponent implements OnInit {
  admin = false;
  vista: 'mi' | 'control' | 'empleados' = 'mi';
  mostrarMisFichajes = false;

  estado: MiEstadoFichaje | null = null;
  empleados: EmpleadoFichaje[] = [];
  usuarios: UsuarioFichaje[] = [];
  registros: JornadaFichaje[] = [];
  correcciones: CorreccionFichaje[] = [];

  auditoriaId: number | null = null;
  desde = this.fechaMadrid().slice(0, 7) + '-01';
  hasta = this.fechaMadrid();
  empleadoId = '';
  usuarioId = '';
  pagina = 0;
  total = 0;

  ocupado = false;
  cargando = false;
  cargandoEstado = false;
  cargandoEmpleados = false;
  cargandoAuditoria = false;

  error = '';
  aviso = '';
  errorEstado = '';

  editando: JornadaFichaje | null = null;
  entradaEdit = '';
  salidaEdit = '';
  motivo = '';

  pendiente: {
    tipo: 'entrada' | 'salida';
    clave: string;
  } | null = null;

  private secuencia = 0;
  private auditoriaSecuencia = 0;

  private get pendienteKey(): string {
    return 'novex_fichaje_pendiente_' + (this.auth.getUsuario()?.email || '');
  }

  constructor(
    public auth: AuthService,
    private api: FichajesService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.admin = this.auth.hasRole('ADMIN', 'DEVELOPER');
    this.vista =
      this.admin && this.route.snapshot.data['control'] ? 'control' : 'mi';

    try {
      const p = JSON.parse(sessionStorage.getItem(this.pendienteKey) || 'null');

      if (
        p &&
        (p.tipo === 'entrada' || p.tipo === 'salida') &&
        typeof p.clave === 'string'
      ) {
        this.pendiente = p;
      }
    } catch {
      sessionStorage.removeItem(this.pendienteKey);
    }

    this.cargarEstado();

    if (this.admin) {
      this.cargarEmpleados();
    }

    if (this.vista === 'control') {
      this.cargarRegistros();
    }
  }

  private fechaMadrid(): string {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const valor = (nombre: string) =>
      partes.find((p) => p.type === nombre)?.value;

    return `${valor('year')}-${valor('month')}-${valor('day')}`;
  }

  fecha(valor: string | null): string {
    if (!valor) return '—';

    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(new Date(valor));
  }

  duracion(segundos: number | null): string {
    if (segundos == null) return 'En curso';

    const minutos = Math.floor(segundos / 60);

    return `${Math.floor(minutos / 60)} h ${String(minutos % 60).padStart(2, '0')} min`;
  }

  get segundosPagina(): number {
    return this.registros.reduce((s, j) => s + (j.segundos || 0), 0);
  }

  get bloqueado(): boolean {
    return (
      this.ocupado ||
      this.cargando ||
      this.cargandoEmpleados ||
      this.cargandoEstado
    );
  }

  private mensaje(err: any): string {
    const texto =
      typeof err?.error === 'string' ? err.error : err?.error?.message;

    if (texto && texto !== 'No message available') {
      return texto;
    }

    return err?.status === 0
      ? 'No se pudo contactar con el servidor.'
      : `No se pudo completar la operación (HTTP ${err?.status || '?'}).`;
  }

  private limpiarDetalle(): void {
    this.editando = null;
    this.auditoriaId = null;
    this.correcciones = [];
    this.cargandoAuditoria = false;
    this.auditoriaSecuencia++;
  }

  cambiarVista(vista: 'mi' | 'control' | 'empleados'): void {
    if (this.bloqueado || (vista !== 'mi' && !this.admin)) {
      return;
    }

    this.vista = vista;
    this.pagina = 0;
    this.error = '';
    this.aviso = '';
    this.registros = [];
    this.total = 0;
    this.limpiarDetalle();

    if (vista === 'control' || (vista === 'mi' && this.mostrarMisFichajes)) {
      this.cargarRegistros();
    }
  }

  alternarMisFichajes(): void {
    if (this.vista !== 'mi' || this.bloqueado) return;

    this.mostrarMisFichajes = !this.mostrarMisFichajes;
    this.limpiarDetalle();

    if (this.mostrarMisFichajes) {
      this.pagina = 0;
      this.cargarRegistros();
    }
  }

  cargarEstado(): void {
    this.cargandoEstado = true;

    this.api.estado().subscribe({
      next: (estado) => {
        this.estado = estado;
        this.errorEstado = '';
        this.cargandoEstado = false;
      },
      error: (err) => {
        this.estado = null;
        this.errorEstado = this.mensaje(err);
        this.cargandoEstado = false;
      },
    });
  }

  cargarEmpleados(): void {
    if (!this.admin) return;

    this.cargandoEmpleados = true;

    forkJoin({
      empleados: this.api.empleados(),
      usuarios: this.api.candidatos(),
    }).subscribe({
      next: (resultado) => {
        this.empleados = resultado.empleados;
        this.usuarios = resultado.usuarios;
        this.cargandoEmpleados = false;
      },
      error: (err) => {
        this.error = this.mensaje(err);
        this.cargandoEmpleados = false;
      },
    });
  }

  cargarRegistros(): void {
    if (this.vista !== 'mi' && !this.admin) return;
    if (this.vista === 'empleados') return;

    if (!this.desde || !this.hasta || this.hasta < this.desde) {
      this.error = 'Selecciona un intervalo de fechas válido.';
      return;
    }

    const numero = ++this.secuencia;
    const control = this.admin && this.vista === 'control';

    this.cargando = true;
    this.error = '';
    this.limpiarDetalle();

    this.api
      .registros(
        control,
        this.desde,
        this.hasta,
        this.pagina,
        control ? this.empleadoId : '',
      )
      .subscribe({
        next: (resultado) => {
          if (numero !== this.secuencia) return;

          this.registros = resultado.registros;
          this.total = resultado.total;
          this.cargando = false;
        },
        error: (err) => {
          if (numero !== this.secuencia) return;

          this.registros = [];
          this.total = 0;
          this.error = this.mensaje(err);
          this.cargando = false;
        },
      });
  }

  filtrar(): void {
    if (this.bloqueado) return;

    this.pagina = 0;
    this.cargarRegistros();
  }

  paginaAnterior(): void {
    if (!this.bloqueado && this.pagina > 0) {
      this.pagina--;
      this.cargarRegistros();
    }
  }

  paginaSiguiente(): void {
    if (!this.bloqueado && (this.pagina + 1) * 50 < this.total) {
      this.pagina++;
      this.cargarRegistros();
    }
  }

  fichar(tipo: 'entrada' | 'salida'): void {
    if (this.bloqueado || !this.estado?.empleado.activo || this.pendiente) {
      return;
    }

    if (
      (tipo === 'entrada' && this.estado.abierta) ||
      (tipo === 'salida' && !this.estado.abierta)
    ) {
      return;
    }

    this.pendiente = { tipo, clave: crypto.randomUUID() };

    sessionStorage.setItem(this.pendienteKey, JSON.stringify(this.pendiente));

    this.enviarPendiente();
  }

  enviarPendiente(): void {
    if (!this.pendiente || this.bloqueado) return;

    this.ocupado = true;
    this.error = '';
    this.aviso = '';

    const pendiente = this.pendiente;

    this.api.fichar(pendiente.tipo, pendiente.clave).subscribe({
      next: () => {
        this.pendiente = null;
        sessionStorage.removeItem(this.pendienteKey);
        this.ocupado = false;

        this.aviso =
          pendiente.tipo === 'entrada'
            ? 'Entrada registrada.'
            : 'Salida registrada.';

        this.cargarEstado();

        if (
          this.vista === 'control' ||
          (this.vista === 'mi' && this.mostrarMisFichajes)
        ) {
          this.cargarRegistros();
        }
      },
      error: (err) => {
        this.ocupado = false;
        this.error = this.mensaje(err);

        // Conserva la clave en errores de red o servidor.
        if (err.status >= 400 && err.status < 500) {
          this.pendiente = null;
          sessionStorage.removeItem(this.pendienteKey);
        }

        this.cargarEstado();
      },
    });
  }

  alta(): void {
    if (!this.admin || !this.usuarioId || this.bloqueado) return;

    this.ocupado = true;
    this.error = '';
    this.aviso = '';

    this.api.alta(Number(this.usuarioId)).subscribe({
      next: () => {
        this.usuarioId = '';
        this.ocupado = false;
        this.aviso = 'Empleado dado de alta.';
        this.cargarEmpleados();
        this.cargarEstado();
      },
      error: (err) => {
        this.ocupado = false;
        this.error = this.mensaje(err);
      },
    });
  }

  activar(empleado: EmpleadoFichaje): void {
    if (!this.admin || this.bloqueado) return;

    if (
      !confirm(
        `${empleado.activo ? 'Desactivar' : 'Activar'} a ${empleado.nombre}?`,
      )
    ) {
      return;
    }

    this.ocupado = true;
    this.error = '';

    this.api.activar(empleado.id, !empleado.activo).subscribe({
      next: () => {
        this.ocupado = false;
        this.cargarEmpleados();
        this.cargarEstado();
      },
      error: (err) => {
        this.ocupado = false;
        this.error = this.mensaje(err);
      },
    });
  }

  private isoMadrid(valor: string): string {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
      timeZoneName: 'shortOffset',
    }).formatToParts(new Date(valor));

    const dato = (nombre: string) =>
      partes.find((p) => p.type === nombre)?.value || '';

    const offset = dato('timeZoneName').replace('GMT', '');
    const signo = offset.startsWith('-') ? '-' : '+';
    const [hora, minuto = '00'] = offset.replace(/^[+-]/, '').split(':');

    return `${dato('year')}-${dato('month')}-${dato('day')}T${dato('hour')}:${dato('minute')}:${dato('second')}${signo}${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}`;
  }

  editar(jornada: JornadaFichaje): void {
    if (!this.admin || this.vista !== 'control' || this.bloqueado) {
      return;
    }

    this.editando = jornada;
    this.entradaEdit = this.isoMadrid(jornada.entrada);
    this.salidaEdit = jornada.salida ? this.isoMadrid(jornada.salida) : '';
    this.motivo = '';
    this.error = '';
  }

  guardarCorreccion(): void {
    if (
      !this.admin ||
      this.vista !== 'control' ||
      !this.editando ||
      this.bloqueado
    ) {
      return;
    }

    const formato = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;

    if (
      !formato.test(this.entradaEdit) ||
      (this.salidaEdit && !formato.test(this.salidaEdit)) ||
      !this.motivo.trim()
    ) {
      this.error = 'Introduce fechas con su zona horaria y el motivo.';
      return;
    }

    const entrada = new Date(this.entradaEdit);
    const salida = this.salidaEdit ? new Date(this.salidaEdit) : null;

    if (isNaN(entrada.getTime()) || (salida && isNaN(salida.getTime()))) {
      this.error = 'Fecha no válida.';
      return;
    }

    if (
      this.isoMadrid(entrada.toISOString()) !== this.entradaEdit ||
      (salida && this.isoMadrid(salida.toISOString()) !== this.salidaEdit)
    ) {
      this.error =
        'Revisa la fecha y su zona: +02:00 en verano o +01:00 en invierno, según Europe/Madrid.';
      return;
    }

    if (salida && salida.getTime() < entrada.getTime()) {
      this.error = 'La salida no puede ser anterior a la entrada.';
      return;
    }

    this.ocupado = true;
    this.error = '';

    this.api
      .corregir(
        this.editando,
        entrada.toISOString(),
        salida?.toISOString() || null,
        this.motivo.trim(),
      )
      .subscribe({
        next: () => {
          this.ocupado = false;
          this.editando = null;
          this.aviso = 'Corrección guardada con su historial.';
          this.cargarEstado();
          this.cargarRegistros();
        },
        error: (err) => {
          this.ocupado = false;
          this.error = this.mensaje(err);
        },
      });
  }

  verCorrecciones(jornada: JornadaFichaje): void {
    if (
      !this.admin ||
      this.vista !== 'control' ||
      this.bloqueado ||
      this.cargandoAuditoria
    ) {
      return;
    }

    const numero = ++this.auditoriaSecuencia;

    this.auditoriaId = jornada.id;
    this.correcciones = [];
    this.cargandoAuditoria = true;

    this.api.correcciones(jornada.id).subscribe({
      next: (resultado) => {
        if (numero !== this.auditoriaSecuencia) return;

        this.correcciones = resultado;
        this.cargandoAuditoria = false;
      },
      error: (err) => {
        if (numero !== this.auditoriaSecuencia) return;

        this.error = this.mensaje(err);
        this.cargandoAuditoria = false;
      },
    });
  }

  cerrarAuditoria(): void {
    this.auditoriaId = null;
    this.correcciones = [];
    this.cargandoAuditoria = false;
    this.auditoriaSecuencia++;
  }
}
