import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:9018/api/auth';
  private readonly tokenKey = 'token';
  private readonly rolKey = 'rol';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        const payload = this.decodeToken(res.token);

        localStorage.setItem(this.tokenKey, res.token);
        localStorage.setItem(this.rolKey, res.rol);

        // 👉 Guardamos la expiración token * 1000
        localStorage.setItem('exp', (payload.exp * 1000).toString());

        // 👉 Guardamos el usuario
        localStorage.setItem('usuario', JSON.stringify({ email: payload.sub }));
      })
    );
  }

  isSessionExpired(): boolean {
    const exp = Number(localStorage.getItem('exp'));
    if (!exp) return true;
    return Date.now() > exp;
  }

  register(data: {
    nombre: string;
    email: string;
    password: string;
    rol: string;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.rolKey);
    localStorage.removeItem('usuario');
  }

  isLoggedIn(): boolean {
    if (!this.getToken()) return false;
    if (this.isSessionExpired()) {
      this.logout();
      return false;
    }
    return true;
  }

  getRol(): string | null {
    return localStorage.getItem(this.rolKey);
  }

  getUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  private decodeToken(token: string): any {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded);
  }
}
