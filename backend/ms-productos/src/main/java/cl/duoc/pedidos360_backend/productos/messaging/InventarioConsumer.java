package cl.duoc.pedidos360_backend.productos.messaging;

import com.rabbitmq.client.Channel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Consumidor del dominio de Inventario.
 *
 * Escucha la cola productos.inventario (evento: producto creado).
 * Registra el nuevo producto en el sistema de inventario.
 * Implementa ACK/NACK manual: errores permanentes van a DLQ.
 */
@Component
public class InventarioConsumer {

    private static final Logger log = LoggerFactory.getLogger(InventarioConsumer.class);

    @RabbitListener(queues = "${app.rabbit.queues.inventario}")
    public void recibirProductoCreado(ProductoEventoDTO evento,
                                      Message message,
                                      Channel channel) throws IOException {
        long tag = message.getMessageProperties().getDeliveryTag();
        try {
            log.info("[INVENTARIO] Producto creado recibido: id={} nombre={}",
                    evento.getProductoId(), evento.getNombre());

            procesarInventario(evento);

            channel.basicAck(tag, false);
            log.info("[INVENTARIO] ACK enviado para productoId={}", evento.getProductoId());

        } catch (IllegalArgumentException ex) {
            log.error("[INVENTARIO] Error permanente productoId={}: {}",
                    evento.getProductoId(), ex.getMessage());
            channel.basicNack(tag, false, false);   // → DLQ

        } catch (Exception ex) {
            log.error("[INVENTARIO] Error inesperado productoId={}: {}",
                    evento.getProductoId(), ex.getMessage(), ex);
            channel.basicNack(tag, false, false);   // → DLQ
        }
    }

    private void procesarInventario(ProductoEventoDTO evento) {
        if (evento.getProductoId() == null) {
            throw new IllegalArgumentException("ProductoId no puede ser null");
        }
        // En producción: actualizar sistema de inventario externo
        log.info("[INVENTARIO] Stock inicial registrado: producto={} stock={}",
                evento.getNombre(), evento.getStock());
    }
}
