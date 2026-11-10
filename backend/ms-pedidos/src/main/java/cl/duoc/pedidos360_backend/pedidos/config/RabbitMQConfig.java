package cl.duoc.pedidos360_backend.pedidos.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración centralizada de RabbitMQ para ms-pedidos.
 *
 * Topología:
 *   pedidos.exchange (DIRECT)
 *     ├── pedido.creado  →  pedidos.notificacion  (DLX → pedidos.dlx → pedidos.notificacion.dlq)
 *     └── pedido.estado  →  pedidos.auditoria     (DLX → pedidos.dlx → pedidos.auditoria.dlq)
 */
@Configuration
public class RabbitMQConfig {

    // ── Valores leídos del application.yml ──────────────────────────────────
    @Value("${app.rabbit.exchanges.pedidos}")
    private String pedidosExchange;

    @Value("${app.rabbit.dlx}")
    private String pedidosDlx;

    @Value("${app.rabbit.queues.notificacion}")
    private String colaNotificacion;

    @Value("${app.rabbit.queues.auditoria}")
    private String colaAuditoria;

    @Value("${app.rabbit.queues.notificacion-dlq}")
    private String colaNotificacionDlq;

    @Value("${app.rabbit.queues.auditoria-dlq}")
    private String colaAuditoriaDlq;

    @Value("${app.rabbit.routing-keys.pedido-creado}")
    private String rkPedidoCreado;

    @Value("${app.rabbit.routing-keys.pedido-estado}")
    private String rkPedidoEstado;

    // ── Conversor JSON ───────────────────────────────────────────────────────
    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public RabbitTemplate rabbitTemplate(ConnectionFactory connectionFactory) {
        RabbitTemplate template = new RabbitTemplate(connectionFactory);
        template.setMessageConverter(jsonMessageConverter());
        return template;
    }

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(
            ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setMessageConverter(jsonMessageConverter());
        // acknowledge-mode y prefetch se toman del application.yml
        return factory;
    }

    // ── Exchange principal (DIRECT) ──────────────────────────────────────────
    @Bean
    public DirectExchange pedidosExchange() {
        return new DirectExchange(pedidosExchange, true, false);
    }

    // ── Dead-Letter Exchange (DIRECT) ────────────────────────────────────────
    @Bean
    public DirectExchange pedidosDlx() {
        return new DirectExchange(pedidosDlx, true, false);
    }

    // ── Colas principales con DLX apuntando al pedidosDlx ───────────────────
    @Bean
    public Queue colaNotificacion() {
        return QueueBuilder.durable(colaNotificacion)
                .deadLetterExchange(pedidosDlx)
                .deadLetterRoutingKey(colaNotificacion)
                .build();
    }

    @Bean
    public Queue colaAuditoria() {
        return QueueBuilder.durable(colaAuditoria)
                .deadLetterExchange(pedidosDlx)
                .deadLetterRoutingKey(colaAuditoria)
                .build();
    }

    // ── Dead-Letter Queues ────────────────────────────────────────────────────
    @Bean
    public Queue colaNotificacionDlq() {
        return QueueBuilder.durable(colaNotificacionDlq).build();
    }

    @Bean
    public Queue colaAuditoriaDlq() {
        return QueueBuilder.durable(colaAuditoriaDlq).build();
    }

    // ── Bindings exchange principal ──────────────────────────────────────────
    @Bean
    public Binding bindingNotificacion(Queue colaNotificacion, DirectExchange pedidosExchange) {
        return BindingBuilder.bind(colaNotificacion).to(pedidosExchange).with(rkPedidoCreado);
    }

    @Bean
    public Binding bindingAuditoria(Queue colaAuditoria, DirectExchange pedidosExchange) {
        return BindingBuilder.bind(colaAuditoria).to(pedidosExchange).with(rkPedidoEstado);
    }

    // ── Bindings DLX → DLQs ──────────────────────────────────────────────────
    @Bean
    public Binding bindingNotificacionDlq(Queue colaNotificacionDlq, DirectExchange pedidosDlx) {
        return BindingBuilder.bind(colaNotificacionDlq).to(pedidosDlx).with(colaNotificacion);
    }

    @Bean
    public Binding bindingAuditoriaDlq(Queue colaAuditoriaDlq, DirectExchange pedidosDlx) {
        return BindingBuilder.bind(colaAuditoriaDlq).to(pedidosDlx).with(colaAuditoria);
    }
}
