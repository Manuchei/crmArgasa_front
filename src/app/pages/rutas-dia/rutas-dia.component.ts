import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { RutaService } from '../../services/ruta.service';
import { ClientesService } from '../../services/cliente.service';
import { EmpresaService } from '../../services/empresa.service';
import { ProductoServiceService } from './../../services/producto-service.service';
import { TransportistaService } from '../../services/transportista.service';
import { Itrasnportista } from '../../interfaces/itrasnportista';

import { RutaDiaRequestDTO } from '../../interfaces/iruta-dia';

@Component({
  selector: 'app-rutas-dia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rutas-dia.component.html',
  styleUrls: ['./rutas-dia.component.css'],
})
export class RutasDiaComponent implements OnInit {
  private readonly RUTAS_LISTADO_URL = '/rutas';

  fecha = '';
  transportista = '';
  emailTransportista = '';
  estado = 'pendiente';

  clientes: any[] = [];
  rutas: any[] = [this.nuevaFila()];
  transportistas: Itrasnportista[] = [];
  transportistaId: number | null = null;

  constructor(
    private router: Router,
    private rutaService: RutaService,
    private clientesService: ClientesService,
    private productoService: ProductoServiceService,
    private empresaService: EmpresaService,
    private transportistaService: TransportistaService,
  ) {}

  ngOnInit(): void {
    this.cargarClientes();
    this.cargarTransportistas();
  }

  volverAListado(): void {
    this.router.navigate(['/app/rutas']);
  }

  private nuevaFila(): any {
    return {
      clienteId: null,
      tarea: '',
      observaciones: '',
      productos: [],
      productosCliente: [],
      productoSel: null,
      cantidadSel: 1,
    };
  }

  getNombreCliente(c: any): string {
    if (!c) return '';

    const preferidos = [
      'nombre',
      'razonSocial',
      'nombreComercial',
      'denominacion',
      'descripcion',
      'cliente',
      'empresa',
      'contacto',
      'personaContacto',
      'apellidos',
      'nombreApellidos',
      'nombre_apellidos',
    ];

    for (const k of preferidos) {
      const v = c?.[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }

    return c?.id != null ? `ID ${c.id}` : '';
  }

  private getEmpresaSeleccionada(): 'ARGASA' | 'ELECTROLUGA' {
    const emp = (localStorage.getItem('empresa_activa') || 'ARGASA')
      .toUpperCase()
      .trim();

    return emp === 'ELECTROLUGA' ? 'ELECTROLUGA' : 'ARGASA';
  }

  cargarClientes(): void {
    this.clientesService.getClientes().subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.content ?? []);
        this.clientes = data;
      },
      error: (err: any) => console.error('Error clientes', err),
    });
  }

  cargarTransportistas(): void {
    const empresa = this.getEmpresaSeleccionada();

    this.transportistaService.getAll().subscribe({
      next: (data) => {
        this.transportistas = (data ?? []).filter((t) => t.empresa === empresa);
      },
      error: (err) => console.error('Error transportistas', err),
    });
  }

  onTransportistaChange(): void {
    if (!this.transportistaId) {
      this.transportista = '';
      this.emailTransportista = '';
      return;
    }

    const t = this.transportistas.find(
      (x) => x.id === Number(this.transportistaId),
    );
    if (!t) return;

    this.transportista = t.nombre;
    this.emailTransportista = t.email;
  }

  onClienteChange(i: number): void {
    const r = this.rutas[i];

    r.productoSel = null;
    r.cantidadSel = 1;
    r.productos = [];
    r.productosCliente = [];

    if (!r.clienteId) return;

    const empresa = this.getEmpresaSeleccionada();
    const clienteId = Number(r.clienteId);

    this.clientesService.getProductosCliente(clienteId, empresa).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res?.content ?? []);

        const normalizados = data
          .map((x: any) => {
            const prod = x?.producto ?? x;

            const id =
              prod?.id ??
              prod?.productoId ??
              x?.productoId ??
              x?.producto?.id ??
              null;

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

            if (!id || pendiente <= 0) return null;

            return {
              id: Number(id),
              codigo: (codigo ?? '').toString(),
              nombre: (nombre ?? '').toString(),
              stock: Math.max(pendiente, 0),
            };
          })
          .filter(Boolean);

        r.productosCliente = normalizados;
      },
      error: (err: any) => {
        console.error('Error productos cliente', err);
        r.productosCliente = [];
      },
    });
  }

  addFila(): void {
    this.rutas.push(this.nuevaFila());
  }

  removeFila(i: number): void {
    this.rutas.splice(i, 1);
    if (this.rutas.length === 0) this.rutas.push(this.nuevaFila());
  }

  private getStockProductoPendiente(productoId: number): number {
    for (const r of this.rutas) {
      const p = (r.productosCliente ?? []).find(
        (x: any) => Number(x.id) === Number(productoId),
      );
      if (p && p.stock != null) return Number(p.stock) || 0;
    }
    return 0;
  }

  private getReservadoFormulario(productoId: number): number {
    let total = 0;
    for (const r of this.rutas) {
      for (const it of r.productos ?? []) {
        if (Number(it.producto) === Number(productoId)) {
          total += Number(it.cantidad ?? 0);
        }
      }
    }
    return total;
  }

  getStockDisponibleFormulario(productoId: number): number {
    const stock = this.getStockProductoPendiente(productoId);
    const reservado = this.getReservadoFormulario(productoId);
    return Math.max(stock - reservado, 0);
  }

  getStockDisponibleSeleccion(i: number): number {
    const r = this.rutas[i];
    const prodId = Number(r.productoSel);
    if (!prodId) return 0;
    return this.getStockDisponibleFormulario(prodId);
  }

  canAddProducto(i: number): boolean {
    const r = this.rutas[i];
    const prodId = Number(r.productoSel);
    const cant = Number(r.cantidadSel ?? 0);

    if (!r.clienteId) return false;
    if (!prodId || isNaN(prodId)) return false;
    if (!cant || isNaN(cant) || cant <= 0) return false;

    const disp = this.getStockDisponibleFormulario(prodId);
    return cant <= disp;
  }

  addProducto(i: number): void {
    const r = this.rutas[i];
    if (!this.canAddProducto(i)) return;

    const prodId = Number(r.productoSel);
    const cant = Number(r.cantidadSel ?? 1);

    if (!Array.isArray(r.productos)) r.productos = [];
    r.productos.push({ producto: prodId, cantidad: cant });

    r.productoSel = null;
    r.cantidadSel = 1;
  }

  removeProducto(i: number, j: number): void {
    this.rutas[i].productos.splice(j, 1);
  }

  getNombreProductoFila(i: number, id: number): string {
    const r = this.rutas[i];
    const p = (r.productosCliente ?? []).find(
      (x: any) => Number(x.id) === Number(id),
    );

    if (!p) return `Producto ${id}`;

    return `${p.codigo ? p.codigo + ' - ' : ''}${p.nombre}`;
  }

  guardarTodas(): void {
    const empresa = this.getEmpresaSeleccionada();

    const payload: RutaDiaRequestDTO = {
      fecha: this.fecha,
      transportistaId: this.transportistaId,
      nombreTransportista: this.transportista,
      emailTransportista: this.emailTransportista,
      estado: this.estado,
      empresa,
      rutas: this.rutas
        .filter((r: any) => !!r.clienteId)
        .map((r: any) => ({
          clienteId: Number(r.clienteId),
          tarea: r.tarea,
          observaciones: r.observaciones,
          estado: this.estado,
          empresa,
          productos: r.productos,
        })),
    };

    if (!payload.fecha || !payload.transportistaId) return;

    this.rutaService.crearRutasDia(payload).subscribe({
      next: () => {
        alert('Rutas guardadas correctamente');
        this.rutas = [this.nuevaFila()];
        this.transportistaId = null;
        this.transportista = '';
        this.emailTransportista = '';
        this.router.navigate(['/app/rutas']);
      },
      error: (err: any) => {
        console.error(err);
        alert(err?.error?.message ?? 'Error guardando rutas');
      },
    });
  }
}
