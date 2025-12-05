import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../interfaces/iruta';


@Component({
  selector: 'app-rutas-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgIf],
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

  constructor(
    private fb: FormBuilder,
    private rutaService: RutaService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.rutaForm = this.fb.group({
    nombreTransportista: ['', Validators.required],
    fecha: ['', Validators.required],
    estado: ['pendiente', Validators.required],
    observaciones: [''],
    origen: ['', Validators.required],
    destino: ['', Validators.required],

    emailTransportista: ['', [Validators.required, Validators.email]] // ← NUEVO
});


    this.idRuta = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idRuta) {
      this.titulo = 'Editar ruta';
      this.cargarRuta(this.idRuta);
    }
  }

  cargarRuta(id: number): void {
    this.cargando = true;
    this.rutaService.getRuta(id).subscribe({
      next: (ruta) => {
        // Adaptamos fecha a formato yyyy-MM-dd si viene con tiempo
        const fecha = ruta.fecha ? ruta.fecha.substring(0, 10) : '';
        this.rutaForm.patchValue({
          nombreTransportista: ruta.nombreTransportista,
          fecha: fecha,
          estado: ruta.estado,
          observaciones: ruta.observaciones,
          origen: ruta.origen,
          destino: ruta.destino,
          emailTransportista: ruta.emailTransportista
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

    if (this.rutaForm.invalid) {
      return;
    }

    const ruta: Ruta = {
      ...this.rutaForm.value
      // la fecha ya es string yyyy-MM-dd
    };

    this.cargando = true;

    if (this.idRuta) {
      // actualizar → el backend enviará correo de actualización
      this.rutaService.actualizarRuta(this.idRuta, ruta).subscribe({
        next: (res) => {
          this.cargando = false;
          alert('Ruta actualizada correctamente (correo de actualización enviado).');
          this.router.navigate(['/rutas']);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al actualizar la ruta';
          this.cargando = false;
        }
      });
    } else {
      // crear → el backend enviará correo de nueva ruta
      this.rutaService.crearRuta(ruta).subscribe({
        next: (res) => {
          this.cargando = false;
          alert('Ruta creada correctamente (correo enviado al transportista).');
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
    this.router.navigate(['/rutas']);
  }

  // Getter rápido para acceder a los controles en el HTML
  get f() {
    return this.rutaForm.controls;
  }
}
