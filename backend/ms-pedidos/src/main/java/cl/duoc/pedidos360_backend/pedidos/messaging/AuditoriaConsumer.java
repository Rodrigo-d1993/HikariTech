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
 * Consumidor del dominio de Auditoría.
 *
 * Escucha la cola pedidos.auditoria (evento: cambio de estado del pedido).
 * Envía un email de actualización de estado al cliente.
 * Implementa ACK/NACK manual: ACK si todo fue bien, NACK → DLQ si falla.
 */
@Component
public class AuditoriaConsumer {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaConsumer.class);

    private final EmailService emailService;

    @Value("${MAIL_DEMO_RECIPIENT:gamehikari.tech@gmail.com}")
    private String demoRecipient;

    public AuditoriaConsumer(EmailService emailService) {
        this.emailService = emailService;
    }

    @RabbitListener(queues = "${app.rabbit.queues.auditoria}")
    public void recibirCambioEstado(PedidoEventoDTO evento,
                                    Message message,
                                    Channel channel) throws IOException {
        long tag = message.getMessageProperties().getDeliveryTag();

        try {
            if (evento.getPedidoId() == null || evento.getEstado() == null) {
                throw new IllegalArgumentException("PedidoId y estado son obligatorios");
            }

            log.info("[AUDITORIA] Procesando pedidoId={} estado={}",
                    evento.getPedidoId(), evento.getEstado());

            // Usar el email real del cliente o el destinatario de demo en modo local
            String destinatario = (evento.getClienteEmail() != null
                    && !evento.getClienteEmail().isBlank())
                    ? evento.getClienteEmail()
                    : demoRecipient;

            emailService.enviarActualizacionEstado(
                    destinatario,
                    evento.getPedidoId(),
                    "ANTERIOR",
                    evento.getEstado()
            );

            log.info("[AUDITORIA] Email enviado a {} — pedido={} estado={}",
                    destinatario, evento.getPedidoId(), evento.getEstado());

            // ACK: procesado correctamente, Rabbit elimina el mensaje
            channel.basicAck(tag, false);
            log.info("[AUDITORIA] ACK enviado para pedidoId={}", evento.getPedidoId());

        } catch (Exception ex) {
            // Cualquier error → NACK a DLQ (requeue=false)
            log.error("[AUDITORIA] Error procesando pedidoId={}: {}",
                    evento.getPedidoId(), ex.getMessage(), ex);
            try {
                channel.basicNack(tag, false, false);
            } catch (IOException ioe) {
                log.error("[AUDITORIA] Error enviando NACK: {}", ioe.getMessage());
            }
        }
    }
}
