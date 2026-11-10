import { Routes } from '@angular/router';
import { adminGuard } from './core/auth/admin.guard';
import { authGuard } from './core/auth/auth.guard';
import { clienteGuard } from './core/auth/cliente.guard';
import { HomeComponent } from './features/home/home.component';
import { LoginComponent } from './features/login/login.component';
import { PedidosComponent } from './features/pedidos/pedidos.component';
import { PedidosAdminComponent } from './features/pedidos/pedidos-admin.component';
import { ProductosComponent } from './features/productos/productos.component';
import { ProductoDetalleComponent } from './features/productos/producto-detalle.component';
import { AdminComponent } from './features/admin/admin.component';

export const routes: Routes = [
  { path: '',                  component: HomeComponent },
  { path: 'login',             component: LoginComponent },
  { path: 'productos',         component: ProductosComponent,        canActivate: [authGuard] },
  { path: 'productos/:id',     component: ProductoDetalleComponent,  canActivate: [authGuard] },
  { path: 'pedidos',           component: PedidosComponent,          canActivate: [authGuard, clienteGuard] },
  { path: 'pedidos-admin',     component: PedidosAdminComponent,     canActivate: [authGuard, adminGuard] },
  { path: 'admin',             component: AdminComponent,            canActivate: [authGuard, adminGuard] },
  { path: '**',                redirectTo: '' },
];
