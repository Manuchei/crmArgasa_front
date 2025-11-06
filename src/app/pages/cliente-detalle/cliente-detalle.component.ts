import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Trabajo {
  id?: number;
  descripcion: string;
  precio: number;
}

interface Cliente {
  id: number;
  nombre: string;
  apellido: string;
  empresa: string;
  telefono: string;
  email: string;
}

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cliente-detalle.component.html',
  styleUrls: ['./cliente-detalle.component.css']
})
export class ClienteDetalleComponent implements OnInit {
  cliente?: Cliente;
  trabajos: Trabajo[] = [];
  nuevoTrabajo: Trabajo = { descripcion: '', precio: 0 };

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.cargarCliente(id);
    this.cargarTrabajos(id);
  }

  cargarCliente(id: number): void {
    this.http.get<Cliente>(`http://localhost:9018/api/clientes/${id}`).subscribe((data) => (this.cliente = data));
  }

  cargarTrabajos(clienteId: number): void {
    this.http.get<Trabajo[]>(`http://localhost:9018/api/trabajos/cliente/${clienteId}`).subscribe((data) => (this.trabajos = data));
  }

  agregarTrabajo(): void {
    if (!this.cliente || !this.nuevoTrabajo.descripcion || this.nuevoTrabajo.precio <= 0) return;

    this.http
      .post<Trabajo>(`http://localhost:9018/api/trabajos/cliente/${this.cliente.id}`, this.nuevoTrabajo)
      .subscribe(() => {
        this.cargarTrabajos(this.cliente!.id);
        this.nuevoTrabajo = { descripcion: '', precio: 0 };
      });
  }

  eliminarTrabajo(id: number): void {
    if (confirm('¿Seguro que deseas eliminar este trabajo?')) {
      this.http.delete(`http://localhost:9018/api/trabajos/${id}`).subscribe(() => {
        this.trabajos = this.trabajos.filter((t) => t.id !== id);
      });
    }
  }

  getTotal(): number {
    return this.trabajos.reduce((acc, t) => acc + (t.precio || 0), 0);
  }
}
