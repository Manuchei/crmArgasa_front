import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { RutaService } from './../../services/ruta.service';
import { ProveedorService } from './../../services/proveedor.service';
import { ClientesService } from './../../services/cliente.service';
import { LlamadasService } from './../../services/llamadas.service';
import { ILlamada } from './../../interfaces/illamda';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  kpis: any[] = [];
  today: any[] = [];
  calls: ILlamada[] = [];

  constructor(
    private clientesService: ClientesService,
    private proveedorService: ProveedorService,
    private rutaService: RutaService,
    private llamadasService: LlamadasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarKPIs();
    this.cargarHoy();
    this.cargarProximasLlamadas();
  }

  // =========================
  // KPIs SUPERIORES
  // =========================
  cargarKPIs(): void {
    this.kpis = [
      { title: 'Clientes', value: 0, color: 'bg-primary', route: '/app/clientes' },
      { title: 'Proveedores', value: 0, color: 'bg-success', route: '/app/proveedores' },
      { title: 'Rutas', value: 0, color: 'bg-warning', route: '/app/rutas' },
      { title: 'Pendientes', value: 0, color: 'bg-secondary', route: '/app/rutas' },
    ];

    this.clientesService.getClientes().subscribe(r => this.kpis[0].value = r.length);
    this.proveedorService.getProveedores().subscribe(r => this.kpis[1].value = r.length);

    this.rutaService.getRutas().subscribe(rutas => {
      this.kpis[2].value = rutas.length;
      this.kpis[3].value = rutas.filter(r => r.estado === 'pendiente').length;
    });
  }

  // =========================
  // BLOQUE HOY (REAL)
  // =========================
  cargarHoy(): void {
    const hoy = this.formatDateYYYYMMDD(new Date());

    // inicial (para que no parpadee vacío)
    this.today = [
      { icon: '📞', title: 'Llamadas hoy', value: 0 },
      { icon: '🗺️', title: 'Rutas hoy', value: 0 },
      { icon: '⏳', title: 'Pendientes', value: 0 },
    ];

    // Llamadas hoy
    this.llamadasService.getLlamadasDia(hoy).subscribe({
     next: (llamadasHoy) => {
  const activas = (llamadasHoy ?? []).filter(l => l.estado === 'pendiente');
  this.updateToday('Llamadas hoy', activas.length);
},
    });

    // Rutas hoy + pendientes
    this.rutaService.getRutas().subscribe({
      next: rutas => {
        const rutasHoy = (rutas ?? []).filter(r => r.fecha === hoy);
        const pendientes = (rutas ?? []).filter(r => r.estado === 'pendiente');

        this.updateToday('Rutas hoy', rutasHoy.length);
        this.updateToday('Pendientes', pendientes.length);
      },
      error: () => {
        this.updateToday('Rutas hoy', 0);
        this.updateToday('Pendientes', 0);
      }
    });
  }

  private updateToday(title: string, value: number): void {
    const index = this.today.findIndex(t => t.title === title);
    if (index >= 0) this.today[index].value = value;
  }

  // =========================
  // PRÓXIMAS LLAMADAS (REAL + FALLBACK)
  // =========================
  cargarProximasLlamadas(): void {
  const hoy = this.formatDateYYYYMMDD(new Date());

  const filtrarPendientes = (arr: ILlamada[] | null | undefined) =>
    (arr ?? []).filter(l => (l as any).estado === 'pendiente');

  this.llamadasService.getProximasLlamadas(10).subscribe({
    next: (res) => {
      const listaPendientes = filtrarPendientes(res);

      // ✅ Si el backend devuelve próximas (pendientes), usamos eso
      if (listaPendientes.length > 0) {
        this.calls = listaPendientes;
        return;
      }

      // ✅ Si viene vacío, fallback: mostramos las de HOY (pendientes)
      this.llamadasService.getLlamadasDia(hoy).subscribe({
        next: (hoyRes) => {
          this.calls = filtrarPendientes(hoyRes);
        },
        error: (err2) => {
          console.error('Error fallback llamadas hoy', err2);
          this.calls = [];
        }
      });
    },
    error: (err) => {
      console.error('Error cargando próximas llamadas (endpoint proximas)', err);

      // ✅ Fallback si falla el endpoint proximas
      this.llamadasService.getLlamadasDia(hoy).subscribe({
        next: (hoyRes) => {
          this.calls = filtrarPendientes(hoyRes);
        },
        error: (err2) => {
          console.error('Error fallback llamadas hoy', err2);
          this.calls = [];
        }
      });
    }
  });
}


  // =========================
  // NAVEGACIÓN
  // =========================
  go(route: string): void {
    this.router.navigate([route]);
  }

  // =========================
  // UTILS
  // =========================
  private formatDateYYYYMMDD(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
