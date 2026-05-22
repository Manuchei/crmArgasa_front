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
import { ClientesService } from '../../services/cliente.service';
import { environment } from '../../../environments/environment';

interface IRutaLineaDto {
  productoId: number;
  cantidad: number;
}

interface IProductoPendienteUI {
  productoId: number;
  codigo?: string;
  nombre: string;
  pendiente: number;
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
  clientes: any[] = [];
  private apiUrl = environment.apiUrl;

  clienteProductos: IProductoPendienteUI[] = [];
  lineas: IRutaLineaDto[] = [];
  productoSeleccionado: IProductoPendienteUI | null = null;

  constructor(
    private fb: FormBuilder,
    private rutaService: RutaService,
    private transportistaService: TransportistaService,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private clientesService: ClientesService,
  ) {}

  ngOnInit(): void {
    this.rutaForm = this.fb.group({
      clienteId: [null, Validators.required],
      transportistaId: [null],
      nombreTransportista: ['', Validators.required],
      emailTransportista: ['', [Validators.required, Validators.email]],
      fecha: ['', Validators.required],
      estado: ['pendiente', Validators.required],
      acompanante1: [''],
      acompanante2: [''],
      destino: [''],
      tarea: [''],
      observaciones: [''],
    });

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

    this.rutaForm.get('clienteId')?.valueChanges.subscribe((id) => {
      this.productoSeleccionado = null;
      this.lineas = [];
      this.lineaForm.reset({ productoId: null, cantidad: 1 });

      if (id) {
        this.cargarProductosPendientesCliente(+id);
      } else {
        this.clienteProductos = [];
        this.actualizarValidadorCantidad();
      }
    });

    this.lineaForm.get('productoId')?.valueChanges.subscribe(() => {
      this.onProductoChange();
    });

    this.rutaForm.get('transportistaId')?.valueChanges.subscribe((id) => {
      this.onSelectTransportista(id);
    });
  }

  cargarClientes(): void {
    this.http.get<any[]>(`${this.apiUrl}/clientes`).subscribe({
      next: (data) => (this.clientes = data ?? []),
      error: (err) => console.error('Error cargando clientes', err),
    });
  }

  cargarTransportistas(): void {
    const empresa = this.getEmpresaSeleccionada();

    this.transportistaService.getAll().subscribe({
      next: (data) => {
        this.transportistas = (data ?? []).filter((t) => t.empresa === empresa);
      },
      error: (err) => console.error(err),
    });
  }

  onSelectTransportista(id: any): void {
    if (!id) {
      this.rutaForm.patchValue({
        nombreTransportista: '',
        emailTransportista: '',
      });
      return;
    }

    const t = this.transportistas.find((x) => x.id === +id);
    if (!t) return;

    this.rutaForm.patchValue({
      nombreTransportista: t.nombre,
      emailTransportista: t.email,
    });
  }

  private getEmpresaSeleccionada(): 'ARGASA' | 'ELECTROLUGA' {
    const emp = (localStorage.getItem('empresa_activa') || 'ARGASA')
      .toUpperCase()
      .trim();
    return emp === 'ELECTROLUGA' ? 'ELECTROLUGA' : 'ARGASA';
  }

  private esEntregado(x: any): boolean {
    const entregado =
      x?.entregado ??
      x?.isEntregado ??
      x?.entregadoBool ??
      x?.entregaRealizada ??
      null;

    if (typeof entregado === 'boolean') return entregado;

    if (typeof entregado === 'string') {
      const v = entregado.toLowerCase().trim();
      if (v === 'si' || v === 'sí' || v === 'true' || v === 'entregado')
        return true;
      if (v === 'no' || v === 'false' || v === 'pendiente') return false;
    }

    const estado = (x?.estado ?? '').toString().toLowerCase().trim();
    if (
      estado === 'entregado' ||
      estado === 'entregada' ||
      estado === 'entregados'
    )
      return true;

    const fechaEntrega =
      x?.fechaEntrega ?? x?.fecha_entrega ?? x?.fechaDeEntrega;
    if (fechaEntrega != null && String(fechaEntrega).trim() !== '') return true;

    return false;
  }

  private unidadesDeLinea(x: any): number {
    const u =
      x?.unidades ??
      x?.cantidad ??
      x?.cantidadTotal ??
      x?.total ??
      x?.asignado ??
      1;
    const n = Number(u);
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  cargarProductosPendientesCliente(clienteId: number): void {
    const empresa = this.getEmpresaSeleccionada();

    this.clientesService
      .getProductosCliente(clienteId, empresa, this.idRuta ?? null)
      .subscribe({
        next: (res: any) => {
          const lista: any[] = Array.isArray(res)
            ? res
            : Array.isArray(res?.content)
              ? res.content
              : [];

          const map = new Map<number, IProductoPendienteUI>();

          for (const x of lista) {
            const prod = x?.producto ?? x;

            const productoId =
              prod?.id ??
              prod?.productoId ??
              x?.productoId ??
              x?.producto?.id ??
              null;

            if (!productoId) continue;

            const nombre =
              prod?.nombre ??
              prod?.descripcion ??
              x?.nombre ??
              x?.descripcion ??
              '';

            const codigo = prod?.codigo ?? x?.codigo ?? '';

            const total = Number(
              x?.cantidadTotal ?? x?.total ?? x?.asignado ?? x?.cantidad ?? 0,
            );

            const entregada = Number(
              x?.cantidadEntregada ?? x?.entregada ?? x?.cantidadEntregado ?? 0,
            );

            const pendienteBackend =
              x?.pendiente ?? x?.pendienteReal ?? x?.cantidadPendiente;

            let pendiente = 0;

            if (pendienteBackend != null && pendienteBackend !== '') {
              pendiente = Number(pendienteBackend) || 0;
            } else {
              pendiente = (Number(total) || 0) - (Number(entregada) || 0);
            }

            pendiente = Math.max(pendiente, 0);
            if (pendiente <= 0) continue;

            const pid = Number(productoId);

            if (!map.has(pid)) {
              map.set(pid, {
                productoId: pid,
                codigo: (codigo ?? '').toString(),
                nombre: (nombre ?? '').toString(),
                pendiente,
              });
            } else {
              const cur = map.get(pid)!;
              cur.pendiente = (cur.pendiente || 0) + pendiente;
              map.set(pid, cur);
            }
          }

          this.clienteProductos = Array.from(map.values()).filter(
            (p) => (p.pendiente ?? 0) > 0,
          );

          const pidSel = +this.lineaForm.value.productoId;
          this.productoSeleccionado =
            this.clienteProductos.find((x) => +x.productoId === pidSel) ?? null;

          if (pidSel && !this.productoSeleccionado) {
            this.lineaForm.patchValue(
              { productoId: null },
              { emitEvent: false },
            );
          }

          this.actualizarValidadorCantidad();
        },
        error: (err: any) => {
          console.error(err);
          this.clienteProductos = [];
          this.productoSeleccionado = null;
          this.actualizarValidadorCantidad();
        },
      });
  }

  onProductoChange(): void {
    const productoId = +this.lineaForm.value.productoId;
    this.productoSeleccionado =
      this.clienteProductos.find((x) => +x.productoId === +productoId) ?? null;

    this.actualizarValidadorCantidad();
  }

  getCantidadEnRuta(productoId: number): number {
    return this.lineas
      .filter((l) => +l.productoId === +productoId)
      .reduce((acc, l) => acc + (+l.cantidad || 0), 0);
  }

  getDisponibles(productoId: number): number {
    const cp = this.clienteProductos.find(
      (x) => +x?.productoId === +productoId,
    );
    const pendiente = +(cp?.pendiente ?? 0);
    const ya = this.getCantidadEnRuta(productoId);
    return Math.max(pendiente - ya, 0);
  }

  private actualizarValidadorCantidad(): void {
    const ctrl = this.lineaForm.get('cantidad');
    if (!ctrl) return;

    ctrl.setValidators([Validators.required, Validators.min(1)]);
    ctrl.updateValueAndValidity({ emitEvent: false });
  }

  addLinea(): void {
    this.error = '';
    this.lineaForm.markAllAsTouched();
    if (this.lineaForm.invalid) return;

    const productoId = +this.lineaForm.value.productoId;
    const cantidad = +this.lineaForm.value.cantidad;

    const disponibles = this.getDisponibles(productoId);

    if (cantidad > disponibles) {
      const cp = this.clienteProductos.find(
        (x) => +x.productoId === +productoId,
      );
      const nombre = cp
        ? `${cp.codigo ? cp.codigo + ' - ' : ''}${cp.nombre}`
        : `Producto ${productoId}`;
      this.error = `No puedes añadir ${cantidad}. Solo quedan ${disponibles} pendientes de ${nombre}.`;
      return;
    }

    const existente = this.lineas.find((l) => l.productoId === productoId);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      this.lineas.push({ productoId, cantidad });
    }

    this.lineaForm.reset({ productoId: null, cantidad: 1 });
    this.productoSeleccionado = null;

    this.actualizarValidadorCantidad();
  }

  removeLinea(productoId: number): void {
    this.lineas = this.lineas.filter((l) => l.productoId !== productoId);
    this.actualizarValidadorCantidad();
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

  getNombreProducto(productoId: number): string {
    const cp = this.clienteProductos.find(
      (x) => +x?.productoId === +productoId,
    );
    if (!cp) return `Producto ${productoId}`;
    return `${cp.codigo ? cp.codigo + ' - ' : ''}${cp.nombre} (Pendiente: ${cp.pendiente})`;
  }

  cargarRuta(id: number): void {
    this.cargando = true;

    this.rutaService.getRuta(id).subscribe({
      next: (ruta: any) => {
        const fecha = ruta.fecha ? ruta.fecha.toString().substring(0, 10) : '';
        const clienteId = ruta?.cliente?.id ?? ruta?.clienteId ?? null;
        const transportistaId =
          ruta?.transportista?.id ?? ruta?.transportistaId ?? null;

        this.rutaForm.patchValue({
          clienteId,
          transportistaId,
          nombreTransportista: ruta.nombreTransportista,
          emailTransportista: ruta.emailTransportista,

          acompanante1: ruta.acompanante1 || '',
          acompanante2: ruta.acompanante2 || '',
          fecha,
          estado: ruta.estado,
          observaciones: ruta.observaciones,
          destino: ruta.destino ?? '',
          tarea: ruta.tarea ?? '',
        });

        if (Array.isArray(ruta?.lineas)) {
          this.lineas = ruta.lineas
            .map((l: any) => ({
              productoId: l?.producto?.id ?? l?.productoId,
              cantidad: l?.cantidad ?? 1,
            }))
            .filter((x: any) => x.productoId);
        }

        if (clienteId) this.cargarProductosPendientesCliente(+clienteId);

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

    if (!this.validarTareaOProductos()) {
      this.error =
        'Debes indicar una tarea o añadir al menos un producto para entregar.';
      return;
    }

    const formValue = this.rutaForm.value;

    const payload = {
      clienteId: this.rutaForm.value.clienteId,
      transportistaId: this.rutaForm.value.transportistaId,

      emailTransportista: this.rutaForm.value.emailTransportista,

      acompanante1: this.rutaForm.value.acompanante1,
      acompanante2: this.rutaForm.value.acompanante2,

      fecha: this.rutaForm.value.fecha,
      estado: this.rutaForm.value.estado,
      destino: this.rutaForm.value.destino,
      tarea: this.rutaForm.value.tarea,
      observaciones: this.rutaForm.value.observaciones,
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
