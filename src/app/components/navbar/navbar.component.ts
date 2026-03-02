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
    private auth: AuthService,
    private empresaService: EmpresaService,
    private router: Router
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

  cambiarEmpresa(): void {
    // ✅ NO hacemos logout
    // ✅ Solo limpiamos la empresa y vamos al selector
    this.empresaService.clearEmpresa();
    this.router.navigate(['/empresa']);
  }

  logout(): void {
    // ✅ Logout completo
    this.auth.logout();
    this.empresaService.clearEmpresa();
    this.router.navigate(['/login']);
  }
}