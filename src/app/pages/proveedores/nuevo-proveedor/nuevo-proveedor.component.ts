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
    numeroCuenta: '',
    iban: '',
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

  formatearNumeroCuenta(value: string): void {
    let limpio = (value || '').replace(/\D/g, '');

    if (limpio.length > 20) {
      limpio = limpio.substring(0, 20);
    }

    this.proveedor.numeroCuenta = limpio;
    this.proveedor.iban =
      limpio.length === 20 ? this.generarIbanEspanol(limpio) : '';
  }

  generarIbanEspanol(numeroCuenta: string): string {
    const cuenta = (numeroCuenta || '').replace(/\D/g, '');

    if (!/^\d{20}$/.test(cuenta)) {
      return '';
    }

    const rearranged = cuenta + '142800';
    const resto = this.mod97(rearranged);
    const dc = 98 - resto;

    return `ES${dc.toString().padStart(2, '0')}${cuenta}`;
  }

  private mod97(numero: string): number {
    let resto = 0;

    for (const char of numero) {
      resto = (resto * 10 + Number(char)) % 97;
    }

    return resto;
  }

  formatearIbanVisual(iban?: string): string {
    return (iban || '').match(/.{1,4}/g)?.join(' ') || '';
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
      datosBancarios: this.trim(this.proveedor.datosBancarios),
      numeroCuenta: this.proveedor.numeroCuenta || '',
      iban: this.proveedor.iban || '',
      notas: this.trim(this.proveedor.notas),
    };
  }

  guardar(formProveedor: any): void {
    if (formProveedor.invalid) {
      formProveedor.form.markAllAsTouched();
      return;
    }

    if (
      !this.proveedor.numeroCuenta ||
      !/^\d{20}$/.test(this.proveedor.numeroCuenta)
    ) {
      alert('El número de cuenta debe tener 20 dígitos.');
      return;
    }

    const payload = this.buildProveedorSaveDto();

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
}
