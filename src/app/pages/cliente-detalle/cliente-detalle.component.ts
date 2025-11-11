import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
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
  nuevoTrabajo = { descripcion: '', importe: 0, importePagado: 0, pagado: false };
  private apiUrl = 'http://localhost:9018/api';

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  volverAClientes(): void {
    this.router.navigate(['/clientes']);
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarCliente(id);
    this.cargarTrabajos(id);
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
        this.trabajos = data;
        this.calcularTotales();
      },
      error: (err) => console.error('Error al cargar trabajos:', err),
    });
  }

  agregarTrabajo(): void {
    if (!this.cliente?.id) return;
    if (!this.nuevoTrabajo.descripcion || this.nuevoTrabajo.importe <= 0) {
      alert('Debes introducir una descripción y un importe válido.');
      return;
    }

    const trabajoAEnviar = {
      descripcion: this.nuevoTrabajo.descripcion,
      importe: Number(this.nuevoTrabajo.importe),
      importePagado: this.nuevoTrabajo.importePagado || 0,
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
        next: () => {
          this.cargarTrabajos(this.cliente.id);
        },
        error: (err) => console.error('Error al eliminar trabajo:', err),
      });
    }
  }

  /** 🔹 Calcula los totales del cliente a partir de los trabajos */
  calcularTotales(): void {
    let totalImporte = 0;
    let totalPagado = 0;

    this.trabajos.forEach((t) => {
      totalImporte += t.importe || 0;
      totalPagado += t.importePagado || 0;
    });

    this.cliente = {
      ...this.cliente,
      totalImporte,
      totalPagado,
      saldoPendiente: totalImporte - totalPagado,
    };
  }

  /** 🔹 Getters para usar en el HTML */
  getTotalImporte(): number {
    return this.cliente?.totalImporte || 0;
  }

  getTotalPagado(): number {
    return this.cliente?.totalPagado || 0;
  }

  getSaldoPendiente(): number {
    return this.cliente?.saldoPendiente || 0;
  }
}
