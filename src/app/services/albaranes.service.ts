import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AlbaranesService {
  private apiUrl = `${environment.apiUrl}/albaranes`;

  private jsonHeaders = new HttpHeaders({
    'Content-Type': 'application/json',
    Accept: 'application/json',
  });

  constructor(private http: HttpClient) {}

  // ============================================================
  // CREAR ALBARÁN DESDE TODOS LOS TRABAJOS DE UN CLIENTE
  // ============================================================

  crearDesdeCliente(clienteId: number, empresa: string): Observable<any> {
    const params = new HttpParams().set('empresa', empresa);

    return this.http.post<any>(
      `${this.apiUrl}/clientes/${clienteId}`,
      {},
      { params },
    );
  }

  // ============================================================
  // CREAR ALBARÁN DESDE UN TRABAJO CONCRETO
  // ============================================================

  crearDesdeTrabajo(trabajoId: number, empresa: string): Observable<any> {
    const params = new HttpParams().set('empresa', empresa);

    return this.http.post<any>(
      `${this.apiUrl}/trabajos/${trabajoId}`,
      {},
      { params },
    );
  }

  // ============================================================
  // LISTAR ALBARANES DE UN CLIENTE
  // ============================================================

  listarPorCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/clientes/${clienteId}`);
  }

  // ============================================================
  // OBTENER ALBARÁN
  // ============================================================

  getById(albaranId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${albaranId}`);
  }

  // ============================================================
  // AGREGAR LÍNEA
  // ============================================================

  agregarLinea(albaranId: number, linea: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${albaranId}/lineas`, linea, {
      headers: this.jsonHeaders,
    });
  }

  // ============================================================
  // ELIMINAR LÍNEA
  // ============================================================

  eliminarLinea(albaranId: number, lineaId: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${albaranId}/lineas/${lineaId}`,
    );
  }

  // ============================================================
  // CONFIRMAR ALBARÁN
  // ============================================================

  confirmar(albaranId: number): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/${albaranId}/confirmar`,
      {},
      {
        headers: this.jsonHeaders,
      },
    );
  }
}
