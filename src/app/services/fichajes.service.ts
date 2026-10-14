import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
export interface EmpleadoFichaje {
  id: number;
  usuarioId: number;
  nombre: string;
  email: string;
  activo: boolean;
}
export interface UsuarioFichaje {
  id: number;
  nombre: string;
  email: string;
}
export interface JornadaFichaje {
  id: number;
  empleadoId: number;
  nombre: string;
  entrada: string;
  salida: string | null;
  entradaOriginal: string;
  salidaOriginal: string | null;
  segundos: number | null;
  version: number;
}
export interface MiEstadoFichaje {
  empleado: EmpleadoFichaje;
  abierta: JornadaFichaje | null;
  horaServidor: string;
}
export interface PaginaFichajes {
  registros: JornadaFichaje[];
  total: number;
  pagina: number;
  tamano: number;
}
export interface CorreccionFichaje {
  id: number;
  actor: string;
  fecha: string;
  motivo: string;
  entradaAnterior: string;
  salidaAnterior: string | null;
  entradaNueva: string;
  salidaNueva: string | null;
}
@Injectable({ providedIn: 'root' })
export class FichajesService {
  private base = `${environment.apiUrl}/fichajes`;
  constructor(private http: HttpClient) {}
  estado() {
    return this.http.get<MiEstadoFichaje>(`${this.base}/mi-estado`);
  }
  fichar(tipo: 'entrada' | 'salida', clave: string) {
    return this.http.post<JornadaFichaje>(`${this.base}/${tipo}`, { clave });
  }
  registros(
    admin: boolean,
    desde: string,
    hasta: string,
    pagina: number,
    empleadoId: string,
  ) {
    let params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta)
      .set('pagina', pagina);
    if (admin && empleadoId) params = params.set('empleadoId', empleadoId);
    return this.http.get<PaginaFichajes>(
      `${this.base}/${admin ? 'registros' : 'mis-registros'}`,
      { params },
    );
  }
  empleados() {
    return this.http.get<EmpleadoFichaje[]>(`${this.base}/empleados`);
  }
  candidatos() {
    return this.http.get<UsuarioFichaje[]>(`${this.base}/usuarios-disponibles`);
  }
  alta(usuarioId: number) {
    return this.http.post<EmpleadoFichaje>(`${this.base}/empleados`, {
      usuarioId,
    });
  }
  activar(id: number, activo: boolean) {
    return this.http.patch<EmpleadoFichaje>(`${this.base}/empleados/${id}`, {
      activo,
    });
  }
  corregir(
    j: JornadaFichaje,
    entrada: string,
    salida: string | null,
    motivo: string,
  ) {
    return this.http.put<JornadaFichaje>(`${this.base}/registros/${j.id}`, {
      entrada,
      salida,
      motivo,
      version: j.version,
    });
  }
  correcciones(id: number) {
    return this.http.get<CorreccionFichaje[]>(
      `${this.base}/registros/${id}/correcciones`,
    );
  }
}
