package cl.duoc.pedidos360_backend.productos.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Manejo global de excepciones para ms-productos.
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

    // ── Error de negocio: stock insuficiente, producto no existe, etc. ────────
    // IllegalArgumentException → 400 Bad Request
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return buildError(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    // ── Validación de campos (@Valid en el @RequestBody) ──────────────────────
    // MethodArgumentNotValidException → 400 Bad Request con detalle de campos
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String detalle = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return buildError(HttpStatus.BAD_REQUEST, "Datos inválidos: " + detalle);
    }

    // ── Cualquier otra excepción no controlada ────────────────────────────────
    // Exception → 500 Internal Server Error
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
