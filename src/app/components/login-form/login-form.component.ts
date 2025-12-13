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

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit() {
    console.log('Login fake → entramos como ADMIN');

    // 🔥 FORZAMOS SESIÓN
    localStorage.setItem('token', 'fake-token');
    localStorage.setItem('rol', 'ROLE_ADMIN');
    localStorage.setItem(
      'usuario',
      JSON.stringify({ email: 'admin@empresa.com' })
    );

    this.router.navigate(['/dashboard']); // o la ruta principal
  }
}
