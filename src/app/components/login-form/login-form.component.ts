import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.css'],
})
export class LoginFormComponent {
  email = '';
  password = '';
  recordar = false;
  mostrarPassword = false;
  cargando = false;
  errorMsg = '';
  aviso = '';

  private readonly recordarKey = 'novex_email_recordado';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    const emailRecordado = localStorage.getItem(this.recordarKey);

    if (emailRecordado) {
      this.email = emailRecordado;
      this.recordar = true;
    }

    const motivo = this.route.snapshot.queryParamMap.get('motivo');

    if (motivo === 'inactividad') {
      this.aviso =
        'Tu sesión se ha cerrado por inactividad. Inicia sesión para continuar.';
    } else if (motivo === 'expirada') {
      this.aviso = 'Tu sesión ha caducado. Inicia sesión de nuevo.';
    }
  }

  cambiarRecordatorio(): void {
    if (!this.recordar) {
      localStorage.removeItem(this.recordarKey);
    }
  }

  onSubmit(form: NgForm): void {
    if (this.cargando) return;

    this.errorMsg = '';

    if (form.invalid || !this.email.trim() || !this.password) {
      form.control.markAllAsTouched();
      return;
    }

    this.cargando = true;

    const email = this.email.trim();

    this.authService
      .login({ email, password: this.password })
      .pipe(finalize(() => (this.cargando = false)))
      .subscribe({
        next: () => {
          if (this.recordar) {
            localStorage.setItem(this.recordarKey, email);
          } else {
            localStorage.removeItem(this.recordarKey);
          }

          this.password = '';
          void this.router.navigate(['/empresa']);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg =
            err.status === 0 || err.status >= 500
              ? 'No se ha podido conectar. Inténtalo de nuevo en unos instantes.'
              : 'No se ha podido iniciar sesión. Comprueba tu correo y contraseña.';
        },
      });
  }
}
