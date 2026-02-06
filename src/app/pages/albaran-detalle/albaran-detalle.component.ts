import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-albaran-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './albaran-detalle.component.html',
  styleUrls: ['./albaran-detalle.component.css'],
})
export class AlbaranDetalleComponent implements OnInit {
  albaran: any = null;

  // ✅ clienteId para volver a /app/clientes/:id
  private clienteId: number | null = null;

  nuevaLinea: any = {
    codigo: '',
    descripcion: '',
    unidades: 1,
    precio: 0,
    dtoPct: 0,
  };

  private apiUrl = 'http://localhost:9018/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      alert('ID de albarán inválido');
      return;
    }

    // 1) intentar cogerlo de query param (si vienes desde cliente)
    const qpClienteId = Number(this.route.snapshot.queryParamMap.get('clienteId'));
    if (!isNaN(qpClienteId) && qpClienteId > 0) {
      this.clienteId = qpClienteId;
      localStorage.setItem('clienteIdFromAlbaran', String(qpClienteId));
    } else {
      // 2) fallback: localStorage (si no hay queryParam)
      const ls = Number(localStorage.getItem('clienteIdFromAlbaran'));
      this.clienteId = !isNaN(ls) && ls > 0 ? ls : null;
    }

    this.cargarAlbaran(id);
  }

  private resolverClienteIdDesdeAlbaran(data: any): number | null {
    // Por si tu backend devuelve alguna de estas variantes:
    const a = Number(data?.clienteId);
    if (!isNaN(a) && a > 0) return a;

    const b = Number(data?.cliente?.id);
    if (!isNaN(b) && b > 0) return b;

    const c = Number(data?.cliente?.idCliente);
    if (!isNaN(c) && c > 0) return c;

    return null;
  }

  cargarAlbaran(id: number): void {
    this.http.get<any>(`${this.apiUrl}/albaranes/${id}`).subscribe({
      next: (data) => {
        this.albaran = data;

        // ✅ normalizar dtoPct y campos numéricos
        this.albaran.lineas = (this.albaran.lineas ?? []).map((l: any) => ({
          ...l,
          dtoPct: l?.dtoPct ?? 0,
          unidades: l?.unidades ?? 0,
          precio: l?.precio ?? 0,
          totalLinea: l?.totalLinea ?? 0,
        }));

        // 3) si el backend trae clienteId, lo guardamos y pisamos si estaba vacío
        const fromApi = this.resolverClienteIdDesdeAlbaran(this.albaran);
        if (!this.clienteId && fromApi) {
          this.clienteId = fromApi;
          localStorage.setItem('clienteIdFromAlbaran', String(fromApi));
        }
      },
      error: (err) => {
        console.error('Error cargando albarán:', err);
        alert('No se pudo cargar el albarán');
      },
    });
  }

  volverACliente(): void {
    const id = this.clienteId;

    if (!id) {
      console.warn('No tengo clienteId. Usa queryParam o localStorage. albaran=', this.albaran);
      alert('No se puede volver al cliente');
      return;
    }

    this.router.navigate(['/app/clientes', id]);
  }

  confirmar(): void {
    if (!this.albaran?.id) return;

    this.http
      .post<any>(`${this.apiUrl}/albaranes/${this.albaran.id}/confirmar`, {})
      .subscribe({
        next: (data) => {
          this.albaran = data;

          // por si ahora devuelve clienteId
          const fromApi = this.resolverClienteIdDesdeAlbaran(this.albaran);
          if (!this.clienteId && fromApi) {
            this.clienteId = fromApi;
            localStorage.setItem('clienteIdFromAlbaran', String(fromApi));
          }

          // ✅ VOLVER al detalle del cliente al confirmar
          this.volverACliente();
        },
        error: (err) => {
          console.error('Error confirmando albarán:', err);
          alert('No se pudo confirmar el albarán');
        },
      });
  }

  agregarLinea(): void {
    if (!this.albaran?.id || this.albaran.confirmado) return;

    const descripcion = (this.nuevaLinea.descripcion ?? '').trim();
    const unidades = Number(this.nuevaLinea.unidades ?? 0);
    const precio = Number(this.nuevaLinea.precio ?? 0);
    const dtoPct = Number(this.nuevaLinea.dtoPct ?? 0);

    if (!descripcion || unidades <= 0 || precio <= 0) {
      alert('Descripción, unidades y precio deben ser válidos.');
      return;
    }
    if (dtoPct < 0 || dtoPct > 100) {
      alert('El descuento debe estar entre 0 y 100.');
      return;
    }

    const payload = {
      codigo: (this.nuevaLinea.codigo ?? '').trim() || null,
      descripcion,
      unidades,
      precio,
      dtoPct,
    };

    this.http
      .post<any>(`${this.apiUrl}/albaranes/${this.albaran.id}/lineas`, payload)
      .subscribe({
        next: (albaranActualizado) => {
          this.albaran = albaranActualizado;

          this.nuevaLinea = {
            codigo: '',
            descripcion: '',
            unidades: 1,
            precio: 0,
            dtoPct: 0,
          };
        },
        error: (err) => {
          console.error('Error agregando línea:', err);
          alert('No se pudo añadir la línea');
        },
      });
  }

  eliminarLinea(lineaId: number): void {
    if (!this.albaran?.id || this.albaran.confirmado) return;

    this.http
      .delete<any>(`${this.apiUrl}/albaranes/${this.albaran.id}/lineas/${lineaId}`)
      .subscribe({
        next: (albaranActualizado) => {
          this.albaran = albaranActualizado;
        },
        error: (err) => {
          console.error('Error eliminando línea:', err);
          alert('No se pudo eliminar la línea');
        },
      });
  }
}
