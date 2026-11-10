import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- HERO -->
    <section class="home-hero">
      <div class="home-hero-content">
        <div class="home-hero-tag">Tienda Gamer #1 en Chile</div>
        <h1 class="home-hero-title">
          Equipa tu setup.<br>
          <span class="home-hero-accent">Domina el juego.</span>
        </h1>
        <p class="home-hero-sub">
          Periféricos, monitores, sillas y accesorios gamer con envío rápido y garantía real.
          Todo lo que necesitas para llevar tu experiencia al siguiente nivel.
        </p>
        <div class="home-hero-actions">
          <button class="btn btn-primary home-btn-lg" (click)="entrar()">
            Ver catálogo
          </button>
          <button class="btn btn-ghost home-btn-lg" (click)="scrollTo('features')">
            Conocer más
          </button>
        </div>
        <div class="home-stats">
          <div class="home-stat">
            <span class="home-stat-num">500+</span>
            <span class="home-stat-label">Productos</span>
          </div>
          <div class="home-stat-divider"></div>
          <div class="home-stat">
            <span class="home-stat-num">12K+</span>
            <span class="home-stat-label">Clientes</span>
          </div>
          <div class="home-stat-divider"></div>
          <div class="home-stat">
            <span class="home-stat-num">4.9★</span>
            <span class="home-stat-label">Valoración</span>
          </div>
        </div>
      </div>
      <div class="home-hero-visual">
        <div class="home-glow-circle"></div>
        <div class="home-hero-img-wrap">
          <img src="https://images.unsplash.com/photo-1616763355548-1b606f439f86?w=600&q=80"
               alt="Setup gamer" (error)="onImgErr($event)">
        </div>
      </div>
    </section>

    <!-- CATEGORÍAS -->
    <section class="home-section" id="features">
      <h2 class="home-section-title">Categorías destacadas</h2>
      <div class="home-cats">
        <div class="home-cat-card" *ngFor="let c of categorias">
          <div class="home-cat-icon">{{ c.icon }}</div>
          <div class="home-cat-name">{{ c.nombre }}</div>
          <div class="home-cat-desc">{{ c.desc }}</div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="home-section home-features-section">
      <div class="home-features">
        <div class="home-feature" *ngFor="let f of features">
          <div class="home-feature-icon">{{ f.icon }}</div>
          <div>
            <div class="home-feature-title">{{ f.titulo }}</div>
            <div class="home-feature-desc">{{ f.desc }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="home-cta">
      <h2>¿Listo para armar tu setup ideal?</h2>
      <p>Crea tu cuenta gratis y empieza a comprar en segundos.</p>
      <button class="btn btn-primary home-btn-lg" (click)="entrar()">Comenzar ahora</button>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  categorias = [
    { icon: '⌨', nombre: 'Teclados',   desc: 'Mecánicos, membrana, inalámbricos' },
    { icon: '🖱', nombre: 'Mouse',      desc: 'Alta precisión, hasta 25600 DPI' },
    { icon: '🖥', nombre: 'Monitores',  desc: '144Hz, 240Hz, 4K HDR' },
    { icon: '🎧', nombre: 'Audio',      desc: 'Headsets 7.1 y auriculares pro' },
    { icon: '💺', nombre: 'Sillas',     desc: 'Ergonómicas con soporte lumbar' },
    { icon: '🖱', nombre: 'Accesorios', desc: 'Mousepads, soportes y más' },
  ];

  features = [
    { icon: '🚚', titulo: 'Envío rápido',      desc: 'Despacho en 24-48 hrs a todo Chile' },
    { icon: '🔒', titulo: 'Pago seguro',        desc: 'SSL y múltiples métodos de pago' },
    { icon: '↩',  titulo: 'Devoluciones',       desc: '30 días para cambios sin preguntas' },
    { icon: '🎮', titulo: 'Garantía real',       desc: 'Todos los productos con garantía de fábrica' },
  ];

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    if (await this.auth.isAuthenticated()) {
      this.router.navigate(['/productos']);
    }
  }

  async entrar(): Promise<void> {
    if (await this.auth.isAuthenticated()) {
      this.router.navigate(['/productos']);
    } else {
      await this.auth.login();
    }
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  onImgErr(e: Event): void {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
