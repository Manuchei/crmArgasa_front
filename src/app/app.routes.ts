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
import { VerProveedorComponent } from './pages/ver-proveedor/ver-proveedor.component';
import { EditarProveedorComponent } from './pages/proveedores/editar-proveedor/editar-proveedor.component';

export const routes: Routes = [
  // Ruta pública
  { path: 'login', component: LoginFormComponent },

  // Rutas protegidas
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'clientes', component: ClientesComponent },
      { path: 'clientes/nuevo', component: NuevoClienteComponent },
      { path: 'clientes/:id', component: ClienteDetalleComponent },
      { path: 'clientes/editar/:id', component: EditarClienteComponent },

      { path: 'proveedores/nuevo', component: NuevoProveedorComponent },
      { path: 'proveedores/editar/:id', component: EditarProveedorComponent },
      { path: 'proveedores/:id', component: VerProveedorComponent },
      { path: 'proveedores', component: ProveedoresComponent },

      { path: 'calendario', component: CalendarioLlamadasComponent },
    ],
  },

  // Default y error
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' },
];
