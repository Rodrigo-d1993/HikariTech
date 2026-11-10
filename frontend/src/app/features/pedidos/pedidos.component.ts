import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ToastService } from '../../core/toast/toast.service';
import { ProductoService } from '../productos/producto.service';
import { Pedido, PedidoService } from './pedido.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="toolbar">
      <h2 class="page-title">Mis pedidos</h2>
    </div>

    <!-- Skeleton loading -->
    <div *ngIf="cargando">
      <div class="skeleton-order" *ngFor="let i of [1,2,3]">
        <div class="skeleton skeleton-order-head"></div>
        <div class="skeleton-order-body">
          <div class="skeleton skeleton-row w100"></div>
          <div class="skeleton skeleton-row w80"></div>
          <div class="skeleton skeleton-row w60"></div>
        </div>
      </div>
    </div>

    <div class="empty-state" *ngIf="!cargando && !error && pedidos.length === 0">
      <div class="empty-icon"></div>
      <p>Aún no tienes pedidos. Ve a <a routerLink="/productos" style="color:var(--cyan)">Productos</a> y compra alguno.</p>
    </div>

    <div class="orders-list" *ngIf="!cargando">
      <div class="order-card" *ngFor="let p of pedidos">
        <div class="order-header">
          <div>
            <div class="order-id">Pedido #{{ p.id }}</div>
            <div class="order-date">{{ p.fecha | date:'dd/MM/yyyy HH:mm' }}</div>
          </div>
          <div style="display:flex; align-items:center; gap:10px">
            <span [class]="badgeClase(p.estado)">{{ p.estado }}</span>
          </div>
        </div>

        <div class="order-body">
          <table class="order-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let i of p.items">
                <td>{{ nombreProducto(i.productoId) }}</td>
                <td>{{ i.cantidad }}</td>
                <td>{{ i.precioUnitario ?? 0 | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
                <td>{{ (i.precioUnitario ?? 0) * i.cantidad | currency:'CLP':'symbol-narrow':'1.0-0' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="order-total">
          Total: {{ total(p) | currency:'CLP':'symbol-narrow':'1.0-0' }}
        </div>
      </div>
    </div>
  `,
})
export class PedidosComponent implements OnInit {
  pedidos: Pedido[] = [];
  cargando = true;
  error = false;
  private nombres = new Map<number, string>();

  constructor(
    private pedidoService: PedidoService,
    private productoService: ProductoService,
    private auth: AuthService,
    private toastSvc: ToastService,
  ) {}

  async ngOnInit(): Promise<void> {
    const clienteId = await this.auth.getClienteId();
    if (!clienteId) {
      this.toastSvc.error('No se pudo identificar al usuario.');
      this.cargando = false;
      return;
    }

    this.productoService.listar().subscribe({
      next: ps => ps.forEach(pr => pr.id != null && this.nombres.set(pr.id, pr.nombre)),
    });

    this.pedidoService.listarPorCliente(clienteId).subscribe({
      next: data => {
        this.pedidos = [...data].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        this.cargando = false;
      },
      error: err => {
        this.toastSvc.error(this.msgError(err, 'No se pudieron cargar los pedidos'));
        this.cargando = false;
      },
    });
  }

  badgeClase(estado?: string): string {
    const map: Record<string, string> = {
      PENDIENTE:  'badge badge-pendiente',
      EN_PROCESO: 'badge badge-en_proceso',
      ENTREGADO:  'badge badge-entregado',
      CANCELADO:  'badge badge-cancelado',
    };
    return map[estado ?? ''] ?? 'badge';
  }

  nombreProducto(id: number): string {
    return this.nombres.get(id) ?? `Producto #${id}`;
  }

  total(p: Pedido): number {
    return p.items.reduce((s, i) => s + (i.precioUnitario ?? 0) * i.cantidad, 0);
  }

  private msgError(err: any, base: string): string {
    if (err?.status === 0) return `${base}: sin respuesta del servidor.`;
    if (err?.status === 401) return `${base}: sesión no autorizada (401).`;
    return `${base} (HTTP ${err?.status ?? '?'}).`;
  }
}
