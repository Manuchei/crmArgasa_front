import { Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';

import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { EmpresaService } from './services/empresa.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'NovexApp';

  private intervalo?: ReturnType<typeof setInterval>;
  private cerrandoSesion = false;
  private ultimaEscritura = 0;

  private readonly eventosActividad = [
    'pointerdown',
    'pointermove',
    'keydown',
    'scroll',
    'touchstart',
  ];

  constructor(
    private auth: AuthService,
    private empresaService: EmpresaService,
    private router: Router,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      for (const evento of this.eventosActividad) {
        document.addEventListener(evento, this.onActividad, {
          passive: true,
          capture: true,
        });
      }

      document.addEventListener('visibilitychange', this.onReanudar);

      window.addEventListener('focus', this.onReanudar);
      window.addEventListener('storage', this.onStorage);

      this.intervalo = setInterval(() => {
        this.comprobarSesion();
      }, 1000);
    });

    this.comprobarSesion();
  }

  ngOnDestroy(): void {
    if (this.intervalo !== undefined) {
      clearInterval(this.intervalo);
    }

    for (const evento of this.eventosActividad) {
      document.removeEventListener(evento, this.onActividad, true);
    }

    document.removeEventListener('visibilitychange', this.onReanudar);

    window.removeEventListener('focus', this.onReanudar);
    window.removeEventListener('storage', this.onStorage);
  }

  mostrarNavbar(): boolean {
    return this.router.url.startsWith('/app');
  }

  private onActividad = (event: Event): void => {
    if (!event.isTrusted || !this.auth.getToken()) return;

    // No reactivar una sesión que ya ha caducado.
    if (!this.comprobarSesion()) return;

    const ahora = Date.now();

    // Limitar las escrituras durante movimientos del ratón.
    if (ahora - this.ultimaEscritura >= 1000) {
      this.auth.registrarActividad();
      this.ultimaEscritura = ahora;
    }
  };

  private onReanudar = (): void => {
    // Comprobar también al volver de otra pestaña
    // o tras suspender el ordenador.
    this.comprobarSesion();
  };

  private onStorage = (event: StorageEvent): void => {
    if (
      event.key === 'token' ||
      event.key === 'exp' ||
      event.key === this.auth.actividadKey ||
      event.key === null
    ) {
      this.comprobarSesion();
    }
  };

  private comprobarSesion(): boolean {
    if (this.cerrandoSesion) return false;

    if (!this.auth.getToken()) {
      if (this.esRutaDeSesion()) {
        this.cerrarSesion();
      }

      return false;
    }

    if (this.auth.isSessionExpired()) {
      this.cerrarSesion('expirada');
      return false;
    }

    if (this.auth.isInactive()) {
      this.cerrarSesion('inactividad');
      return false;
    }

    return true;
  }

  private esRutaDeSesion(): boolean {
    const ruta = this.router.url.split(/[?#]/)[0];

    return (
      ruta === '/empresa' ||
      ruta === '/app' ||
      ruta.startsWith('/app/') ||
      ruta.startsWith('/imprimir/') ||
      ruta.startsWith('/informes/')
    );
  }

  private cerrarSesion(motivo?: 'inactividad' | 'expirada'): void {
    if (this.cerrandoSesion) return;

    this.cerrandoSesion = true;

    this.zone.run(() => {
      this.auth.logout();
      this.empresaService.clearEmpresa();

      void this.router
        .navigate(['/login'], {
          replaceUrl: true,
          queryParams: motivo ? { motivo } : {},
        })
        .finally(() => {
          this.cerrandoSesion = false;
        });
    });
  }
}
