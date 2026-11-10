package cl.duoc.pedidos360_backend.rabbitadmin.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Manejo global de excepciones para ms-rabbit-admin.
 *
 * Sin este handler, Spring devuelve un 500 sin cuerpo útil cuando ocurre
 * un error de negocio. Con él, cada excepción se mapea a un HTTP status
 * apropiado y un JSON descriptivo que el frontend puede leer.
 *
 * Flujo:
 *   Excepción lanzada en Service/Controller
 *       │
 *       └─► Spring busca un @ExceptionHandler que la maneje
 *                   │
 *                   └─► GlobalExceptionHandler la intercepta
 *                               │
 *                               └─► devuelve ResponseEntity con JSON de error
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    // ── Error 4xx de la Management API de RabbitMQ (ej. cola ya existe) ───────
    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<Map<String, Object>> handleRabbitClientError(HttpClientErrorException ex) {
        return buildError(
                HttpStatus.valueOf(ex.getStatusCode().value()),
                "Error en RabbitMQ: " + ex.getMessage());
    }

    // ── Error 5xx de la Management API de RabbitMQ ────────────────────────────
    @ExceptionHandler(HttpServerErrorException.class)
    public ResponseEntity<Map<String, Object>> handleRabbitServerError(HttpServerErrorException ex) {
        return buildError(HttpStatus.BAD_GATEWAY,
                "RabbitMQ Management API no disponible: " + ex.getMessage());
    }

    // ── Validación de campos (@Valid en el @RequestBody) ──────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String detalle = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return buildError(HttpStatus.BAD_REQUEST, "Datos inválidos: " + detalle);
    }

    // ── Cualquier otra excepción no controlada ────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneric(Exception ex) {
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR,
                "Error interno del servidor");
    }

    // ── Helper: construye el cuerpo JSON de error ─────────────────────────────
    private ResponseEntity<Map<String, Object>> buildError(HttpStatus status, String mensaje) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status",    status.value());
        body.put("error",     status.getReasonPhrase());
        body.put("mensaje",   mensaje);
        return ResponseEntity.status(status).body(body);
    }
}
