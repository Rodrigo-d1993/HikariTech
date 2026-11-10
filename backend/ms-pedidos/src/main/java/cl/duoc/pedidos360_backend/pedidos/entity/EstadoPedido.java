package cl.duoc.pedidos360_backend.pedidos.entity;

/**
 * Estados válidos de un pedido.
 *
 * Usar un enum en vez de un String libre evita que se guarden valores
 * inválidos en la base de datos (ej. "entregadoo", "CANCELADOO", etc.).
 * El valor se persiste como texto en la columna "estado" (EnumType.STRING)
 * para que sea legible directamente en la BD.
 */
public enum EstadoPedido {
    PENDIENTE,
    EN_PROCESO,
    ENTREGADO,
    CANCELADO
}
