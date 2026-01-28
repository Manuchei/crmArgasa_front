import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../interfaces/iruta';
import { TransportistaService } from '../../services/transportista.service';
import { Itrasnportista } from '../../interfaces/itrasnportista';

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

  constructor(
    private fb: FormBuilder,
    private rutaService: RutaService,
    private transportistaService: TransportistaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1) Form
    this.rutaForm = this.fb.group({
  nombreTransportista: ['', Validators.required],
  emailTransportista: ['', [Validators.required, Validators.email]],
  fecha: ['', Validators.required],
  estado: ['pendiente', Validators.required],
  origen: ['', Validators.required],
  destino: ['', Validators.required],
  tarea: ['', Validators.required], // ✅ NUEVO
  observaciones: ['']
});


    // 2) Cargar transportistas
    this.cargarTransportistas();

    // 3) Editar si viene ID
    this.idRuta = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idRuta) {
      this.titulo = 'Editar ruta';
      this.cargarRuta(this.idRuta);
    }
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

    // Autorellenar el form
    this.rutaForm.patchValue({
      nombreTransportista: t.nombre,
      emailTransportista: t.email
    });
  }

  cargarRuta(id: number): void {
    this.cargando = true;
    this.rutaService.getRuta(id).subscribe({
      next: (ruta) => {
        const fecha = ruta.fecha ? ruta.fecha.toString().substring(0, 10) : '';

        this.rutaForm.patchValue({
          // transportistaId lo dejamos vacío si la ruta antigua no lo tiene
          nombreTransportista: ruta.nombreTransportista,
          emailTransportista: ruta.emailTransportista,
          fecha: fecha,
          estado: ruta.estado,
          observaciones: ruta.observaciones,
          origen: ruta.origen,
          destino: ruta.destino
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

    // Si transportistaId es solo para autocompletar, lo eliminamos del payload
    const { transportistaId, ...payload } = this.rutaForm.value;

    const ruta: Ruta = {
      ...payload
    };

    this.cargando = true;

    if (this.idRuta) {
      this.rutaService.actualizarRuta(this.idRuta, ruta).subscribe({
        next: () => {
          this.cargando = false;
          alert('Ruta actualizada correctamente.');
          this.router.navigate(['/rutas']);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al actualizar la ruta';
          this.cargando = false;
        }
      });
    } else {
      this.rutaService.crearRuta(ruta).subscribe({
        next: () => {
          this.cargando = false;
          alert('Ruta creada correctamente.');
          this.router.navigate(['/rutas']);
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
