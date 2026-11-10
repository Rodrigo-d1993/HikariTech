package cl.duoc.pedidos360_backend.pedidos.service;

import cl.duoc.pedidos360_backend.pedidos.client.ProductoClient;
import cl.duoc.pedidos360_backend.pedidos.client.ProductoDTO;
import cl.duoc.pedidos360_backend.pedidos.entity.EstadoPedido;
import cl.duoc.pedidos360_backend.pedidos.entity.DetallePedido;
import cl.duoc.pedidos360_backend.pedidos.entity.Pedido;
import cl.duoc.pedidos360_backend.pedidos.messaging.PedidoEventoDTO;
import cl.duoc.pedidos360_backend.pedidos.messaging.PedidoProducer;
import cl.duoc.pedidos360_backend.pedidos.repository.PedidoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Lógica de negocio de pedidos.
 *
 * Publica eventos en RabbitMQ tras operaciones exitosas.
 * La configuración de mensajería está completamente aislada en RabbitMQConfig
 * y PedidoProducer; este servicio solo conoce el productor como interfaz de alto nivel.
 */
@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final ProductoClient productoClient;
    private final PedidoProducer pedidoProducer;

    public PedidoService(PedidoRepository pedidoRepository,
                         ProductoClient productoClient,
                         PedidoProducer pedidoProducer) {
        this.pedidoRepository = pedidoRepository;
        this.productoClient   = productoClient;
        this.pedidoProducer   = pedidoProducer;
    }

    public List<Pedido> listarTodos() {
        return pedidoRepository.findAll()
                .stream()
                .sorted((a, b) -> Long.compare(
                        b.getId() != null ? b.getId() : 0,
                        a.getId() != null ? a.getId() : 0))
                .toList();
    }

    public List<Pedido> listarPorCliente(String clienteId) {
        return pedidoRepository.findByClienteId(clienteId);
    }

    public Optional<Pedido> buscarPorId(Long id) {
        return pedidoRepository.findById(id);
    }

    public Pedido crear(Pedido pedido) {
        // Validar stock, tomar precio real y descontar stock en ms-productos
        for (DetallePedido item : pedido.getItems()) {
            ProductoDTO producto = productoClient.obtenerProducto(item.getProductoId());
            if (producto == null) {
                throw new IllegalArgumentException(
                        "Producto " + item.getProductoId() + " no existe");
            }
            if (producto.getStock() < item.getCantidad()) {
                throw new IllegalArgumentException(
                        "Stock insuficiente para el producto " + producto.getNombre());
            }
            item.setPrecioUnitario(producto.getPrecio());
            item.setPedido(pedido);
        }

        Pedido guardado = pedidoRepository.save(pedido);

        // Descontar stock de cada ítem en ms-productos
        for (DetallePedido item : guardado.getItems()) {
            productoClient.descontarStock(item.getProductoId(), item.getCantidad());
        }

        // Publicar evento asíncrono: notificación al cliente
        pedidoProducer.publicarPedidoCreado(new PedidoEventoDTO(
                guardado.getId(),
                guardado.getClienteId(),
                guardado.getClienteEmail(),
                guardado.getEstado().name(),
                guardado.getFecha(),
                "PEDIDO_CREADO"
        ));

        return guardado;
    }

    public Optional<Pedido> actualizarEstado(Long id, EstadoPedido estado) {
        return pedidoRepository.findById(id).map(pedido -> {
            pedido.setEstado(estado);
            Pedido guardado = pedidoRepository.save(pedido);

            // Publicar evento asíncrono: auditoría del cambio de estado
            pedidoProducer.publicarEstadoActualizado(new PedidoEventoDTO(
                    guardado.getId(),
                    guardado.getClienteId(),
                    guardado.getClienteEmail(),
                    guardado.getEstado().name(),
                    guardado.getFecha(),
                    "ESTADO_ACTUALIZADO"
            ));

            return guardado;
        });
    }
}
