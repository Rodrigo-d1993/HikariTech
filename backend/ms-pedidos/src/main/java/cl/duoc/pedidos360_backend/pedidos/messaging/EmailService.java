package cl.duoc.pedidos360_backend.pedidos.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Servicio de envío de emails via JavaMailSender (SMTP).
 *
 * En desarrollo se usa Gmail como servidor SMTP con una contraseña de
 * aplicación (no la contraseña real de la cuenta).
 *
 * En producción se reemplaza el host/port/credenciales por AWS SES u
 * otro proveedor cambiando solo variables de entorno — el código no cambia.
 *
 * NOTA ACADÉMICA: Este servicio demuestra el flujo completo de mensajería
 * asíncrona con RabbitMQ: pedido creado → evento en cola → Consumer lo
 * procesa → email enviado. En un sistema productivo real se usaría AWS SES
 * por su mayor escala y reputación de dominio, pero AWS Academy no incluye
 * ese servicio, por lo que usamos Gmail SMTP como alternativa equivalente.
 */
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Envía un email de confirmación cuando se crea un pedido.
     *
     * @param destinatario  Email del cliente (o clienteId si no hay email)
     * @param pedidoId      ID del pedido creado
     * @param estado        Estado inicial del pedido (PENDIENTE)
     */
    public void enviarConfirmacionPedido(String destinatario, Long pedidoId, String estado) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(from);
        mensaje.setTo(destinatario);
        mensaje.setSubject("HikariTec · Pedido #" + pedidoId + " confirmado");
        mensaje.setText(
            "¡Hola!\n\n" +
            "Tu pedido #" + pedidoId + " ha sido recibido correctamente.\n\n" +
            "Estado actual: " + estado + "\n\n" +
            "Te notificaremos cuando cambie el estado de tu pedido.\n\n" +
            "Gracias por comprar en HikariTec.\n" +
            "─────────────────────────────\n" +
            "Este es un email automático generado por el sistema de pedidos.\n" +
            "Demostración del flujo RabbitMQ → Consumer → JavaMailSender SMTP."
        );

        mailSender.send(mensaje);
        log.info("[EMAIL] Confirmación enviada a {} para pedido #{}", destinatario, pedidoId);
    }

    /**
     * Envía un email de actualización de estado de un pedido.
     *
     * @param destinatario   Email del cliente
     * @param pedidoId       ID del pedido
     * @param estadoAnterior Estado previo
     * @param estadoNuevo    Nuevo estado
     */
    public void enviarActualizacionEstado(String destinatario, Long pedidoId,
                                          String estadoAnterior, String estadoNuevo) {
        SimpleMailMessage mensaje = new SimpleMailMessage();
        mensaje.setFrom(from);
        mensaje.setTo(destinatario);
        mensaje.setSubject("HikariTec · Pedido #" + pedidoId + " — Estado actualizado");
        mensaje.setText(
            "¡Hola!\n\n" +
            "Tu pedido #" + pedidoId + " ha sido actualizado.\n\n" +
            "Estado anterior: " + estadoAnterior + "\n" +
            "Estado nuevo:    " + estadoNuevo    + "\n\n" +
            obtenerMensajeEstado(estadoNuevo) + "\n\n" +
            "Gracias por comprar en HikariTec.\n" +
            "─────────────────────────────\n" +
            "Este es un email automático generado por el sistema de pedidos."
        );

        mailSender.send(mensaje);
        log.info("[EMAIL] Actualización de estado enviada a {} para pedido #{} ({} → {})",
                destinatario, pedidoId, estadoAnterior, estadoNuevo);
    }

    private String obtenerMensajeEstado(String estado) {
        return switch (estado) {
            case "EN_PROCESO" -> "Tu pedido está siendo preparado.";
            case "ENTREGADO"  -> "¡Tu pedido ha sido entregado! Esperamos que disfrutes tu compra.";
            case "CANCELADO"  -> "Tu pedido ha sido cancelado. Si tienes dudas, contáctanos.";
            default           -> "El estado de tu pedido ha sido actualizado.";
        };
    }
}
