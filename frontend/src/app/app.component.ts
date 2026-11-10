import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/auth/auth.service';
import { CartDrawerComponent } from './core/cart/cart-drawer.component';
import { CartService } from './core/cart/cart.service';
import { ToastContainerComponent } from './core/toast/toast-container.component';
import { RoleService } from './core/auth/role.service';
import { ViewModeService } from './core/auth/view-mode.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, CartDrawerComponent, ToastContainerComponent],
  template: `
    <!-- ─── HEADER ─────────────────────────────────────────────────────── -->
    <header class="topbar">
      <div class="topbar-inner">

        <!-- Logo -->
        <a class="brand" routerLink="/">
          Hikari<span class="accent">Tec</span><span class="dot">.</span>
        </a>

        <!-- Nav principal -->
        <nav class="topbar-nav" *ngIf="autenticado">
          <a routerLink="/productos"     routerLinkActive="active">Productos</a>
          <a routerLink="/pedidos"       routerLinkActive="active" *ngIf="!modoAdmin">Mis pedidos</a>
          <a routerLink="/pedidos-admin" routerLinkActive="active" *ngIf="modoAdmin">Pedidos</a>
          <a routerLink="/admin"         routerLinkActive="active" *ngIf="modoAdmin">RabbitMQ</a>
        </nav>

        <!-- Acciones -->
        <div class="topbar-actions">
          <ng-container *ngIf="autenticado; else noAuth">
            <div class="topbar-user">

              <!-- Toggle vista (solo Admin) -->
              <div class="view-toggle" *ngIf="esAdmin" (click)="toggleVista()" title="Alternar vista">
                <div class="view-toggle-track" [class.view-toggle-cliente]="vistaCliente">
                  <div class="view-toggle-thumb"></div>
                </div>
                <span class="view-toggle-label">{{ vistaCliente ? 'Vista cliente' : 'Vista admin' }}</span>
              </div>

              <!-- Botón carrito (solo modo cliente) -->
              <button
                class="cart-btn"
                *ngIf="!modoAdmin"
                (click)="cart.toggleDrawer()"
                title="Ver carrito"
              >
                🛒
                <span class="cart-btn-badge" *ngIf="cart.totalUnidades() > 0">
                  {{ cart.totalUnidades() > 99 ? '99+' : cart.totalUnidades() }}
                </span>
              </button>

              <span class="role-badge" [class.role-admin]="modoAdmin" [class.role-cliente]="!modoAdmin">
                {{ modoAdmin ? 'Admin' : 'Cliente' }}
              </span>
              <div class="topbar-user-info">
                <span class="topbar-user-name">{{ usuario }}</span>
              </div>
              <button class="btn btn-ghost btn-sm" (click)="logout()">Salir</button>
            </div>
          </ng-container>
          <ng-template #noAuth>
            <button class="btn btn-primary btn-sm" (click)="login()">Iniciar sesión</button>
          </ng-template>
        </div>

      </div>

      <!-- Barra secundaria (solo autenticado) -->
      <div class="topbar-sub" *ngIf="autenticado">
        <div class="topbar-sub-inner">
          <span class="topbar-sub-item">Envío gratis sobre $50.000</span>
          <span class="topbar-sub-sep">·</span>
          <span class="topbar-sub-item">Garantía 12 meses</span>
          <span class="topbar-sub-sep">·</span>
          <span class="topbar-sub-item">Soporte 24/7</span>
        </div>
      </div>
    </header>

    <!-- ─── CONTENIDO ────────────────────────────────────────────────────── -->
    <main class="container">
      <router-outlet></router-outlet>
    </main>

    <!-- ─── FOOTER ───────────────────────────────────────────────────────── -->
    <footer class="footer">
      <div class="footer-inner">

        <div class="footer-brand-col">
          <div class="footer-logo">Hikari<span class="accent">Tec</span><span class="dot">.</span></div>
          <p class="footer-tagline">Tu tienda gamer de confianza en Chile. Periféricos, monitores y accesorios para llevar tu setup al siguiente nivel.</p>
          <div class="footer-social">
            <a href="#" class="footer-social-btn">Instagram</a>
            <a href="#" class="footer-social-btn">Twitter</a>
            <a href="#" class="footer-social-btn">Discord</a>
          </div>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">Tienda</div>
          <a routerLink="/productos">Todos los productos</a>
          <a routerLink="/productos" [queryParams]="{categoria: 'Teclados'}">Teclados</a>
          <a routerLink="/productos" [queryParams]="{categoria: 'Mouse'}">Mouse y pads</a>
          <a routerLink="/productos" [queryParams]="{categoria: 'Monitores'}">Monitores</a>
          <a routerLink="/productos" [queryParams]="{categoria: 'Sillas'}">Sillas gamer</a>
          <a routerLink="/productos" [queryParams]="{categoria: 'Audio'}">Audífonos</a>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">Ayuda</div>
          <a href="#">Centro de ayuda</a>
          <a href="#">Seguimiento de pedido</a>
          <a href="#">Devoluciones</a>
          <a href="#">Garantía</a>
          <a href="#">Preguntas frecuentes</a>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">Contacto</div>
          <span>contacto&#64;hikaritec.cl</span>
          <span>+56 2 2345 6789</span>
          <span>Lun–Vie · 9:00–18:00</span>
          <div class="footer-col-title" style="margin-top:16px">Legal</div>
          <a href="#">Términos y condiciones</a>
          <a href="#">Política de privacidad</a>
        </div>

      </div>

      <div class="footer-bottom">
        <span>© 2026 HikariTec SpA · Santiago, Chile</span>
      </div>
    </footer>

    <!-- ─── CARRITO DRAWER ────────────────────────────────────────────────── -->
    <app-cart-drawer></app-cart-drawer>

    <!-- ─── TOASTS ───────────────────────────────────────────────────────── -->
    <app-toast-container></app-toast-container>
  `,
})
export class AppComponent implements OnInit {
  autenticado = false;
  usuario     = '';
  esAdmin     = false;

  // Clave para persistir el rol en localStorage y tenerlo
  // disponible de forma sincrónica en el primer render.
  private static readonly ROL_KEY = 'hikaritec_es_admin';

  constructor(
    private auth: AuthService,
    private role: RoleService,
    private router: Router,
    public viewMode: ViewModeService,
    public cart: CartService,
  ) {
    // Carga sincrónica desde localStorage para que el primer render
    // ya tenga el valor correcto y no haya parpadeo del nav.
    const cached = localStorage.getItem(AppComponent.ROL_KEY);
    if (cached !== null) {
      this.esAdmin = cached === 'true';
    }
  }

  /** true solo cuando es admin Y está en vista admin (no vista cliente) */
  get modoAdmin(): boolean {
    return this.esAdmin && !this.vistaCliente;
  }

  get vistaCliente(): boolean {
    return this.viewMode.modo() === 'cliente';
  }

  toggleVista(): void {
    this.viewMode.toggleModo();
    const url = this.router.url;
    // Al pasar a vista cliente: salir de rutas exclusivas de admin
    if (this.vistaCliente && (url.startsWith('/admin') || url.startsWith('/pedidos-admin'))) {
      this.router.navigate(['/productos']);
    }
    // Al pasar a vista admin: salir de rutas exclusivas de cliente
    if (!this.vistaCliente && url.startsWith('/pedidos') && !url.startsWith('/pedidos-admin')) {
      this.router.navigate(['/productos']);
    }
  }

  ngOnInit(): void {
    this.actualizarSesion();

    // Re-evaluar en cada navegación por si la sesión cambia
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.actualizarSesion());
  }

  private async actualizarSesion(): Promise<void> {
    this.autenticado = await this.auth.isAuthenticated();

    if (this.autenticado) {
      this.usuario  = await this.auth.getUserLabel();
      this.esAdmin  = await this.role.isAdmin();
      // Persiste para el próximo render sincrónico
      localStorage.setItem(AppComponent.ROL_KEY, String(this.esAdmin));
    } else {
      this.esAdmin = false;
      localStorage.removeItem(AppComponent.ROL_KEY);
    }
  }

  async logout(): Promise<void> {
    localStorage.removeItem(AppComponent.ROL_KEY);
    await this.auth.logout();
  }

  async login(): Promise<void> { await this.auth.login(); }
}
