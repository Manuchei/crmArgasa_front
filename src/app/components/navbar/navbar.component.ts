import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent {
  usuario: any = null;
  rol: string | null = null;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.usuario = this.auth.getUsuario();
    this.rol = this.auth.getRol();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
