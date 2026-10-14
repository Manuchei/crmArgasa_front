import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  EmpresaService,
  Empresa,
} from '../../services/empresa.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-selector-empresa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selector-empresa.component.html',
  styleUrls: ['./selector-empresa.component.css'],
})
export class SelectorEmpresaComponent implements OnInit {
  constructor(
    private empresaService: EmpresaService,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.empresaService.clearEmpresa();
  }

  seleccionarEmpresa(empresa: Empresa): void {
    this.empresaService.setEmpresa(empresa);

    if (this.auth.hasRole('USER', 'ADMIN', 'DEVELOPER')) {
      void this.router.navigateByUrl('/app/dashboard');
      return;
    }

    if (this.auth.hasRole('TRANSPORTISTA')) {
      void this.router.navigateByUrl('/app/rutas');
      return;
    }

    this.auth.logout();
    this.empresaService.clearEmpresa();
    void this.router.navigateByUrl('/login');
  }
}