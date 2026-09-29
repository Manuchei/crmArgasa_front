import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { ClientesService } from '../../services/cliente.service';
import { ProveedorService } from '../../services/proveedor.service';
import { RutaService } from '../../services/ruta.service';
import { LlamadasService } from '../../services/llamadas.service';
import { TareasService } from '../../services/tareas.service';
import { VisitasService } from '../../services/visitas.service';
import { PushNotificationsService } from '../../services/push-notifications.service';

interface ElementoAgenda {
  id: number;
  tipo: 'Llamada' | 'Tarea' | 'Visita';
  fecha: string;
  titulo: string;
  detalle: string;
  estado: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  agendaHoy: ElementoAgenda[] = [];

  resumenHoy = {
    llamadas: 0,
    tareas: 0,
    visitas: 0,
  };

  get totalActividadHoy(): number {
    return (
      this.resumenHoy.llamadas +
      this.resumenHoy.tareas +
      this.resumenHoy.visitas
    );
  }

  get graficoActividad(): string {
    const total = this.totalActividadHoy;

    if (total === 0) {
      return '#e8edf4 0% 100%';
    }

    const tareas = (this.resumenHoy.tareas / total) * 100;
    const visitas = (this.resumenHoy.visitas / total) * 100;
    const llamadas = (this.resumenHoy.llamadas / total) * 100;

    return `
    #8065c9 0% ${tareas}%,
    #35a779 ${tareas}% ${tareas + visitas}%,
    #4b91d1 ${tareas + visitas}% ${tareas + visitas + llamadas}%
  `;
  }

  kpis: { title: string; value: number; route: string }[] = [
    { title: 'Clientes', value: 0, route: '/app/clientes' },
    { title: 'Proveedores', value: 0, route: '/app/proveedores' },
    { title: 'Rutas', value: 0, route: '/app/rutas' },
    { title: 'Rutas pendientes', value: 0, route: '/app/rutas' },
  ];

  constructor(
    private clientesService: ClientesService,
    private proveedorService: ProveedorService,
    private rutaService: RutaService,
    private llamadasService: LlamadasService,
    private tareasService: TareasService,
    private visitasService: VisitasService,
    private pushNotificationsService: PushNotificationsService,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.pushNotificationsService.solicitarPermisoYRegistrar();
    this.cargarAgendaHoy();
    this.cargarResumen();
  }

  isAdmin(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  isUser(): boolean {
    return this.auth.hasRole('USER');
  }

  cargarAgendaHoy(): void {
    const fecha = this.formatoFecha(new Date());

    forkJoin({
      llamadas: this.llamadasService
        .getLlamadasDia(fecha)
        .pipe(catchError(() => of([]))),

      tareas: this.tareasService
        .getTareasDia(fecha)
        .pipe(catchError(() => of([]))),

      visitas: this.visitasService
        .getVisitasDia(fecha)
        .pipe(catchError(() => of([]))),
    }).subscribe(({ llamadas, tareas, visitas }) => {
      const llamadasActivas = llamadas.filter(
        (item) => item.estado !== 'realizada' && item.estado !== 'cancelada',
      );

      const tareasActivas = tareas.filter(
        (item) => item.estado !== 'realizada' && item.estado !== 'cancelada',
      );

      const visitasActivas = visitas.filter(
        (item) => item.estado !== 'realizada' && item.estado !== 'cancelada',
      );

      this.resumenHoy = {
        llamadas: llamadasActivas.length,
        tareas: tareasActivas.length,
        visitas: visitasActivas.length,
      };

      this.agendaHoy = [
        ...llamadasActivas.map(
          (item): ElementoAgenda => ({
            id: item.id,
            tipo: 'Llamada',
            fecha: item.fecha,
            titulo: item.nombre || item.motivo || 'Llamada',
            detalle: item.nombre ? item.motivo : item.direccion || '',
            estado: item.estado,
          }),
        ),

        ...tareasActivas.map(
          (item): ElementoAgenda => ({
            id: item.id,
            tipo: 'Tarea',
            fecha: item.fecha,
            titulo: item.titulo,
            detalle: item.observaciones || '',
            estado: item.estado,
          }),
        ),

        ...visitasActivas.map(
          (item): ElementoAgenda => ({
            id: item.id,
            tipo: 'Visita',
            fecha: item.fecha,
            titulo: item.titulo,
            detalle: item.observaciones || '',
            estado: item.estado,
          }),
        ),
      ].sort(
        (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime(),
      );
    });
  }

  cargarResumen(): void {
    this.clientesService.getClientes().subscribe({
      next: (clientes) => (this.kpis[0].value = clientes.length),
    });

    this.proveedorService.getProveedores().subscribe({
      next: (proveedores) => (this.kpis[1].value = proveedores.length),
    });

    this.rutaService.getRutas().subscribe({
      next: (rutas) => {
        this.kpis[2].value = rutas.length;
        this.kpis[3].value = rutas.filter(
          (ruta) => ruta.estado === 'pendiente',
        ).length;
      },
    });
  }

  go(route: string): void {
    this.router.navigate([route]);
  }

  private formatoFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}
