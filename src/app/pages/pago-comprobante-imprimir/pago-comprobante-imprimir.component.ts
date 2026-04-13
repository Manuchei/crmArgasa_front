import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pago-comprobante-imprimir',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pago-comprobante-imprimir.component.html',
  styleUrls: ['./pago-comprobante-imprimir.component.css'],
})
export class PagoComprobanteImprimirComponent implements OnInit {
  comprobante: any;
  private apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.http.get(`${this.apiUrl}/pagos/${id}/comprobante`).subscribe({
      next: (data: any) => {
        this.comprobante = data;
        this.cdr.detectChanges();

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            window.print();
          });
        });
      },
      error: (err) => {
        console.error('Error cargando comprobante de pago:', err);
        alert('No se pudo cargar el comprobante de pago.');
      },
    });
  }

  imprimirManual(): void {
    window.print();
  }
}
