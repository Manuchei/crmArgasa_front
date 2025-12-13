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
import { RutasListComponent } from './pages/rutas-list/rutas-list.component';
import { RutasFormComponent } from './pages/rutas-form/rutas-form.component';

export const routes: Routes = [
  { path: 'login', component: LoginFormComponent },

  {
    path: '',
    children: [
      { path: 'dashboard', component: DashboardComponent },

      { path: 'clientes', component: ClientesComponent },
      { path: 'clientes/nuevo', component: NuevoClienteComponent },
      { path: 'clientes/:id', component: ClienteDetalleComponent },
      { path: 'clientes/editar/:id', component: EditarClienteComponent },

      { path: 'proveedores', component: ProveedoresComponent },
      { path: 'proveedores/nuevo', component: NuevoProveedorComponent },
      { path: 'proveedores/:id', component: VerProveedorComponent },
      { path: 'proveedores/editar/:id', component: EditarProveedorComponent },

      { path: 'rutas', component: RutasListComponent },
      { path: 'rutas/nueva', component: RutasFormComponent },
      { path: 'rutas/editar/:id', component: RutasFormComponent },

      { path: 'calendario', component: CalendarioLlamadasComponent },
    ],
  },

  // SOLO UNO
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  // wildcard al final
  { path: '**', redirectTo: 'dashboard' },
];
