import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-albaran-imprimir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alabaran-imprimir.component.html',
  styleUrls: ['./alabaran-imprimir.component.css'] // ✅ OJO: styleUrls (plural)
})
export class AlbaranImprimirComponent implements OnInit {

  albaran: any;
  private apiUrl = 'http://localhost:9018/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    // ✅ URL CORRECTA (SIN "app" y CON "/")
    this.http.get(`${this.apiUrl}/albaranes/${id}`).subscribe({
      next: (data: any) => {
        this.albaran = data;

        // ✅ render -> print (más fiable que setTimeout)
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
}
