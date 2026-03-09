import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TransportistaService } from '../../services/transportista.service';
import { Itrasnportista } from '../../interfaces/itrasnportista';
import { EmpresaService, Empresa } from '../../services/empresa.service';

@Component({
  selector: 'app-transportistas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './transportistas.component.html',
})
export class TransportistasComponent implements OnInit {
  transportistas: Itrasnportista[] = [];

  form!: FormGroup;
  cargando = false;
  error = '';
  enviado = false;

  editId: number | null = null;
  empresaActual: Empresa | null = null;

  constructor(
    private fb: FormBuilder,
    private transportistaService: TransportistaService,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.empresaActual = this.empresaService.getEmpresa();

    if (!this.empresaActual) {
      this.error = 'No hay empresa seleccionada.';
      return;
    }

    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = '';

    this.transportistaService.getAll().subscribe({
      next: (data) => {
        // Si quieres mostrar solo los de la empresa activa:
        this.transportistas = data.filter(t => t.empresa === this.empresaActual);
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar transportistas';
        this.cargando = false;
      }
    });
  }

  guardar(): void {
    this.enviado = true;
    this.error = '';

    if (this.form.invalid) return;

    this.empresaActual = this.empresaService.getEmpresa();

    if (!this.empresaActual) {
      this.error = 'No hay empresa seleccionada.';
      return;
    }

    const payload: Itrasnportista = {
      nombre: this.form.value.nombre.trim(),
      email: this.form.value.email.trim(),
      empresa: this.empresaActual
    };

    this.cargando = true;

    if (this.editId === null) {
      this.transportistaService.create(payload).subscribe({
        next: () => {
          this.resetForm();
          this.cargar();
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al crear el transportista';
          this.cargando = false;
        }
      });
      return;
    }

    this.transportistaService.update(this.editId, payload).subscribe({
      next: () => {
        this.resetForm();
        this.cargar();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al actualizar el transportista';
        this.cargando = false;
      }
    });
  }

  editar(t: Itrasnportista): void {
    if (!t.id) return;

    this.editId = t.id;
    this.enviado = false;

    this.form.patchValue({
      nombre: t.nombre,
      email: t.email
    });
  }

  cancelarEdicion(): void {
    this.resetForm();
  }

  eliminar(t: Itrasnportista): void {
    if (!t.id) return;

    if (!confirm(`¿Eliminar transportista "${t.nombre}"?`)) return;

    this.cargando = true;
    this.transportistaService.delete(t.id).subscribe({
      next: () => this.cargar(),
      error: (err) => {
        console.error(err);
        this.error = 'Error al eliminar el transportista';
        this.cargando = false;
      }
    });
  }

  private resetForm(): void {
    this.form.reset();
    this.editId = null;
    this.enviado = false;
    this.cargando = false;
  }

  get f() {
    return this.form.controls;
  }
}