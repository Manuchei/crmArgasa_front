import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cliente-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './cliente-detalle.component.html',
  styleUrls: ['./cliente-detalle.component.css'],
})
export class ClienteDetalleComponent implements OnInit {
  cliente: any;
  trabajos: any[] = [];
  albaranes: any[] = [];
  pagos: any[] = [];

  nuevoTrabajo = {
    descripcion: '',
    importe: 0,
    importePagado: 0,
    pagado: false,
  };

  nuevoPago = {
    fecha: ClienteDetalleComponent.hoyISO(),
    importe: 0,
    metodo: '',
    observaciones: '',
  };
  creandoPago = false;

  creandoAlbaranEmpresa: string | null = null;

  private apiUrl = 'http://localhost:9018/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  // ---------- helpers ----------
  private static toNumber(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
  }

  private static safeText(v: any): string {
    return v == null ? '' : String(v);
  }

  private static safeTrim(v: any): string {
    return ClienteDetalleComponent.safeText(v).trim();
  }

  private static isValidISODate(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }

  private static hoyISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private hoyISO(): string {
    return ClienteDetalleComponent.hoyISO();
  }

  volverAClientes(): void {
    this.router.navigate(['/app/clientes']);
  }

  verAlbaran(a: any): void {
  if (!a?.id) return;

  // ✅ Guardar empresa del albarán como empresa seleccionada
  // Cambia la clave si tú usas otra (ej: 'empresaSeleccionada')
  if (a?.empresa) {
    localStorage.setItem('empresa', String(a.empresa));
  }

  // ✅ Navegar al detalle
  this.router.navigate(['/app/albaranes', a.id]);
}


  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (isNaN(id)) {
      alert('ID inválido');
      this.router.navigate(['/clientes']);
      return;
    }

    this.cargarCliente(id);
    this.cargarTrabajos(id);
    this.cargarAlbaranes(id);
    this.cargarPagos(id);
  }

  // ---------------- CLIENTE ----------------
  cargarCliente(id: number): void {
    this.http.get(`${this.apiUrl}/clientes/${id}`).subscribe({
      next: (data: any) => {
        this.cliente = data;
        this.calcularTotales();
      },
      error: (err) => console.error('Error al cargar cliente:', err),
    });
  }

  // ---------------- TRABAJOS ----------------
  cargarTrabajos(clienteId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/trabajos/cliente/${clienteId}`).subscribe({
      next: (data) => {
        this.trabajos = data ?? [];
        this.calcularTotales(); // ✅ recalcula total/pagado/saldo
      },
      error: (err) => console.error('Error al cargar trabajos:', err),
    });
  }

  agregarTrabajo(): void {
    if (!this.cliente?.id) return;

    const desc = ClienteDetalleComponent.safeTrim(this.nuevoTrabajo.descripcion);
    const importe = ClienteDetalleComponent.toNumber(this.nuevoTrabajo.importe);
    const pagadoInicial = ClienteDetalleComponent.toNumber(this.nuevoTrabajo.importePagado);

    if (!desc || importe <= 0) {
      alert('Debes introducir una descripción y un importe válido.');
      return;
    }

    const trabajoAEnviar = {
      descripcion: desc,
      importe,
      // ✅ Puede venir un primer pago aquí (se contará en totales)
      importePagado: pagadoInicial,
      pagado: false,
    };

    this.http.post(`${this.apiUrl}/trabajos/cliente/${this.cliente.id}`, trabajoAEnviar).subscribe({
      next: () => {
        this.cargarTrabajos(this.cliente.id);
        this.nuevoTrabajo = { descripcion: '', importe: 0, importePagado: 0, pagado: false };
      },
      error: (err) => console.error('Error al agregar trabajo:', err),
    });
  }

  eliminarTrabajo(id: number): void {
    if (!this.cliente?.id) return;

    if (confirm('¿Seguro que deseas eliminar este trabajo?')) {
      this.http.delete(`${this.apiUrl}/trabajos/${id}`).subscribe({
        next: () => this.cargarTrabajos(this.cliente.id),
        error: (err) => console.error('Error al eliminar trabajo:', err),
      });
    }
  }

  // ---------------- ALBARANES ----------------
cargarAlbaranes(clienteId: number): void {
  // ✅ GET /api/albaranes?clienteId=...
  this.http.get<any[]>(`${this.apiUrl}/albaranes`, { params: { clienteId } as any }).subscribe({
    next: (data) => (this.albaranes = data ?? []),
    error: (err) => console.error('Error al cargar albaranes:', err),
  });
}



// ✅ Un solo albarán (empresa la decide el backend por el cliente/tenant)
crearAlbaran(): void {
  if (!this.cliente?.id) return;
      this.router.navigate(['/app/clientes']);

  // opcional: bloquear botón mientras crea
  this.creandoPago = true; // si NO quieres añadir una variable nueva, reutilizo esta
  // mejor sería: creandoAlbaran = true; pero así no toco más

  // ✅ POST /api/albaranes/clientes/{clienteId} (SIN ?empresa)
  this.http.post<any>(`${this.apiUrl}/albaranes/clientes/${this.cliente.id}`, {}).subscribe({
    next: (albaran) => {
      this.creandoPago = false;

      if (!albaran?.id) {
        alert('No se pudo crear el albarán.');
        return;
      }

      this.cargarAlbaranes(this.cliente.id);
      this.router.navigate(['/app/albaranes', albaran.id]);
    },
    error: (err) => {
      this.creandoPago = false;
      console.error('Error creando albarán:', err);
      alert('No se pudo crear el albarán.');
    },
  });
}



  // ---------------- PAGOS (HISTORIAL) ----------------
  cargarPagos(clienteId: number): void {
    this.http.get<any[]>(`${this.apiUrl}/pagos/cliente/${clienteId}`).subscribe({
      next: (data) => {
        this.pagos = data ?? [];
        this.calcularTotales(); // ✅ recalcula total/pagado/saldo
      },
      error: (err) => console.error('Error al cargar pagos:', err),
    });
  }

  agregarPago(): void {
    if (!this.cliente?.id) return;

    const fecha = ClienteDetalleComponent.safeTrim(this.nuevoPago.fecha);
    const importe = ClienteDetalleComponent.toNumber(this.nuevoPago.importe);
    const metodo = ClienteDetalleComponent.safeTrim(this.nuevoPago.metodo);
    const observaciones = ClienteDetalleComponent.safeTrim(this.nuevoPago.observaciones);

    if (!ClienteDetalleComponent.isValidISODate(fecha)) {
      alert('Fecha inválida.');
      return;
    }
    if (importe <= 0) {
      alert('El importe del pago debe ser mayor que 0.');
      return;
    }

    this.creandoPago = true;

    const payload = { fecha, importe, metodo, observaciones };

    this.http.post<any>(`${this.apiUrl}/pagos/cliente/${this.cliente.id}`, payload).subscribe({
      next: (pagoCreado) => {
        this.creandoPago = false;

        // ✅ Añadir en local y ordenar
        if (pagoCreado) {
          this.pagos = [...(this.pagos ?? []), pagoCreado].sort((a, b) => {
            const fa = String(a?.fecha ?? '');
            const fb = String(b?.fecha ?? '');
            if (fa < fb) return -1;
            if (fa > fb) return 1;
            return ClienteDetalleComponent.toNumber(a?.id) - ClienteDetalleComponent.toNumber(b?.id);
          });
        }

        // ✅ recalcular total pagado + saldo (SIN tocar trabajos)
        this.calcularTotales();

        // reset
        this.nuevoPago = {
          fecha: this.hoyISO(),
          importe: 0,
          metodo: '',
          observaciones: '',
        };
      },
      error: (err) => {
        this.creandoPago = false;
        console.error('Error al registrar pago:', err);
        alert('No se pudo registrar el pago.');
      },
    });
  }

  eliminarPago(pagoId: number): void {
    if (!this.cliente?.id) return;

    if (!confirm('¿Seguro que deseas eliminar este pago?')) return;

    this.http.delete(`${this.apiUrl}/pagos/${pagoId}`).subscribe({
      next: () => {
        // ✅ quitar en local y recalcular (SIN tocar trabajos)
        this.pagos = (this.pagos ?? []).filter(p => ClienteDetalleComponent.toNumber(p?.id) !== pagoId);
        this.calcularTotales();
      },
      error: (err) => {
        console.error('Error al eliminar pago:', err);
        alert('No se pudo eliminar el pago.');
      },
    });
  }

  // ✅ total solo del historial
  getTotalPagos(): number {
    return (this.pagos ?? []).reduce(
      (acc, p) => acc + ClienteDetalleComponent.toNumber(p?.importe),
      0
    );
  }

  // ---------------- TOTALES (total trabajos, pagado = historial + pagado inicial de trabajos) ----------------
  calcularTotales(): void {
    const totalImporte = (this.trabajos ?? []).reduce(
      (acc, t) => acc + ClienteDetalleComponent.toNumber(t?.importe),
      0
    );

    // ✅ Pagos del historial
    const pagadoHistorial = (this.pagos ?? []).reduce(
      (acc, p) => acc + ClienteDetalleComponent.toNumber(p?.importe),
      0
    );

    // ✅ Pagado inicial metido en trabajos al crearlos (no se modifica con pagos)
    const pagadoInicial = (this.trabajos ?? []).reduce(
      (acc, t) => acc + ClienteDetalleComponent.toNumber(t?.importePagado),
      0
    );

    const totalPagado = pagadoHistorial + pagadoInicial;

    this.cliente = {
      ...this.cliente,
      totalImporte,
      totalPagado,
      saldoPendiente: totalImporte - totalPagado,
    };
  }

  getTotalImporte(): number {
    return ClienteDetalleComponent.toNumber(this.cliente?.totalImporte);
  }

  getTotalPagado(): number {
    return ClienteDetalleComponent.toNumber(this.cliente?.totalPagado);
  }

  getSaldoPendiente(): number {
    return ClienteDetalleComponent.toNumber(this.cliente?.saldoPendiente);
  }

 imprimirAlbaran(a: any): void {
  if (!a?.id) return;

  const url = `${window.location.origin}/app/imprimir/albaran/${a.id}`;
  window.open(url, '_blank');
}


}
