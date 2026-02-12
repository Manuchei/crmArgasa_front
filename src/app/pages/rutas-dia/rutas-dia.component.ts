import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RutaService } from '../../services/ruta.service';
import { TransportistaService } from '../../services/transportista.service';
import { Itrasnportista } from '../../interfaces/itrasnportista';
import { HttpClient } from '@angular/common/http';

interface RutaDiaItem {
  clienteId: number | null; // ✅
  origen: string;
  destino: string;
  tarea: string;
  observaciones: string;
  estado?: string;
}

@Component({
  selector: 'app-rutas-dia',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './rutas-dia.component.html',
})
export class RutasDiaComponent implements OnInit {
  cargando = false;
  error = '';

  fecha = '';
  nombreTransportista = '';
  emailTransportista = '';
  estado = 'pendiente';

  transportistas: Itrasnportista[] = [];
  transportistaId: string = '';

  // ✅ clientes
  clientes: any[] = [];
  private apiUrl = 'http://localhost:9018/api';

  rutas: RutaDiaItem[] = [
    { clienteId: null, origen: '', destino: '', tarea: '', observaciones: '' }
  ];

  constructor(
    private rutaService: RutaService,
    private transportistaService: TransportistaService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.transportistaService.getAll().subscribe({
      next: (t) => this.transportistas = t,
      error: (err) => console.error(err)
    });

    this.cargarClientes();
  }

  cargarClientes(): void {
    this.http.get<any[]>(`${this.apiUrl}/clientes`).subscribe({
      next: (data) => this.clientes = data ?? [],
      error: (err) => console.error('Error cargando clientes', err)
    });
  }

  onSelectTransportista(id: string): void {
    this.transportistaId = id;
    if (!id) return;

    const t = this.transportistas.find(x => x.id === +id);
    if (!t) return;

    this.nombreTransportista = t.nombre;
    this.emailTransportista = t.email;
  }

  addFila(): void {
    this.rutas.push({ clienteId: null, origen: '', destino: '', tarea: '', observaciones: '' });
  }

  removeFila(i: number): void {
    this.rutas.splice(i, 1);
    if (this.rutas.length === 0) this.addFila();
  }

  guardar(): void {
    this.error = '';

    if (!this.fecha || !this.nombreTransportista || !this.emailTransportista) {
      this.error = 'Fecha, transportista y email son obligatorios.';
      return;
    }

    const validas = this.rutas.filter(r =>
      r.clienteId &&
      r.origen.trim() &&
      r.destino.trim()
    );

    if (validas.length === 0) {
      this.error = 'Añade al menos una ruta con cliente, origen y destino.';
      return;
    }

    this.cargando = true;

    this.rutaService.crearRutasDia({
      empresa: (localStorage.getItem('empresa') || '').trim(),
      fecha: this.fecha,
      nombreTransportista: this.nombreTransportista,
      emailTransportista: this.emailTransportista,
      estado: this.estado,
      rutas: validas
    } as any).subscribe({
      next: () => {
        this.cargando = false;
        alert('Rutas del día creadas correctamente.');
        this.router.navigate(['/app/rutas']);
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
        this.error = 'Error al crear las rutas del día.';
      }
    });
  }

  volver(): void {
    this.router.navigate(['/app/rutas']);
  }
}
