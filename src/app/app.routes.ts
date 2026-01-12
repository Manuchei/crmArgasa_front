import { Routes } from '@angular/router';

import { LoginFormComponent } from './components/login-form/login-form.component';
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

import { CalendarioLlamadas2Component } from './pages/calendario-llamadas2/calendario-llamadas2.component';
import { FacturasListComponent } from './pages/facturas/facturas-list/facturas-list.component';
import { FacturasClienteComponent } from './pages/facturas/facturas-cliente/facturas-cliente.component';
import { RutasDiaComponent } from './pages/rutas-dia/rutas-dia.component';
import { TransportistasComponent } from './pages/transportistas/transportistas.component';

export const routes: Routes = [
  { path: 'login', component: LoginFormComponent },

  // ✅ UNA SOLA raíz
  {
    path: '',
    children: [
      // ✅ redirect dentro del children
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
      { path: 'rutas/dia', component:RutasDiaComponent},

      // ✅ calendario NUEVO
      { path: 'calendario', component: CalendarioLlamadas2Component },

      // ✅ transportisas NUEVO
      { path: 'transportistas', component: TransportistasComponent},


      { path: 'facturas', component: FacturasListComponent},
      { path: 'clientes/:id/facturas', component: FacturasClienteComponent},

    ],
  },

  // ✅ wildcard al final
  { path: '**', redirectTo: 'dashboard' },
];
