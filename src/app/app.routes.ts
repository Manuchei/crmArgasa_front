import { ClienteDetalleComponent } from './pages/cliente-detalle/cliente-detalle.component';
import { Routes } from '@angular/router';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { NuevoClienteComponent } from './pages/clientes/nuevo-cliente/nuevo-cliente.component';
import { ProveedoresComponent } from './pages/proveedores/proveedores.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full'},
    { path: 'login', component: LoginFormComponent},
    { path: 'dashboard', component: DashboardComponent},
    { path: 'clientes', component: ClientesComponent},
    { path: 'clientes/nuevo', component: NuevoClienteComponent },
    { path: 'proveedores', component: ProveedoresComponent},
    { path: 'clientes/:id', component: ClienteDetalleComponent},
    { path: '**', redirectTo: 'dashboard'}

];
