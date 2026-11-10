import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from './role.service';
import { ViewModeService } from './view-mode.service';

/** Solo los clientes (o Admin en vista cliente) pueden acceder a Mis pedidos */
export const clienteGuard: CanActivateFn = async () => {
  const role     = inject(RoleService);
  const viewMode = inject(ViewModeService);
  const router   = inject(Router);
  // Permitir si es cliente real, o si es admin en modo vista cliente
  if (await role.isCliente()) return true;
  if (await role.isAdmin() && !viewMode.esVistaAdmin()) return true;
  return router.createUrlTree(['/productos']);
};
