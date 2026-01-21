import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cliente-detalle.component.html',
  styleUrls: ['./cliente-detalle.component.css'],
})
export class ClienteDetalleComponent implements OnInit {
  cliente: any;
  trabajos: any[] = [];
  albaranes: any[] = [];

  nuevoTrabajo = { descripcion: '', importe: 0, importePagado: 0, pagado: false };

  creandoAlbaranEmpresa: string | null = null;

  private apiUrl = 'http://localhost:9018/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  volverAClientes(): void {
    this.router.navigate(['/clientes']);
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      alert('ID inválido');
      this.router.navigate(['/clientes']);
      return;
    }

    this.cargarCliente(id);
    this.cargarTrabajos(id);
    this.cargarAlbaranes(id);
  }

  cargarCliente(id: number): void {
    this.http.get(`${this.apiUrl}/clientes/${id}`).subscribe({
      next: (data: any) => {
        this.cliente = data;
        this.calcularTotales();
      },
      error: (err) => console.error('Error al cargar cliente:', err),
    });
  }

  cargarTrabajos(clienteId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/trabajos/cliente/${clienteId}`).subscribe({
      next: (data) => {
        this.trabajos = data ?? [];
        this.calcularTotales();
      },
      error: (err) => console.error('Error al cargar trabajos:', err),
    });
  }

  // ✅ NUEVO: cargar albaranes del cliente
  cargarAlbaranes(clienteId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/albaranes/clientes/${clienteId}`).subscribe({
      next: (data) => (this.albaranes = data ?? []),
      error: (err) => console.error('Error al cargar albaranes:', err),
    });
  }

  // ✅ NUEVO: crear albarán para Argasa/Luga y navegar al detalle
  crearAlbaran(empresa: 'Argasa' | 'Luga'): void {
    if (!this.cliente?.id) return;

    this.creandoAlbaranEmpresa = empresa;

    const params = new HttpParams().set('empresa', empresa);

    this.http
      .post<any>(`${this.apiUrl}/albaranes/clientes/${this.cliente.id}`, {}, { params })
      .subscribe({
        next: (albaran) => {
          this.creandoAlbaranEmpresa = null;

          if (!albaran?.id) {
            alert('No se pudo crear el albarán.');
            return;
          }

          // recarga lista y navega al detalle del albarán
          this.cargarAlbaranes(this.cliente.id);
          this.router.navigate(['/albaranes', albaran.id]);
        },
        error: (err) => {
          this.creandoAlbaranEmpresa = null;
          console.error('Error creando albarán:', err);
          alert('No se pudo crear el albarán.');
        },
      });
  }

  // ---------- trabajos ----------
  agregarTrabajo(): void {
    if (!this.cliente?.id) return;

    if (!this.nuevoTrabajo.descripcion || this.nuevoTrabajo.importe <= 0) {
      alert('Debes introducir una descripción y un importe válido.');
      return;
    }

    const trabajoAEnviar = {
      descripcion: this.nuevoTrabajo.descripcion,
      importe: Number(this.nuevoTrabajo.importe),
      importePagado: Number(this.nuevoTrabajo.importePagado || 0),
      pagado: false,
    };

    this.http
      .post(`${this.apiUrl}/trabajos/cliente/${this.cliente.id}`, trabajoAEnviar)
      .subscribe({
        next: () => {
          this.cargarTrabajos(this.cliente.id);
          this.nuevoTrabajo = { descripcion: '', importe: 0, importePagado: 0, pagado: false };
        },
        error: (err) => console.error('Error al agregar trabajo:', err),
      });
  }

  eliminarTrabajo(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este trabajo?')) {
      this.http.delete(`${this.apiUrl}/trabajos/${id}`).subscribe({
        next: () => this.cargarTrabajos(this.cliente.id),
        error: (err) => console.error('Error al eliminar trabajo:', err),
      });
    }
  }

  // ---------- totales ----------
  calcularTotales(): void {
    let totalImporte = 0;
    let totalPagado = 0;

    (this.trabajos ?? []).forEach((t) => {
      totalImporte += Number(t?.importe || 0);
      totalPagado += Number(t?.importePagado || 0);
    });

    this.cliente = {
      ...this.cliente,
      totalImporte,
      totalPagado,
      saldoPendiente: totalImporte - totalPagado,
    };
  }

  getTotalImporte(): number {
    return Number(this.cliente?.totalImporte || 0);
  }

  getTotalPagado(): number {
    return Number(this.cliente?.totalPagado || 0);
  }

  getSaldoPendiente(): number {
    return Number(this.cliente?.saldoPendiente || 0);
  }
}
