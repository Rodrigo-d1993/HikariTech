import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { CartService } from './cart.service';
import { ToastService } from '../toast/toast.service';
import { PedidoService } from '../../features/pedidos/pedido.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <!-- Backdrop -->
    <div
      class="cart-backdrop"
      [class.cart-backdrop-visible]="cart.abierto()"
      (click)="cart.cerrarDrawer()"
    ></div>

    <!-- Drawer -->
    <aside class="cart-drawer" [class.cart-drawer-open]="cart.abierto()">

      <!-- Header -->
      <div class="cart-header">
        <div class="cart-title">
          <span class="cart-icon-lg">🛒</span>
          Carrito
          <span class="cart-count-badge" *ngIf="cart.totalUnidades() > 0">
            {{ cart.totalUnidades() }}
          </span>
        </div>
        <button class="cart-close-btn" (click)="cart.cerrarDrawer()">✕</button>
      </div>

      <!-- Vacío -->
      <div class="cart-empty" *ngIf="cart.items().length === 0">
        <div class="cart-empty-icon">🛒</div>
        <p>Tu carrito está vacío</p>
        <button class="btn btn-ghost btn-sm" (click)="irAProductos()">Ver productos</button>
      </div>

      <!-- Lista de ítems -->
      <div class="cart-items" *ngIf="cart.items().length > 0">
        <div class="cart-item" *ngFor="let item of cart.items()">

          <!-- Imagen -->
          <div class="cart-item-img">
            <img
              *ngIf="item.producto.imagenUrl"
              [src]="item.producto.imagenUrl"
              [alt]="item.producto.nombre"
              (error)="onImgErr($event)"
            >
            <span *ngIf="!item.producto.imagenUrl">🎮</span>
          </div>

          <!-- Info -->
          <div class="cart-item-info">
            <div class="cart-item-name">{{ item.producto.nombre }}</div>
            <div class="cart-item-price">
              {{ item.producto.precio | currency:'CLP':'symbol-narrow':'1.0-0' }}
            </div>
            <div class="cart-item-qty">
              <button
                (click)="cart.setCantidad(item.producto.id!, item.cantidad - 1)"
                [disabled]="item.cantidad <= 1"
              >−</button>
              <span>{{ item.cantidad }}</span>
              <button
                (click)="cart.setCantidad(item.producto.id!, item.cantidad + 1)"
                [disabled]="item.cantidad >= item.producto.stock"
              >+</button>
            </div>
          </div>

          <!-- Subtotal + eliminar -->
          <div class="cart-item-right">
            <div class="cart-item-subtotal">
              {{ item.producto.precio * item.cantidad | currency:'CLP':'symbol-narrow':'1.0-0' }}
            </div>
            <button class="cart-remove-btn" (click)="cart.eliminar(item.producto.id!)" title="Quitar del carrito">
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="cart-footer" *ngIf="cart.items().length > 0">
        <div class="cart-summary">
          <div class="cart-summary-row">
            <span>Subtotal ({{ cart.totalUnidades() }} {{ cart.totalUnidades() === 1 ? 'ítem' : 'ítems' }})</span>
            <span>{{ cart.totalMonto() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
          <div class="cart-summary-row cart-summary-envio">
            <span>Envío</span>
            <span class="cart-envio-gratis">Gratis</span>
          </div>
          <div class="cart-summary-total">
            <span>Total</span>
            <span>{{ cart.totalMonto() | currency:'CLP':'symbol-narrow':'1.0-0' }}</span>
          </div>
        </div>

        <button
          class="btn btn-primary btn-full"
          (click)="confirmarPedido()"
          [disabled]="comprando"
        >
          {{ comprando ? 'Procesando...' : 'Confirmar pedido' }}
        </button>

        <button class="btn btn-ghost btn-sm btn-full" (click)="cart.vaciar()" [disabled]="comprando">
          Vaciar carrito
        </button>
      </div>

    </aside>
  `,
})
export class CartDrawerComponent {
  comprando = false;

  constructor(
    public cart: CartService,
    private pedidoService: PedidoService,
    private auth: AuthService,
    private router: Router,
    private toastSvc: ToastService,
  ) {}

  irAProductos(): void {
    this.cart.cerrarDrawer();
    this.router.navigate(['/productos']);
  }

  onImgErr(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }

  async confirmarPedido(): Promise<void> {
    this.comprando = true;

    const clienteId = await this.auth.getClienteId();
    if (!clienteId) {
      this.toastSvc.error('No se pudo identificar al usuario.');
      this.comprando = false;
      return;
    }

    // Obtener el email del usuario autenticado para las notificaciones.
    // En modo Cognito el backend lo sobreescribe con el claim "email" del JWT.
    // En modo local (sin JWT) este valor llega al backend y se usa directamente.
    const clienteEmail = await this.auth.getUserLabel();

    const items = this.cart.items().map(i => ({
      productoId: i.producto.id!,
      cantidad:   i.cantidad,
    }));

    this.pedidoService.crear({ clienteId, clienteEmail, items }).subscribe({
      next: pedido => {
        this.comprando = false;
        this.cart.vaciar();
        this.toastSvc.exito(`Pedido #${pedido.id} confirmado ✓`);
        setTimeout(() => {
          this.cart.cerrarDrawer();
          this.router.navigate(['/pedidos']);
        }, 800);
      },
      error: err => {
        this.comprando = false;
        if (err?.status === 0)        this.toastSvc.error('Sin respuesta del servidor.');
        else if (err?.status === 400) this.toastSvc.error(err?.error?.message ?? 'Stock insuficiente o datos inválidos.');
        else if (err?.status === 401) this.toastSvc.error('Sesión expirada. Vuelve a iniciar sesión.');
        else                          this.toastSvc.error(`Error al crear el pedido (HTTP ${err?.status ?? '?'}).`);
      },
    });
  }
}
