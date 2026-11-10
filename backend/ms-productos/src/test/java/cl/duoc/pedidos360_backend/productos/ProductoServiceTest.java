package cl.duoc.pedidos360_backend.productos;

import cl.duoc.pedidos360_backend.productos.entity.Producto;
import cl.duoc.pedidos360_backend.productos.messaging.ProductoProducer;
import cl.duoc.pedidos360_backend.productos.repository.ProductoRepository;
import cl.duoc.pedidos360_backend.productos.service.ProductoService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductoServiceTest {

    @Mock
    private ProductoRepository productoRepository;

    @Mock
    private ProductoProducer productoProducer;

    @Test
    void buscarPorId_retornaProductoCuandoExiste() {
        Producto producto = new Producto("Teclado mecánico", "Switches rojos", BigDecimal.valueOf(29990), 10);
        producto.setId(1L);
        when(productoRepository.findById(1L)).thenReturn(Optional.of(producto));

        ProductoService service = new ProductoService(productoRepository, productoProducer);
        Optional<Producto> resultado = service.buscarPorId(1L);

        assertTrue(resultado.isPresent());
        assertEquals("Teclado mecánico", resultado.get().getNombre());
    }

    @Test
    void eliminar_retornaFalseCuandoNoExiste() {
        when(productoRepository.findById(99L)).thenReturn(Optional.empty());

        ProductoService service = new ProductoService(productoRepository, productoProducer);
        boolean resultado = service.eliminar(99L);

        assertFalse(resultado);
    }
}
