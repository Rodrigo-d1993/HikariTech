-- ─────────────────────────────────────────────────────────────────────────────
-- SCHEMA: pedidos360_productos
-- Microservicio: ms-productos (puerto 8081)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS pedidos360_productos
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pedidos360_productos;

CREATE TABLE IF NOT EXISTS productos (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    nombre      VARCHAR(150)    NOT NULL,
    descripcion VARCHAR(500)    NULL,
    precio      DECIMAL(12, 2)  NOT NULL,
    stock       INT             NOT NULL DEFAULT 0,
    imagen_url  VARCHAR(1000)   NULL,
    categoria   VARCHAR(50)     NULL,
    PRIMARY KEY (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_unicode_ci;

-- Si la tabla ya existe, agrega las columnas nuevas con:
-- ALTER TABLE productos ADD COLUMN imagen_url VARCHAR(1000) NULL;
-- ALTER TABLE productos ADD COLUMN categoria VARCHAR(50) NULL;

INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url, categoria) VALUES
    ('Teclado mecánico RGB',    'Teclado mecánico con switches Cherry MX Red y retroiluminación RGB', 59990,  20, 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&q=80', 'Teclados'),
    ('Mouse inalámbrico Pro',   'Mouse óptico inalámbrico 16000 DPI, 6 botones programables',         34990,  35, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&q=80', 'Mouse'),
    ('Monitor 24" 144Hz',       'Monitor IPS Full HD 144Hz, 1ms respuesta, FreeSync',                149990,  10, 'https://images.unsplash.com/photo-1593640495253-23196b27a87f?w=400&q=80', 'Monitores'),
    ('Audífonos Gaming 7.1',    'Audífonos over-ear sonido surround 7.1, micrófono retráctil',        49990,  15, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', 'Audio'),
    ('Silla gamer ErgoX',       'Silla ergonómica con reposapiés, reclinable 135°, cojines',         189990,   5, 'https://images.unsplash.com/photo-1598550487031-0898b4852122?w=400&q=80', 'Sillas'),
    ('Mousepad XXL',            'Mousepad de tela 900x400mm, base antideslizante, bordes cosidos',     14990,  40, 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&q=80', 'Accesorios'),
    ('Headset stand RGB',       'Soporte para audífonos con hub USB 3.0 y luz RGB',                   24990,  20, 'https://images.unsplash.com/photo-1612444530582-fc66183b16f7?w=400&q=80', 'Accesorios'),
    ('Webcam Full HD',          'Cámara web 1080p 60fps, micrófono incorporado, autofocus',            39990,  12, 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=400&q=80', 'Accesorios');
