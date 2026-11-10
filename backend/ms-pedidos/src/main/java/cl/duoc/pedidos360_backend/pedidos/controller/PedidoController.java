package cl.duoc.pedidos360_backend.pedidos.controller;

import cl.duoc.pedidos360_backend.pedidos.entity.EstadoPedido;
import cl.duoc.pedidos360_backend.pedidos.entity.Pedido;
import cl.duoc.pedidos360_backend.pedidos.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    /** Listar todos los pedidos. En modo Cognito el acceso está restringido a
     *  Admin en el SecurityConfig; en modo local es público. */
    @GetMapping("/todos")
    public List<Pedido> listarTodos() {
        return pedidoService.listarTodos();
    }

    /** Pedidos de un cliente.
     *  <p>En modo Cognito (jwt presente) el {@code clienteId} se toma del
     *  {@code sub} del token, ignorando el parámetro de query: así un cliente
     *  no puede consultar los pedidos de otro. En modo local (sin JWT) se usa
     *  el clienteId que envía el frontend. */
    @GetMapping
    public List<Pedido> listarPorCliente(@RequestParam(required = false) String clienteId,
                                         @AuthenticationPrincipal Jwt jwt) {
        String efectivo = clienteIdEfectivo(clienteId, jwt);
        return efectivo == null ? List.of() : pedidoService.listarPorCliente(efectivo);
    }

    /** Detalle de un pedido.
     *  <p>En modo Cognito, un cliente solo puede ver SUS pedidos; un Admin puede
     *  ver cualquiera. Si no es propietario ni admin se devuelve 404 (no se
     *  revela la existencia del pedido ajeno). En modo local no hay restricción. */
    @GetMapping("/{id}")
    public ResponseEntity<Pedido> buscarPorId(@PathVariable Long id,
                                             @AuthenticationPrincipal Jwt jwt) {
        return pedidoService.buscarPorId(id)
                .filter(p -> jwt == null || esAdmin(jwt)
                        || jwt.getSubject().equals(p.getClienteId()))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /** Crear un pedido.
     *  <p>En modo Cognito el {@code clienteId} se sobreescribe con el {@code sub}
     *  del token, de modo que el pedido siempre queda atribuido al usuario
     *  autenticado (no se confía en el cuerpo). En modo local se respeta el
     *  clienteId del body enviado por el frontend. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Pedido crear(@Valid @RequestBody Pedido pedido,
                        @AuthenticationPrincipal Jwt jwt) {
        if (jwt != null) {
            // sub → clienteId único e inmutable del usuario
            pedido.setClienteId(jwt.getSubject());
            // email → claim estándar de Cognito, usado para enviar notificaciones
            String email = jwt.getClaimAsString("email");
            if (email != null && !email.isBlank()) {
                pedido.setClienteEmail(email);
            }
        }
        return pedidoService.crear(pedido);
    }

    /** Cambiar el estado de un pedido. En modo Cognito el acceso está
     *  restringido a Admin en el SecurityConfig.
     *  El estado se valida contra el enum EstadoPedido: si el valor no es
     *  PENDIENTE/EN_PROCESO/ENTREGADO/CANCELADO se devuelve 400. */
    @PatchMapping("/{id}/estado")
    public ResponseEntity<Pedido> actualizarEstado(@PathVariable Long id,
                                                   @RequestBody Map<String, String> body) {
        String estadoStr = body.get("estado");
        EstadoPedido estadoEnum;
        try {
            estadoEnum = EstadoPedido.valueOf(estadoStr);
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException(
                "Estado inválido: '" + estadoStr + "'. Valores permitidos: "
                + java.util.Arrays.toString(EstadoPedido.values()));
        }
        return pedidoService.actualizarEstado(id, estadoEnum)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // ── Helpers de tenencia ──────────────────────────────────────────────────

    /** clienteId a usar: el {@code sub} del token si hay JWT (modo Cognito);
     *  si no, el del query (modo local). Null si no hay ninguno. */
    private String clienteIdEfectivo(String delQuery, Jwt jwt) {
        if (jwt != null) return jwt.getSubject();
        return (delQuery != null && !delQuery.isBlank()) ? delQuery : null;
    }

    /** true si el JWT tiene el grupo "Admin" en el claim cognito:groups. */
    private boolean esAdmin(Jwt jwt) {
        List<String> grupos = jwt.getClaimAsStringList("cognito:groups");
        return grupos != null && grupos.contains("Admin");
    }
}
