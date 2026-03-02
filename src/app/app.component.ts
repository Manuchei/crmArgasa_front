import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { AuthService } from './services/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, NgIf],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'empresa.crm';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {
    setInterval(() => {
      if (this.auth.isSessionExpired()) {
        this.auth.logout();
        this.router.navigate(['/login']);
      }
    }, 15000);
  }

  mostrarNavbar(): boolean {
    return this.router.url.startsWith('/app');
  }
}
