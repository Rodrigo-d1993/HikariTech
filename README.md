# Pedidos360 — DSY1107 Desarrollo Cloud Native I

Sistema de pedidos con microservicios Spring Boot, mensajería RabbitMQ, autenticación con AWS Cognito y frontend Angular.

---

## Arquitectura

```
Frontend Angular (localhost:4200)
        │
        │  Authorization Code + PKCE
        ▼
  AWS Cognito (IDaaS)
        │  JWT (Bearer token)
        ▼
  AWS API Gateway  ─── valida JWT ───────────┐
        │                                    │
   /api/productos                      /api/pedidos
        │                                    │
        ▼                                    ▼
  ms-productos :8081              ms-pedidos :8082
  RDS MySQL (pedidos360_productos)  RDS MySQL (pedidos360_pedidos)
        │                                    │
        └──────────── RabbitMQ ──────────────┘
                        │
              ms-rabbit-admin :8083
```

**Exchanges RabbitMQ:**
- `pedidos.exchange` (DIRECT): routing key `pedido.creado` → cola `pedidos.notificacion`, `pedido.estado` → cola `pedidos.auditoria`
- `productos.exchange` (TOPIC): `producto.creado` → cola `productos.inventario`, `producto.#` → cola `productos.log`
- Cada cola principal tiene su DLQ configurada (`pedidos.dlx` / `productos.dlx`)

**Notificaciones por email (JavaMailSender):**
- Al crear un pedido → `NotificacionConsumer` envía email de confirmación al cliente via SMTP Gmail
- Al cambiar estado de un pedido → `AuditoriaConsumer` envía email de actualización al cliente
- En producción se reemplazaría por AWS SES cambiando solo las variables de entorno

---

## Prerrequisitos

- Java 17+
- Maven 3.x (`mvn -v` para verificar)
- Docker Desktop (para RabbitMQ local)
- Node.js 18+ y Angular CLI (`npm install -g @angular/cli`)
- MySQL Workbench (para conectar al RDS de AWS)
- PowerShell (Windows)

---

## Levantar en local con RDS de AWS

> En modo local los microservicios arrancan **sin validar JWT** (`JWK_SET_URI` vacío → `permitAll`).
> El frontend igual pasa por Cognito (Amplify configurado con el User Pool real).

> ⚠️ **Antes de arrancar:** verifica que tu IP actual esté autorizada en el Security Group del RDS
> (puerto 3306). Si cambiaste de red, actualiza la regla en AWS Console → EC2 → Security Groups.

### 1. RabbitMQ

```powershell
cd backend
docker compose up -d
```

Verifica en http://localhost:15672 (usuario: `guest` / contraseña: `guest`)

### 2. Microservicios (4 terminales separadas)

**Terminal 1 — ms-productos (:8081)**
```powershell
cd backend\ms-productos
$env:DB_HOST="pedidos360-db.cim02rcogyo2.us-east-1.rds.amazonaws.com"
$env:DB_PORT="3306"; $env:DB_NAME="pedidos360_productos"
$env:DB_USER="admin"; $env:DB_PASSWORD="TU_CLAVE"; $env:DB_USE_SSL="true"
mvn spring-boot:run
```

**Terminal 2 — ms-pedidos (:8082)**
```powershell
cd backend\ms-pedidos
$env:DB_HOST="pedidos360-db.cim02rcogyo2.us-east-1.rds.amazonaws.com"
$env:DB_PORT="3306"; $env:DB_NAME="pedidos360_pedidos"
$env:DB_USER="admin"; $env:DB_PASSWORD="TU_CLAVE"; $env:DB_USE_SSL="true"
$env:MAIL_PASSWORD="TU_APP_PASSWORD_GMAIL"
mvn spring-boot:run
```

> `MAIL_PASSWORD`: contraseña de aplicación de Gmail (16 caracteres, generada en myaccount.google.com/apppasswords).
> `MAIL_DEMO_RECIPIENT` (opcional): email destino en modo local. Por defecto usa `gamehikari.tech@gmail.com`.

**Terminal 3 — ms-rabbit-admin (:8083)**
```powershell
cd backend\ms-rabbit-admin
mvn spring-boot:run
```

**Terminal 4 — Frontend (:4200)**
```powershell
cd frontend
npm install   # solo la primera vez
npm start
```

Abre http://localhost:4200

### 3. Verificación de salud

| Servicio | URL |
|---|---|
| RabbitMQ Management | http://localhost:15672 |
| ms-productos health | http://localhost:8081/actuator/health |
| ms-pedidos health | http://localhost:8082/actuator/health |
| ms-rabbit-admin health | http://localhost:8083/actuator/health |

### 4. Documentación interactiva (Swagger)

| Servicio | URL |
|---|---|
| ms-productos | http://localhost:8081/swagger-ui.html |
| ms-pedidos | http://localhost:8082/swagger-ui.html |
| ms-rabbit-admin | http://localhost:8083/swagger-ui.html |

---

## Configurar para AWS

### 1. Cognito (User Pool ya configurado)

El User Pool está configurado en `frontend/src/environments/environment.ts`:
- `userPoolId`: `us-east-1_FiIcrh4Jk`
- Grupos: `Admin` (administradores), `Cliente` (usuarios finales)
- Los grupos se mapean a roles en `CognitoJwtConverter` (`ROLE_Admin` / `ROLE_Cliente`)

Para activar validación JWT en los microservicios, agrega:
```
JWK_SET_URI=https://cognito-idp.us-east-1.amazonaws.com/us-east-1_FiIcrh4Jk/.well-known/jwks.json
```

### 2. RDS MySQL (ya configurado)

- Endpoint: `pedidos360-db.cim02rcogyo2.us-east-1.rds.amazonaws.com`
- Bases de datos: `pedidos360_productos` y `pedidos360_pedidos`
- El schema se crea automáticamente con `ddl-auto: update` al primer arranque
- Para inicializar manualmente:
  ```powershell
  mysql -h pedidos360-db.cim02rcogyo2.us-east-1.rds.amazonaws.com -u admin -p < backend\scripts\sql\01_ms_productos_schema.sql
  mysql -h pedidos360-db.cim02rcogyo2.us-east-1.rds.amazonaws.com -u admin -p < backend\scripts\sql\02_ms_pedidos_schema.sql
  ```

### 3. API Gateway (un API REST por microservicio)

Crea 3 APIs REST en API Gateway:

| Microservicio | Recursos | Métodos |
|---|---|---|
| ms-productos | `/api/productos` | GET, POST |
| | `/api/productos/{id}` | GET, PUT, DELETE |
| | `/api/productos/{id}/stock` | PATCH |
| ms-pedidos | `/api/pedidos` | GET, POST |
| | `/api/pedidos/todos` | GET |
| | `/api/pedidos/{id}` | GET |
| | `/api/pedidos/{id}/estado` | PATCH |
| ms-rabbit-admin | `/admin/queues` | GET, POST |
| | `/admin/queues/{nombre}` | GET, DELETE |
| | `/admin/exchanges` | GET, POST |
| | `/admin/exchanges/{nombre}` | DELETE |
| | `/admin/bindings` | GET, POST |
| | `/admin/bindings/{exchange}/{cola}/{routingKey}` | DELETE |
| | `/admin/overview` | GET |

Para cada API:
1. Crea un **Cognito Authorizer** apuntando al User Pool `us-east-1_FiIcrh4Jk`
2. Habilita CORS en cada recurso
3. Configura la integración HTTP con la URL del microservicio
4. En `frontend/src/environments/environment.prod.ts`, reemplaza los placeholders con los Invoke URL

### 4. RabbitMQ en EC2

```bash
# En la EC2, copia los archivos y ejecuta:
bash backend/scripts/setup-ec2.sh
```

El `docker-compose.cluster.yml` levanta un clúster de 2 nodos.

---

## Endpoints principales

> **Modelo de autorización (modo Cognito, `JWK_SET_URI` configurado):** los grupos de Cognito (`Admin`, `Cliente`) se mapean a roles (`ROLE_Admin`/`ROLE_Cliente`) en `CognitoJwtConverter`. "Admin" = solo administradores; "Autenticado" = cualquier usuario con sesión válida; "Público" = sin JWT. En **modo local** (`JWK_SET_URI` vacío) todo es `permitAll` (sin seguridad) para desarrollo.
>
> **Tenencia de pedidos:** en modo Cognito el `clienteId` se toma del `sub` del JWT, no del query ni del body. Un cliente solo ve y crea SUS pedidos; al consultar el detalle de un pedido ajeno recibe 404. El Admin puede ver cualquier pedido.
>
> **Email del cliente:** el claim `email` del JWT se extrae al crear el pedido y se almacena en `clienteEmail`. Los consumers de RabbitMQ (`NotificacionConsumer`, `AuditoriaConsumer`) lo usan para enviar emails reales al destinatario correcto.

### ms-productos (`:8081`)
| Método | Ruta | Descripción | Rol requerido |
|--------|------|-------------|---------------|
| GET | `/api/productos` | Listar todos | Público |
| GET | `/api/productos/{id}` | Detalle producto | Público |
| POST | `/api/productos` | Crear producto | Admin |
| PUT | `/api/productos/{id}` | Actualizar producto | Admin |
| DELETE | `/api/productos/{id}` | Eliminar producto | Admin |
| PATCH | `/api/productos/{id}/stock` | Descontar stock | Autenticado * |

> \* `PATCH /stock` lo llama ms-pedidos (service-to-service) reenviando el JWT del cliente.

### ms-pedidos (`:8082`)
| Método | Ruta | Descripción | Rol requerido |
|--------|------|-------------|---------------|
| GET | `/api/pedidos` | Mis pedidos (clienteId del token) | Autenticado |
| GET | `/api/pedidos/todos` | Todos los pedidos | Admin |
| GET | `/api/pedidos/{id}` | Detalle (propietario o Admin) | Autenticado |
| POST | `/api/pedidos` | Crear pedido (clienteId del token) | Autenticado |
| PATCH | `/api/pedidos/{id}/estado` | Cambiar estado | Admin |

### ms-rabbit-admin (`:8083`)

> Todos los endpoints requieren rol **Admin** en modo Cognito.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/queues` | Listar colas |
| POST | `/admin/queues` | Crear cola |
| GET | `/admin/queues/{nombre}` | Detalle de una cola |
| DELETE | `/admin/queues/{nombre}` | Eliminar cola |
| GET | `/admin/exchanges` | Listar exchanges |
| POST | `/admin/exchanges` | Crear exchange |
| DELETE | `/admin/exchanges/{nombre}` | Eliminar exchange |
| GET | `/admin/bindings` | Listar bindings |
| POST | `/admin/bindings` | Crear binding |
| DELETE | `/admin/bindings/{exchange}/{cola}/{routingKey}` | Eliminar binding |
| GET | `/admin/overview` | Resumen del broker |

---

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host del RDS MySQL | `localhost` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_NAME` | Nombre de la base de datos | según microservicio |
| `DB_USER` | Usuario MySQL | `root` |
| `DB_PASSWORD` | Contraseña MySQL | `root` |
| `DB_USE_SSL` | Habilitar SSL para RDS | `false` |
| `JWK_SET_URI` | JWKS URI de Cognito (activa validación JWT) | vacío (modo local) |
| `MAIL_PASSWORD` | Contraseña de aplicación Gmail | vacío |
| `MAIL_USERNAME` | Cuenta Gmail remitente | `gamehikari.tech@gmail.com` |
| `MAIL_FROM` | Dirección "from" del email | `gamehikari.tech@gmail.com` |
| `MAIL_DEMO_RECIPIENT` | Destinatario en modo local | `gamehikari.tech@gmail.com` |
| `PRODUCTOS_SERVICE_URL` | URL de ms-productos (usado por ms-pedidos) | `http://localhost:8081` |
| `RABBITMQ_HOST` | Host de RabbitMQ | `localhost` |
| `RABBITMQ_USER` | Usuario RabbitMQ | `guest` |
| `RABBITMQ_PASSWORD` | Contraseña RabbitMQ | `guest` |

Ver `.env.example` para la lista completa.

---

## Estructura del repositorio

```
Pedidos360/
├── backend/
│   ├── ms-pedidos/          Spring Boot :8082
│   │   └── messaging/       PedidoProducer, NotificacionConsumer (email),
│   │                        AuditoriaConsumer (email), EmailService
│   ├── ms-productos/        Spring Boot :8081
│   ├── ms-rabbit-admin/     Spring Boot :8083 — administración RabbitMQ REST API
│   ├── scripts/
│   │   ├── sql/             Scripts DDL para RDS MySQL
│   │   └── setup-ec2.sh     Script de instalación en Ubuntu EC2
│   ├── docker-compose.yml           RabbitMQ local (nodo único)
│   ├── docker-compose.cluster.yml   RabbitMQ clúster 2 nodos (EC2)
│   └── .env.example         Plantilla de variables de entorno
├── frontend/                Angular 17 + AWS Amplify (Cognito PKCE)
│   └── src/environments/
│       ├── environment.ts       Desarrollo local (localhost)
│       └── environment.prod.ts  Producción (API Gateway URLs)
├── central-emergencias/     Ejemplo de referencia RabbitMQ (NO modificar)
└── README.md
```
