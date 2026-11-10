package cl.duoc.pedidos360_backend.productos.service;

import cl.duoc.pedidos360_backend.productos.entity.Producto;
import cl.duoc.pedidos360_backend.productos.messaging.ProductoEventoDTO;
import cl.duoc.pedidos360_backend.productos.messaging.ProductoProducer;
import cl.duoc.pedidos360_backend.productos.repository.ProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Lógica de negocio de productos.
 *
 * Publica eventos en RabbitMQ tras operaciones exitosas.
 * La configuración de mensajería está aislada en RabbitMQConfig y ProductoProducer.
 */
@Service
public class ProductoService {

    private final ProductoRepository productoRepository;
    private final ProductoProducer productoProducer;

    public ProductoService(ProductoRepository productoRepository,
                           ProductoProducer productoProducer) {
        this.productoRepository = productoRepository;
        this.productoProducer   = productoProducer;
    }

    public List<Producto> listar() {
        return productoRepository.findAll();
    }

    public List<Producto> listarPorCategoria(String categoria) {
        return productoRepository.findByCategoriaIgnoreCase(categoria);
    }

    public List<String> listarCategorias() {
        return productoRepository.findDistinctCategorias();
    }

    public Optional<Producto> buscarPorId(Long id) {
        return productoRepository.findById(id);
    }

    public Producto crear(Producto producto) {
        Producto guardado = productoRepository.save(producto);

        // Publicar evento asíncrono: inventario + log
        productoProducer.publicarProductoCreado(new ProductoEventoDTO(
                guardado.getId(),
                guardado.getNombre(),
                guardado.getPrecio(),
                guardado.getStock(),
                "PRODUCTO_CREADO"
        ));

        return guardado;
    }

    public Optional<Producto> descontarStock(Long id, int cantidad) {
        return productoRepository.findById(id).map(producto -> {
            if (producto.getStock() < cantidad) {
                throw new IllegalArgumentException(
                    "Stock insuficiente para '" + producto.getNombre() + "'. Disponible: " + producto.getStock());
            }
            producto.setStock(producto.getStock() - cantidad);
            return productoRepository.save(producto);
        });
    }

    public Optional<Producto> actualizar(Long id, Producto datos) {
        return productoRepository.findById(id).map(producto -> {
            producto.setNombre(datos.getNombre());
            producto.setDescripcion(datos.getDescripcion());
            producto.setPrecio(datos.getPrecio());
            producto.setStock(datos.getStock());
            Producto guardado = productoRepository.save(producto);

            // Publicar evento asíncrono: solo log (patrón producto.#)
            productoProducer.publicarProductoActualizado(new ProductoEventoDTO(
                    guardado.getId(),
                    guardado.getNombre(),
                    guardado.getPrecio(),
                    guardado.getStock(),
                    "PRODUCTO_ACTUALIZADO"
            ));

            return guardado;
        });
    }

    public boolean eliminar(Long id) {
        return productoRepository.findById(id).map(producto -> {
            productoRepository.deleteById(id);

            // Publicar evento asíncrono: solo log (patrón producto.#)
            productoProducer.publicarProductoEliminado(new ProductoEventoDTO(
                    producto.getId(),
                    producto.getNombre(),
                    producto.getPrecio(),
                    producto.getStock(),
                    "PRODUCTO_ELIMINADO"
            ));

            return true;
        }).orElse(false);
    }
}
