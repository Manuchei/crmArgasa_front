import { Routes } from '@angular/router';

import { LoginFormComponent } from './components/login-form/login-form.component';
import { SelectorEmpresaComponent } from './pages/selector-empresa/selector-empresa.component';

import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { NuevoClienteComponent } from './pages/clientes/nuevo-cliente/nuevo-cliente.component';
import { EditarClienteComponent } from './pages/clientes/editar-cliente/editar-cliente.component';
import { ClienteDetalleComponent } from './pages/cliente-detalle/cliente-detalle.component';

import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { NuevoProveedorComponent } from './pages/proveedores/nuevo-proveedor/nuevo-proveedor.component';
import { VerProveedorComponent } from './pages/ver-proveedor/ver-proveedor.component';
import { EditarProveedorComponent } from './pages/proveedores/editar-proveedor/editar-proveedor.component';

import { RutasListComponent } from './pages/rutas-list/rutas-list.component';
import { RutasFormComponent } from './pages/rutas-form/rutas-form.component';
import { RutasDiaComponent } from './pages/rutas-dia/rutas-dia.component';

import { CalendarioLlamadas2Component } from './pages/calendario-llamadas2/calendario-llamadas2.component';
import { TransportistasComponent } from './pages/transportistas/transportistas.component';
import { AlbaranDetalleComponent } from './pages/albaran-detalle/albaran-detalle.component';

import { FacturasListComponent } from './pages/facturas/facturas-list/facturas-list.component';

import { empresaGuard, empresaChildGuard } from './guards/empresa.guard';
import { authGuard } from './guards/auth.guard';

import { ImprimirFacturaComponent } from './pages/imprimir-factura/imprimir-factura.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { RutasVerComponent } from './pages/rutas-ver/rutas-ver.component';

export const routes: Routes = [
  // 🔐 LOGIN
  { path: 'login', component: LoginFormComponent },

  // 🏢 SELECTOR DE EMPRESA (solo si estás logueado)
  {
    path: 'empresa',
    component: SelectorEmpresaComponent,
    canActivate: [authGuard],
  },

  // ✅ imprimir protegido
  {
    path: 'imprimir/albaran/:id',
    loadComponent: () =>
      import('./pages/alabaran-imprimir/alabaran-imprimir.component').then(
        (m) => m.AlbaranImprimirComponent,
      ),
    canActivate: [authGuard, empresaGuard],
  },
  {
    path: 'imprimir/factura/:id',
    component: ImprimirFacturaComponent,
    canActivate: [authGuard, empresaGuard],
  },

  // 🚀 APP REAL
  {
    path: 'app',
    canActivate: [authGuard, empresaGuard],
    canActivateChild: [authGuard, empresaChildGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      { path: 'dashboard', component: DashboardComponent },

      { path: 'clientes', component: ClientesComponent },
      { path: 'clientes/nuevo', component: NuevoClienteComponent },
      { path: 'clientes/editar/:id', component: EditarClienteComponent },
      { path: 'clientes/:id', component: ClienteDetalleComponent },

      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'proveedores/nuevo', component: NuevoProveedorComponent },
      { path: 'proveedores/editar/:id', component: EditarProveedorComponent },
      { path: 'proveedores/:id', component: VerProveedorComponent },

      { path: 'rutas', component: RutasListComponent },
      { path: 'rutas/nueva', component: RutasFormComponent },
      { path: 'rutas/editar/:id', component: RutasFormComponent },
      { path: 'rutas/dia', component: RutasDiaComponent },
      { path: 'rutas/ver/:id', component: RutasVerComponent },

      { path: 'calendario', component: CalendarioLlamadas2Component },

      { path: 'transportistas', component: TransportistasComponent },

      { path: 'albaranes/:id', component: AlbaranDetalleComponent },

      { path: 'facturas', component: FacturasListComponent },

      { path: 'productos', component: ProductosComponent },
    ],
  },

  // 🧭 raíz → login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ❌ cualquier otra ruta → login
  { path: '**', redirectTo: 'login' },
];
