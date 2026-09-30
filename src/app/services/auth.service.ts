import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../environments/environment';

interface TokenPayload {
  sub: string;
  exp: number;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = 'token';
  private readonly rolKey = 'rol';

  readonly actividadKey = 'novex_ultima_actividad';

  // Tiempo máximo sin actividad: 15 minutos.
  readonly inactividadMs = 15 * 60 * 1000;

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (!res || typeof res.token !== 'string' || !res.token) {
          throw new Error('Token inválido o vacío');
        }

        const payload = this.decodeToken(res.token);

        if (
          !payload ||
          typeof payload.sub !== 'string' ||
          !payload.sub ||
          typeof payload.exp !== 'number' ||
          !Number.isFinite(payload.exp) ||
          payload.exp * 1000 <= Date.now()
        ) {
          throw new Error('Token inválido o caducado');
        }

        if (typeof res.rol !== 'string' || !res.rol.trim()) {
          throw new Error('Rol inválido');
        }

        localStorage.setItem(this.tokenKey, res.token);
        localStorage.setItem(this.rolKey, res.rol.trim());
        localStorage.setItem('exp', String(payload.exp * 1000));

        localStorage.setItem('usuario', JSON.stringify({ email: payload.sub }));

        this.registrarActividad();
      }),
    );
  }

  private decodeToken(token: string): TokenPayload | null {
    try {
      const partes = token.split('.');

      if (partes.length !== 3) return null;

      // Los JWT utilizan Base64URL.
      const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');

      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

      const bytes = Uint8Array.from(atob(padded), (caracter) =>
        caracter.charCodeAt(0),
      );

      return JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getUsuario(): { email: string } | null {
    try {
      const almacenado = localStorage.getItem('usuario');

      if (!almacenado) return null;

      const usuario = JSON.parse(almacenado);

      return typeof usuario?.email === 'string'
        ? { email: usuario.email }
        : null;
    } catch {
      return null;
    }
  }

  getRol(): string | null {
    return localStorage.getItem(this.rolKey);
  }

  registrarActividad(): void {
    if (!this.getToken()) return;

    localStorage.setItem(this.actividadKey, Date.now().toString());
  }

  isInactive(): boolean {
    if (!this.getToken()) return false;

    const ultimaActividad = Number(localStorage.getItem(this.actividadKey));

    return (
      !Number.isFinite(ultimaActividad) ||
      ultimaActividad <= 0 ||
      Date.now() - ultimaActividad >= this.inactividadMs
    );
  }

  isSessionExpired(): boolean {
    const token = this.getToken();

    if (!token) return false;

    const payload = this.decodeToken(token);

    if (
      !payload ||
      typeof payload.exp !== 'number' ||
      !Number.isFinite(payload.exp)
    ) {
      return true;
    }

    return Date.now() >= payload.exp * 1000;
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !this.isSessionExpired() && !this.isInactive();
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.rolKey);
    localStorage.removeItem('usuario');
    localStorage.removeItem('exp');
    localStorage.removeItem(this.actividadKey);

    // Conservamos novex_email_recordado para «Recuérdame».
  }

  hasRole(...roles: string[]): boolean {
    const rol = (this.getRol() ?? '').toUpperCase().trim();

    return roles.some((role) => {
      const normalizado = role.toUpperCase().trim();

      return rol === normalizado || rol === `ROLE_${normalizado}`;
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
