import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { EmpresaService } from '../../services/empresa.service';
import { CajaService } from '../../services/caja.service';
import {
  FichajesService,
  MiEstadoFichaje,
} from '../../services/fichajes.service';

@Component({
  selector: 'app-acciones-inicio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './acciones-inicio.component.html',
  styleUrl: './acciones-inicio.component.css',
})
export class AccionesInicioComponent implements OnInit, OnDestroy {
  @Input() soloFichaje = false;

  estado: MiEstadoFichaje | null = null;
  caja: any = null;

  empresa = '';
  puedeFichar = false;
  puedeCaja = false;

  cargandoFichaje = false;
  cargandoCaja = false;
  fichando = false;
  abriendoCaja = false;

  errorFichaje = '';
  errorCaja = '';
  aviso = '';

  pendiente: {
    tipo: 'entrada' | 'salida';
    clave: string;
  } | null = null;

  private sub?: Subscription;
  private contextoCaja = 0;
  private secuenciaCaja = 0;
  private destruido = false;

  private get pendienteKey(): string {
    return 'novex_fichaje_pendiente_' + (this.auth.getUsuario()?.email || '');
  }

  get nombreEmpresa(): string {
    if (this.empresa === 'ARGASA') return 'Argasa';
    if (this.empresa === 'ELECTROLUGA') return 'Electroluga';

    return 'Seleccionar empresa';
  }

  constructor(
    private auth: AuthService,
    private empresas: EmpresaService,
    private fichajes: FichajesService,
    private cajas: CajaService,
  ) {}

  ngOnInit(): void {
    this.puedeFichar = this.auth.hasRole(
      'USER',
      'ADMIN',
      'DEVELOPER',
      'TRANSPORTISTA',
    );

    this.puedeCaja =
      !this.soloFichaje &&
      !this.auth.hasRole('TRANSPORTISTA') &&
      this.auth.hasRole('USER', 'ADMIN', 'DEVELOPER');

    if (this.puedeFichar) {
      this.recuperarPendiente();
      this.cargarFichaje();
    }

    this.sub = this.empresas.empresa$.subscribe((empresa) => {
      this.contextoCaja++;
      this.secuenciaCaja++;
      this.empresa = empresa || '';

      this.caja = null;
      this.errorCaja = '';
      this.cargandoCaja = false;
      this.abriendoCaja = false;
      this.aviso = '';

      if (this.puedeCaja && empresa) {
        this.cargarCaja();
      }
    });
  }

  ngOnDestroy(): void {
    this.destruido = true;
    this.contextoCaja++;
    this.secuenciaCaja++;
    this.sub?.unsubscribe();
  }

  private recuperarPendiente(): void {
    try {
      const pendiente = JSON.parse(
        sessionStorage.getItem(this.pendienteKey) || 'null',
      );

      if (
        pendiente &&
        (pendiente.tipo === 'entrada' || pendiente.tipo === 'salida') &&
        typeof pendiente.clave === 'string' &&
        pendiente.clave.trim()
      ) {
        this.pendiente = pendiente;
      } else {
        sessionStorage.removeItem(this.pendienteKey);
      }
    } catch {
      sessionStorage.removeItem(this.pendienteKey);
    }
  }

  horaEntrada(valor: string): string {
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(valor));
  }

  private mensaje(err: any): string {
    const mensaje =
      typeof err?.error === 'string' ? err.error : err?.error?.message;

    if (mensaje && mensaje !== 'No message available') {
      return mensaje;
    }

    if (err?.status === 0) {
      return 'No se pudo contactar con el servidor.';
    }

    if (err?.status === 403) {
      return 'No tienes permiso para realizar esta operación.';
    }

    return 'No se pudo completar la operación.';
  }

  cargarFichaje(): void {
    if (this.destruido || !this.puedeFichar || this.cargandoFichaje) {
      return;
    }

    this.cargandoFichaje = true;

    this.fichajes.estado().subscribe({
      next: (estado) => {
        if (this.destruido) return;

        this.estado = estado;
        this.errorFichaje = '';
        this.cargandoFichaje = false;
      },
      error: (err) => {
        if (this.destruido) return;

        this.estado = null;
        this.errorFichaje = this.mensaje(err);
        this.cargandoFichaje = false;
      },
    });
  }

  fichar(): void {
    if (
      this.destruido ||
      !this.puedeFichar ||
      this.fichando ||
      this.cargandoFichaje ||
      !this.estado?.empleado.activo ||
      this.pendiente
    ) {
      return;
    }

    this.pendiente = {
      tipo: this.estado.abierta ? 'salida' : 'entrada',
      clave: crypto.randomUUID(),
    };

    sessionStorage.setItem(this.pendienteKey, JSON.stringify(this.pendiente));

    this.enviarFichaje();
  }

  enviarFichaje(): void {
    if (
      this.destruido ||
      !this.puedeFichar ||
      !this.pendiente ||
      this.fichando ||
      this.cargandoFichaje
    ) {
      return;
    }

    const pendiente = this.pendiente;
    const almacenamientoKey = this.pendienteKey;

    this.fichando = true;
    this.errorFichaje = '';
    this.aviso = '';

    this.fichajes.fichar(pendiente.tipo, pendiente.clave).subscribe({
      next: () => {
        sessionStorage.removeItem(almacenamientoKey);

        if (this.destruido) return;

        this.pendiente = null;
        this.fichando = false;
        this.errorFichaje = '';
        this.aviso =
          pendiente.tipo === 'entrada'
            ? 'Entrada registrada.'
            : 'Salida registrada.';

        this.cargarFichaje();
      },
      error: (err) => {
        const errorCliente = err?.status >= 400 && err?.status < 500;

        if (errorCliente) {
          sessionStorage.removeItem(almacenamientoKey);
        }

        if (this.destruido) return;

        if (errorCliente) {
          this.pendiente = null;
        }

        // Conserva la clave ante errores de red o servidor.
        this.fichando = false;
        this.errorFichaje = this.mensaje(err);
        this.cargarFichaje();
      },
    });
  }

  cargarCaja(): void {
    if (
      this.destruido ||
      !this.puedeCaja ||
      !this.empresa ||
      this.cargandoCaja ||
      this.abriendoCaja
    ) {
      return;
    }

    const contexto = this.contextoCaja;
    const secuencia = ++this.secuenciaCaja;

    this.cargandoCaja = true;

    this.cajas.actual().subscribe({
      next: (caja) => {
        if (
          this.destruido ||
          contexto !== this.contextoCaja ||
          secuencia !== this.secuenciaCaja
        ) {
          return;
        }

        this.caja = caja;
        this.errorCaja = '';
        this.cargandoCaja = false;
      },
      error: (err) => {
        if (
          this.destruido ||
          contexto !== this.contextoCaja ||
          secuencia !== this.secuenciaCaja
        ) {
          return;
        }

        this.errorCaja = this.mensaje(err);
        this.cargandoCaja = false;
      },
    });
  }

  abrirCaja(): void {
    if (
      this.destruido ||
      !this.puedeCaja ||
      this.abriendoCaja ||
      this.cargandoCaja ||
      this.caja ||
      this.errorCaja ||
      !this.empresa
    ) {
      return;
    }

    const contexto = this.contextoCaja;

    this.abriendoCaja = true;
    this.errorCaja = '';
    this.aviso = '';

    this.cajas.abrir().subscribe({
      next: (resultado) => {
        if (this.destruido || contexto !== this.contextoCaja) {
          return;
        }

        this.caja = resultado.caja;
        this.abriendoCaja = false;
        this.errorCaja = '';
        this.aviso = 'Caja abierta.';
      },
      error: (err) => {
        if (this.destruido || contexto !== this.contextoCaja) {
          return;
        }

        this.abriendoCaja = false;
        this.errorCaja = this.mensaje(err);
      },
    });
  }
}
