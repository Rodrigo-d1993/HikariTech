package cl.duoc.pedidos360_backend.pedidos.config;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;

/**
 * Convierte el JWT emitido por AWS Cognito en un Authentication cuyas
 * authorities se basan en el claim {@code cognito:groups}.
 *
 * <p>Cada grupo se mapea a un authority {@code ROLE_<grupo>} (p. ej.
 * {@code "Admin"} -&gt; {@code ROLE_Admin}), de modo que las reglas
 * {@code hasRole("Admin")} / {@code hasRole("Cliente")} del SecurityConfig
 * funcionen. También se conservan los authorities de scope ({@code SCOPE_*})
 * que el converter por defecto de Spring extrae del claim {@code scope}.
 *
 * <p>Solo se activa en modo seguro ({@code JWK_SET_URI} configurado). En modo
 * local el SecurityConfig aplica {@code permitAll} a todo, por lo que este
 * converter no se llega a usar.
 */
public class CognitoJwtConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    /** Converter por defecto: extrae los scopes del claim "scope" (SCOPE_*). */
    private final JwtGrantedAuthoritiesConverter scopesConverter = new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> scopes = scopesConverter.convert(jwt);
        Collection<GrantedAuthority> authorities =
                new ArrayList<>(scopes != null ? scopes : List.of());

        // Mapear cada grupo de Cognito a ROLE_<grupo>.
        List<String> grupos = jwt.getClaimAsStringList("cognito:groups");
        if (grupos != null) {
            for (String grupo : grupos) {
                if (grupo != null && !grupo.isBlank()) {
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + grupo));
                }
            }
        }

        return new JwtAuthenticationToken(jwt, authorities, jwt.getSubject());
    }
}
