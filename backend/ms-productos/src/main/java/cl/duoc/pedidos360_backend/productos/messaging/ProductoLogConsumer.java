package cl.duoc.pedidos360_backend.productos.messaging;

import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Consumidor del dominio de Logs de Productos.
 *
 * Escucha la cola productos.log que recibe TODOS los eventos de productos
 * gracias al patrón topic "producto.#":
 *   - producto.creado
 *   - producto.actualizado
 *   - producto.eliminado
 *
 * Implementa ACK/NACK manual. Los mensajes fallidos quedan en DLQ
 * para inspección posterior sin pérdida de datos.
 */
@Component
public class ProductoLogConsumer {

    private static final Logger log = LoggerFactory.getLogger(ProductoLogConsumer.class);

    @RabbitListener(queues = "${app.rabbit.queues.log}")
    public void recibirEvento(ProductoEventoDTO evento,
                              Message message,
                              Channel channel) throws IOException {
        long tag = message.getMessageProperties().getDeliveryTag();
        try {
            String routingKey = message.getMessageProperties().getReceivedRoutingKey();
            log.info("[PRODUCTO-LOG] Evento recibido | routingKey={} | productoId={} | tipo={}",
                    routingKey, evento.getProductoId(), evento.getTipoEvento());

            registrarLog(evento, routingKey);

            channel.basicAck(tag, false);

        } catch (IllegalArgumentException ex) {
            log.error("[PRODUCTO-LOG] Error permanente productoId={}: {}",
                    evento.getProductoId(), ex.getMessage());
            channel.basicNack(tag, false, false);   // → DLQ

        } catch (Exception ex) {
            log.error("[PRODUCTO-LOG] Error inesperado productoId={}: {}",
                    evento.getProductoId(), ex.getMessage(), ex);
            channel.basicNack(tag, false, false);   // → DLQ
        }
    }

    private void registrarLog(ProductoEventoDTO evento, String routingKey) {
        if (evento.getProductoId() == null) {
            throw new IllegalArgumentException("ProductoId no puede ser null en log");
        }
        // En producción: persistir en tabla de logs o enviar a CloudWatch/ELK
        log.info("[PRODUCTO-LOG] LOG PERSISTIDO | rk={} | id={} | nombre={} | precio={} | stock={}",
                routingKey, evento.getProductoId(), evento.getNombre(),
                evento.getPrecio(), evento.getStock());
    }
}
