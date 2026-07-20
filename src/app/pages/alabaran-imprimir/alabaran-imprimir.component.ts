import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { environment } from '../../../environments/environment';
import { EMPRESAS } from '../../shared/config/empresa-config';

@Component({
  selector: 'app-albaran-imprimir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alabaran-imprimir.component.html',
  styleUrls: ['./alabaran-imprimir.component.css'],
})
export class AlbaranImprimirComponent implements OnInit {
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
    .toLowerCase();

  if (emp === 'luga') {
    return EMPRESAS.electroluga;
  }

  return EMPRESAS[emp as keyof typeof EMPRESAS] || null;
}
}
