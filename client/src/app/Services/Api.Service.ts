import { environment } from '../../environments/environment';

/**
 * URL base de Firmeza.Api.
 *
 * Viene del archivo de entorno que Angular sustituye en cada build:
 * - development (npm start): puerto 5180, la API con `dotnet run --launch-profile http`.
 * - production (npm run build, y la imagen de Docker): puerto 8080, el mapeo de docker-compose.
 *
 * Ver client/src/environments/.
 */
export const API_URL = environment.apiUrl;

/** ProblemDetails de la API: detalle legible y errores por campo. */
export interface ApiError {
  status: number;
  message: string;
  fieldErrors: Record<string, string>;
}

const FALLBACK_MESSAGES: Record<number, string> = {
  0: 'No se pudo conectar con el servidor. Verifica que la API este disponible.',
  400: 'La solicitud no es valida. Revisa los datos ingresados.',
  401: 'Tu sesion expiro. Vuelve a ingresar.',
  403: 'No tienes permisos para realizar esta accion.',
  404: 'El recurso solicitado no existe.',
  409: 'El registro esta en uso o tiene operaciones relacionadas.',
  422: 'La operacion no cumple una regla de negocio.',
  500: 'Ocurrio un error inesperado en el servidor.'
};

export function toApiError(error: unknown): ApiError {
  const status = (error as { status?: number })?.status ?? 0;
  const payload = (error as { error?: unknown })?.error;
  const fieldErrors: Record<string, string> = {};

  if (payload && typeof payload === 'object') {
    const errors = (payload as { errors?: Record<string, string[]> }).errors;
    for (const [field, messages] of Object.entries(errors ?? {})) {
      if (messages?.length) {
        fieldErrors[field] = messages.join(' ');
      }
    }
  }

  const detail =
    typeof payload === 'string' && payload.length > 0
      ? payload
      : (payload as { detail?: string; title?: string })?.detail ??
        (payload as { title?: string })?.title;

  return {
    status,
    message: detail?.trim() || FALLBACK_MESSAGES[status] || `Error ${status}.`,
    fieldErrors
  };
}
