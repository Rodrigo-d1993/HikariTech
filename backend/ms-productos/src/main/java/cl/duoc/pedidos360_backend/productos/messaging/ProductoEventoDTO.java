package cl.duoc.pedidos360_backend.productos.messaging;

import java.math.BigDecimal;

/**
 * DTO para eventos de productos publicados en RabbitMQ.
 */
public class ProductoEventoDTO {

    private Long productoId;
    private String nombre;
    private BigDecimal precio;
    private Integer stock;
    private String tipoEvento;   // "PRODUCTO_CREADO" | "PRODUCTO_ACTUALIZADO" | "PRODUCTO_ELIMINADO"

    public ProductoEventoDTO() {
    }

    public ProductoEventoDTO(Long productoId, String nombre, BigDecimal precio,
                              Integer stock, String tipoEvento) {
        this.productoId = productoId;
        this.nombre     = nombre;
        this.precio     = precio;
        this.stock      = stock;
        this.tipoEvento = tipoEvento;
    }

    public Long getProductoId()           { return productoId; }
    public void setProductoId(Long v)     { this.productoId = v; }

    public String getNombre()             { return nombre; }
    public void setNombre(String v)       { this.nombre = v; }

    public BigDecimal getPrecio()         { return precio; }
    public void setPrecio(BigDecimal v)   { this.precio = v; }

    public Integer getStock()             { return stock; }
    public void setStock(Integer v)       { this.stock = v; }

    public String getTipoEvento()         { return tipoEvento; }
    public void setTipoEvento(String v)   { this.tipoEvento = v; }
}
