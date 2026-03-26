import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { EmpresaService, Empresa } from '../../services/empresa.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  usuario: any = null;
  rol: string | null = null;
  empresa: Empresa | null = null;

  private empresaSub?: Subscription;

  constructor(
    public auth: AuthService,
    private empresaService: EmpresaService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();
    this.rol = this.auth.getRol();

    this.empresaSub = this.empresaService.empresa$.subscribe((empresa) => {
      this.empresa = empresa;
    });
  }

  ngOnDestroy(): void {
    this.empresaSub?.unsubscribe();
  }

  // ✅ helpers permisos
  isTransportistaOnly(): boolean {
    return this.auth.hasRole('TRANSPORTISTA') && !this.auth.hasRole('ADMIN');
  }

  canInicio(): boolean {
    // Transportista NO
    return !this.isTransportistaOnly();
  }

  canClientes(): boolean {
    return this.auth.hasRole('ADMIN', 'USER');
  }

  canProveedores(): boolean {
    return this.auth.hasRole('ADMIN', 'USER');
  }

  canProductos(): boolean {
    return this.auth.hasRole('ADMIN', 'USER');
  }

  canRutas(): boolean {
    return this.auth.hasRole('ADMIN', 'TRANSPORTISTA');
  }

  canCalendario(): boolean {
    // ✅ SOLO ADMIN (User NO, Transportista NO)
    return this.auth.hasRole('ADMIN');
  }

  canTransportistas(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  canInformes(): boolean {
    return this.auth.hasRole('ADMIN');
  }

  cambiarEmpresa(): void {
    this.empresaService.clearEmpresa();
    this.router.navigate(['/empresa']);
  }

  logout(): void {
    this.auth.logout();
    this.empresaService.clearEmpresa();
    this.router.navigate(['/login']);
  }
}
