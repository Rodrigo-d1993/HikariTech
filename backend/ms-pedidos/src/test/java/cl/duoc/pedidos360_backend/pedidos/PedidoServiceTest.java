package cl.duoc.pedidos360_backend.pedidos;

import cl.duoc.pedidos360_backend.pedidos.client.ProductoClient;
import cl.duoc.pedidos360_backend.pedidos.client.ProductoDTO;
import cl.duoc.pedidos360_backend.pedidos.entity.DetallePedido;
import cl.duoc.pedidos360_backend.pedidos.entity.Pedido;
import cl.duoc.pedidos360_backend.pedidos.messaging.PedidoProducer;
import cl.duoc.pedidos360_backend.pedidos.repository.PedidoRepository;
import cl.duoc.pedidos360_backend.pedidos.service.PedidoService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PedidoServiceTest {

    @Mock
    private PedidoRepository pedidoRepository;

    @Mock
    private ProductoClient productoClient;

    @Mock
    private PedidoProducer pedidoProducer;   // nuevo mock requerido por el constructor

    @Test
    void crear_lanzaExcepcionSiNoHayStock() {
        ProductoDTO producto = new ProductoDTO();
        producto.setId(1L);
        producto.setNombre("Mouse");
        producto.setPrecio(BigDecimal.valueOf(9990));
        producto.setStock(1);
        when(productoClient.obtenerProducto(1L)).thenReturn(producto);

        Pedido pedido = new Pedido("cliente-123");
        pedido.getItems().add(new DetallePedido(1L, 5, null));

        PedidoService service = new PedidoService(pedidoRepository, productoClient, pedidoProducer);

        assertThrows(IllegalArgumentException.class, () -> service.crear(pedido));
    }
}
