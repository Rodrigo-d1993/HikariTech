import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../core/toast/toast.service';
import { AdminService, ExchangeInfo, QueueInfo } from './admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toolbar">
      <h2 class="page-title">Panel RabbitMQ</h2>
      <button class="btn btn-ghost btn-sm" (click)="cargar()" [disabled]="cargando">
        {{ cargando ? 'Cargando...' : 'Actualizar' }}
      </button>
    </div>

    <!-- Skeleton loading -->
    <div *ngIf="cargando">
      <!-- Sección Colas -->
      <div class="skeleton skeleton-row w40" style="height:22px;margin-bottom:16px;border-radius:6px"></div>
      <div class="rabbit-grid">
        <div class="rabbit-card" *ngFor="let i of [1,2,3,4]" style="gap:10px;display:flex;flex-direction:column">
          <div class="skeleton skeleton-row w80" style="height:18px;border-radius:4px"></div>
          <div class="skeleton skeleton-row w100" style="height:12px;border-radius:4px"></div>
          <div class="skeleton skeleton-row w100" style="height:12px;border-radius:4px"></div>
          <div class="skeleton skeleton-row w80" style="height:12px;border-radius:4px"></div>
          <div class="skeleton skeleton-row w60" style="height:12px;border-radius:4px"></div>
          <div class="skeleton skeleton-row w100" style="height:32px;border-radius:6px;margin-top:6px"></div>
        </div>
      </div>
      <!-- Sección Exchanges -->
      <div class="skeleton skeleton-row w40" style="height:22px;margin:28px 0 16px;border-radius:6px"></div>
      <div class="rabbit-grid">
        <div class="rabbit-card" *ngFor="let i of [1,2,3]" style="gap:10px;display:flex;flex-direction:column">
          <div class="skeleton skeleton-row w80" style="height:18px;border-radius:4px"></div>
          <div class="skeleton skeleton-row w60" style="height:12px;border-radius:4px"></div>
          <div class="skeleton skeleton-row w60" style="height:12px;border-radius:4px"></div>
          <div class="skeleton skeleton-row w60" style="height:12px;border-radius:4px"></div>
        </div>
      </div>
    </div>

    <!-- Estado vacío / sin conexión -->
    <div class="rabbit-offline" *ngIf="!cargando && sinConexion">
      <div class="rabbit-offline-icon">🔌</div>
      <p>No se pudo conectar con ms-rabbit-admin</p>
      <span class="rabbit-offline-hint">¿Está corriendo en :8083?</span>
      <button class="btn btn-ghost btn-sm" (click)="cargar()">Reintentar</button>
    </div>

    <div *ngIf="!cargando && !sinConexion">

      <!-- Colas -->
      <h3 class="rabbit-section-title">Colas ({{ colas.length }})</h3>
      <div class="rabbit-grid">
        <div class="rabbit-card" *ngFor="let q of colas">
          <div class="queue-name">{{ q.name }}</div>
          <div class="queue-stat">Mensajes totales  <span>{{ q.messages }}</span></div>
          <div class="queue-stat">Listos            <span>{{ q.messages_ready }}</span></div>
          <div class="queue-stat">Sin confirmar     <span>{{ q.messages_unacknowledged }}</span></div>
          <div class="queue-stat">Consumidores      <span>{{ q.consumers }}</span></div>
          <div class="queue-stat">Estado
            <span [style.color]="q.state === 'running' ? 'var(--green)' : 'var(--yellow)'">
              {{ q.state }}
            </span>
          </div>
          <button
            class="btn btn-danger btn-sm"
            style="margin-top:10px;width:100%"
            (click)="eliminarCola(q.name)"
            [disabled]="eliminandoCola === q.name"
          >
            {{ eliminandoCola === q.name ? 'Eliminando...' : 'Eliminar cola' }}
          </button>
        </div>
      </div>

      <!-- Exchanges -->
      <h3 class="rabbit-section-title" style="margin-top:28px">Exchanges ({{ exchanges.length }})</h3>
      <div class="rabbit-grid">
        <div class="rabbit-card" *ngFor="let e of exchanges">
          <div class="queue-name">{{ e.name || '(default)' }}</div>
          <div class="queue-stat">Tipo
            <span [style.color]="colorTipo(e.type)">{{ e.type }}</span>
          </div>
          <div class="queue-stat">Durable     <span>{{ e.durable    ? 'Sí' : 'No' }}</span></div>
          <div class="queue-stat">Auto-delete <span>{{ e.auto_delete ? 'Sí' : 'No' }}</span></div>
        </div>
      </div>

    </div>
  `,
})
export class AdminComponent implements OnInit {
  colas: QueueInfo[] = [];
  exchanges: ExchangeInfo[] = [];
  cargando = true;
  sinConexion = false;
  eliminandoCola: string | null = null;

  constructor(
    private adminService: AdminService,
    private toastSvc: ToastService,
  ) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.cargando = true;
    this.sinConexion = false;

    this.adminService.listarColas().subscribe({
      next: data => {
        this.colas = data.filter(q => !q.name.includes('amq.'));
        this.cargarExchanges();
      },
      error: err => {
        this.sinConexion = true;
        this.cargando = false;
        this.toastSvc.error(
          `No se pudo conectar con RabbitMQ (HTTP ${err?.status ?? '?'}).`
        );
      },
    });
  }

  private cargarExchanges(): void {
    this.adminService.listarExchanges().subscribe({
      next: data => {
        this.exchanges = data.filter(e => e.name && !e.name.startsWith('amq.'));
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.toastSvc.aviso('Exchanges no disponibles.');
      },
    });
  }

  eliminarCola(nombre: string): void {
    if (!confirm(`¿Eliminar la cola "${nombre}"?`)) return;
    this.eliminandoCola = nombre;

    this.adminService.eliminarCola(nombre).subscribe({
      next: () => {
        this.colas = this.colas.filter(q => q.name !== nombre);
        this.eliminandoCola = null;
        this.toastSvc.exito(`Cola "${nombre}" eliminada.`);
      },
      error: err => {
        this.eliminandoCola = null;
        this.toastSvc.error(
          err?.status === 404
            ? `Cola "${nombre}" no encontrada.`
            : `No se pudo eliminar "${nombre}" (HTTP ${err?.status ?? '?'}).`
        );
      },
    });
  }

  colorTipo(tipo: string): string {
    const map: Record<string, string> = {
      direct:  'var(--cyan)',
      topic:   'var(--purple)',
      fanout:  'var(--yellow)',
      headers: 'var(--text-dim)',
    };
    return map[tipo] ?? 'var(--text)';
  }
}
