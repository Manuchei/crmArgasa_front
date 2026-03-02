import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import { CommonModule } from '@angular/common';

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
    // Limpia solo el estado en memoria
    this.empresaService.clearEmpresa();
  }

  seleccionarEmpresa(empresa: Empresa) {
    console.log('Empresa seleccionada:', empresa);

    this.empresaService.setEmpresa(empresa);

    // ⚠️ Usa SIEMPRE la misma clave que tu empresa.guard
    localStorage.setItem('empresa', empresa);

    this.router.navigateByUrl('/app/dashboard');
  }
}
