package cl.duoc.pedidos360_backend.rabbitadmin.service;

import cl.duoc.pedidos360_backend.rabbitadmin.dto.CrearBindingRequest;
import cl.duoc.pedidos360_backend.rabbitadmin.dto.CrearColaRequest;
import cl.duoc.pedidos360_backend.rabbitadmin.dto.CrearExchangeRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;

import java.util.Map;

/**
 * Servicio de administración de RabbitMQ.
 *
 * Toda la lógica de creación, consulta y eliminación de recursos RabbitMQ
 * está encapsulada aquí. Los controladores llaman a métodos de alto nivel
 * y no conocen detalles internos de la API Management de RabbitMQ.
 *
 * Utiliza la API HTTP de RabbitMQ Management (puerto 15672).
 * Documentación: https://www.rabbitmq.com/management.html#http-api
 */
@Service
public class RabbitAdminService {

    private static final Logger log = LoggerFactory.getLogger(RabbitAdminService.class);
    private static final String VHOST = "%2F";   // "/" URL-encoded

    private final RestClient restClient;

    public RabbitAdminService(RestClient rabbitAdminRestClient) {
        this.restClient = rabbitAdminRestClient;
    }

    // ── Colas ────────────────────────────────────────────────────────────────

    public String listarColas() {
        log.info("[ADMIN] Listando colas");
        return restClient.get()
                .uri("/queues")
                .retrieve()
                .body(String.class);
    }

    public String obtenerCola(String nombre) {
        log.info("[ADMIN] Obteniendo cola: {}", nombre);
        return restClient.get()
                .uri("/queues/{vhost}/{nombre}", VHOST, nombre)
                .retrieve()
                .body(String.class);
    }

    public void crearCola(CrearColaRequest request) {
        log.info("[ADMIN] Creando cola: {}", request.getNombre());
        Map<String, Object> body = Map.of(
                "durable",     request.isDurable(),
                "auto_delete", request.isAutoDelete(),
                "arguments",   Map.of()
        );
        restClient.put()
                .uri("/queues/{vhost}/{nombre}", VHOST, request.getNombre())
                .body(body)
                .retrieve()
                .toBodilessEntity();
        log.info("[ADMIN] Cola creada: {}", request.getNombre());
    }

    public void eliminarCola(String nombre) {
        log.info("[ADMIN] Eliminando cola: {}", nombre);
        try {
            restClient.delete()
                    .uri("/queues/{vhost}/{nombre}", VHOST, nombre)
                    .retrieve()
                    .toBodilessEntity();
            log.info("[ADMIN] Cola eliminada: {}", nombre);
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("[ADMIN] Cola no encontrada para eliminar: {}", nombre);
            throw e;
        }
    }

    // ── Exchanges ─────────────────────────────────────────────────────────────

    public String listarExchanges() {
        log.info("[ADMIN] Listando exchanges");
        return restClient.get()
                .uri("/exchanges")
                .retrieve()
                .body(String.class);
    }

    public void crearExchange(CrearExchangeRequest request) {
        log.info("[ADMIN] Creando exchange: {} tipo: {}", request.getNombre(), request.getTipo());
        Map<String, Object> body = Map.of(
                "type",        request.getTipo(),
                "durable",     request.isDurable(),
                "auto_delete", request.isAutoDelete(),
                "arguments",   Map.of()
        );
        restClient.put()
                .uri("/exchanges/{vhost}/{nombre}", VHOST, request.getNombre())
                .body(body)
                .retrieve()
                .toBodilessEntity();
        log.info("[ADMIN] Exchange creado: {}", request.getNombre());
    }

    public void eliminarExchange(String nombre) {
        log.info("[ADMIN] Eliminando exchange: {}", nombre);
        try {
            restClient.delete()
                    .uri("/exchanges/{vhost}/{nombre}", VHOST, nombre)
                    .retrieve()
                    .toBodilessEntity();
            log.info("[ADMIN] Exchange eliminado: {}", nombre);
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("[ADMIN] Exchange no encontrado para eliminar: {}", nombre);
            throw e;
        }
    }

    // ── Bindings ──────────────────────────────────────────────────────────────

    public String listarBindings() {
        log.info("[ADMIN] Listando bindings");
        return restClient.get()
                .uri("/bindings")
                .retrieve()
                .body(String.class);
    }

    public void crearBinding(CrearBindingRequest request) {
        log.info("[ADMIN] Creando binding: {} → {} [{}]",
                request.getExchange(), request.getCola(), request.getRoutingKey());
        Map<String, Object> body = Map.of(
                "routing_key", request.getRoutingKey(),
                "arguments",   Map.of()
        );
        restClient.post()
                .uri("/bindings/{vhost}/e/{exchange}/q/{cola}",
                        VHOST, request.getExchange(), request.getCola())
                .body(body)
                .retrieve()
                .toBodilessEntity();
        log.info("[ADMIN] Binding creado: {} → {}", request.getExchange(), request.getCola());
    }

    public void eliminarBinding(String exchange, String cola, String routingKey) {
        log.info("[ADMIN] Eliminando binding: {} → {} [{}]", exchange, cola, routingKey);
        try {
            restClient.delete()
                    .uri("/bindings/{vhost}/e/{exchange}/q/{cola}/{rk}",
                            VHOST, exchange, cola, routingKey)
                    .retrieve()
                    .toBodilessEntity();
            log.info("[ADMIN] Binding eliminado");
        } catch (HttpClientErrorException.NotFound e) {
            log.warn("[ADMIN] Binding no encontrado para eliminar");
            throw e;
        }
    }

    // ── Vista general ─────────────────────────────────────────────────────────

    public String resumenBroker() {
        log.info("[ADMIN] Obteniendo resumen del broker");
        return restClient.get()
                .uri("/overview")
                .retrieve()
                .body(String.class);
    }
}
