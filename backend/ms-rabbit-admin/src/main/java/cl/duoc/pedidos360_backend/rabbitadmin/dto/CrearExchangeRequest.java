package cl.duoc.pedidos360_backend.rabbitadmin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO para solicitudes de creación de exchanges.
 */
public class CrearExchangeRequest {

    @NotBlank(message = "El nombre del exchange es obligatorio")
    @Size(min = 1, max = 255, message = "El nombre debe tener entre 1 y 255 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9._\\-:]+$",
             message = "El nombre solo puede contener letras, números, puntos, guiones y dos puntos")
    private String nombre;

    @NotBlank(message = "El tipo es obligatorio")
    @Pattern(regexp = "^(direct|fanout|topic|headers)$",
             message = "El tipo debe ser: direct, fanout, topic o headers")
    private String tipo;

    private boolean durable = true;

    private boolean autoDelete = false;

    public String getNombre()            { return nombre; }
    public void setNombre(String v)      { this.nombre = v; }

    public String getTipo()              { return tipo; }
    public void setTipo(String v)        { this.tipo = v; }

    public boolean isDurable()           { return durable; }
    public void setDurable(boolean v)    { this.durable = v; }

    public boolean isAutoDelete()        { return autoDelete; }
    public void setAutoDelete(boolean v) { this.autoDelete = v; }
}
