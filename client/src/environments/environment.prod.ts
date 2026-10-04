/**
 * Entorno de produccion: la API se publica en el puerto 8080 del host.
 * Es la configuracion que usa `npm run build` / `npm run build:publish`,
 * y por lo tanto la imagen de Docker (Dockerfile.web).
 *
 * El puerto sale de docker-compose.yml (`api.ports: 8080:8080`).
 * Si cambias el puerto en el compose, cambialo tambien aqui.
 */
export const environment = {
  apiUrl: 'http://localhost:8080/api'
};