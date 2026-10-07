import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

interface RegistroActividad {
  id: number;
  fecha: string;
  actor: string;
  accion: string;
  empresa: string | null;
  detalle: string;
  estado: number;
}

interface PaginaActividad {
  content: RegistroActividad[];
  last: boolean;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
})
export class UsuariosComponent implements OnInit {

  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private apiUrl = `${environment.apiUrl}/developer`;

  usuarios: Usuario[] = [];
  registros: RegistroActividad[] = [];

  tab: 'usuarios' | 'actividad' = 'usuarios';

  formularioAbierto = false;
  editandoId: number | null = null;

  mostrarPassword = false;
  soloPassword = false;

  guardando = false;
  cargando = false;

  error = '';
  mensaje = '';

  pagina = 0;
  ultimaPagina = true;

  datos = {
    nombre: '',
    email: '',
    rol: 'USER',
    password: '',
  };

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  esMiCuenta(usuario: Usuario): boolean {
    const email = this.auth.getUsuario()?.email ?? '';

    return usuario.email.toLowerCase() === email.toLowerCase();
  }

  editandoMiCuenta(): boolean {
    return this.usuarios.some(
      usuario =>
        usuario.id === this.editandoId && this.esMiCuenta(usuario)
    );
  }

  cargarUsuarios(): void {
    this.cargando = true;

    this.http.get<Usuario[]>(`${this.apiUrl}/usuarios`).subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.cargando = false;
      },
      error: error => this.mostrarError(error),
    });
  }

  cambiarTab(tab: 'usuarios' | 'actividad'): void {
    if (this.guardando || this.cargando) return;

    // Limpiar la contraseña al abandonar el formulario.
    this.cancelar();
    this.tab = tab;
    this.error = '';
    this.mensaje = '';

    if (tab === 'actividad') {
      this.cargarActividad(0);
    }
  }

  cargarActividad(pagina: number): void {
    if (this.cargando) return;

    this.cargando = true;
    this.error = '';

    this.http.get<PaginaActividad>(
      `${this.apiUrl}/actividad?page=${pagina}`
    ).subscribe({
      next: respuesta => {
        this.registros = respuesta.content;
        this.pagina = pagina;
        this.ultimaPagina = respuesta.last;
        this.cargando = false;
      },
      error: error => this.mostrarError(error),
    });
  }

  abrirFormulario(usuario?: Usuario): void {
    if (this.guardando || this.cargando) return;

    this.error = '';
    this.mensaje = '';
    this.tab = 'usuarios';

    this.editandoId = usuario?.id ?? null;
    this.mostrarPassword = false;
    this.soloPassword = false;

    this.datos = {
      nombre: usuario?.nombre ?? '',
      email: usuario?.email ?? '',
      rol: (usuario?.rol ?? 'USER')
        .trim()
        .toUpperCase()
        .replace(/^ROLE_/, ''),
      password: '',
    };

    this.formularioAbierto = true;
  }

  restablecerPassword(usuario: Usuario): void {
    if (this.guardando || this.cargando) return;

    this.abrirFormulario(usuario);
    this.soloPassword = true;
  }

  cancelar(): void {
    this.formularioAbierto = false;
    this.editandoId = null;
    this.mostrarPassword = false;
    this.soloPassword = false;

    this.datos = {
      nombre: '',
      email: '',
      rol: 'USER',
      password: '',
    };
  }

  guardar(): void {
    if (this.guardando || this.cargando) return;

    this.error = '';
    this.mensaje = '';

    const password = this.datos.password;
    const passwordObligatoria =
      this.editandoId === null || this.soloPassword;

    if (passwordObligatoria && !password.trim()) {
      this.error = 'Introduce una contraseña nueva.';
      return;
    }

    if (password.length > 0) {
      if (!password.trim()) {
        this.error = 'La contraseña no puede contener solo espacios.';
        return;
      }

      const bytes = new TextEncoder().encode(password).length;

      if (password.length < 12 || bytes > 72) {
        this.error =
          'La contraseña debe tener al menos 12 caracteres ' +
          'y no superar 72 bytes.';
        return;
      }
    }

    const esRestablecimiento = this.soloPassword;

    // Enviar una copia para mantener estable la petición.
    const payload = { ...this.datos };

    this.guardando = true;

    const peticion = this.editandoId === null
      ? this.http.post<Usuario>(
          `${this.apiUrl}/usuarios`,
          payload
        )
      : this.http.put<Usuario>(
          `${this.apiUrl}/usuarios/${this.editandoId}`,
          payload
        );

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.cancelar();

        this.mensaje = esRestablecimiento
          ? 'Contraseña restablecida correctamente. ' +
            'El cambio queda registrado en el historial.'
          : 'Usuario guardado correctamente.';

        this.cargarUsuarios();
      },
      error: error => this.mostrarError(error),
    });
  }

  eliminar(usuario: Usuario): void {
    if (
      this.guardando ||
      this.cargando ||
      this.esMiCuenta(usuario)
    ) {
      return;
    }

    const confirmado = confirm(
      `¿Eliminar la cuenta de ${usuario.nombre}? ` +
      'El historial se conservará.'
    );

    if (!confirmado) return;

    this.guardando = true;
    this.error = '';
    this.mensaje = '';

    this.http.delete(
      `${this.apiUrl}/usuarios/${usuario.id}`
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.mensaje = 'Usuario eliminado correctamente.';

        if (this.editandoId === usuario.id) {
          this.cancelar();
        }

        this.cargarUsuarios();
      },
      error: error => this.mostrarError(error),
    });
  }

  private mostrarError(error: HttpErrorResponse): void {
    this.guardando = false;
    this.cargando = false;
    this.mostrarPassword = false;

    this.error = error.error?.detail
      || error.error?.message
      || (error.status === 403
        ? 'Solo el developer puede acceder a esta sección.'
        : error.status === 401
          ? 'La sesión no es válida. Vuelve a iniciar sesión.'
          : 'No se pudo completar la operación.');
  }
}