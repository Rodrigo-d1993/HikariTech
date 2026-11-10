import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from './role.service';
import { ViewModeService } from './view-mode.service';

export const adminGuard: CanActivateFn = async () => {
  const role     = inject(RoleService);
  const viewMode = inject(ViewModeService);
  const router   = inject(Router);

  // El rol se determina únicamente desde el claim cognito:groups del token.
  // No se usa el caché de localStorage como fallback: sería falsificable desde
  // la consola del navegador (localStorage.setItem('hikaritec_es_admin', 'true')).
  // Si el token dice "no admin", se niega el acceso (fail-closed).
  if (await role.isAdmin() && viewMode.esVistaAdmin()) return true;
  return router.createUrlTree(['/productos']);
};
