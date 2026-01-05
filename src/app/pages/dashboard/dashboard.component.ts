import { RutaService } from './../../services/ruta.service';
import { ProveedorService } from './../../services/proveedor.service';
import { ClientesService } from './../../services/cliente.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
    private ClientesService: ClientesService,
    private ProveedorService: ProveedorService,
    private RutaService: RutaService,
    private llamadasService: LlamadasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarKPIs();
    this.cargarTodayFake();
    this.cargarProximasLlamadas();
  }

  // -------------------------
  // PRÓXIMAS LLAMADAS (REALES)
  // -------------------------
  private cargarProximasLlamadas(): void {
    this.llamadasService.getProximasLlamadas(10).subscribe({
      next: (res) => (this.calls = res),
      error: (err) => {
        console.error('Error cargando próximas llamadas', err);
        this.calls = [];
      },
    });
  }

  // -------------------------
  // KPIs REALES
  // -------------------------
  cargarKPIs() {
    this.kpis = [
      { title: 'Clientes', value: 0, color: 'bg-primary', route: '/clientes' },
      { title: 'Proveedores', value: 0, color: 'bg-success', route: '/proveedores' },
      { title: 'Rutas', value: 0, color: 'bg-warning', route: '/rutas' },
      { title: 'Pendientes', value: '-', color: 'bg-secondary', route: '/dashboard' },
    ];

    this.ClientesService.getClientes().subscribe((res) => {
      this.kpis[0].value = res.length;
    });

    this.ProveedorService.getProveedores().subscribe((res) => {
      this.kpis[1].value = res.length;
    });

    this.RutaService.getRutas().subscribe((res) => {
      this.kpis[2].value = res.length;
    });
  }

  // -------------------------
  // BLOQUE HOY (FAKE)
  // -------------------------
  cargarTodayFake() {
    this.today = [
      { icon: '📞', title: 'Llamadas hoy', value: 0 },
      { icon: '🗺️', title: 'Rutas hoy', value: 0 },
      { icon: '⏳', title: 'Pendientes', value: 0 },
    ];
  }

  // -------------------------
  // NAVEGACIÓN
  // -------------------------
  go(route: string) {
    this.router.navigate([route]);
  }
}
