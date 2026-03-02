import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
  email = '';
  password = '';
  errorMsg = '';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onSubmit() {
    this.errorMsg = '';

    const credentials = {
      email: this.email,
      password: this.password,
    };

    this.authService.login(credentials).subscribe({
      next: () => {
        // ✅ Login OK → vamos al selector de empresa (siempre después del login)
        this.router.navigate(['/empresa']); // ajusta si tu ruta real es otra
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMsg = 'Credenciales incorrectas';
      },
    });
  }
}
