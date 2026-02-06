import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-imprimir-factura',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './imprimir-factura.component.html',
  styleUrls: ['./imprimir-factura.component.css'],
})
export class ImprimirFacturaComponent implements OnInit {
  factura: any = null;
  loading = false;
  error: string | null = null;

  private baseUrl = 'http://localhost:9018/api/facturacion-v2';

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error = 'ID de factura inválido';
      return;
    }
    this.cargarFactura(id);
  }

  cargarFactura(id: number): void {
    this.loading = true;
    this.error = null;

    // ✅ En vez de /facturas/detalle (que NO admite POST), usamos GET por ID
    this.http.get<any>(`${this.baseUrl}/facturas/${id}`).subscribe({
     next: (data) => {
  this.factura = data;

  // ✅ refuerzo: si el backend devuelve empresa, la guardamos
  if (this.factura?.empresa) {
    localStorage.setItem('empresa', String(this.factura.empresa));
  }

  this.loading = false;
},

      error: (err) => {
        console.error('Error cargando factura', err);
        this.loading = false;

        // Si el backend devuelve texto plano, lo mostramos
        const backendText = typeof err?.error === 'string' ? err.error : null;

        this.error =
          err?.error?.message ??
          backendText ??
          `No se pudo cargar la factura (HTTP ${err?.status ?? '?'})`;
      },
    });
  }
  

  imprimirManual(): void {
    window.print();
  }
}
