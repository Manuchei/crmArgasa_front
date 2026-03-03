import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = 'http://localhost:9018/api/auth';
  private readonly tokenKey = 'token';
  private readonly rolKey = 'rol';

  constructor(private http: HttpClient) {}

  // 🔐 LOGIN
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        // Validamos que realmente venga un token
        if (!res || !res.token) {
          throw new Error('Token inválido o vacío');
        }

        const payload = this.decodeToken(res.token);

        if (!payload || !payload.sub) {
          throw new Error('Payload inválido');
        }

        // Guardamos token y datos
        localStorage.setItem(this.tokenKey, res.token);
        localStorage.setItem(this.rolKey, res.rol);
        localStorage.setItem('exp', (payload.exp * 1000).toString());

        // Guardamos email del usuario
        localStorage.setItem('usuario', JSON.stringify({ email: payload.sub }));
      }),
    );
  }

  // 🔐 DECODIFICAR TOKEN
  private decodeToken(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  }

  // 🔐 OBTENER TOKEN
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // 🔐 OBTENER USUARIO
  getUsuario() {
    const usuario = localStorage.getItem('usuario');
    return usuario ? JSON.parse(usuario) : null;
  }

  // 🔐 OBTENER ROL
  getRol(): string | null {
    return localStorage.getItem(this.rolKey);
  }

  // 🔐 COMPROBAR SI TOKEN HA EXPIRADO
  isSessionExpired(): boolean {
    // 🔥 MODO DEV → nunca expira
    return false;
  }

  // isSessionExpired(): boolean {
  //   const exp = Number(localStorage.getItem('exp'));
  //   if (!exp) return true; // si no existe exp → expirado
  //   return Date.now() > exp;
  // }

  // 🔐 COMPROBAR SI ESTÁ LOGUEADO
  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;

    if (this.isSessionExpired()) {
      this.logout();
      return false;
    }
    return true;
  }

  // 🔐 LOGOUT
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.rolKey);
    localStorage.removeItem('usuario');
    localStorage.removeItem('exp');
  }

  hasRole(...roles: string[]): boolean {
    const rol = (this.getRol() ?? '').toUpperCase().trim();
    return roles.some((r) => {
      const rr = r.toUpperCase().trim();
      return rol === rr || rol === `ROLE_${rr}`;
    });
  }

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isTransportista(): boolean {
    return this.hasRole('TRANSPORTISTA');
  }

  isUser(): boolean {
    return this.hasRole('USER');
  }
}
