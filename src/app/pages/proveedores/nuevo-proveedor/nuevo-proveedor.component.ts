import { Component } from '@angular/core';
import { ProveedorService } from '../../../services/proveedor.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Proveedor } from '../../../interfaces/iproveedor';
import { ProveedorSaveDto } from '../../../interfaces/iproveedor-save';

@Component({
  selector: 'app-nuevo-proveedor',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './nuevo-proveedor.component.html',
})
export class NuevoProveedorComponent {
  proveedor: Proveedor = {
    nombre: '',
    oficio: '',
    telefono: '',
    email: '',
    trabajaEnArgasa: false,
    trabajaEnLuga: false,
    trabajoRealizado: '',
    direccion: '',
    cif: '',
    fechaAltaProveedor: '',
    localidad: '',
    codigoPostal: '',
    provincia: '',
    pais: '',
    contacto: '',
    datosBancarios: '',
    notas: '',
    importeTotal: 0,
    importePagado: 0,
    productos: [],
  };

  oficios: string[] = [
    'Fontanero',
    'Electricista',
    'Carpintero',
    'Programador',
    'Pintor',
    'Cerrajero',
    'Albañil',
    'Jardinero',
  ];

  constructor(
    private proveedorService: ProveedorService,
    private router: Router,
  ) {}

  esIbanEspanolValido(iban: string): boolean {
    const limpio = (iban || '').replace(/\s+/g, '').toUpperCase();
    return /^ES\d{22}$/.test(limpio);
  }

  private trim(value: any): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private buildProveedorSaveDto(): ProveedorSaveDto {
    return {
      nombre: this.trim(this.proveedor.nombre),
      oficio: this.trim(this.proveedor.oficio),
      empresa: this.trim(this.proveedor.empresa),
      telefono: this.trim(this.proveedor.telefono),
      email: this.trim(this.proveedor.email),
      trabajaEnArgasa: !!this.proveedor.trabajaEnArgasa,
      trabajaEnLuga: !!this.proveedor.trabajaEnLuga,
      trabajoRealizado: this.trim(this.proveedor.trabajoRealizado),
      direccion: this.trim(this.proveedor.direccion),
      cif: this.trim(this.proveedor.cif),
      fechaAltaProveedor: this.proveedor.fechaAltaProveedor || null,
      localidad: this.trim(this.proveedor.localidad),
      codigoPostal: this.trim(this.proveedor.codigoPostal),
      provincia: this.trim(this.proveedor.provincia),
      pais: this.trim(this.proveedor.pais),
      contacto: this.trim(this.proveedor.contacto),
      datosBancarios: this.trim(this.proveedor.datosBancarios)
        .replace(/\s+/g, '')
        .toUpperCase(),
      notas: this.trim(this.proveedor.notas),
    };
  }

  guardar(formProveedor: any) {
    if (formProveedor.invalid) {
      formProveedor.form.markAllAsTouched();
      return;
    }

    const payload = this.buildProveedorSaveDto();

    if (!this.esIbanEspanolValido(payload.datosBancarios)) {
      alert('El IBAN no es válido. Debe empezar por ES y tener 22 números.');
      return;
    }

    this.proveedorService.crearProveedor(payload).subscribe({
      next: () => {
        alert('Proveedor guardado correctamente');
        this.router.navigate(['/app/proveedores']);
      },
      error: (err) => {
        console.error('Error al guardar proveedor', err);
        alert('Error al guardar el proveedor');
      },
    });
  }

  formatearIBAN(): void {
    let value = this.proveedor.datosBancarios || '';

    value = value.replace(/\s+/g, '').toUpperCase();

    value = value.replace(/(.{4})/g, '$1 ').trim();

    this.proveedor.datosBancarios = value;
  }
}
