import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">Hikari<span class="accent">Tec</span><span class="dot">.</span></div>
        <p class="login-tagline">Tu tienda gamer de confianza</p>

        <div class="alert-error" *ngIf="error">{{ error }}</div>

        <button class="btn btn-primary btn-full" (click)="login()" [disabled]="cargando">
          {{ cargando ? 'Redirigiendo...' : 'Iniciar sesión' }}
        </button>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  cargando = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    if (await this.auth.isAuthenticated()) {
      this.router.navigate(['/productos']);
    }
  }

  async login(): Promise<void> {
    this.cargando = true;
    this.error = '';
    try {
      await this.auth.login();
    } catch (e) {
      console.error(e);
      this.error = 'No se pudo iniciar sesión. Revisa la configuración de Cognito.';
      this.cargando = false;
    }
  }
}
