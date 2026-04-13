import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-albaran-proveedor-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './albaran-proveedor-detalle.component.html',
  styleUrls: ['./albaran-proveedor-detalle.component.css'],
})
export class AlbaranProveedorDetalleComponent implements OnInit, OnDestroy {
  albaran: any = null;

  private destroy$ = new Subject<void>();

  private proveedorId: number | null = null;
  private albaranId: number | null = null;

  isConfirming = false;

  nuevaLinea: any = {
    codigo: '',
    descripcion: '',
    unidades: 1,
    precio: 0,
    dtoPct: 0,
    tipo: 'MANUAL',
  };

  private apiUrl = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((pm) => {
      const id = Number(pm.get('id'));
      if (isNaN(id) || id <= 0) {
        alert('ID de albarán inválido');
        this.router.navigateByUrl('/app/proveedores');
        return;
      }

      this.albaran = null;
      this.proveedorId = null;
      this.albaranId = id;
      this.isConfirming = false;

      const qpProveedorId = Number(
        this.route.snapshot.queryParamMap.get('proveedorId'),
      );

      if (!isNaN(qpProveedorId) && qpProveedorId > 0) {
        this.proveedorId = qpProveedorId;
        this.setProveedorIdCache(id, qpProveedorId);
      } else {
        const stateProveedorId = Number((history.state as any)?.proveedorId);
        if (!isNaN(stateProveedorId) && stateProveedorId > 0) {
          this.proveedorId = stateProveedorId;
          this.setProveedorIdCache(id, stateProveedorId);
        } else {
          this.proveedorId = this.getProveedorIdCache(id);
        }
      }

      this.cargarAlbaran(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private storageKey(albaranId: number): string {
    return `proveedorIdFromAlbaran_${albaranId}`;
  }

  private setProveedorIdCache(albaranId: number, proveedorId: number): void {
    localStorage.setItem(this.storageKey(albaranId), String(proveedorId));
  }

  private getProveedorIdCache(albaranId: number): number | null {
    const v = Number(localStorage.getItem(this.storageKey(albaranId)));
    return !isNaN(v) && v > 0 ? v : null;
  }

  private resolverProveedorIdDesdeAlbaran(data: any): number | null {
    const candidates = [
      data?.proveedorId,
      data?.idProveedor,
      data?.id_proveedor,
      data?.proveedor?.id,
      data?.proveedor?.idProveedor,
      data?.proveedor?.id_proveedor,
    ];

    for (const v of candidates) {
      const n = Number(v);
      if (!isNaN(n) && n > 0) return n;
    }

    return null;
  }

  private getProveedorIdSeguro(): number | null {
    if (this.proveedorId) return this.proveedorId;

    const fromMem = this.resolverProveedorIdDesdeAlbaran(this.albaran);
    if (fromMem && this.albaranId) {
      this.proveedorId = fromMem;
      this.setProveedorIdCache(this.albaranId, fromMem);
      return fromMem;
    }

    if (this.albaranId) {
      const cached = this.getProveedorIdCache(this.albaranId);
      if (cached) {
        this.proveedorId = cached;
        return cached;
      }
    }

    return null;
  }

  cargarAlbaran(id: number): void {
    this.http
      .get<any>(`${this.apiUrl}/albaranes-proveedor/${id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.albaran = {
            ...data,
            lineas: (data?.lineas ?? []).map((l: any) => ({
              ...l,
              dtoPct: Number(l?.dtoPct ?? 0),
              unidades: Number(l?.unidades ?? 0),
              precio: Number(l?.precio ?? 0),
              totalLinea: Number(l?.totalLinea ?? 0),
              baseLinea: Number(l?.baseLinea ?? 0),
              descuentoImporte: Number(l?.descuentoImporte ?? 0),
            })),
          };

          const fromApi = this.resolverProveedorIdDesdeAlbaran(this.albaran);
          if (fromApi && this.albaranId) {
            this.proveedorId = fromApi;
            this.setProveedorIdCache(this.albaranId, fromApi);
          }
        },
        error: (err) => {
          console.error('Error cargando albarán proveedor:', err);
          alert('No se pudo cargar el albarán');
          this.router.navigateByUrl('/app/proveedores');
        },
      });
  }

  volverAProveedor(): void {
    const id = this.getProveedorIdSeguro();
    if (!id) {
      this.router.navigateByUrl('/app/proveedores');
      return;
    }

    this.router.navigate(['/app/proveedores', id]);
  }

  editarAlbaran(): void {
    if (!this.albaran?.id) return;

    this.router.navigate(['/app/albaranes-proveedor/editar', this.albaran.id], {
      queryParams: { proveedorId: this.getProveedorIdSeguro() },
      state: { proveedorId: this.getProveedorIdSeguro(), volverA: 'albaranes' },
    });
  }

  imprimirAlbaran(): void {
    if (!this.albaran?.id) return;
    const url = `${window.location.origin}/imprimir/albaran-proveedor/${this.albaran.id}`;
    window.open(url, '_blank');
  }

  confirmar(): void {
    if (!this.albaran?.id || this.isConfirming) return;

    this.isConfirming = true;

    this.http
      .post<any>(
        `${this.apiUrl}/albaranes-proveedor/${this.albaran.id}/confirmar`,
        {},
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (albaranActualizado) => {
          if (albaranActualizado) {
            this.albaran = {
              ...albaranActualizado,
              lineas: (albaranActualizado?.lineas ?? []).map((l: any) => ({
                ...l,
                dtoPct: Number(l?.dtoPct ?? 0),
                unidades: Number(l?.unidades ?? 0),
                precio: Number(l?.precio ?? 0),
                totalLinea: Number(l?.totalLinea ?? 0),
                baseLinea: Number(l?.baseLinea ?? 0),
                descuentoImporte: Number(l?.descuentoImporte ?? 0),
              })),
            };
          }
          this.isConfirming = false;
        },
        error: (err) => {
          console.error('Error confirmando albarán:', err);
          alert('No se pudo confirmar el albarán');
          this.isConfirming = false;
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
      tipo: this.nuevaLinea.tipo || 'MANUAL',
      codigo: (this.nuevaLinea.codigo ?? '').trim() || null,
      descripcion,
      unidades,
      precio,
      dtoPct,
    };

    this.http
      .post<any>(
        `${this.apiUrl}/albaranes-proveedor/${this.albaran.id}/lineas`,
        payload,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (albaranActualizado) => {
          this.albaran = {
            ...albaranActualizado,
            lineas: (albaranActualizado?.lineas ?? []).map((l: any) => ({
              ...l,
              dtoPct: Number(l?.dtoPct ?? 0),
              unidades: Number(l?.unidades ?? 0),
              precio: Number(l?.precio ?? 0),
              totalLinea: Number(l?.totalLinea ?? 0),
              baseLinea: Number(l?.baseLinea ?? 0),
              descuentoImporte: Number(l?.descuentoImporte ?? 0),
            })),
          };

          const fromApi = this.resolverProveedorIdDesdeAlbaran(this.albaran);
          if (fromApi && this.albaranId) {
            this.proveedorId = fromApi;
            this.setProveedorIdCache(this.albaranId, fromApi);
          }

          this.nuevaLinea = {
            codigo: '',
            descripcion: '',
            unidades: 1,
            precio: 0,
            dtoPct: 0,
            tipo: 'MANUAL',
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
        `${this.apiUrl}/albaranes-proveedor/${this.albaran.id}/lineas/${lineaId}`,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (albaranActualizado) => {
          this.albaran = {
            ...albaranActualizado,
            lineas: (albaranActualizado?.lineas ?? []).map((l: any) => ({
              ...l,
              dtoPct: Number(l?.dtoPct ?? 0),
              unidades: Number(l?.unidades ?? 0),
              precio: Number(l?.precio ?? 0),
              totalLinea: Number(l?.totalLinea ?? 0),
              baseLinea: Number(l?.baseLinea ?? 0),
              descuentoImporte: Number(l?.descuentoImporte ?? 0),
            })),
          };
        },
        error: (err) => {
          console.error('Error eliminando línea:', err);
          alert('No se pudo eliminar la línea');
        },
      });
  }

  getNombreProveedor(): string {
    const nombre = (this.albaran?.nombre ?? '').toString().trim();
    const apellido = (this.albaran?.apellido ?? '').toString().trim();
    return `${nombre} ${apellido}`.trim() || '-';
  }

  getEstadoLabel(): string {
    return this.albaran?.confirmado ? 'Confirmado' : 'Pendiente';
  }

  getEstadoBadgeClass(): string {
    return this.albaran?.confirmado ? 'bg-success' : 'bg-warning text-dark';
  }

  getTotalCompra(): number {
    const candidates = [
      this.albaran?.totalCompra,
      this.albaran?.totalCompras,
      this.albaran?.totalImporte,
      this.albaran?.importeTotal,
      this.albaran?.subtotal,
    ];

    for (const v of candidates) {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }

    return 0;
  }

  getTotalPagado(): number {
    const candidates = [
      this.albaran?.totalPagado,
      this.albaran?.importePagado,
      this.albaran?.pagado,
      this.albaran?.totalAbonado,
    ];

    for (const v of candidates) {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }

    return 0;
  }

  getPendientePago(): number {
    const candidates = [
      this.albaran?.pendientePago,
      this.albaran?.saldoPendiente,
      this.albaran?.importePendiente,
    ];

    for (const v of candidates) {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }

    return Math.max(this.getTotalCompra() - this.getTotalPagado(), 0);
  }

  hasResumenPago(): boolean {
    return (
      this.albaran?.totalPagado != null ||
      this.albaran?.importePagado != null ||
      this.albaran?.pagado != null ||
      this.albaran?.pendientePago != null ||
      this.albaran?.saldoPendiente != null ||
      this.albaran?.importePendiente != null
    );
  }

  canEdit(): boolean {
    return !!this.albaran && !this.albaran.confirmado;
  }
}
