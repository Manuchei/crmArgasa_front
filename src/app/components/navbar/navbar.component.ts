import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { Empresa, EmpresaService } from '../../services/empresa.service';

interface EnlaceNavbar {
  texto: string;
  ruta: string;
}

interface GrupoNavbar {
  id: string;
  texto: string;
  enlaces: EnlaceNavbar[];
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  usuario: { email?: string } | null = null;
  empresa: Empresa | null = null;

  menuOpen = false;
  desplegable: string | null = null;

  private subscriptions = new Subscription();
  private ultimoBoton: HTMLButtonElement | null = null;

  constructor(
    public auth: AuthService,
    private empresaService: EmpresaService,
    private router: Router,
    private element: ElementRef<HTMLElement>,
  ) {}

  ngOnInit(): void {
    this.usuario = this.auth.getUsuario();

    this.subscriptions.add(
      this.empresaService.empresa$.subscribe((empresa) => {
        this.empresa = empresa;
      }),
    );

    this.subscriptions.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          this.closeMenu();
        }
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get accesoGeneral(): boolean {
    return this.auth.hasRole('USER', 'ADMIN', 'DEVELOPER');
  }

  get gestionaEquipo(): boolean {
    return this.auth.hasRole('ADMIN', 'DEVELOPER');
  }

  get nombreEmpresa(): string {
    if (this.empresa === 'ARGASA') return 'Argasa';
    if (this.empresa === 'ELECTROLUGA') return 'Electroluga';
    return 'Seleccionar empresa';
  }

  get inicialUsuario(): string {
    return this.usuario?.email?.trim().charAt(0).toUpperCase() || 'U';
  }

  get nombreRol(): string {
    if (this.auth.hasRole('DEVELOPER')) return 'Developer';
    if (this.auth.hasRole('ADMIN')) return 'Administrador';
    if (this.auth.hasRole('USER')) return 'Usuario';
    if (this.auth.hasRole('TRANSPORTISTA')) return 'Transportista';
    return 'Cuenta';
  }

  get rutaInicio(): string {
    return this.accesoGeneral ? '/app/dashboard' : '/app/rutas';
  }

  get grupos(): GrupoNavbar[] {
  if (!this.accesoGeneral) {
    return this.auth.hasRole('TRANSPORTISTA')
      ? [
          {
            id: 'logistica',
            texto: 'Rutas',
            enlaces: [
              { texto: 'Ver rutas', ruta: '/app/rutas' },
              { texto: 'Nueva ruta', ruta: '/app/rutas/nueva' },
              { texto: 'Rutas del día', ruta: '/app/rutas/dia' },
            ],
          },
        ]
      : [];
  }

  return [
    {
      id: 'gestion',
      texto: 'Gestión',
      enlaces: [
        { texto: 'Clientes', ruta: '/app/clientes' },
        { texto: 'Proveedores', ruta: '/app/proveedores' },
        { texto: 'Productos', ruta: '/app/productos' },
        { texto: 'Caja', ruta: '/app/caja' },
        { texto: 'Ticket', ruta: '/app/venta-rapida' },
      ],
    },
    {
      id: 'logistica',
      texto: 'Logística',
      enlaces: [
        { texto: 'Rutas', ruta: '/app/rutas' },
        { texto: 'Transportistas', ruta: '/app/transportistas' },
        { texto: 'Almacén', ruta: '/app/almacen' },
      ],
    },
    {
      id: 'organizacion',
      texto: 'Organización',
      enlaces: [
        { texto: 'Calendario', ruta: '/app/calendario' },
        { texto: 'Mi jornada', ruta: '/app/mi-jornada' },
        ...(this.gestionaEquipo
          ? [
              {
                texto: 'Fichajes del equipo y empleados',
                ruta: '/app/control-fichajes',
              },
            ]
          : []),
      ],
    },
  ];
}

  canInicio(): boolean {
    return this.accesoGeneral;
  }

  canCalendario(): boolean {
    return this.accesoGeneral;
  }

  canInformes(): boolean {
    return this.accesoGeneral;
  }

  canCaja(): boolean {
    return this.accesoGeneral;
  }

  canUsuarios(): boolean {
    return this.auth.hasRole('DEVELOPER');
  }

  trackGrupo(_: number, grupo: GrupoNavbar): string {
    return grupo.id;
  }

  trackEnlace(_: number, enlace: EnlaceNavbar): string {
    return enlace.ruta;
  }

  toggleMenu(event: Event): void {
    this.menuOpen = !this.menuOpen;
    this.desplegable = null;
    this.ultimoBoton = event.currentTarget as HTMLButtonElement;
  }

  toggleDesplegable(id: string, event: Event): void {
    this.desplegable = this.desplegable === id ? null : id;
    this.ultimoBoton = event.currentTarget as HTMLButtonElement;
  }

  closeMenu(): void {
    this.menuOpen = false;
    this.desplegable = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.element.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:focusin', ['$event'])
  onDocumentFocus(event: FocusEvent): void {
    if (!this.element.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen || this.desplegable) {
      this.closeMenu();
      this.ultimoBoton?.focus();
    }
  }

  cambiarEmpresa(): void {
    this.closeMenu();
    this.empresaService.clearEmpresa();
    void this.router.navigate(['/empresa']);
  }

  logout(): void {
    this.closeMenu();
    this.auth.logout();
    this.empresaService.clearEmpresa();
    void this.router.navigate(['/login']);
  }
}
