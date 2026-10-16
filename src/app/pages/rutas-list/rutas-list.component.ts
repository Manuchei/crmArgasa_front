import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../interfaces/iruta';
import { AuthService } from '../../services/auth.service';
import { AccionesInicioComponent } from '../../components/acciones-inicio/acciones-inicio.component';

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
  imports: [FormsModule, NgIf, NgFor, AccionesInicioComponent],
})
export class RutasListComponent implements OnInit {
  rutas: Ruta[] = [];
  rutasBase: Ruta[] = [];
  grouped: GrupoFecha[] = [];

  filtroEstado = '';
  filtroNombre = '';
  filtroFecha = '';

  cargando = false;
  error = '';
  openIndex: number | null = null;

  emailUsuario = '';
  esTransportista = false;
  puedeGestionar = false;

  constructor(
    private rutaService: RutaService,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.inicializarUsuario();
    this.inicializarFiltrosPorDefecto();
    this.cargarRutas();
  }

  private inicializarUsuario(): void {
    const usuario = this.authService.getUsuario();

    this.emailUsuario = (usuario?.email || '').trim().toLowerCase();

    this.esTransportista = this.authService.hasRole('TRANSPORTISTA');

    this.puedeGestionar = this.authService.hasRole(
      'USER',
      'ADMIN',
      'DEVELOPER',
    );
  }

  private inicializarFiltrosPorDefecto(): void {
    this.filtroFecha = this.toInputDate(new Date());
    this.filtroEstado = this.esTransportista ? 'pendiente' : '';
  }

  private toInputDate(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  toggle(i: number): void {
    this.openIndex = this.openIndex === i ? null : i;
  }

  cargarRutas(): void {
    this.cargando = true;
    this.error = '';
    this.openIndex = null;

    this.rutaService.getRutas().subscribe({
      next: (data) => {
        this.rutasBase = Array.isArray(data) ? data : [];
        this.aplicarFiltrosLocales();
        this.cargando = false;
      },
      error: (err) => {
        this.error = this.getErrorMessage(err, 'Error al cargar las rutas');

        this.rutasBase = [];
        this.aplicarFiltrosLocales();
        this.cargando = false;
      },
    });
  }

  aplicarFiltrosLocales(): void {
    let resultado = [...this.rutasBase];

    if (this.esTransportista) {
      resultado = resultado.filter((ruta) => {
        const emailRuta = String((ruta as any)?.emailTransportista || '')
          .trim()
          .toLowerCase();

        return !!this.emailUsuario && emailRuta === this.emailUsuario;
      });
    } else if (!this.puedeGestionar) {
      resultado = [];
    }

    if (this.filtroFecha) {
      resultado = resultado.filter(
        (ruta) => this.getFechaKey(ruta) === this.filtroFecha,
      );
    }

    if (this.filtroEstado) {
      resultado = resultado.filter((ruta) => ruta.estado === this.filtroEstado);
    }

    const texto = this.filtroNombre.trim().toLowerCase();

    if (texto) {
      resultado = resultado.filter((ruta: any) => {
        const campos = [
          ruta?.cliente?.nombreApellidos,
          ruta?.cliente?.nombreComercial,
          ruta?.nombreTransportista,
          ruta?.emailTransportista,
          ruta?.destino,
          ruta?.observaciones,
          ruta?.tarea,
        ];

        return campos.some((valor) =>
          String(valor || '')
            .toLowerCase()
            .includes(texto),
        );
      });
    }

    this.rutas = resultado;
    this.grouped = this.agruparRutas(resultado);
    this.openIndex = this.grouped.length ? 0 : null;
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
    this.filtroEstado = this.esTransportista ? 'pendiente' : '';
    this.filtroFecha = this.esTransportista ? this.toInputDate(new Date()) : '';

    this.aplicarFiltrosLocales();
  }

  nuevaRuta(): void {
    this.router.navigate(['/app/rutas/nueva']);
  }

  crearRutasDia(): void {
    this.router.navigate(['/app/rutas/dia']);
  }

  editarRuta(ruta: Ruta): void {
    if (ruta.id != null) {
      this.router.navigate(['/app/rutas/editar', ruta.id]);
    }
  }

  verRuta(id: number): void {
    this.router.navigate(['/app/rutas/ver', id]);
  }

  eliminarRuta(ruta: Ruta): void {
    if (!this.puedeGestionarTodo() || ruta.id == null) return;

    if (!confirm(`¿Seguro que quieres eliminar la ruta ${ruta.id}?`)) {
      return;
    }

    this.rutaService.eliminarRuta(ruta.id).subscribe({
      next: () => this.cargarRutas(),
      error: (err) => {
        alert(this.getErrorMessage(err, 'Error al eliminar la ruta'));
      },
    });
  }

  cerrarRuta(ruta: Ruta): void {
    if (ruta.id == null || ruta.estado === 'cerrada') return;

    if (!confirm(`¿Cerrar la ruta ${ruta.id}?`)) return;

    this.rutaService.cerrarRuta(ruta.id).subscribe({
      next: () => this.cargarRutas(),
      error: (err) => {
        alert(this.getErrorMessage(err, 'Error al cerrar la ruta'));
      },
    });
  }

  puedeGestionarTodo(): boolean {
    return this.puedeGestionar;
  }

  private getErrorMessage(err: any, fallback: string): string {
    if (typeof err?.error === 'string' && err.error.trim()) {
      return err.error;
    }

    if (typeof err?.error?.message === 'string' && err.error.message.trim()) {
      return err.error.message;
    }

    if (err?.status === 0) {
      return 'No se pudo contactar con el servidor.';
    }

    if (err?.status === 403) {
      return 'No tienes permiso para realizar esta operación.';
    }

    return fallback;
  }

  private getFechaKey(ruta: Ruta): string {
    const fecha = String(ruta?.fecha || '').trim();
    return fecha ? fecha.substring(0, 10) : 'Sin fecha';
  }

  private formatFechaLabel(fechaKey: string): string {
    const [year, month, day] = fechaKey.split('-');

    return year && month && day ? `${day}/${month}/${year}` : 'Sin fecha';
  }

  private agruparRutas(rutas: Ruta[]): GrupoFecha[] {
    const fechas = new Map<string, Map<string, GrupoTransportista>>();

    for (const ruta of rutas) {
      const fecha = this.getFechaKey(ruta);
      const nombre =
        String(ruta.nombreTransportista || '').trim() || 'Sin transportista';

      const email = String((ruta as any).emailTransportista || '').trim();

      const claveTransportista = email.toLowerCase() || nombre.toLowerCase();

      if (!fechas.has(fecha)) {
        fechas.set(fecha, new Map());
      }

      const transportistas = fechas.get(fecha)!;

      if (!transportistas.has(claveTransportista)) {
        transportistas.set(claveTransportista, {
          nombre,
          email: email || undefined,
          rutas: [],
        });
      }

      transportistas.get(claveTransportista)!.rutas.push(ruta);
    }

    return [...fechas.keys()]
      .sort((a, b) => b.localeCompare(a))
      .map((fechaKey) => {
        const transportistas = [...fechas.get(fechaKey)!.values()]
          .map((transportista) => ({
            ...transportista,
            rutas: [...transportista.rutas].sort(
              (a, b) => (a.id ?? 0) - (b.id ?? 0),
            ),
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre));

        return {
          fechaKey,
          fechaLabel: this.formatFechaLabel(fechaKey),
          transportistas,
          total: transportistas.reduce(
            (total, transportista) => total + transportista.rutas.length,
            0,
          ),
        };
      });
  }

  private nombreProductoFromLinea(linea: any): string {
    const producto = linea?.producto;

    if (producto?.codigo && producto?.nombre) {
      return `${producto.codigo} - ${producto.nombre}`;
    }

    if (producto?.nombre) return producto.nombre;
    if (linea?.nombreProducto) return linea.nombreProducto;
    if (linea?.productoId) return `Producto ${linea.productoId}`;

    return 'Producto';
  }

  getResumenEntrega(ruta: any, maxItems = 2): string | null {
    const lineas = ruta?.lineas;

    if (!Array.isArray(lineas) || !lineas.length) return null;

    const partes = lineas
      .slice(0, maxItems)
      .map(
        (linea: any) =>
          `${linea?.cantidad ?? 1}x ${this.nombreProductoFromLinea(linea)}`,
      );

    const extra =
      lineas.length > maxItems ? ` +${lineas.length - maxItems}` : '';

    return `📦 Entrega: ${partes.join(', ')}${extra}`;
  }

  getResumenTarea(ruta: any): string | null {
    const tarea = String(ruta?.tarea || '').trim();

    return tarea ? `🛠 Tarea: ${tarea}` : null;
  }

  getResumenPrincipal(ruta: any): string {
    return this.getResumenEntrega(ruta) || this.getResumenTarea(ruta) || '—';
  }

  getResumenSecundario(ruta: any): string | null {
    return this.getResumenEntrega(ruta) ? this.getResumenTarea(ruta) : null;
  }

  get rutasPendientes(): number {
    return this.rutas.filter((ruta) => ruta.estado === 'pendiente').length;
  }

  get rutasEnCurso(): number {
    return this.rutas.filter((ruta) => ruta.estado === 'en_curso').length;
  }

  get rutasCerradas(): number {
    return this.rutas.filter((ruta) => ruta.estado === 'cerrada').length;
  }

  nombreEstado(estado: string | null | undefined): string {
    switch (estado) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_curso':
        return 'En curso';
      case 'cerrada':
        return 'Cerrada';
      default:
        return estado || 'Sin estado';
    }
  }
}
