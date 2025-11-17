import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

import { LoginFormComponent } from './components/login-form/login-form.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { NuevoClienteComponent } from './pages/clientes/nuevo-cliente/nuevo-cliente.component';
import { EditarClienteComponent } from './pages/clientes/editar-cliente/editar-cliente.component';
import { ClienteDetalleComponent } from './pages/cliente-detalle/cliente-detalle.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { CalendarioLlamadasComponent } from './pages/calendario-llamadas/calendario-llamadas.component';
import { NuevoProveedorComponent } from './pages/proveedores/nuevo-proveedor/nuevo-proveedor.component';

export const routes: Routes = [

  // Si no hay ruta → ir al login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Login SIN guard
  { path: 'login', component: LoginFormComponent },

  // Rutas protegidas
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'clientes', component: ClientesComponent, canActivate: [AuthGuard] },
  { path: 'clientes/nuevo', component: NuevoClienteComponent, canActivate: [AuthGuard] },
  { path: 'clientes/editar/:id', component: EditarClienteComponent, canActivate: [AuthGuard] },
  { path: 'clientes/:id', component: ClienteDetalleComponent, canActivate: [AuthGuard] },
  { path: 'proveedores', component: ProveedoresComponent, canActivate: [AuthGuard] },
  { path: 'calendario', component: CalendarioLlamadasComponent, canActivate: [AuthGuard] },
  { path: 'proveedores/nuevo', component: NuevoProveedorComponent, canActivate: [AuthGuard] },
  // Si la ruta no existe → login
  { path: '**', redirectTo: 'login' }
];
