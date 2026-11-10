package cl.duoc.pedidos360_backend.pedidos.messaging;

import java.time.LocalDateTime;

/**
 * DTO que viaja como mensaje en RabbitMQ.
 * Contiene la información mínima necesaria para que los consumidores
 * puedan procesar el evento sin necesidad de consultar la base de datos.
 */
public class PedidoEventoDTO {

    private Long pedidoId;
    private String clienteId;
    private String clienteEmail;   // email real del cliente, extraído del JWT
    private String estado;
    private LocalDateTime fecha;
    private String tipoEvento;   // "PEDIDO_CREADO" | "ESTADO_ACTUALIZADO"

    public PedidoEventoDTO() {
    }

    public PedidoEventoDTO(Long pedidoId, String clienteId, String clienteEmail,
                            String estado, LocalDateTime fecha, String tipoEvento) {
        this.pedidoId      = pedidoId;
        this.clienteId     = clienteId;
        this.clienteEmail  = clienteEmail;
        this.estado        = estado;
        this.fecha         = fecha;
        this.tipoEvento    = tipoEvento;
    }

    public Long getPedidoId()             { return pedidoId; }
    public void setPedidoId(Long v)       { this.pedidoId = v; }

    public String getClienteId()          { return clienteId; }
    public void setClienteId(String v)    { this.clienteId = v; }

    public String getClienteEmail()       { return clienteEmail; }
    public void setClienteEmail(String v) { this.clienteEmail = v; }

    public String getEstado()             { return estado; }
    public void setEstado(String v)       { this.estado = v; }

    public LocalDateTime getFecha()            { return fecha; }
    public void setFecha(LocalDateTime v)      { this.fecha = v; }

    public String getTipoEvento()           { return tipoEvento; }
    public void setTipoEvento(String v)     { this.tipoEvento = v; }
}
