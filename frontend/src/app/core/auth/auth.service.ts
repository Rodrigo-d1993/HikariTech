import { Injectable } from '@angular/core';
import {
  signInWithRedirect,
  signOut,
  fetchAuthSession,
  getCurrentUser,
} from 'aws-amplify/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  login(): Promise<void> {
    return signInWithRedirect();
  }

  logout(): Promise<void> {
    return signOut();
  }

  async isAuthenticated(): Promise<boolean> {
    try {
      const session = await fetchAuthSession({ forceRefresh: true });
      return !!session.tokens?.accessToken;
    } catch {
      return false;
    }
  }

  async getAccessToken(): Promise<string | null> {
    const session = await fetchAuthSession({ forceRefresh: true });
    return session.tokens?.accessToken?.toString() ?? null;
  }

  async getClienteId(): Promise<string | null> {
    // El "sub" del usuario en Cognito, usado como identificador del cliente en los pedidos
    try {
      const user = await getCurrentUser();
      return user.userId;
    } catch {
      return null;
    }
  }

  // Texto para mostrar en la barra superior: el email si existe, si no el username
  async getUserLabel(): Promise<string> {
    try {
      const session = await fetchAuthSession();
      const email = session.tokens?.idToken?.payload?.['email'];
      if (typeof email === 'string' && email) {
        return email;
      }
      const user = await getCurrentUser();
      return user.username;
    } catch {
      return '';
    }
  }
}