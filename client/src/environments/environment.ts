/**
 * Entorno de desarrollo: la API se levanta con
 * `dotnet run --project Firmeza.Api --launch-profile http` (puerto 5180).
 * Se usa con `npm start` (ng serve) y con `ng build --configuration development`.
 */
export const environment = {
  apiUrl: 'http://localhost:5180/api'
};