import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { EmpresaService, Empresa } from '../../services/empresa.service';

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
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Limpia la empresa anterior en memoria y almacenamiento.
    this.empresaService.clearEmpresa();
  }

  seleccionarEmpresa(empresa: Empresa): void {
    this.empresaService.setEmpresa(empresa);

    // El guard del dashboard resuelve el destino según el rol.
    // ADMIN y DEVELOPER permanecen en el dashboard normal.
    this.router.navigateByUrl('/app/dashboard');
  }
}
