package cl.duoc.pedidos360_backend.pedidos.client;

import cl.duoc.pedidos360_backend.pedidos.config.AppConfig;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.Map;

/**
 * Cliente HTTP para comunicarse con ms-productos.
 */
@Component
public class ProductoClient {

    private final RestTemplate restTemplate;
    private final AppConfig appConfig;

    public ProductoClient(RestTemplate restTemplate, AppConfig appConfig) {
        this.restTemplate = restTemplate;
        this.appConfig = appConfig;
    }

    public ProductoDTO obtenerProducto(Long productoId) {
        try {
            String url = appConfig.getProductosServiceUrl() + "/api/productos/" + productoId;
            return restTemplate.getForObject(url, ProductoDTO.class);
        } catch (RestClientException e) {
            throw new IllegalStateException(
                    "No se pudo obtener el producto " + productoId + " desde ms-productos", e);
        }
    }

    public void descontarStock(Long productoId, int cantidad) {
        try {
            String url = appConfig.getProductosServiceUrl() + "/api/productos/" + productoId + "/stock";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Integer>> request =
                    new HttpEntity<>(Map.of("cantidad", cantidad), headers);
            restTemplate.exchange(url, HttpMethod.PATCH, request, Void.class);
        } catch (RestClientException e) {
            throw new IllegalStateException(
                    "No se pudo descontar stock del producto " + productoId, e);
        }
    }
}
