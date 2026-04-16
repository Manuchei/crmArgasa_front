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

// ✅ NUEVO
import { AlbaranProveedorDetalleComponent } from './pages/albaran-proveedor-detalle/albaran-proveedor-detalle.component';

import { FacturasListComponent } from './pages/facturas/facturas-list/facturas-list.component';

import { empresaGuard, empresaChildGuard } from './guards/empresa.guard';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

import { ImprimirFacturaComponent } from './pages/imprimir-factura/imprimir-factura.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { RutasVerComponent } from './pages/rutas-ver/rutas-ver.component';
import { dashboardRedirectGuard } from './guards/dashboard-redirect.guard';
import { DashboardUserComponent } from './pages/dashboard-user/dashboard-user.component';
import { PagoComprobanteImprimirComponent } from './pages/pago-comprobante-imprimir/pago-comprobante-imprimir.component';
import { InformeSaldosComponent } from './pages/informe-saldos/informe-saldos.component';
import { InformesComponent } from './pages/informes/informes.component';
import { FacturaProveedorComponent } from './pages/factura-proveedor/factura-proveedor.component';

export const routes: Routes = [
  { path: 'login', component: LoginFormComponent },

  {
    path: 'empresa',
    component: SelectorEmpresaComponent,
    canActivate: [authGuard],
  },

  // =========================
  // 🧾 IMPRIMIR
  // =========================
  {
    path: 'imprimir/albaran/:id',
    loadComponent: () =>
      import('./pages/alabaran-imprimir/alabaran-imprimir.component').then(
        (m) => m.AlbaranImprimirComponent,
      ),
    canActivate: [authGuard, empresaGuard],
  },

  // ✅ NUEVO (PROVEEDOR)
  {
    path: 'imprimir/albaran-proveedor/:id',
    loadComponent: () =>
      import('./pages/albaran-proveedor-imprimir/albaran-proveedor-imprimir.component').then(
        (m) => m.AlbaranProveedorImprimirComponent,
      ),
    canActivate: [authGuard, empresaGuard],
  },

  {
    path: 'imprimir/factura-proveedor/:id',
    loadComponent: () =>
      import('./pages/imprimir-factura-proveedor/imprimir-factura-proveedor.component').then(
        (m) => m.ImprimirFacturaProveedorComponent,
      ),
    canActivate: [authGuard, empresaGuard],
  },

  {
    path: 'imprimir/factura/:id',
    component: ImprimirFacturaComponent,
    canActivate: [authGuard, empresaGuard],
  },
  {
    path: 'imprimir/pago/:id',
    component: PagoComprobanteImprimirComponent,
    canActivate: [authGuard, empresaGuard],
  },

  {
    path: 'informes/saldos',
    component: InformeSaldosComponent,
  },

  // =========================
  // 🚀 APP
  // =========================
  {
    path: 'app',
    canActivate: [authGuard, empresaGuard],
    canActivateChild: [authGuard, empresaChildGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        component: DashboardComponent,
        canActivate: [dashboardRedirectGuard],
      },

      {
        path: 'dashboard-user',
        component: DashboardUserComponent,
        canActivate: [roleGuard(['USER'])],
      },

      // =========================
      // CLIENTES
      // =========================
      {
        path: 'clientes',
        component: ClientesComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },
      {
        path: 'clientes/nuevo',
        component: NuevoClienteComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },
      {
        path: 'clientes/editar/:id',
        component: EditarClienteComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },
      {
        path: 'clientes/:id',
        component: ClienteDetalleComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },

      // =========================
      // PROVEEDORES
      // =========================
      {
        path: 'proveedores',
        component: ProveedoresComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },

      {
        path: 'facturas-proveedor/:id',
        component: FacturaProveedorComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },
      {
        path: 'proveedores/nuevo',
        component: NuevoProveedorComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },
      {
        path: 'proveedores/editar/:id',
        component: EditarProveedorComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },
      {
        path: 'proveedores/:id',
        component: VerProveedorComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },

      // =========================
      // RUTAS
      // =========================
      {
        path: 'rutas',
        component: RutasListComponent,
        canActivate: [roleGuard(['ADMIN', 'TRANSPORTISTA'])],
      },
      {
        path: 'rutas/nueva',
        component: RutasFormComponent,
        canActivate: [roleGuard(['ADMIN', 'TRANSPORTISTA'])],
      },
      {
        path: 'rutas/editar/:id',
        component: RutasFormComponent,
        canActivate: [roleGuard(['ADMIN', 'TRANSPORTISTA'])],
      },
      {
        path: 'rutas/dia',
        component: RutasDiaComponent,
        canActivate: [roleGuard(['ADMIN', 'TRANSPORTISTA'])],
      },
      {
        path: 'rutas/ver/:id',
        component: RutasVerComponent,
        canActivate: [roleGuard(['ADMIN', 'TRANSPORTISTA'])],
      },

      {
        path: 'calendario',
        component: CalendarioLlamadas2Component,
        canActivate: [roleGuard(['ADMIN'])],
      },

      {
        path: 'transportistas',
        component: TransportistasComponent,
        canActivate: [roleGuard(['ADMIN'])],
      },

      // =========================
      // 🧾 ALBARANES CLIENTE
      // =========================
      {
        path: 'albaranes/:id',
        component: AlbaranDetalleComponent,
        canActivate: [roleGuard(['ADMIN'])],
      },

      // =========================
      // 🧾 ALBARANES PROVEEDOR (NUEVO)
      // =========================
      {
        path: 'albaranes-proveedor/:id',
        component: AlbaranProveedorDetalleComponent,
        canActivate: [roleGuard(['ADMIN'])],
      },
      {
        path: 'albaranes-proveedor/editar/:id',
        component: AlbaranProveedorDetalleComponent,
        canActivate: [roleGuard(['ADMIN'])],
      },

      // =========================
      // FACTURAS
      // =========================
      {
        path: 'facturas',
        component: FacturasListComponent,
        canActivate: [roleGuard(['ADMIN'])],
      },

      {
        path: 'informes',
        component: InformesComponent,
        canActivate: [roleGuard(['ADMIN'])],
      },

      {
        path: 'productos',
        component: ProductosComponent,
        canActivate: [roleGuard(['ADMIN', 'USER'])],
      },
    ],
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
