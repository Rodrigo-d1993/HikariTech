package cl.duoc.pedidos360_backend.pedidos.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AppConfig {

    // URL de ms-productos leída del application.yml (app.productos-service-url)
    @Value("${app.productos-service-url}")
    private String productosServiceUrl;

    @Bean
    public RestTemplate restTemplate() {
        // HttpComponentsClientHttpRequestFactory (Apache HttpClient 5) es necesario
        // porque el SimpleClientHttpRequestFactory de Java puro no soporta PATCH.
        RestTemplate restTemplate = new RestTemplate(new HttpComponentsClientHttpRequestFactory());
        // Propaga el header Authorization del request HTTP entrante a las llamadas
        // salientes hacia ms-productos. Así, en modo Cognito, las operaciones
        // service-to-service (como descontar stock al crear un pedido) viajan con
        // el JWT del cliente y pasan la validación JWT de ms-productos.
        // En modo local (sin JWT) no hay header que propagar y es inofensivo.
        restTemplate.getInterceptors().add((request, body, execution) -> {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                String auth = attrs.getRequest().getHeader(HttpHeaders.AUTHORIZATION);
                if (auth != null && !auth.isBlank()) {
                    request.getHeaders().add(HttpHeaders.AUTHORIZATION, auth);
                }
            }
            return execution.execute(request, body);
        });
        return restTemplate;
    }

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // allowedOriginPatterns permite usar "*" (wildcard) junto con
                // cabeceras de autorización. En producción reemplazar por la URL
                // real del frontend (CloudFront / Amplify Hosting).
                registry.addMapping("/api/**")
                        .allowedOriginPatterns("*")
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(false); // false porque allowedOriginPatterns="*"
            }
        };
    }

    public String getProductosServiceUrl() {
        return productosServiceUrl;
    }
}
