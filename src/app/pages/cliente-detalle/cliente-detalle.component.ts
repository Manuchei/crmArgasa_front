import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-detalle.component.html',
  styleUrls: ['./cliente-detalle.component.css']
})
export class ClienteDetalleComponent implements OnInit {
  cliente: any;
  trabajos: any[] = [];
  nuevoTrabajo = { descripcion: '', precio: 0 };

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarCliente(id);
    this.cargarTrabajos(id);
  }

  cargarCliente(id: number): void {
    this.http.get(`http://localhost:9018/api/clientes/${id}`).subscribe({
      next: (data) => (this.cliente = data),
      error: (err) => console.error('Error al cargar cliente:', err)
    });
  }

  cargarTrabajos(clienteId: number): void {
    this.http.get(`http://localhost:9018/api/trabajos/cliente/${clienteId}`).subscribe({
      next: (data: any) => (this.trabajos = data),
      error: (err) => console.error('Error al cargar trabajos:', err)
    });
  }

  agregarTrabajo(): void {
    if (!this.cliente) return;
    if (!this.nuevoTrabajo.descripcion || this.nuevoTrabajo.precio <= 0) return;

    this.http.post(`http://localhost:9018/api/trabajos/cliente/${this.cliente.id}`, this.nuevoTrabajo)
      .subscribe({
        next: () => {
          this.cargarTrabajos(this.cliente.id);
          this.nuevoTrabajo = { descripcion: '', precio: 0 };
        },
        error: (err) => console.error('Error al agregar trabajo:', err)
      });
  }

  eliminarTrabajo(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este trabajo?')) {
      this.http.delete(`http://localhost:9018/api/trabajos/${id}`).subscribe({
        next: () => this.trabajos = this.trabajos.filter(t => t.id !== id),
        error: (err) => console.error('Error al eliminar trabajo:', err)
      });
    }
  }

  getTotal(): number {
    return this.trabajos.reduce((acc, t) => acc + (t.precio || 0), 0);
  }
}
