package cl.duoc.pedidos360_backend.pedidos.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pedidos")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // sub (identificador único) del usuario autenticado en Cognito.
    // En modo Cognito se sobreescribe desde el JWT en el controller;
    // en modo local se acepta el valor enviado por el frontend.
    @NotBlank
    @Column(nullable = false, length = 100)
    private String clienteId;

    @Column(nullable = false)
    private LocalDateTime fecha = LocalDateTime.now();

    // Email del cliente extraído del claim "email" del JWT de Cognito.
    // Se guarda en BD para poder enviar notificaciones posteriores
    // (cambios de estado) sin necesidad de volver a consultar el token.
    // En modo local puede quedar vacío.
    @Column(length = 255)
    private String clienteEmail;

    // Persistido como String ("PENDIENTE", "EN_PROCESO", etc.) para que
    // sea legible directamente en la base de datos.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EstadoPedido estado = EstadoPedido.PENDIENTE;

    @NotEmpty(message = "El pedido debe tener al menos un ítem")
    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<DetallePedido> items = new ArrayList<>();

    public Pedido() {}

    public Pedido(String clienteId) {
        this.clienteId = clienteId;
    }

    // ── Getters y setters ────────────────────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public EstadoPedido getEstado() { return estado; }
    public void setEstado(EstadoPedido estado) { this.estado = estado; }

    public List<DetallePedido> getItems() { return items; }
    public void setItems(List<DetallePedido> items) { this.items = items; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }
}
