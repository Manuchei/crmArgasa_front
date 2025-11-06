import { Routes } from '@angular/router';
import { LoginFormComponent } from './components/login-form/login-form.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientesComponent } from './pages/clientes/clientes.component';
import { NuevoClienteComponent } from './pages/clientes/nuevo-cliente/nuevo-cliente.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full'},
    { path: 'login', component: LoginFormComponent},
    { path: 'dashboard', component: DashboardComponent},
    { path: 'clientes', component: ClientesComponent},
    { path: 'clientes/nuevo', component: NuevoClienteComponent },

];
