import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RutaService } from '../../services/ruta.service';
import { TransportistaService } from '../../services/transportista.service';
import { Itrasnportista } from '../../interfaces/itrasnportista';
import { HttpClient } from '@angular/common/http';
import { ClienteProductoService } from '../../services/cliente-producto.service';

interface IRutaLineaDto {
  productoId: number;
  cantidad: number;
}

@Component({
  selector: 'app-rutas-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgIf, NgFor],
  templateUrl: './rutas-form.component.html',
  styleUrls: ['./rutas-form.component.scss'],
})
export class RutasFormComponent implements OnInit {
  rutaForm!: FormGroup;
  lineaForm!: FormGroup;

  titulo = 'Nueva ruta';
  idRuta?: number;
  cargando = false;
  error = '';
  enviado = false;

  transportistas: Itrasnportista[] = [];

  // ✅ clientes
  clientes: any[] = [];
  private apiUrl = 'http://localhost:9018/api';

  // ✅ productos comprados del cliente
  // Backend devuelve: [{ productoId, codigo, nombre, cantidad }]
  clienteProductos: any[] = [];
  lineas: IRutaLineaDto[] = [];

  // ✅ producto seleccionado para calcular disponibles/max
  productoSeleccionado: any = null;

  constructor(
    private fb: FormBuilder,
    private rutaService: RutaService,
    private transportistaService: TransportistaService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private clienteProductoService: ClienteProductoService,
  ) {}

  ngOnInit(): void {
    this.rutaForm = this.fb.group({
      clienteId: [null, Validators.required],
      nombreTransportista: ['', Validators.required],
      emailTransportista: ['', [Validators.required, Validators.email]],
      fecha: ['', Validators.required],
      estado: ['pendiente', Validators.required],
      destino: ['', Validators.required],
      tarea: [''],
      observaciones: [''],
    });

    // ✅ formulario para añadir líneas
    this.lineaForm = this.fb.group({
      productoId: [null, Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
    });

    this.cargarClientes();
    this.cargarTransportistas();

    this.idRuta = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idRuta) {
      this.titulo = 'Editar ruta';
      this.cargarRuta(this.idRuta);
    }

    // ✅ Autocompletar destino + cargar productos cliente + reset líneas si cambia cliente
    this.rutaForm.get('clienteId')?.valueChanges.subscribe((id) => {
      this.autocompletarDestinoPorCliente(id);

      // reset selección producto
      this.productoSeleccionado = null;

      if (id) {
        this.lineas = [];
        this.lineaForm.reset({ productoId: null, cantidad: 1 });
        this.cargarProductosCliente(+id);
      } else {
        this.clienteProductos = [];
        this.lineas = [];
      }
    });
  }

  cargarClientes(): void {
    this.http.get<any[]>(`${this.apiUrl}/clientes`).subscribe({
      next: (data) => (this.clientes = data ?? []),
      error: (err) => console.error('Error cargando clientes', err),
    });
  }

  cargarTransportistas(): void {
    this.transportistaService.getAll().subscribe({
      next: (data) => (this.transportistas = data),
      error: (err) => console.error(err),
    });
  }

  onSelectTransportista(id: string): void {
    if (!id) return;

    const t = this.transportistas.find((x) => x.id === +id);
    if (!t) return;

    this.rutaForm.patchValue({
      nombreTransportista: t.nombre,
      emailTransportista: t.email,
    });
  }

  private autocompletarDestinoPorCliente(clienteId: any): void {
    if (!clienteId) return;

    const c = this.clientes.find((x) => x.id === +clienteId);
    if (!c) return;

    const destinoAuto =
      (c.direccionCompleta && String(c.direccionCompleta).trim()) ||
      this.buildDireccionCompleta(c);

    // ✅ si estás editando, no pisamos un destino ya escrito
    const destinoActual = (this.rutaForm.get('destino')?.value || '')
      .toString()
      .trim();
    if (this.idRuta && destinoActual) return;

    this.rutaForm.patchValue({ destino: destinoAuto });
  }

  private buildDireccionCompleta(c: any): string {
    const dir = (c.direccion || '').toString().trim();
    const cp = (c.codigoPostal ?? '').toString().trim();
    const pob = (c.poblacion || '').toString().trim();
    const prov = (c.provincia || '').toString().trim();

    const p1 = [dir].filter(Boolean).join('');
    const p2 = [cp, pob].filter(Boolean).join(' ');
    const p3 = prov ? `(${prov})` : '';

    return [p1, p2, p3].filter(Boolean).join(', ').trim();
  }

  // ✅ cargar productos COMPRADOS del cliente (DTO: productoId, codigo, nombre, cantidad)
  cargarProductosCliente(clienteId: number): void {
    this.clienteProductoService.getProductosCliente(clienteId).subscribe({
      next: (data) => {
        const lista = data ?? [];

        // ✅ evitar duplicados por productoId (por si el backend devolviera repetidos)
        const map = new Map<number, any>();

        for (const cp of lista) {
          const pid = +cp?.productoId;
          if (!pid) continue;

          if (!map.has(pid)) {
            map.set(pid, cp);
          } else {
            const existente = map.get(pid);
            const c1 = +(existente?.cantidad ?? 0);
            const c2 = +(cp?.cantidad ?? 0);
            existente.cantidad = c1 + c2;
            map.set(pid, existente);
          }
        }

        this.clienteProductos = Array.from(map.values());

        // si ya hay producto seleccionado, refrescamos referencia
        const pidSel = +this.lineaForm.value.productoId;
        this.productoSeleccionado =
          this.clienteProductos.find((x) => +x.productoId === pidSel) ?? null;

        // reajusta max y cantidad si hace falta
        this.ajustarCantidadSiExcedeDisponibles();
      },
      error: (err) => {
        console.error(err);
        this.clienteProductos = [];
        this.productoSeleccionado = null;
      },
    });
  }

  // ✅ cuando cambias el select de producto
  onProductoChange(): void {
    const productoId = +this.lineaForm.value.productoId;
    this.productoSeleccionado =
      this.clienteProductos.find((x) => +x.productoId === +productoId) ?? null;

    this.ajustarCantidadSiExcedeDisponibles();
  }

  // ✅ cuántas unidades de un producto ya están en la ruta
  getCantidadEnRuta(productoId: number): number {
    return this.lineas
      .filter((l) => +l.productoId === +productoId)
      .reduce((acc, l) => acc + (+l.cantidad || 0), 0);
  }

  // ✅ disponibles restantes (comprados - ya añadidos)
  getDisponibles(productoId: number): number {
    const cp = this.clienteProductos.find(
      (x) => +x?.productoId === +productoId,
    );
    const comprados = +(cp?.cantidad ?? 0);
    const ya = this.getCantidadEnRuta(productoId);
    return Math.max(comprados - ya, 0);
  }

  private ajustarCantidadSiExcedeDisponibles(): void {
    if (!this.productoSeleccionado) return;

    const pid = +this.productoSeleccionado.productoId;
    const disponibles = this.getDisponibles(pid);

    const actual = +this.lineaForm.value.cantidad || 1;
    if (actual > disponibles && disponibles > 0) {
      this.lineaForm.patchValue(
        { cantidad: disponibles },
        { emitEvent: false },
      );
    }
    if (disponibles === 0) {
      // dejamos 1 pero el botón estará deshabilitado
      this.lineaForm.patchValue({ cantidad: 1 }, { emitEvent: false });
    }
  }

  // ✅ añadir una línea (producto + cantidad) a la ruta
  addLinea(): void {
    this.error = '';
    this.lineaForm.markAllAsTouched();
    if (this.lineaForm.invalid) return;

    const productoId = +this.lineaForm.value.productoId;
    const cantidad = +this.lineaForm.value.cantidad;

    const disponibles = this.getDisponibles(productoId);

    // ✅ BLOQUEO: no permitir superar los comprados
    if (cantidad > disponibles) {
      const cp = this.clienteProductos.find(
        (x) => +x.productoId === +productoId,
      );
      const nombre = cp
        ? `${cp.codigo} - ${cp.nombre}`
        : `Producto ${productoId}`;
      this.error = `No puedes añadir ${cantidad}. Solo quedan ${disponibles} disponibles de ${nombre}.`;
      return;
    }

    const existente = this.lineas.find((l) => l.productoId === productoId);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      this.lineas.push({ productoId, cantidad });
    }

    // reset
    this.lineaForm.reset({ productoId: null, cantidad: 1 });
    this.productoSeleccionado = null;

    this.rutaForm
      .get('tarea')
      ?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  // ✅ quitar línea
  removeLinea(productoId: number): void {
    this.lineas = this.lineas.filter((l) => l.productoId !== productoId);

    // recalcular disponibles si ese producto estaba seleccionado
    if (
      this.productoSeleccionado &&
      +this.productoSeleccionado.productoId === +productoId
    ) {
      this.ajustarCantidadSiExcedeDisponibles();
    }

    this.rutaForm
      .get('tarea')
      ?.updateValueAndValidity({ onlySelf: true, emitEvent: false });
  }

  private tieneTarea(): boolean {
    const t = (this.rutaForm.get('tarea')?.value || '').toString().trim();
    return t.length > 0;
  }

  private tieneProductos(): boolean {
    return Array.isArray(this.lineas) && this.lineas.length > 0;
  }

  private validarTareaOProductos(): boolean {
    return this.tieneTarea() || this.tieneProductos();
  }

  // ✅ nombre de producto para la tabla
  getNombreProducto(productoId: number): string {
    const cp = this.clienteProductos.find(
      (x: any) => +x?.productoId === +productoId,
    );
    if (!cp) return `Producto ${productoId}`;
    return `${cp.codigo} - ${cp.nombre} (Comprados: ${cp.cantidad ?? 0})`;
  }

  cargarRuta(id: number): void {
    this.cargando = true;

    this.rutaService.getRuta(id).subscribe({
      next: (ruta: any) => {
        const fecha = ruta.fecha ? ruta.fecha.toString().substring(0, 10) : '';

        const clienteId = ruta?.cliente?.id ?? ruta?.clienteId ?? null;

        this.rutaForm.patchValue({
          clienteId,
          nombreTransportista: ruta.nombreTransportista,
          emailTransportista: ruta.emailTransportista,
          fecha,
          estado: ruta.estado,
          observaciones: ruta.observaciones,
          destino: ruta.destino,
          tarea: ruta.tarea,
        });

        // ✅ si tu backend devuelve lineas en GET /rutas/{id}
        if (Array.isArray(ruta?.lineas)) {
          this.lineas = ruta.lineas
            .map((l: any) => ({
              productoId: l?.producto?.id ?? l?.productoId,
              cantidad: l?.cantidad ?? 1,
            }))
            .filter((x: any) => x.productoId);
        }

        if (clienteId) this.cargarProductosCliente(+clienteId);

        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.error = 'Error al cargar la ruta';
        this.cargando = false;
      },
    });
  }

  onSubmit(): void {
    this.enviado = true;
    this.error = '';

    if (this.rutaForm.invalid) return;

    // ✅ regla: debe haber TAREA o PRODUCTOS (al menos uno)
    if (!this.validarTareaOProductos()) {
      this.error =
        'Debes indicar una tarea o añadir al menos un producto para entregar.';
      return;
    }

    const payload = {
      ...this.rutaForm.value,
      // ✅ si no hay tarea, enviamos '' (por si backend no acepta null)
      tarea: (this.rutaForm.value.tarea || '').toString().trim(),
      // ✅ si no hay productos, enviamos []
      lineas: this.lineas ?? [],
    };

    this.cargando = true;

    if (this.idRuta) {
      this.rutaService.actualizarRuta(this.idRuta, payload as any).subscribe({
        next: () => {
          this.cargando = false;
          alert('Ruta actualizada correctamente.');
          this.router.navigate(['/app/rutas']);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al actualizar la ruta';
          this.cargando = false;
        },
      });
    } else {
      this.rutaService.crearRuta(payload as any).subscribe({
        next: () => {
          this.cargando = false;
          alert('Ruta creada correctamente.');
          this.router.navigate(['/app/rutas']);
        },
        error: (err) => {
          console.error(err);
          this.error = 'Error al crear la ruta';
          this.cargando = false;
        },
      });
    }
  }

  volver(): void {
    this.router.navigate(['/app/rutas']);
  }

  get f() {
    return this.rutaForm.controls;
  }

  get lf() {
    return this.lineaForm.controls;
  }
}
