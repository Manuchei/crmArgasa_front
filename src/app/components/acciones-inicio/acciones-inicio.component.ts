import { Component, OnInit, OnDestroy } from '@angular/core';
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

  template: `
    <section class="acciones-inicio">
      <article class="accion-card" *ngIf="puedeFichar">
        <div class="accion-info">
          <span class="etiqueta">MI JORNADA</span>

          <strong>
            {{
              cargandoFichaje
                ? 'Consultando…'
                : estado?.abierta
                  ? 'Estás trabajando'
                  : estado
                    ? 'Fuera de jornada'
                    : 'Mi jornada'
            }}
          </strong>

          <small *ngIf="estado?.abierta as jornada">
            Entrada: {{ horaEntrada(jornada.entrada) }}
          </small>

          <small *ngIf="estado && !estado.empleado.activo">
            Tu ficha de empleado está inactiva.
          </small>

          <small *ngIf="pendiente"> Fichaje pendiente de confirmar. </small>

          <small *ngIf="errorFichaje" class="texto-error" role="alert">
            {{ errorFichaje }}
          </small>
        </div>

        <div class="accion-botones">
          <button
            type="button"
            class="boton"
            *ngIf="pendiente; else botonFichaje"
            (click)="enviarFichaje()"
            [disabled]="fichando || cargandoFichaje"
          >
            {{ fichando ? 'Registrando…' : 'Reintentar fichaje' }}
          </button>

          <ng-template #botonFichaje>
            <button
              *ngIf="estado"
              type="button"
              class="boton"
              (click)="fichar()"
              [disabled]="
                cargandoFichaje || fichando || !estado.empleado.activo
              "
            >
              {{
                fichando
                  ? 'Registrando…'
                  : estado.abierta
                    ? 'Fichar salida'
                    : 'Fichar entrada'
              }}
            </button>

            <button
              *ngIf="!estado"
              type="button"
              class="boton"
              (click)="cargarFichaje()"
              [disabled]="cargandoFichaje || fichando"
            >
              {{ cargandoFichaje ? 'Consultando…' : 'Consultar jornada' }}
            </button>
          </ng-template>

          <a routerLink="/app/mi-jornada">Ver mis fichajes</a>
        </div>
      </article>

      <article class="accion-card" *ngIf="puedeCaja">
        <div class="accion-info">
          <span class="etiqueta">CAJA · {{ nombreEmpresa }}</span>

          <strong>
            {{
              cargandoCaja
                ? 'Consultando…'
                : caja
                  ? 'Caja abierta'
                  : errorCaja
                    ? 'Revisar caja'
                    : 'Caja cerrada'
            }}
          </strong>

          <small *ngIf="caja">
            Cobrado: {{ caja.totalCobrado | number: '1.2-2' }} €
          </small>

          <small *ngIf="errorCaja" class="texto-error" role="alert">
            {{ errorCaja }}
          </small>
        </div>

        <div class="accion-botones">
          <button
            *ngIf="errorCaja"
            type="button"
            class="boton"
            (click)="cargarCaja()"
            [disabled]="cargandoCaja || abriendoCaja || !empresa"
          >
            {{ cargandoCaja ? 'Consultando…' : 'Reintentar consulta' }}
          </button>

          <button
            *ngIf="!caja && !errorCaja"
            type="button"
            class="boton"
            (click)="abrirCaja()"
            [disabled]="cargandoCaja || abriendoCaja || !empresa"
          >
            {{ abriendoCaja ? 'Abriendo…' : 'Abrir caja' }}
          </button>

          <a *ngIf="caja" class="boton" routerLink="/app/caja"> Cerrar caja </a>

          <a routerLink="/app/caja">Ver caja e historial</a>
        </div>
      </article>
    </section>

    <p class="aviso" role="status" *ngIf="aviso">
      {{ aviso }}
    </p>
  `,

  styles: [
    `
      :host {
        display: block;
        margin-bottom: 24px;
      }

      * {
        box-sizing: border-box;
      }

      .acciones-inicio {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }

      .accion-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;
        padding: 22px;
        background: #fff;
        border: 1px solid #dfe6ef;
        border-radius: 12px;
      }

      .accion-info,
      .accion-botones {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .accion-info {
        min-width: 0;
      }

      .etiqueta {
        color: #718096;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      strong {
        color: #1a2940;
        font-size: 20px;
      }

      small {
        color: #718096;
        font-size: 12px;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }

      .texto-error {
        color: #9f2534;
      }

      .accion-botones {
        align-items: center;
        flex-shrink: 0;
      }

      .boton {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        min-height: 44px;
        padding: 11px 18px;
        border: 0;
        border-radius: 8px;
        background: var(--color-primario, #d71920);
        color: #fff;
        font: inherit;
        font-size: 13px;
        font-weight: 750;
        text-decoration: none;
        cursor: pointer;
      }

      .boton:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      a:not(.boton) {
        color: #61728a;
        font-size: 11px;
        text-decoration: none;
      }

      a:not(.boton):hover {
        text-decoration: underline;
      }

      .aviso {
        color: #237457;
        font-size: 13px;
      }

      button:focus-visible,
      a:focus-visible {
        outline: 3px solid #94a3b8;
        outline-offset: 3px;
      }

      @media (max-width: 600px) {
        .acciones-inicio {
          grid-template-columns: 1fr;
        }

        .accion-card {
          align-items: flex-start;
          flex-direction: column;
        }

        .accion-botones {
          align-items: stretch;
          width: 100%;
        }
      }
    `,
  ],
})
export class AccionesInicioComponent implements OnInit, OnDestroy {
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

    this.puedeCaja = this.auth.hasRole('USER', 'ADMIN', 'DEVELOPER');

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
    if (!this.puedeFichar || this.cargandoFichaje) return;

    this.cargandoFichaje = true;

    this.fichajes.estado().subscribe({
      next: (estado) => {
        if (this.destruido) return;

        this.estado = estado;
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
        if (err.status >= 400 && err.status < 500) {
          sessionStorage.removeItem(almacenamientoKey);
        }

        if (this.destruido) return;

        if (err.status >= 400 && err.status < 500) {
          this.pendiente = null;
        }

        // Los errores de red o servidor conservan la misma clave.
        this.fichando = false;
        this.errorFichaje = this.mensaje(err);
        this.cargarFichaje();
      },
    });
  }

  cargarCaja(): void {
    if (
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
