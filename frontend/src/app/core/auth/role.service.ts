import { Injectable } from '@angular/core';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Lee el claim "cognito:groups" del ID token para determinar el rol del usuario.
 * Cognito incluye automáticamente los grupos del usuario en este claim.
 */
@Injectable({ providedIn: 'root' })
export class RoleService {

  async getGroups(): Promise<string[]> {
    try {
      // forceRefresh: true renueva el token si expiró; evita que grupos
      // aparezcan vacíos cuando el id-token ya no está en caché.
      const session = await fetchAuthSession({ forceRefresh: true });
      const payload = session.tokens?.idToken?.payload;
      const groups = payload?.['cognito:groups'];
      if (Array.isArray(groups)) return groups as string[];
      return [];
    } catch {
      return [];
    }
  }

  async isAdmin(): Promise<boolean> {
    const groups = await this.getGroups();
    return groups.includes('Admin');
  }

  async isCliente(): Promise<boolean> {
    const groups = await this.getGroups();
    return groups.includes('Cliente') || !groups.includes('Admin');
  }
}
