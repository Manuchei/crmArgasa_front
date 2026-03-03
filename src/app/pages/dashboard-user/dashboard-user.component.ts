import { Component, OnInit } from '@angular/core';
import { StatsService } from '../../services/stats-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard-user',
  standalone: true,
  templateUrl: './dashboard-user.component.html',
})
export class DashboardUserComponent implements OnInit {
  clientes = 0;
  proveedores = 0;
  productos = 0;

  constructor(
    private stats: StatsService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.stats.getUserStats().subscribe((data) => {
      this.clientes = data.clientes;
      this.proveedores = data.proveedores;
      this.productos = data.productos;
    });
  }

  go(route: string) {
    this.router.navigateByUrl(route);
  }
}
