import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EmpresaService, Empresa } from '../../services/empresa.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selector-empresa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './selector-empresa.component.html',
  styleUrls: ['./selector-empresa.component.css']
})
export class SelectorEmpresaComponent implements OnInit {

  constructor(
    private empresaService: EmpresaService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 🔥 CLAVE: limpiar empresa previa
    this.empresaService.clearEmpresa();
  }

  seleccionarEmpresa(empresa: Empresa) {
    console.log('Empresa seleccionada:', empresa);
    this.empresaService.setEmpresa(empresa);
    this.router.navigate(['/app']);
  }
}
