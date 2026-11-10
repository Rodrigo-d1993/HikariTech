package cl.duoc.pedidos360_backend.pedidos.messaging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Productor de eventos de pedidos.
 *
 * Publica en pedidos.exchange (DIRECT) con las routing keys definidas
 * en application.yml. La lógica de negocio solo llama a este servicio;
 * no conoce detalles internos de RabbitMQ.
 */
@Service
public class PedidoProducer {

    private static final Logger log = LoggerFactory.getLogger(PedidoProducer.class);

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbit.exchanges.pedidos}")
    private String exchange;

    @Value("${app.rabbit.routing-keys.pedido-creado}")
    private String rkPedidoCreado;

    @Value("${app.rabbit.routing-keys.pedido-estado}")
    private String rkPedidoEstado;

    public PedidoProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    /**
     * Publica un evento cuando se crea un nuevo pedido.
     * Routing key: pedido.creado  →  cola pedidos.notificacion
     */
    public void publicarPedidoCreado(PedidoEventoDTO evento) {
        log.info("[PRODUCER] Publicando evento PEDIDO_CREADO para pedidoId={}", evento.getPedidoId());
        rabbitTemplate.convertAndSend(exchange, rkPedidoCreado, evento);
    }

    /**
     * Publica un evento cuando se actualiza el estado de un pedido.
     * Routing key: pedido.estado  →  cola pedidos.auditoria
     */
    public void publicarEstadoActualizado(PedidoEventoDTO evento) {
        log.info("[PRODUCER] Publicando evento ESTADO_ACTUALIZADO pedidoId={} estado={}",
                evento.getPedidoId(), evento.getEstado());
        rabbitTemplate.convertAndSend(exchange, rkPedidoEstado, evento);
    }
}
