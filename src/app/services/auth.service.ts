import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:9018/api/auth';
  private tokenKey = 'token';
  private rolKey = 'rol';

  constructor(private http: HttpClient) {}

  login(credentials: { email: string; password: string }): Observable<any> {
  return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
    tap((res: any) => {
      localStorage.setItem(this.tokenKey, res.token);
      localStorage.setItem(this.rolKey, res.rol);

      // 👉 decodificar token para obtener el email
      const payload = this.decodeToken(res.token);

      localStorage.setItem(
        'usuario',
        JSON.stringify({ email: payload.sub }) // normalmente viene en "sub"
      );
    })
  );
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
    return !!this.getToken();
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
