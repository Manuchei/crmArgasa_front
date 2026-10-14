import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { CajaService } from '../../services/caja.service';
import { EmpresaService } from '../../services/empresa.service';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css'],
})
export class CajaComponent implements OnInit, OnDestroy {
  empresa = '';

  actual: any = null;
  detalle: any = null;
  cajas: any[] = [];

  efectivoContado: number | null = null;
  observaciones = '';

  desde = this.hoy().slice(0, 7) + '-01';
  hasta = this.hoy();

  pagina = 0;
  total = 0;

  ocupado = false;
  cargando = false;

  error = '';
  aviso = '';
  cerrarPanel = false;

  private sub?: Subscription;
  private contexto = 0;
  private peticionDetalle = 0;
  private peticionHistorial = 0;

  vistaCaja: 'actual' | 'historial' = 'actual';

  constructor(
    private api: CajaService,
    private empresas: EmpresaService,
  ) {}

  ngOnInit(): void {
    this.sub = this.empresas.empresa$.subscribe(empresa => {
      this.contexto++;
      this.empresa = empresa || '';

      this.actual = null;
      this.detalle = null;
      this.cajas = [];

      this.cerrarPanel = false;
      this.efectivoContado = null;
      this.observaciones = '';

      this.error = '';
      this.aviso = '';
      this.ocupado = false;
      this.cargando = false;
      this.pagina = 0;
      this.total = 0;

      if (empresa) {
        this.cargarActual();
        this.historial();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.contexto++;
  }

  private hoy(): string {
    const partes = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());

    const valor = (tipo: string) =>
      partes.find(parte => parte.type === tipo)?.value;

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

  private mensaje(err: any): string {
    if (typeof err?.error === 'string') {
      return err.error;
    }

    if (
      err?.error?.message &&
      err.error.message !== 'No message available'
    ) {
      return err.error.message;
    }

    return (
      'No se pudo completar la operación. ' +
      'Revisa la conexión y actualiza la caja.'
    );
  }

  cargarActual(): void {
    const contexto = this.contexto;

    this.cargando = true;

    this.api.actual().subscribe({
      next: caja => {
        if (contexto !== this.contexto) return;

        this.actual = caja;
        this.cargando = false;
      },
      error: err => {
        if (contexto !== this.contexto) return;

        this.error = this.mensaje(err);
        this.cargando = false;
      },
    });
  }

  historial(): void {
    if (
      !this.desde ||
      !this.hasta ||
      this.hasta < this.desde
    ) {
      this.error = 'Intervalo de fechas no válido';
      return;
    }

    const contexto = this.contexto;
    const peticion = ++this.peticionHistorial;

    this.api.historial(
      this.desde,
      this.hasta,
      this.pagina,
    ).subscribe({
      next: resultado => {
        if (
          contexto !== this.contexto ||
          peticion !== this.peticionHistorial
        ) {
          return;
        }

        this.cajas = resultado.cajas;
        this.total = resultado.total;
      },
      error: err => {
        if (
          contexto !== this.contexto ||
          peticion !== this.peticionHistorial
        ) {
          return;
        }

        this.cajas = [];
        this.error = this.mensaje(err);
      },
    });
  }

  filtrar(): void {
    this.pagina = 0;
    this.historial();
  }

  paginar(delta: number): void {
    if (
      this.pagina + delta < 0 ||
      (
        delta > 0 &&
        (this.pagina + 1) * 30 >= this.total
      )
    ) {
      return;
    }

    this.pagina += delta;
    this.historial();
  }

  abrir(): void {
  if (
    this.ocupado ||
    this.cargando ||
    this.actual
  ) {
    return;
  }

  this.ocupado = true;
  this.error = '';
  this.aviso = '';

  const contexto = this.contexto;

  this.api.abrir().subscribe({
    next: resultado => {
      if (contexto !== this.contexto) return;

      this.actual = resultado.caja;
      this.detalle = null;
      this.ocupado = false;
      this.aviso = 'Caja abierta.';

      this.historial();
    },
    error: err => {
      if (contexto !== this.contexto) return;

      this.ocupado = false;
      this.error = this.mensaje(err);

      this.cargarActual();
      this.historial();
    },
  });
}

  prepararCierre(): void {
    this.cerrarPanel = true;
    this.efectivoContado = null;
    this.observaciones = '';

    this.cargarActual();
  }

  cerrar(): void {
    if (
      this.ocupado ||
      this.cargando ||
      !this.actual
    ) {
      return;
    }

    if (
      this.efectivoContado === null ||
      !Number.isFinite(Number(this.efectivoContado)) ||
      Number(this.efectivoContado) < 0
    ) {
      this.error = 'Introduce el efectivo contado físicamente';
      return;
    }

    if (!confirm('¿Cerrar la caja y guardar el arqueo definitivo?')) {
      return;
    }

    this.ocupado = true;
    this.error = '';

    const contexto = this.contexto;

    this.api.cerrar(
      this.actual.id,
      Number(this.efectivoContado),
      this.observaciones,
    ).subscribe({
      next: resultado => {
        if (contexto !== this.contexto) return;

        this.actual = null;
        this.detalle = resultado;
        this.cerrarPanel = false;
        this.ocupado = false;

        this.aviso =
          'Caja cerrada. El historial y el desglose han quedado guardados.';

        this.historial();
        this.vistaCaja = 'historial';
      },
      error: err => {
        if (contexto !== this.contexto) return;

        this.ocupado = false;
        this.error = this.mensaje(err);

        this.cargarActual();
        this.historial();
      },
    });
  }

  ver(id: number): void {
    if (this.ocupado) return;

    const contexto = this.contexto;
    const peticion = ++this.peticionDetalle;

    this.api.ver(id).subscribe({
      next: resultado => {
        if (
          contexto !== this.contexto ||
          peticion !== this.peticionDetalle
        ) {
          return;
        }

        this.detalle = resultado;
      },
      error: err => {
        if (
          contexto !== this.contexto ||
          peticion !== this.peticionDetalle
        ) {
          return;
        }

        this.error = this.mensaje(err);
      },
    });
  }
}