package cl.duoc.pedidos360_backend.rabbitadmin.controller;

import cl.duoc.pedidos360_backend.rabbitadmin.dto.CrearBindingRequest;
import cl.duoc.pedidos360_backend.rabbitadmin.dto.CrearColaRequest;
import cl.duoc.pedidos360_backend.rabbitadmin.dto.CrearExchangeRequest;
import cl.duoc.pedidos360_backend.rabbitadmin.service.RabbitAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;

/**
 * API REST de administración de RabbitMQ.
 *
 * Los controladores solo delegan al RabbitAdminService;
 * no contienen lógica de negocio ni detalles internos de RabbitMQ.
 *
 * Recursos expuestos:
 *   GET    /admin/queues              → lista todas las colas
 *   GET    /admin/queues/{nombre}     → detalle de una cola
 *   POST   /admin/queues              → crea una cola
 *   DELETE /admin/queues/{nombre}     → elimina una cola
 *
 *   GET    /admin/exchanges           → lista todos los exchanges
 *   POST   /admin/exchanges           → crea un exchange
 *   DELETE /admin/exchanges/{nombre}  → elimina un exchange
 *
 *   GET    /admin/bindings            → lista todos los bindings
 *   POST   /admin/bindings            → crea un binding
 *   DELETE /admin/bindings/{exchange}/{cola}/{routingKey} → elimina un binding
 *
 *   GET    /admin/overview            → resumen del broker
 */
@RestController
@RequestMapping("/admin")
public class RabbitAdminController {

    private final RabbitAdminService rabbitAdminService;

    public RabbitAdminController(RabbitAdminService rabbitAdminService) {
        this.rabbitAdminService = rabbitAdminService;
    }

    // ── Colas ─────────────────────────────────────────────────────────────────

    @GetMapping("/queues")
    public ResponseEntity<String> listarColas() {
        return ResponseEntity.ok(rabbitAdminService.listarColas());
    }

    @GetMapping("/queues/{nombre}")
    public ResponseEntity<String> obtenerCola(@PathVariable String nombre) {
        try {
            return ResponseEntity.ok(rabbitAdminService.obtenerCola(nombre));
        } catch (HttpClientErrorException.NotFound e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/queues")
    public ResponseEntity<String> crearCola(@Valid @RequestBody CrearColaRequest request) {
        rabbitAdminService.crearCola(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Cola creada: " + request.getNombre());
    }

    @DeleteMapping("/queues/{nombre}")
    public ResponseEntity<Void> eliminarCola(@PathVariable String nombre) {
        try {
            rabbitAdminService.eliminarCola(nombre);
            return ResponseEntity.noContent().build();
        } catch (HttpClientErrorException.NotFound e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Exchanges ─────────────────────────────────────────────────────────────

    @GetMapping("/exchanges")
    public ResponseEntity<String> listarExchanges() {
        return ResponseEntity.ok(rabbitAdminService.listarExchanges());
    }

    @PostMapping("/exchanges")
    public ResponseEntity<String> crearExchange(@Valid @RequestBody CrearExchangeRequest request) {
        rabbitAdminService.crearExchange(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Exchange creado: " + request.getNombre() + " [" + request.getTipo() + "]");
    }

    @DeleteMapping("/exchanges/{nombre}")
    public ResponseEntity<Void> eliminarExchange(@PathVariable String nombre) {
        try {
            rabbitAdminService.eliminarExchange(nombre);
            return ResponseEntity.noContent().build();
        } catch (HttpClientErrorException.NotFound e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Bindings ──────────────────────────────────────────────────────────────

    @GetMapping("/bindings")
    public ResponseEntity<String> listarBindings() {
        return ResponseEntity.ok(rabbitAdminService.listarBindings());
    }

    @PostMapping("/bindings")
    public ResponseEntity<String> crearBinding(@Valid @RequestBody CrearBindingRequest request) {
        rabbitAdminService.crearBinding(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body("Binding creado: " + request.getExchange()
                        + " → " + request.getCola()
                        + " [" + request.getRoutingKey() + "]");
    }

    @DeleteMapping("/bindings/{exchange}/{cola}/{routingKey}")
    public ResponseEntity<Void> eliminarBinding(@PathVariable String exchange,
                                                 @PathVariable String cola,
                                                 @PathVariable String routingKey) {
        try {
            rabbitAdminService.eliminarBinding(exchange, cola, routingKey);
            return ResponseEntity.noContent().build();
        } catch (HttpClientErrorException.NotFound e) {
            return ResponseEntity.notFound().build();
        }
    }

    // ── Overview ──────────────────────────────────────────────────────────────

    @GetMapping("/overview")
    public ResponseEntity<String> resumenBroker() {
        return ResponseEntity.ok(rabbitAdminService.resumenBroker());
    }
}
