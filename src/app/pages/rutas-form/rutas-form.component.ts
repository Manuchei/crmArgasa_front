import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../interfaces/iruta';
import { TransportistaService } from '../../services/transportista.service';
import { Itrasnportista } from '../../interfaces/itrasnportista';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-rutas-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgIf, NgFor],
  templateUrl: './rutas-form.component.html',
  styleUrls: ['./rutas-form.component.scss']
})
export class RutasFormComponent implements OnInit {

  rutaForm!: FormGroup;
  titulo = 'Nueva ruta';
  idRuta?: number;
  cargando = false;
  error = '';
  enviado = false;

  transportistas: Itrasnportista[] = [];

  // ✅ clientes
  clientes: any[] = [];
  private apiUrl = 'http://localhost:9018/api';

  constructor(
    private fb: FormBuilder,
    private rutaService: RutaService,
    private transportistaService: TransportistaService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.rutaForm = this.fb.group({
      clienteId: [null, Validators.required], // ✅ NUEVO
      nombreTransportista: ['', Validators.required],
      emailTransportista: ['', [Validators.required, Validators.email]],
      fecha: ['', Validators.required],
      estado: ['pendiente', Validators.required],
      origen: ['', Validators.required],
      destino: ['', Validators.required],
      tarea: ['', Validators.required],
      observaciones: ['']
    });

    this.cargarClientes();
    this.cargarTransportistas();

    this.idRuta = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idRuta) {
      this.titulo = 'Editar ruta';
      this.cargarRuta(this.idRuta);
    }
  }

  cargarClientes(): void {
    this.http.get<any[]>(`${this.apiUrl}/clientes`).subscribe({
      next: (data) => this.clientes = data ?? [],
      error: (err) => console.error('Error cargando clientes', err)
    });
  }

  cargarTransportistas(): void {
    this.transportistaService.getAll().subscribe({
      next: (data) => this.transportistas = data,
      error: (err) => console.error(err)
    });
  }

  onSelectTransportista(id: string): void {
    if (!id) return;

    const t = this.transportistas.find(x => x.id === +id);
    if (!t) return;

    this.rutaForm.patchValue({
      nombreTransportista: t.nombre,
      emailTransportista: t.email
    });
  }

  cargarRuta(id: number): void {
  this.cargando = true;
  this.rutaService.getRuta(id).subscribe({
    next: (ruta: any) => {
      const fecha = ruta.fecha ? ruta.fecha.toString().substring(0, 10) : '';

      this.rutaForm.patchValue({
        clienteId: ruta?.clienteId ?? null, // ✅ CORREGIDO
        nombreTransportista: ruta.nombreTransportista,
        emailTransportista: ruta.emailTransportista,
        fecha,
        estado: ruta.estado,
        observaciones: ruta.observaciones,
        origen: ruta.origen,
        destino: ruta.destino,
        tarea: ruta.tarea
      });

      this.cargando = false;
    },
    error: (err) => {
      console.error(err);
      this.error = 'Error al cargar la ruta';
      this.cargando = false;
    }
  });
}

  onSubmit(): void {
    this.enviado = true;
    this.error = '';
    if (this.rutaForm.invalid) return;

    const payload = {
      ...this.rutaForm.value,
      // ✅ empresa: mejor mandarla también (y además tu service puede mandar X-Empresa)
      empresa: (localStorage.getItem('empresa') || '').trim()
    };

    this.cargando = true;

    if (this.idRuta) {
      this.rutaService.actualizarRuta(this.idRuta, payload as any).subscribe({
        next: () => {
          this.cargando = false;
          alert('Ruta actualizada correctamente.');
          this.router.navigate(['/app/rutas']);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al actualizar la ruta';
          this.cargando = false;
        }
      });
    } else {
      this.rutaService.crearRuta(payload as any).subscribe({
        next: () => {
          this.cargando = false;
          alert('Ruta creada correctamente.');
          this.router.navigate(['/app/rutas']);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al crear la ruta';
          this.cargando = false;
        }
      });
    }
  }

  volver(): void {
    this.router.navigate(['/app/rutas']);
  }

  get f() {
    return this.rutaForm.controls;
  }
}
