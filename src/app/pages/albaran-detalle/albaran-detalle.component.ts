import { EmpresaService } from './../../services/empresa.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Empresa } from '../../services/empresa.service';

@Component({
  selector: 'app-albaran-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './albaran-detalle.component.html',
  styleUrls: ['./albaran-detalle.component.css'],
})
export class AlbaranDetalleComponent implements OnInit, OnDestroy {
  albaran: any = null;

  private destroy$ = new Subject<void>();

  private clienteId: number | null = null;
  private albaranId: number | null = null;

  isConfirming = false;

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
    private router: Router,
    private empresaService: EmpresaService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((pm) => {
      const id = Number(pm.get('id'));
      if (isNaN(id) || id <= 0) {
        alert('ID de albarán inválido');
        return;
      }

      this.albaran = null;
      this.clienteId = null;
      this.albaranId = id;
      this.isConfirming = false;

      // 1) queryParam (ideal)
      const qpClienteId = Number(
        this.route.snapshot.queryParamMap.get('clienteId'),
      );
      if (!isNaN(qpClienteId) && qpClienteId > 0) {
        this.clienteId = qpClienteId;
        this.setClienteIdCache(id, qpClienteId);
      } else {
        // 2) state
        const stateClienteId = Number((history.state as any)?.clienteId);
        if (!isNaN(stateClienteId) && stateClienteId > 0) {
          this.clienteId = stateClienteId;
          this.setClienteIdCache(id, stateClienteId);
        } else {
          // 3) cache por albarán
          this.clienteId = this.getClienteIdCache(id);
        }
      }

      this.cargarAlbaran(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // =========================
  //  EMPRESA (LA CLAVE REAL)
  // =========================
  private normalizarEmpresa(value: any): Empresa | null {
    const e = (value ?? '').toString().trim().toUpperCase();
    if (e === 'ARGASA' || e === 'ELECTROLUGA') return e as Empresa;
    return null;
  }

  private asegurarEmpresaActivaOrDie(): void {
    // Si ya hay empresa en el servicio, perfecto
    const actual = this.empresaService.getEmpresa();
    if (actual) return;

    // Si no, intento sacarla del albarán
    const empresa = this.normalizarEmpresa(this.albaran?.empresa);
    if (!empresa) return;

    // ✅ ESTO es lo que tu guard/servicio necesitan
    localStorage.setItem('empresa_activa', empresa);
    this.empresaService.setEmpresa(empresa);
  }

  // =========================
  //  ClienteId cache helpers
  // =========================
  private storageKey(albaranId: number) {
    return `clienteIdFromAlbaran_${albaranId}`;
  }

  private setClienteIdCache(albaranId: number, clienteId: number) {
    localStorage.setItem(this.storageKey(albaranId), String(clienteId));
  }

  private getClienteIdCache(albaranId: number): number | null {
    const v = Number(localStorage.getItem(this.storageKey(albaranId)));
    return !isNaN(v) && v > 0 ? v : null;
  }

  private resolverClienteIdDesdeAlbaran(data: any): number | null {
    const candidates = [
      data?.clienteId,
      data?.idCliente,
      data?.id_cliente,
      data?.cliente?.id,
      data?.cliente?.idCliente,
      data?.cliente?.id_cliente,
    ];

    for (const v of candidates) {
      const n = Number(v);
      if (!isNaN(n) && n > 0) return n;
    }
    return null;
  }

  private getClienteIdSeguro(): number | null {
    if (this.clienteId) return this.clienteId;

    const fromMem = this.resolverClienteIdDesdeAlbaran(this.albaran);
    if (fromMem && this.albaranId) {
      this.clienteId = fromMem;
      this.setClienteIdCache(this.albaranId, fromMem);
      return fromMem;
    }

    if (this.albaranId) {
      const cached = this.getClienteIdCache(this.albaranId);
      if (cached) {
        this.clienteId = cached;
        return cached;
      }
    }

    return null;
  }

  // =========================
  //  API
  // =========================
  cargarAlbaran(id: number): void {
    this.http.get<any>(`${this.apiUrl}/albaranes/${id}`).subscribe({
      next: (data) => {
        this.albaran = data;

        this.albaran.lineas = (this.albaran.lineas ?? []).map((l: any) => ({
          ...l,
          dtoPct: l?.dtoPct ?? 0,
          unidades: l?.unidades ?? 0,
          precio: l?.precio ?? 0,
          totalLinea: l?.totalLinea ?? 0,
        }));

        const fromApi = this.resolverClienteIdDesdeAlbaran(this.albaran);
        if (fromApi && this.albaranId) {
          this.clienteId = fromApi;
          this.setClienteIdCache(this.albaranId, fromApi);
        }

        // ✅ IMPORTANTÍSIMO: en cuanto cargo el albarán, fijo empresa_activa si hace falta
        this.asegurarEmpresaActivaOrDie();
      },
      error: (err) => {
        console.error('Error cargando albarán:', err);
        alert('No se pudo cargar el albarán');
      },
    });
  }

  // =========================
  //  Navegación
  // =========================
  volverACliente(): void {
    // ✅ antes de navegar: seteo empresa_activa + EmpresaService
    this.asegurarEmpresaActivaOrDie();

    const id = this.getClienteIdSeguro();
    if (!id) {
      this.router.navigateByUrl('/app/clientes');
      return;
    }

    this.router.navigateByUrl(`/app/clientes/${id}`);
  }

  confirmar(): void {
    if (!this.albaran?.id || this.isConfirming) return;

    const clienteIdSeguro = this.getClienteIdSeguro(); // puede ser null
    this.isConfirming = true;

    this.http
      .post<any>(`${this.apiUrl}/albaranes/${this.albaran.id}/confirmar`, {})
      .subscribe({
        next: () => {
          // ✅ antes de navegar: seteo empresa_activa + EmpresaService
          this.asegurarEmpresaActivaOrDie();

          if (clienteIdSeguro) {
            this.router.navigateByUrl(`/app/clientes/${clienteIdSeguro}`);
            return;
          }

          this.router.navigateByUrl('/app/albaranes');
        },
        error: (err) => {
          console.error('Error confirmando albarán:', err);
          alert('No se pudo confirmar el albarán');
          this.isConfirming = false;
        },
      });
  }

  // =========================
  //  Líneas
  // =========================
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

          const fromApi = this.resolverClienteIdDesdeAlbaran(this.albaran);
          if (fromApi && this.albaranId) {
            this.clienteId = fromApi;
            this.setClienteIdCache(this.albaranId, fromApi);
          }

          // por si vino empresa y el servicio estaba vacío
          this.asegurarEmpresaActivaOrDie();

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
      .delete<any>(
        `${this.apiUrl}/albaranes/${this.albaran.id}/lineas/${lineaId}`,
      )
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
