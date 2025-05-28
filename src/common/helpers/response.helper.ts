/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { HttpStatus } from '@nestjs/common';

/**
 * Interfaz base para todas las respuestas de la API
 */
interface BaseApiResponse {
  readonly ok: boolean;
  readonly status: HttpStatus;
  readonly message: string;
  readonly timestamp: string;
}

/**
 * Interfaz para respuestas exitosas
 */
interface SuccessApiResponse<TData = unknown> extends BaseApiResponse {
  readonly ok: true;
  readonly body: TData;
}

/**
 * Interfaz para respuestas de error
 */
interface ErrorApiResponse<TBody = unknown> extends BaseApiResponse {
  readonly ok: false;
  readonly body: TBody | null;
  readonly error: string | null;
}

/**
 * Tipo union para todas las posibles respuestas
 */
type ApiResponse<TData = unknown, TErrorBody = unknown> =
  | SuccessApiResponse<TData>
  | ErrorApiResponse<TErrorBody>;

/**
 * Tipo para objetos de error que pueden tener diferentes estructuras
 */
type ErrorLike = Error | { message: string } | { error: string } | string | unknown;

/**
 * Opciones para personalizar la respuesta de éxito
 */
interface SuccessOptions {
  readonly message?: string;
  readonly status?: HttpStatus;
}

/**
 * Opciones para personalizar la respuesta de error
 */
interface ErrorOptions<TBody = unknown> {
  readonly status?: HttpStatus;
  readonly body?: TBody | null;
  readonly error?: ErrorLike;
}

/**
 * Helper class para crear respuestas API estructuradas y tipadas
 *
 * @example
 * ```typescript
 * // Respuesta exitosa básica
 * const response = ResponseHelper.success({ id: 1, name: 'John' });
 *
 * // Respuesta exitosa personalizada
 * const customResponse = ResponseHelper.success(
 *   users,
 *   { message: 'Usuarios obtenidos correctamente', status: HttpStatus.OK }
 * );
 *
 * // Respuesta de error
 * const errorResponse = ResponseHelper.error('Usuario no encontrado', {
 *   status: HttpStatus.NOT_FOUND,
 *   body: { userId: 123 }
 * });
 * ```
 */
export class ResponseHelper {
  private static readonly DEFAULT_SUCCESS_MESSAGE = 'Operación exitosa';
  private static readonly DEFAULT_ERROR_MESSAGE = 'Error interno del servidor';

  /**
   * Crea una respuesta exitosa estructurada y tipada
   *
   * @template TData - Tipo de los datos en el body de la respuesta
   * @param body - Datos principales de la respuesta
   * @param options - Opciones para personalizar la respuesta
   * @returns Objeto de respuesta exitosa tipado
   */
  static success<TData>(body: TData, options: SuccessOptions = {}): SuccessApiResponse<TData> {
    const { message = this.DEFAULT_SUCCESS_MESSAGE, status = HttpStatus.OK } = options;

    return {
      ok: true,
      status,
      message,
      body,
      timestamp: new Date().toISOString(),
    } as const;
  }

  /**
   * Crea una respuesta de error estructurada y tipada
   *
   * @template TBody - Tipo de los datos adicionales en el body del error
   * @param message - Mensaje de error descriptivo
   * @param options - Opciones para personalizar la respuesta de error
   * @returns Objeto de error estructurado y tipado
   */
  static error<TBody = unknown>(
    message: string,
    options: ErrorOptions<TBody> = {},
  ): ErrorApiResponse<TBody> {
    const { status = HttpStatus.INTERNAL_SERVER_ERROR, body = null, error } = options;

    return {
      ok: false,
      status,
      message: message || this.DEFAULT_ERROR_MESSAGE,
      body,
      error: this.extractErrorMessage(error),
      timestamp: new Date().toISOString(),
    } as const;
  }

  /**
   * Crea una respuesta de validación fallida
   *
   * @param validationErrors - Array de errores de validación
   * @param message - Mensaje personalizado (opcional)
   * @returns Respuesta de error de validación
   */
  static validationError(
    validationErrors: string[] | Record<string, string[]>,
    message: string = 'Errores de validación',
  ): ErrorApiResponse<{ validationErrors: string[] | Record<string, string[]> }> {
    return this.error(message, {
      status: HttpStatus.BAD_REQUEST,
      body: { validationErrors },
    });
  }

  /**
   * Crea una respuesta de no encontrado
   *
   * @param resource - Nombre del recurso no encontrado
   * @param identifier - Identificador del recurso (opcional)
   * @returns Respuesta de error 404
   */
  static notFound(
    resource: string,
    identifier?: string | number,
  ): ErrorApiResponse<{ resource: string; identifier?: string | number }> {
    const message = identifier
      ? `${resource} con identificador '${identifier}' no encontrado`
      : `${resource} no encontrado`;

    return this.error(message, {
      status: HttpStatus.NOT_FOUND,
      body: { resource, identifier },
    });
  }

  /**
   * Crea una respuesta de no autorizado
   *
   * @param message - Mensaje personalizado (opcional)
   * @returns Respuesta de error 401
   */
  static unauthorized(message: string = 'No autorizado'): ErrorApiResponse<null> {
    return this.error(message, {
      status: HttpStatus.UNAUTHORIZED,
    });
  }

  /**
   * Crea una respuesta de prohibido
   *
   * @param message - Mensaje personalizado (opcional)
   * @returns Respuesta de error 403
   */
  static forbidden(message: string = 'Acceso prohibido'): ErrorApiResponse<null> {
    return this.error(message, {
      status: HttpStatus.FORBIDDEN,
    });
  }

  /**
   * Extrae el mensaje de error de diferentes tipos de objetos de error
   *
   * @private
   * @param error - Objeto de error de cualquier tipo
   * @returns Mensaje de error extraído o null
   */
  private static extractErrorMessage(error: ErrorLike): string | null {
    if (!error) return null;

    if (typeof error === 'string') return error;

    if (error instanceof Error) return error.message;

    if (typeof error === 'object') {
      if ('message' in error && typeof error.message === 'string') {
        return error.message;
      }
      if ('error' in error && typeof error.error === 'string') {
        return error.error;
      }
    }

    return String(error);
  }
}

// Exportar tipos para uso en otros módulos
export type {
  ApiResponse,
  SuccessApiResponse,
  ErrorApiResponse,
  BaseApiResponse,
  SuccessOptions,
  ErrorOptions,
  ErrorLike,
};
