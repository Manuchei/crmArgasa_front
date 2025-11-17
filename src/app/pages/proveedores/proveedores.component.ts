import { CommonModule } from '@angular/common';
import { ProveedorService } from './../../services/proveedor.service';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-proveedores',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './proveedores.component.html',
  styleUrl: './proveedores.component.css'
})
export class ProveedoresComponent implements OnInit {

  proveedores: any[] = [];
  filtros = {
    texto: '',
    empresa: '',
    oficio: '',
  }

  constructor(private proveedorService: ProveedorService) {}

  ngOnInit() {
    this.cargarProveedores()
  }
  cargarProveedores() {
    this.proveedorService.getProveedores().subscribe(
      data => this.proveedores = data
    )
  }
  filtrar() {
    if(!this.filtros.texto && !this.filtros.empresa && !this.filtros.oficio){
      this.cargarProveedores();
      return;
    }
    this.proveedorService.buscar(
      this.filtros.texto,
      this.filtros.empresa,
      this.filtros.oficio
    ).subscribe(data => this.proveedores = data)
  }
  limpiarFiltros() {
    this.filtros = {texto: '', empresa: '', oficio: ''}
    this.cargarProveedores();
  }
}
