package cl.duoc.pedidos360_backend.rabbitadmin.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}")
    private String jwkSetUri;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        if (jwkSetUri == null || jwkSetUri.isBlank()) {
            // Modo local: sin Cognito, todo público (desarrollo sin JWT).
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
        } else {
            // Modo seguro (Cognito): validar JWT y aplicar autorización por rol.
            // Todo /admin/** administra el broker RabbitMQ: solo administrador.
            // Los grupos de Cognito ("Admin") se mapean a ROLE_* en
            // CognitoJwtConverter, por lo que aquí se usa hasRole("Admin").
            http
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(HttpMethod.GET, "/actuator/health").permitAll()
                    // Swagger UI — documentación interactiva de la API
                    .requestMatchers("/swagger-ui.html", "/swagger-ui/**",
                                     "/v3/api-docs", "/v3/api-docs/**").permitAll()
                    .requestMatchers("/admin/**").hasRole("Admin")
                    .anyRequest().authenticated()
                )
                .oauth2ResourceServer(oauth2 ->
                    oauth2.jwt(jwt ->
                        jwt.jwkSetUri(jwkSetUri)
                           .jwtAuthenticationConverter(new CognitoJwtConverter())
                    )
                );
        }

        return http.build();
    }
}
