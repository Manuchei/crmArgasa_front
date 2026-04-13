import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-albaran-proveedor-imprimir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './albaran-proveedor-imprimir.component.html',
  styleUrls: ['./albaran-proveedor-imprimir.component.css'],
})
export class AlbaranProveedorImprimirComponent implements OnInit {
  albaran: any;
  private apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.http.get(`${this.apiUrl}/albaranes-proveedor/${id}`).subscribe({
      next: (data: any) => {
        this.albaran = data;

        this.cdr.detectChanges();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => window.print());
        });
      },
      error: (err) => {
        console.error('Error cargando albarán proveedor para imprimir:', err);
        alert('No se pudo cargar el albarán para imprimir.');
      },
    });
  }

  imprimirManual(): void {
    window.print();
  }

  getEmpresaVisualAlbaran(): any {
    const emp = String(this.albaran?.empresa || '')
      .trim()
      .toUpperCase();

    if (emp === 'ARGASA') {
      return {
        nombre: 'Argasa Garrido S.L.',
        cif: 'B36879617',
        direccion: 'Rúa Pintor Laxeiro Nº15 Bajo',
        codigoPostal: '36211',
        poblacion: 'Vigo',
        provincia: 'Pontevedra',
        telefono: '607472159',
        email: 'argasaluis@gmail.com',
        logoUrl: '/assets/logos/argasa.png',
      };
    }

    if (emp === 'ELECTROLUGA' || emp === 'LUGA') {
      return {
        nombre: 'ELECTROLUGA, S.L.U',
        cif: 'B42722389',
        direccion: 'Rúa Pintor Laxeiro Nº15 Bajo',
        codigoPostal: '36211',
        poblacion: 'Vigo',
        provincia: 'Pontevedra',
        telefono: '607472159',
        email: 'electrolugaslu@gmail.com',
        logoUrl: '/assets/logos/luga.png',
      };
    }

    return {
      nombre: this.albaran?.empresa || '',
      cif: '',
      direccion: '',
      codigoPostal: '',
      poblacion: '',
      provincia: '',
      telefono: '',
      email: '',
      logoUrl: '',
    };
  }
}
