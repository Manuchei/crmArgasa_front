import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../interfaces/iruta';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface GrupoTransportista {
  nombre: string;
  email?: string;
  rutas: Ruta[];
}

interface GrupoFecha {
  fechaKey: string;
  fechaLabel: string;
  transportistas: GrupoTransportista[];
  total: number;
}

@Component({
  selector: 'app-rutas-list',
  standalone: true,
  templateUrl: './rutas-list.component.html',
  styleUrls: ['./rutas-list.component.scss'],
  imports: [FormsModule, NgIf, NgFor],
})
export class RutasListComponent implements OnInit {
  rutas: Ruta[] = [];
  rutasBase: Ruta[] = [];
  grouped: GrupoFecha[] = [];

  filtroEstado: string = 'pendiente';
  filtroNombre: string = '';
  filtroFecha: string = '';

  cargando = false;
  error = '';
  openIndex: number | null = null;

  emailUsuario: string = '';
  rolUsuario: string = '';
  esAdminODebug: boolean = false;
  esTransportista: boolean = false;

  constructor(
    private rutaService: RutaService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.inicializarUsuario();
    this.inicializarFiltrosPorDefecto();
    this.cargarRutas();
  }

  toggle(i: number): void {
    this.openIndex = this.openIndex === i ? null : i;
  }

  private inicializarUsuario(): void {
    const usuario = this.authService.getUsuario?.();
    const rol = this.authService.getRol?.();

    this.emailUsuario = (usuario?.email || '').trim().toLowerCase();
    this.rolUsuario = (rol || '').trim().toUpperCase();

    this.esAdminODebug =
      this.rolUsuario.includes('ADMIN') ||
      this.rolUsuario.includes('DEVELOPER');

    this.esTransportista = !this.esAdminODebug;
  }

  private inicializarFiltrosPorDefecto(): void {
    const hoy = new Date();
    this.filtroFecha = this.toInputDate(hoy);

    if (this.esTransportista) {
      this.filtroEstado = 'pendiente';
    } else {
      this.filtroEstado = '';
    }
  }

  private toInputDate(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private setRutasBase(rutas: Ruta[] | null | undefined): void {
    this.rutasBase = Array.isArray(rutas) ? rutas : [];
    this.aplicarFiltrosLocales();
  }

  private setRutasFiltradas(rutas: Ruta[]): void {
    this.rutas = Array.isArray(rutas) ? rutas : [];
    this.grouped = this.agruparRutas(this.rutas);

    if (this.grouped.length > 0) {
      this.openIndex = 0;
    } else {
      this.openIndex = null;
    }
  }

  private getErrorMessage(err: any, fallback: string): string {
    console.error('Detalle error:', err);

    if (typeof err?.error === 'string' && err.error.trim() !== '') {
      return err.error;
    }

    if (
      typeof err?.error?.message === 'string' &&
      err.error.message.trim() !== ''
    ) {
      return err.error.message;
    }

    if (typeof err?.message === 'string' && err.message.trim() !== '') {
      return err.message;
    }

    if (err?.status) {
      return `${fallback} (HTTP ${err.status})`;
    }

    return fallback;
  }

  cargarRutas(): void {
    this.cargando = true;
    this.error = '';
    this.openIndex = null;

    this.rutaService.getRutas().subscribe({
      next: (data) => {
        this.setRutasBase(data);
        this.cargando = false;
      },
      error: (err) => {
        this.error = this.getErrorMessage(err, 'Error al cargar las rutas');
        this.setRutasBase([]);
        this.cargando = false;
      },
    });
  }

  aplicarFiltrosLocales(): void {
    let rutasFiltradas = [...this.rutasBase];

    // 1. Si NO es admin/developer, solo ve sus rutas
    if (this.esTransportista) {
      rutasFiltradas = rutasFiltradas.filter((r: any) => {
        const emailRuta = (r?.emailTransportista || '').toString().trim().toLowerCase();
        return emailRuta === this.emailUsuario;
      });
    }

    // 2. Filtro por fecha
    if (this.filtroFecha) {
      rutasFiltradas = rutasFiltradas.filter((r) => {
        const fechaRuta = this.getFechaKey(r);
        return fechaRuta === this.filtroFecha;
      });
    }

    // 3. Filtro por estado
    if (this.filtroEstado) {
      rutasFiltradas = rutasFiltradas.filter((r) => r.estado === this.filtroEstado);
    }

    // 4. Filtro por nombre/transportista/búsqueda
    if (this.filtroNombre && this.filtroNombre.trim() !== '') {
      const texto = this.filtroNombre.trim().toLowerCase();

      rutasFiltradas = rutasFiltradas.filter((r: any) => {
        const cliente = `${r?.cliente?.nombreApellidos || ''} ${r?.cliente?.nombreComercial || ''}`.toLowerCase();
        const transportista = (r?.nombreTransportista || '').toLowerCase();
        const emailTransportista = (r?.emailTransportista || '').toLowerCase();
        const destino = (r?.destino || '').toLowerCase();
        const observaciones = (r?.observaciones || '').toLowerCase();
        const tarea = (r?.tarea || '').toLowerCase();

        return (
          cliente.includes(texto) ||
          transportista.includes(texto) ||
          emailTransportista.includes(texto) ||
          destino.includes(texto) ||
          observaciones.includes(texto) ||
          tarea.includes(texto)
        );
      });
    }

    this.setRutasFiltradas(rutasFiltradas);
  }

  filtrarNombre(): void {
    this.aplicarFiltrosLocales();
  }

  filtrarEstado(): void {
    this.aplicarFiltrosLocales();
  }

  filtrarFecha(): void {
    this.aplicarFiltrosLocales();
  }

  limpiarFiltros(): void {
    this.filtroNombre = '';

    if (this.esTransportista) {
      this.filtroEstado = 'pendiente';
      this.filtroFecha = this.toInputDate(new Date());
    } else {
      this.filtroEstado = '';
      this.filtroFecha = '';
    }

    this.aplicarFiltrosLocales();
  }

  nuevaRuta(): void {
    this.router.navigate(['/app/rutas/nueva']);
  }

  crearRutasDia(): void {
    this.router.navigate(['/app/rutas/dia']);
  }

  editarRuta(ruta: Ruta): void {
    if (ruta?.id != null) {
      this.router.navigate(['/app/rutas/editar', ruta.id]);
    }
  }

  verRuta(id: number): void {
    this.router.navigate(['/app/rutas/ver', id]);
  }

  eliminarRuta(ruta: Ruta): void {
    if (!ruta?.id) return;

    if (confirm(`¿Seguro que quieres eliminar la ruta ${ruta.id}?`)) {
      this.rutaService.eliminarRuta(ruta.id).subscribe({
        next: () => this.cargarRutas(),
        error: (err) => {
          alert(this.getErrorMessage(err, 'Error al eliminar la ruta'));
        },
      });
    }
  }

  cerrarRuta(ruta: Ruta): void {
    if (!ruta?.id) return;

    if (confirm(`¿Cerrar la ruta ${ruta.id}?`)) {
      this.rutaService.cerrarRuta(ruta.id).subscribe({
        next: () => this.cargarRutas(),
        error: (err) => {
          alert(this.getErrorMessage(err, 'Error al cerrar la ruta'));
        },
      });
    }
  }

  puedeGestionarTodo(): boolean {
    return this.esAdminODebug;
  }

  getTituloPantalla(): string {
    return this.esAdminODebug ? 'Gestión de Rutas' : 'Mis Rutas';
  }

  private formatFechaLabel(fechaKey: string): string {
    const [y, m, d] = (fechaKey || '').split('-');
    if (!y || !m || !d) return fechaKey || 'Sin fecha';
    return `${d}/${m}/${y}`;
  }

  private getFechaKey(r: Ruta): string {
    const fecha = (r?.fecha || '').toString().trim();
    if (!fecha) return 'Sin fecha';
    return fecha.substring(0, 10);
  }

  private getTransportistaKey(r: Ruta): string {
    return (r?.nombreTransportista || 'Sin transportista').toString().trim();
  }

  private getTransportistaEmail(r: Ruta): string | undefined {
    const email = (r as any)?.emailTransportista;
    return email ? String(email) : undefined;
  }

  private agruparRutas(rutas: Ruta[]): GrupoFecha[] {
    const mapFecha = new Map<string, Map<string, GrupoTransportista>>();

    for (const r of rutas) {
      const fechaKey = this.getFechaKey(r);
      const transportistaKey = this.getTransportistaKey(r);

      if (!mapFecha.has(fechaKey)) {
        mapFecha.set(fechaKey, new Map<string, GrupoTransportista>());
      }

      const mapTransportistas = mapFecha.get(fechaKey)!;

      if (!mapTransportistas.has(transportistaKey)) {
        mapTransportistas.set(transportistaKey, {
          nombre: transportistaKey,
          email: this.getTransportistaEmail(r),
          rutas: [],
        });
      }

      mapTransportistas.get(transportistaKey)!.rutas.push(r);
    }

    const fechasOrdenadas = Array.from(mapFecha.keys()).sort((a, b) =>
      b.localeCompare(a),
    );

    return fechasOrdenadas.map((fechaKey) => {
      const transportistasMap = mapFecha.get(fechaKey)!;

      const transportistas = Array.from(transportistasMap.values())
        .map((t) => ({
          ...t,
          rutas: [...t.rutas].sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));

      const total = transportistas.reduce((acc, t) => acc + t.rutas.length, 0);

      return {
        fechaKey,
        fechaLabel: this.formatFechaLabel(fechaKey),
        transportistas,
        total,
      };
    });
  }

  private nombreProductoFromLinea(linea: any): string {
    const p = linea?.producto;

    if (p?.codigo && p?.nombre) return `${p.codigo} - ${p.nombre}`;
    if (p?.nombre) return p.nombre;
    if (linea?.nombreProducto) return linea.nombreProducto;
    if (linea?.productoId) return `Producto ${linea.productoId}`;

    return 'Producto';
  }

  getResumenEntrega(ruta: any, maxItems: number = 2): string | null {
    const lineas = ruta?.lineas;

    if (!Array.isArray(lineas) || lineas.length === 0) return null;

    const parts = lineas
      .slice(0, maxItems)
      .map(
        (l: any) => `${l?.cantidad ?? 1}x ${this.nombreProductoFromLinea(l)}`,
      );

    const extra =
      lineas.length > maxItems ? ` +${lineas.length - maxItems}` : '';

    return `📦 Entrega: ${parts.join(', ')}${extra}`;
  }

  getResumenTarea(ruta: any): string | null {
    const tarea = (ruta?.tarea ?? '').toString().trim();
    if (!tarea) return null;
    return `🛠 Tarea: ${tarea}`;
  }

  getResumenPrincipal(ruta: any): string {
    const entrega = this.getResumenEntrega(ruta, 2);
    const tarea = this.getResumenTarea(ruta);

    if (entrega) return entrega;
    if (tarea) return tarea;

    return '—';
  }

  getResumenSecundario(ruta: any): string | null {
    const entrega = this.getResumenEntrega(ruta, 2);
    const tarea = this.getResumenTarea(ruta);

    if (entrega && tarea) return tarea;

    return null;
  }
}