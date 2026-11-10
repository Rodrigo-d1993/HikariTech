package cl.duoc.pedidos360_backend.rabbitadmin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Configura el RestClient que se usa para comunicarse con
 * la API HTTP de RabbitMQ Management (puerto 15672).
 *
 * Las credenciales se leen de application.yml para que no queden
 * hardcodeadas en el código fuente.
 */
@Configuration
public class RestClientConfig {

    @Value("${app.rabbit.admin.url}")
    private String adminUrl;

    @Value("${app.rabbit.admin.username}")
    private String adminUsername;

    @Value("${app.rabbit.admin.password}")
    private String adminPassword;

    @Bean
    public RestClient rabbitAdminRestClient() {
        return RestClient.builder()
                .baseUrl(adminUrl)
                .defaultHeaders(headers -> headers.setBasicAuth(adminUsername, adminPassword))
                .build();
    }
}
