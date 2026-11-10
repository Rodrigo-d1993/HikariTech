package cl.duoc.pedidos360_backend.rabbitadmin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO para solicitudes de creación de colas.
 * Las anotaciones de validación evitan nombres vacíos o con caracteres inválidos.
 */
public class CrearColaRequest {

    @NotBlank(message = "El nombre de la cola es obligatorio")
    @Size(min = 1, max = 255, message = "El nombre debe tener entre 1 y 255 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9._\\-:]+$",
             message = "El nombre solo puede contener letras, números, puntos, guiones y dos puntos")
    private String nombre;

    private boolean durable = true;

    private boolean autoDelete = false;

    public String getNombre()             { return nombre; }
    public void setNombre(String nombre)  { this.nombre = nombre; }

    public boolean isDurable()            { return durable; }
    public void setDurable(boolean v)     { this.durable = v; }

    public boolean isAutoDelete()         { return autoDelete; }
    public void setAutoDelete(boolean v)  { this.autoDelete = v; }
}
