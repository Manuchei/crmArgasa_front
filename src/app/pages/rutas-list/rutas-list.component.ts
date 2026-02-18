import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RutaService } from '../../services/ruta.service';
import { Ruta } from '../../interfaces/iruta';
import { FormsModule } from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';

interface GrupoTransportista {
  nombre: string;
  email?: string;
  rutas: Ruta[];
}

interface GrupoFecha {
  fechaKey: string; // "2026-01-30"
  fechaLabel: string; // "30/01/2026"
  transportistas: GrupoTransportista[];
  total: number;
}

@Component({
  selector: 'app-rutas-list',
  standalone: true,
  templateUrl: './rutas-list.component.html',
  imports: [FormsModule, NgIf, NgFor],
  styleUrls: ['./rutas-list.component.scss'],
})
export class RutasListComponent implements OnInit {
  rutas: Ruta[] = [];
  grouped: GrupoFecha[] = [];

  filtroEstado: string = '';
  filtroNombre: string = '';
  filtroFecha: string = '';

  cargando = false;
  error = '';

  // acordeón manual (sin JS de Bootstrap)
  openIndex: number | null = null;

  constructor(
    private rutaService: RutaService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.cargarRutas();
  }

  // -----------------------------
  // ACORDEÓN MANUAL
  // -----------------------------
  toggle(i: number): void {
    this.openIndex = this.openIndex === i ? null : i;
  }

  // -----------------------------
  // SET
  // -----------------------------
  private setRutas(rutas: Ruta[]): void {
    this.rutas = rutas ?? [];
    this.grouped = this.agruparRutas(this.rutas);

    // opcional: abrir el primer grupo automáticamente
    if (this.grouped.length > 0 && this.openIndex === null) {
      this.openIndex = 0;
    }
  }

  // -----------------------------
  // CARGA
  // -----------------------------
  cargarRutas(): void {
    this.cargando = true;
    this.error = '';

    this.rutaService.getRutas().subscribe({
      next: (data) => {
        this.setRutas(data);
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar las rutas';
        this.cargando = false;
      },
    });
  }

  // -----------------------------
  // FILTROS (uno activo cada vez)
  // -----------------------------
  filtrarNombre(): void {
    if (!this.filtroNombre || this.filtroNombre.trim() === '') {
      this.cargarRutas();
      return;
    }

    this.cargando = true;
    this.rutaService.filtrarPorTransportista(this.filtroNombre).subscribe({
      next: (r) => {
        this.setRutas(r);
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al filtrar por transportista';
        this.cargando = false;
      },
    });
  }

  filtrarEstado(): void {
    if (!this.filtroEstado) {
      this.cargarRutas();
      return;
    }

    this.cargando = true;
    this.rutaService.filtrarPorEstado(this.filtroEstado).subscribe({
      next: (r) => {
        this.setRutas(r);
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al filtrar por estado';
        this.cargando = false;
      },
    });
  }

  filtrarFecha(): void {
    if (!this.filtroFecha) {
      this.cargarRutas();
      return;
    }

    this.cargando = true;
    this.rutaService.filtrarPorFecha(this.filtroFecha).subscribe({
      next: (r) => {
        this.setRutas(r);
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al filtrar por fecha';
        this.cargando = false;
      },
    });
  }

  // -----------------------------
  // NAVEGACIÓN
  // -----------------------------
  nuevaRuta(): void {
    this.router.navigate(['/app/rutas/nueva']);
  }

  crearRutasDia(): void {
    this.router.navigate(['/app/rutas/dia']);
  }

  editarRuta(ruta: Ruta): void {
    if (ruta.id) {
      this.router.navigate(['/app/rutas/editar', ruta.id]);
    }
  }

  // -----------------------------
  // ACCIONES
  // -----------------------------
  eliminarRuta(ruta: Ruta): void {
    if (!ruta.id) return;
    if (confirm(`¿Seguro que quieres eliminar la ruta ${ruta.id}?`)) {
      this.rutaService.eliminarRuta(ruta.id).subscribe({
        next: () => this.cargarRutas(),
        error: (err) => {
          console.error(err);
          alert('Error al eliminar la ruta');
        },
      });
    }
  }

  cerrarRuta(ruta: Ruta): void {
    if (!ruta.id) return;
    if (confirm(`¿Cerrar la ruta ${ruta.id}?`)) {
      this.rutaService.cerrarRuta(ruta.id).subscribe({
        next: () => this.cargarRutas(),
        error: (err) => {
          console.error(err);
          alert('Error al cerrar la ruta');
        },
      });
    }
  }

  // -----------------------------
  // HELPERS (fecha/estado)
  // -----------------------------
  private formatFechaLabel(fechaKey: string): string {
    // "2026-01-30" -> "30/01/2026"
    const [y, m, d] = (fechaKey || '').split('-');
    if (!y || !m || !d) return fechaKey;
    return `${d}/${m}/${y}`;
  }

  private getFechaKey(r: Ruta): string {
    // "2026-01-30" o "2026-01-30T00:00:00"
    return (r.fecha || '').toString().substring(0, 10);
  }

  private getTransportistaKey(r: Ruta): string {
    return (r.nombreTransportista || 'Sin transportista').toString().trim();
  }

  private getTransportistaEmail(r: Ruta): string | undefined {
    return r.emailTransportista || undefined;
  }

  // -----------------------------
  // AGRUPACIÓN
  // -----------------------------
  private agruparRutas(rutas: Ruta[]): GrupoFecha[] {
    const mapFecha = new Map<string, Map<string, GrupoTransportista>>();

    for (const r of rutas) {
      const fechaKey = this.getFechaKey(r);
      const tKey = this.getTransportistaKey(r);

      if (!mapFecha.has(fechaKey)) mapFecha.set(fechaKey, new Map());
      const mapT = mapFecha.get(fechaKey)!;

      if (!mapT.has(tKey)) {
        mapT.set(tKey, {
          nombre: tKey,
          email: this.getTransportistaEmail(r),
          rutas: [],
        });
      }
      mapT.get(tKey)!.rutas.push(r);
    }

    // fechas desc
    const fechas = Array.from(mapFecha.keys()).sort((a, b) =>
      b.localeCompare(a),
    );

    return fechas.map((fechaKey) => {
      const transportistasMap = mapFecha.get(fechaKey)!;

      const transportistas = Array.from(transportistasMap.values())
        .map((t) => ({
          ...t,
          rutas: t.rutas.sort((a, b) => (a.id ?? 0) - (b.id ?? 0)),
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

  // --- Helpers para mostrar tarea/entrega en el listado ---

private nombreProductoFromLinea(linea: any): string {
  // soporta linea.producto.nombre / linea.productoId / linea.nombreProducto si lo tuvieras
  const p = linea?.producto;
  if (p?.nombre) return p.nombre;
  if (p?.codigo && p?.nombre) return `${p.codigo} - ${p.nombre}`;
  if (linea?.nombreProducto) return linea.nombreProducto;
  if (linea?.productoId) return `Producto ${linea.productoId}`;
  return 'Producto';
}

getResumenEntrega(ruta: any, maxItems: number = 2): string | null {
  const lineas = ruta?.lineas;
  if (!Array.isArray(lineas) || lineas.length === 0) return null;

  const parts = lineas
    .slice(0, maxItems)
    .map((l: any) => `${l?.cantidad ?? 1}x ${this.nombreProductoFromLinea(l)}`);

  const extra = lineas.length > maxItems ? ` +${lineas.length - maxItems}` : '';
  return `📦 Entrega: ${parts.join(', ')}${extra}`;
}

getResumenTarea(ruta: any): string | null {
  const t = (ruta?.tarea ?? '').toString().trim();
  if (!t) return null;
  return `🛠 Tarea: ${t}`;
}

// Para el "chip" principal (1 línea). Prioriza entrega si existe.
getResumenPrincipal(ruta: any): string {
  const entrega = this.getResumenEntrega(ruta, 2);
  const tarea = this.getResumenTarea(ruta);

  // si hay entrega, esa es la principal
  if (entrega) return entrega;

  // si no hay entrega pero sí tarea
  if (tarea) return tarea;

  return '—';
}

// Para mostrar una segunda línea (solo si hay ambas)
getResumenSecundario(ruta: any): string | null {
  const entrega = this.getResumenEntrega(ruta, 2);
  const tarea = this.getResumenTarea(ruta);

  // si hay ambas, ponemos la tarea como secundaria
  if (entrega && tarea) return tarea;

  return null;
}


  verRuta(id: number): void {
    this.router.navigate(['/app/rutas/ver', id]);
  }
}
