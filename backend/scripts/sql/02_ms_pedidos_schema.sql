-- ─────────────────────────────────────────────────────────────────────────────
-- SCHEMA: pedidos360_pedidos
-- Microservicio: ms-pedidos (puerto 8082)
--
-- Cómo ejecutar:
--   1. Conéctate al endpoint de Aurora MySQL desde MySQL Workbench
--   2. Abre este archivo y ejecútalo completo (Ctrl+Shift+Enter)
--   3. Configura DB_HOST y DB_NAME=pedidos360_pedidos en las variables
--      de entorno de ms-pedidos antes de arrancarlo
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS pedidos360_pedidos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pedidos360_pedidos;

-- ─── Tabla de pedidos ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pedidos (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    cliente_id  VARCHAR(100)    NOT NULL,   -- sub del usuario en Cognito
    fecha       DATETIME        NOT NULL    DEFAULT CURRENT_TIMESTAMP,
    estado      VARCHAR(30)     NOT NULL    DEFAULT 'PENDIENTE',
    PRIMARY KEY (id),
    INDEX idx_pedidos_cliente (cliente_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- ─── Tabla de detalle de pedido ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detalle_pedido (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    pedido_id        BIGINT          NOT NULL,
    producto_id      BIGINT          NOT NULL,
    cantidad         INT             NOT NULL,
    precio_unitario  DECIMAL(12, 2)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_detalle_pedido
        FOREIGN KEY (pedido_id) REFERENCES pedidos (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_detalle_pedido (pedido_id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;
