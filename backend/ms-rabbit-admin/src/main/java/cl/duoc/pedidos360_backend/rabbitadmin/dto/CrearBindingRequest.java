package cl.duoc.pedidos360_backend.rabbitadmin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO para solicitudes de creación de bindings.
 */
public class CrearBindingRequest {

    @NotBlank(message = "El exchange es obligatorio")
    @Size(max = 255)
    private String exchange;

    @NotBlank(message = "La cola destino es obligatoria")
    @Size(max = 255)
    private String cola;

    @NotBlank(message = "La routing key es obligatoria")
    @Size(max = 255, message = "La routing key no puede superar 255 caracteres")
    private String routingKey;

    public String getExchange()          { return exchange; }
    public void setExchange(String v)    { this.exchange = v; }

    public String getCola()              { return cola; }
    public void setCola(String v)        { this.cola = v; }

    public String getRoutingKey()        { return routingKey; }
    public void setRoutingKey(String v)  { this.routingKey = v; }
}
