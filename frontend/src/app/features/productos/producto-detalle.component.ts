import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/cart/cart.service';
import { ToastService } from '../../core/toast/toast.service';
import { RoleService } from '../../core/auth/role.service';
import { ViewModeService } from '../../core/auth/view-mode.service';
import { Producto, ProductoService } from './producto.service';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <!-- ── Migas de pan ──────────────────────────────────────────────────── -->
    <nav class="breadcrumb">      <a routerLink="/productos">Productos</a>
      <span class="breadcrumb-sep">›</span>
      <span *ngIf="producto">{{ producto.nombre }}</span>
      <span *ngIf="!producto && !error" class="skeleton skeleton-bc"></span>
    </nav>

    <!-- ── Error ─────────────────────────────────────────────────────────── -->
    <div class="alert-error" *ngIf="error">{{ error }}</div>
    <!-- ── Skeleton ──────────────────────────────────────────────────────── -->
    <div class="detalle-layout" *ngIf="cargando && !error">
      <div class="detalle-img-col">
        <div class="skeleton detalle-img-skeleton"></div>
      </div>
      <div class="detalle-info-col">
        <div class="skeleton" style="height:32px;width:70%;margin-bottom:16px;border-radius:6px"></div>
        <div class="skeleton" style="height:16px;width:40%;margin-bottom:24px;border-radius:6px"></div>
        <div class="skeleton" style="height:14px;width:100%;margin-bottom:8px;border-radius:6px"></div>
        <div class="skeleton" style="height:14px;width:90%;margin-bottom:8px;border-radius:6px"></div>
        <div class="skeleton" style="height:14px;width:75%;margin-bottom:32px;border-radius:6px"></div>
        <div class="skeleton" style="height:48px;width:100%;border-radius:10px"></div>
      </div>
    </div>

    <!-- ── Detalle real ───────────────────────────────────────────────────── -->
    <div class="detalle-layout" *ngIf="producto && !cargando">

      <!-- Columna izquierda: imagen -->
      <div class="detalle-img-col">
        <div class="detalle-img-wrap" [class.detalle-img-sin-stock]="producto.stock <= 0">
          <img
            *ngIf="producto.imagenUrl && !imgError"
            [src]="producto.imagenUrl"
            [alt]="producto.nombre"
            (error)="imgError = true"
          >
          <div class="detalle-img-placeholder" *ngIf="!producto.imagenUrl || imgError">
            <span class="detalle-placeholder-icon">🎮</span>
            <span class="detalle-placeholder-text">Sin imagen</span>
          </div>
          <div class="detalle-sin-stock-banner" *ngIf="producto.stock <= 0">SIN STOCK</div>
        </div>
      </div>

      <!-- Columna derecha: info + acciones -->
      <div class="detalle-info-col">

        <!-- Categoría badge -->
        <div class="detalle-cat-badge" *ngIf="producto.categoria">
          {{ producto.categoria }}
        </div>

        <!-- Nombre -->
        <h1 class="detalle-nombre">{{ producto.nombre }}</h1>

        <!-- Precio -->
        <div class="detalle-precio">
          {{ producto.precio | currency:'CLP':'symbol-narrow':'1.0-0' }}
        </div>

        <!-- Stock -->
        <div class="detalle-stock"
             [class.stock-ok]="producto.stock > 10"
             [class.stock-low]="producto.stock > 0 && producto.stock <= 10"
             [class.stock-empty]="producto.stock <= 0">
          <span class="detalle-stock-dot"></span>
          {{ stockTexto }}
        </div>

        <!-- Separador -->
        <div class="detalle-divider"></div>

        <!-- Descripción -->
        <p class="detalle-descripcion" *ngIf="producto.descripcion">
          {{ producto.descripcion }}
        </p>
        <p class="detalle-descripcion detalle-desc-vacia" *ngIf="!producto.descripcion">
          Sin descripción disponible.
        </p>

        <!-- Separador -->
        <div class="detalle-divider"></div>

        <!-- Acciones (solo modo cliente) -->
        <ng-container *ngIf="!modoAdmin">
          <div class="detalle-acciones">

            <!-- Selector de cantidad -->
            <div class="detalle-qty-wrap" *ngIf="producto.stock > 0">
              <span class="detalle-qty-label">Cantidad</span>
              <div class="qty-control">
                <button (click)="decrementar()" [disabled]="cantidad <= 1">−</button>
                <span>{{ cantidad }}</span>
                <button (click)="incrementar()" [disabled]="cantidad >= producto.stock">+</button>
              </div>
              <span class="detalle-qty-max">Máx. {{ producto.stock }}</span>
            </div>

            <!-- Botón agregar al carrito -->
            <button
              class="btn btn-primary detalle-btn-carrito"
              (click)="agregarAlCarrito()"
              [disabled]="producto.stock <= 0"
            >
              {{ producto.stock <= 0 ? 'Sin stock' : '🛒 Agregar al carrito' }}
            </button>

          </div>
        </ng-container>

        <!-- Modo admin: solo editar -->
        <ng-container *ngIf="modoAdmin">
          <div class="detalle-acciones">
            <a routerLink="/productos" class="btn btn-purple detalle-btn-carrito">
              ← Volver al catálogo
            </a>
          </div>
        </ng-container>

        <!-- Feedback de carrito -->
        <div class="detalle-carrito-info" *ngIf="cantidadEnCarrito > 0 && !modoAdmin">
          🛒 Ya tienes <strong>{{ cantidadEnCarrito }}</strong>
          {{ cantidadEnCarrito === 1 ? 'unidad' : 'unidades' }} en el carrito
          <button class="btn-link" (click)="cart.abrirDrawer()">Ver carrito →</button>
        </div>

        <!-- Info adicional -->
        <div class="detalle-meta">
          <div class="detalle-meta-item">
            <span class="detalle-meta-icon">🚚</span>
            <span>Envío gratis sobre $50.000</span>
          </div>
          <div class="detalle-meta-item">
            <span class="detalle-meta-icon">🔒</span>
            <span>Pago 100% seguro</span>
          </div>
          <div class="detalle-meta-item">
            <span class="detalle-meta-icon">↩</span>
            <span>30 días para devoluciones</span>
          </div>
          <div class="detalle-meta-item">
            <span class="detalle-meta-icon">🎮</span>
            <span>Garantía de fábrica</span>
          </div>
        </div>

      </div>
    </div>

  `,
})
export class ProductoDetalleComponent implements OnInit {
  producto: Producto | null = null;
  cargando = true;
  error    = '';
  imgError = false;
  cantidad = 1;
  esAdmin = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productoService: ProductoService,
    public cart: CartService,
    private role: RoleService,
    private viewMode: ViewModeService,
    private toastSvc: ToastService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.esAdmin = await this.role.isAdmin();

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.router.navigate(['/productos']);
      return;
    }
    this.productoService.buscarPorId(id).subscribe({
      next: p => {
        this.producto = p;
        this.cargando = false;
      },
      error: err => {
        this.toastSvc.error(
          err?.status === 404
            ? 'Producto no encontrado.'
            : `No se pudo cargar el producto (HTTP ${err?.status ?? '?'}).`
        );
        this.cargando = false;
      },
    });
  }

  get modoAdmin(): boolean {
    return this.esAdmin && this.viewMode.esVistaAdmin();
  }

  get stockTexto(): string {
    if (!this.producto) return '';
    if (this.producto.stock <= 0)  return 'Sin stock';
    if (this.producto.stock <= 10) return `Stock bajo — quedan ${this.producto.stock} unidades`;
    return `En stock — ${this.producto.stock} unidades disponibles`;
  }

  /** Cuántas unidades de este producto hay ya en el carrito */
  get cantidadEnCarrito(): number {
    if (!this.producto?.id) return 0;
    const item = this.cart.items().find(i => i.producto.id === this.producto!.id);
    return item?.cantidad ?? 0;
  }

  decrementar(): void {
    if (this.cantidad > 1) this.cantidad--;
  }

  incrementar(): void {
    if (this.producto && this.cantidad < this.producto.stock) this.cantidad++;
  }

  agregarAlCarrito(): void {
    if (!this.producto || this.producto.stock <= 0) return;
    this.cart.agregar(this.producto, this.cantidad);
    this.toastSvc.exito(`${this.producto.nombre} agregado al carrito 🛒`);
  }
}
