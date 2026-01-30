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

  // ✅ mismo backend que FacturacionV2Service
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

  this.http.post<any>(`${this.baseUrl}/facturas/detalle`, { id }).subscribe({
    next: (data) => {
      this.factura = data;
      this.loading = false;
      // setTimeout(() => window.print(), 200);
    },
    error: (err) => {
      console.error('Error cargando factura', err);
      this.loading = false;
      this.error =
        err?.error?.message ??
        `No se pudo cargar la factura (HTTP ${err?.status ?? '?'})`;
    },
  });
}


  imprimirManual(): void {
    window.print();
  }
}
