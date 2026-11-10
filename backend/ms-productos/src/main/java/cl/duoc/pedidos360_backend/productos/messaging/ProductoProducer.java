package cl.duoc.pedidos360_backend.productos.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Productor de eventos de productos.
 *
 * Publica en productos.exchange (TOPIC) usando las routing keys
 * definidas en application.yml.
 */
@Service
public class ProductoProducer {

    private static final Logger log = LoggerFactory.getLogger(ProductoProducer.class);

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbit.exchanges.productos}")
    private String exchange;

    @Value("${app.rabbit.routing-keys.producto-creado}")
    private String rkProductoCreado;

    public ProductoProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Publica evento cuando se crea un producto.
     * Routing key: producto.creado → colas: productos.inventario + productos.log
     */
    public void publicarProductoCreado(ProductoEventoDTO evento) {
        log.info("[PRODUCER] Publicando PRODUCTO_CREADO para productoId={}", evento.getProductoId());
        rabbitTemplate.convertAndSend(exchange, rkProductoCreado, evento);
    }

    /**
     * Publica evento cuando se actualiza un producto.
     * Routing key: producto.actualizado → cola: productos.log  (por el patrón producto.#)
     */
    public void publicarProductoActualizado(ProductoEventoDTO evento) {
        log.info("[PRODUCER] Publicando PRODUCTO_ACTUALIZADO para productoId={}", evento.getProductoId());
        rabbitTemplate.convertAndSend(exchange, "producto.actualizado", evento);
    }

    /**
     * Publica evento cuando se elimina un producto.
     * Routing key: producto.eliminado → cola: productos.log  (por el patrón producto.#)
     */
    public void publicarProductoEliminado(ProductoEventoDTO evento) {
        log.info("[PRODUCER] Publicando PRODUCTO_ELIMINADO para productoId={}", evento.getProductoId());
        rabbitTemplate.convertAndSend(exchange, "producto.eliminado", evento);
    }
}
