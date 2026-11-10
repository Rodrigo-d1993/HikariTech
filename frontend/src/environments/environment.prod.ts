// ─── Entorno de PRODUCCIÓN ────────────────────────────────────────────────────
// Estas URLs apuntan a AWS API Gateway (un API REST por microservicio).
// Reemplaza los placeholders con los Invoke URL reales de cada API Gateway
// antes de hacer el build de producción (ng build --configuration production).
//
// Cómo obtener los Invoke URL:
//   AWS Console → API Gateway → selecciona la API → Stages → prod (o el stage)
//   → copia el "Invoke URL" que aparece arriba.
//
// Ejemplo: https://abc123def.execute-api.us-east-1.amazonaws.com/prod
// ─────────────────────────────────────────────────────────────────────────────

export const environment = {
  production: true,

  // URL del API Gateway que apunta a ms-productos (:8081)
  apiBaseUrl:     'https://REEMPLAZAR_API_PRODUCTOS.execute-api.us-east-1.amazonaws.com/prod',

  // URL del API Gateway que apunta a ms-pedidos (:8082)
  pedidosBaseUrl: 'https://REEMPLAZAR_API_PEDIDOS.execute-api.us-east-1.amazonaws.com/prod',

  // URL del API Gateway que apunta a ms-rabbit-admin (:8083)
  adminBaseUrl:   'https://REEMPLAZAR_API_RABBIT.execute-api.us-east-1.amazonaws.com/prod',

  cognito: {
    userPoolId:       'us-east-1_FiIcrh4Jk',
    userPoolClientId: '1gd9dcsatj06co34dpfs8tcrq7',
    domain:           'us-east-1fiicrh4jk.auth.us-east-1.amazoncognito.com',
    // En producción los redirects apuntan al dominio real del frontend
    // (CloudFront o Amplify Hosting). Reemplaza con la URL real.
    redirectSignIn:   'https://REEMPLAZAR_DOMINIO_FRONTEND/',
    redirectSignOut:  'https://REEMPLAZAR_DOMINIO_FRONTEND/',
  }
};
