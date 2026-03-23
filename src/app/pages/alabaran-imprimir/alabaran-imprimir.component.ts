import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-albaran-imprimir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alabaran-imprimir.component.html',
  styleUrls: ['./alabaran-imprimir.component.css'],
})
export class AlbaranImprimirComponent implements OnInit {
  albaran: any;
  private apiUrl = 'http://localhost:9018/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.http.get(`${this.apiUrl}/albaranes/${id}`).subscribe({
      next: (data: any) => {
        this.albaran = data;

        this.cdr.detectChanges();
        requestAnimationFrame(() => {
          requestAnimationFrame(() => window.print());
        });
      },
      error: (err) => {
        console.error('Error cargando albarán para imprimir:', err);
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
