package cl.duoc.pedidos360_backend.productos.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuración centralizada de RabbitMQ para ms-productos.
 *
 * Topología:
 *   productos.exchange (TOPIC)
 *     ├── producto.creado   →  productos.inventario  (DLX → productos.dlx → productos.inventario.dlq)
 *     └── producto.#        →  productos.log         (DLX → productos.dlx → productos.log.dlq)
 */
@Configuration
public class RabbitMQConfig {

    @Value("${app.rabbit.exchanges.productos}")
    private String productosExchange;

    @Value("${app.rabbit.dlx}")
    private String productosDlx;

    @Value("${app.rabbit.queues.inventario}")
    private String colaInventario;

    @Value("${app.rabbit.queues.log}")
    private String colaLog;

    @Value("${app.rabbit.queues.inventario-dlq}")
    private String colaInventarioDlq;

    @Value("${app.rabbit.queues.log-dlq}")
    private String colaLogDlq;

    @Value("${app.rabbit.routing-keys.producto-creado}")
    private String rkProductoCreado;

    @Value("${app.rabbit.routing-keys.producto-pattern}")
    private String rkProductoPattern;

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
        return factory;
    }

    // ── Exchange principal (TOPIC) ────────────────────────────────────────────
    @Bean
    public TopicExchange productosExchange() {
        return new TopicExchange(productosExchange, true, false);
    }

    // ── Dead-Letter Exchange (DIRECT) ─────────────────────────────────────────
    @Bean
    public DirectExchange productosDlx() {
        return new DirectExchange(productosDlx, true, false);
    }

    // ── Colas principales con DLX ─────────────────────────────────────────────
    @Bean
    public Queue colaInventario() {
        return QueueBuilder.durable(colaInventario)
                .deadLetterExchange(productosDlx)
                .deadLetterRoutingKey(colaInventario)
                .build();
    }

    @Bean
    public Queue colaLog() {
        return QueueBuilder.durable(colaLog)
                .deadLetterExchange(productosDlx)
                .deadLetterRoutingKey(colaLog)
                .build();
    }

    // ── Dead-Letter Queues ────────────────────────────────────────────────────
    @Bean
    public Queue colaInventarioDlq() {
        return QueueBuilder.durable(colaInventarioDlq).build();
    }

    @Bean
    public Queue colaLogDlq() {
        return QueueBuilder.durable(colaLogDlq).build();
    }

    // ── Bindings exchange TOPIC → colas ──────────────────────────────────────
    @Bean
    public Binding bindingInventario(Queue colaInventario, TopicExchange productosExchange) {
        return BindingBuilder.bind(colaInventario).to(productosExchange).with(rkProductoCreado);
    }

    @Bean
    public Binding bindingLog(Queue colaLog, TopicExchange productosExchange) {
        // "producto.#" captura cualquier routing key que empiece con "producto."
        return BindingBuilder.bind(colaLog).to(productosExchange).with(rkProductoPattern);
    }

    // ── Bindings DLX → DLQs ──────────────────────────────────────────────────
    @Bean
    public Binding bindingInventarioDlq(Queue colaInventarioDlq, DirectExchange productosDlx) {
        return BindingBuilder.bind(colaInventarioDlq).to(productosDlx).with(colaInventario);
    }

    @Bean
    public Binding bindingLogDlq(Queue colaLogDlq, DirectExchange productosDlx) {
        return BindingBuilder.bind(colaLogDlq).to(productosDlx).with(colaLog);
    }
}
