package cl.duoc.pedidos360_backend.pedidos.messaging;

import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Consumidor del dominio de Notificaciones.
 *
 * Escucha la cola pedidos.notificacion (evento: pedido creado).
 * Envía un email de confirmación al cliente usando JavaMailSender (SMTP Gmail).
 *
 * NOTA: El clienteId es el sub (UUID) de Cognito, no un email. Para esta
 * demo el email de confirmación se envía a la dirección configurada en
 * MAIL_DEMO_RECIPIENT (por defecto la misma cuenta de envío), lo que permite
 * verificar que el flujo RabbitMQ → Consumer → Email funciona end-to-end.
 * En producción se obtendría el email del cliente desde un servicio de
 * perfiles de usuario.
 *
 * Implementa ACK/NACK manual:
 *   - ACK si el email se envió correctamente
 *   - NACK (requeue=false) si hay error permanente → mensaje va a DLQ
 */
@Component
public class NotificacionConsumer {

    private static final Logger log = LoggerFactory.getLogger(NotificacionConsumer.class);

    private final EmailService emailService;

    /** Destinatario de demo: recibe los emails de confirmación de pedidos. */
    @Value("${MAIL_DEMO_RECIPIENT:gamehikari.tech@gmail.com}")
    private String demoRecipient;

    public NotificacionConsumer(EmailService emailService) {
        this.emailService = emailService;
    }

    @RabbitListener(queues = "${app.rabbit.queues.notificacion}")
    public void recibirPedidoCreado(PedidoEventoDTO evento,
                                    Message message,
                                    Channel channel) throws IOException {
        long tag = message.getMessageProperties().getDeliveryTag();
        try {
            if (evento.getPedidoId() == null) {
                throw new IllegalArgumentException("PedidoId no puede ser null");
            }

            // Usar el email real del cliente extraído del JWT de Cognito.
            // Si no hay email (modo local sin JWT), usar el destinatario de demo.
            String destinatario = (evento.getClienteEmail() != null && !evento.getClienteEmail().isBlank())
                    ? evento.getClienteEmail()
                    : demoRecipient;

            log.info("[NOTIFICACION] Procesando pedidoId={} → enviando email a {}",
                    evento.getPedidoId(), destinatario);

            emailService.enviarConfirmacionPedido(
                    destinatario,
                    evento.getPedidoId(),
                    evento.getEstado()
            );

            // ACK: mensaje procesado correctamente, Rabbit lo elimina de la cola.
            channel.basicAck(tag, false);
            log.info("[NOTIFICACION] ACK — email enviado para pedidoId={}", evento.getPedidoId());

        } catch (IllegalArgumentException ex) {
            // Error permanente (datos inválidos): no reencolar → DLQ.
            log.error("[NOTIFICACION] Error permanente pedidoId={}: {}",
                    evento.getPedidoId(), ex.getMessage());
            channel.basicNack(tag, false, false);

        } catch (Exception ex) {
            // Error inesperado (fallo SMTP, red, etc.): → DLQ.
            log.error("[NOTIFICACION] Error enviando email pedidoId={}: {}",
                    evento.getPedidoId(), ex.getMessage(), ex);
            channel.basicNack(tag, false, false);
        }
    }
}
