import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { ResponseHelper, SuccessApiResponse, ApiResponse } from '../helpers/response.helper';

/**
 * Guard de tipo para verificar si es una respuesta API válida
 */
function isApiResponse(data: unknown): data is ApiResponse {
  return (
    data !== null &&
    typeof data === 'object' &&
    'ok' in data &&
    typeof (data as Record<string, unknown>).ok === 'boolean' &&
    'status' in data &&
    typeof (data as Record<string, unknown>).status === 'number' &&
    'message' in data &&
    typeof (data as Record<string, unknown>).message === 'string' &&
    'timestamp' in data &&
    typeof (data as Record<string, unknown>).timestamp === 'string'
  );
}

/**
 * Configuración del interceptor
 */
interface InterceptorConfig {
  readonly enableLogging?: boolean;
  readonly defaultSuccessMessage?: string;
  readonly transformStrings?: boolean;
}

/**
 * Interceptor que estandariza todas las respuestas de la API
 *
 * Funciones principales:
 * - Transforma respuestas no estructuradas al formato estándar
 * - Preserva respuestas ya estructuradas
 * - Maneja diferentes tipos de datos de respuesta
 * - Proporciona logging opcional
 * - Mantiene códigos de estado HTTP apropiados
 *
 * @example
 * ```typescript
 * // En app.module.ts o en el controlador específico
 * @UseInterceptors(ResponseInterceptor)
 *
 * // O globalmente
 * app.useGlobalInterceptors(new ResponseInterceptor());
 * ```
 */
@Injectable()
export class ResponseInterceptor<TData = unknown>
  implements NestInterceptor<TData, ApiResponse<TData>>
{
  private readonly logger = new Logger(ResponseInterceptor.name);

  private readonly config: Required<InterceptorConfig> = {
    enableLogging: false,
    defaultSuccessMessage: 'Operación exitosa',
    transformStrings: true,
  };

  constructor(config: InterceptorConfig = {}) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Intercepta la respuesta y la transforma al formato estándar
   */
  intercept(context: ExecutionContext, next: CallHandler<TData>): Observable<ApiResponse<TData>> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    return next.handle().pipe(
      map((data: TData): ApiResponse<TData> => {
        const transformedResponse = this.transformResponse(data, response);

        if (this.config.enableLogging) {
          this.logResponse(request, response, startTime, transformedResponse);
        }

        return transformedResponse;
      }),
      catchError((error: unknown) => {
        // En caso de error, el interceptor no debería manejarlo
        // Los filtros de excepción se encargan de eso
        throw error;
      }),
    );
  }

  /**
   * Transforma la respuesta al formato estándar
   *
   * @private
   * @param data - Datos de respuesta originales
   * @param response - Objeto de respuesta HTTP
   * @returns Respuesta transformada
   */
  private transformResponse(data: TData, response: Response): ApiResponse<TData> {
    // Si ya es una respuesta API estructurada, verificamos y preservamos
    if (isApiResponse(data)) {
      this.syncHttpStatusCode(data.status, response);
      return data as ApiResponse<TData>;
    }

    // Manejo especial para respuestas nulas o undefined
    if (data === null || data === undefined) {
      return this.createSuccessResponse(null as TData, response);
    }

    // Manejo para strings (si está habilitado)
    if (typeof data === 'string' && this.config.transformStrings) {
      return this.createSuccessResponse(null as TData, response, data);
    }

    // Manejo para arrays vacíos
    if (Array.isArray(data) && data.length === 0) {
      return this.createSuccessResponse(data, response, 'Lista obtenida exitosamente (vacía)');
    }

    // Manejo para objetos con propiedades específicas que indican éxito/fallo
    if (this.hasSpecialResponseFormat(data)) {
      return this.handleSpecialFormat(data, response);
    }

    // Caso general: envolver datos en respuesta exitosa
    return this.createSuccessResponse(data, response);
  }

  /**
   * Crea una respuesta exitosa estándar
   *
   * @private
   * @param data - Datos a incluir en la respuesta
   * @param response - Objeto de respuesta HTTP
   * @param customMessage - Mensaje personalizado (opcional)
   * @returns Respuesta exitosa tipada
   */
  private createSuccessResponse(
    data: TData,
    response: Response,
    customMessage?: string,
  ): SuccessApiResponse<TData> {
    const httpStatus = this.getValidHttpStatus(response.statusCode);
    const message = customMessage ?? this.getSuccessMessageByStatus(httpStatus);

    return ResponseHelper.success(data, {
      message,
      status: httpStatus,
    });
  }

  /**
   * Verifica si los datos tienen un formato especial de respuesta
   *
   * @private
   * @param data - Datos a verificar
   * @returns true si tiene formato especial
   */
  private hasSpecialResponseFormat(data: unknown): boolean {
    return (
      typeof data === 'object' &&
      data !== null &&
      (('success' in data && typeof (data as Record<string, unknown>).success === 'boolean') ||
        ('error' in data && typeof (data as Record<string, unknown>).error === 'boolean') ||
        'result' in data ||
        ('data' in data && 'meta' in data))
    );
  }

  /**
   * Maneja formatos especiales de respuesta
   *
   * @private
   * @param data - Datos con formato especial
   * @param response - Objeto de respuesta HTTP
   * @returns Respuesta API estructurada
   */
  private handleSpecialFormat(data: any, response: Response): ApiResponse<TData> {
    if (this.isSuccessFormat(data)) {
      return this.handleSuccessFormat(data, response);
    }

    if (this.isPaginatedFormat(data)) {
      return this.handlePaginatedFormat(data, response);
    }

    if (this.isResultFormat(data)) {
      return this.handleResultFormat(data, response);
    }

    // Fallback: tratar como respuesta exitosa
    return this.createSuccessResponse(data as TData, response);
  }

  private isSuccessFormat(data: any): boolean {
    return 'success' in data;
  }

  private handleSuccessFormat(data: any, response: Response): ApiResponse<TData> {
    const typedData = data as { success: boolean; data?: unknown; message?: string };
    if (typedData.success) {
      return this.createSuccessResponse(
        (typedData.data ?? data) as TData,
        response,
        typeof typedData.message === 'string' ? typedData.message : undefined,
      );
    } else {
      const httpStatus = this.getValidHttpStatus(response.statusCode, HttpStatus.BAD_REQUEST);
      return ResponseHelper.error(
        typeof typedData.message === 'string' ? typedData.message : 'Operación fallida',
        {
          status: httpStatus,
          body: 'data' in typedData ? typedData.data : undefined,
        },
      ) as ApiResponse<TData>;
    }
  }

  private isPaginatedFormat(data: any): boolean {
    return 'data' in data && 'meta' in data;
  }

  private handlePaginatedFormat(data: any, response: Response): ApiResponse<TData> {
    return this.createSuccessResponse(
      data as TData,
      response,
      'Datos paginados obtenidos exitosamente',
    );
  }

  private isResultFormat(data: any): boolean {
    return 'result' in data;
  }

  private handleResultFormat(data: any, response: Response): ApiResponse<TData> {
    const resultData = (data as { result: unknown }).result;
    return this.createSuccessResponse(resultData as TData, response);
  }

  /**
   * Obtiene un código de estado HTTP válido
   *
   * @private
   * @param statusCode - Código de estado actual
   * @param fallback - Código de respaldo
   * @returns Código de estado HTTP válido
   */
  private getValidHttpStatus(statusCode: number, fallback: HttpStatus = HttpStatus.OK): HttpStatus {
    // Verificar si es un código de estado HTTP válido (100-599)
    if (statusCode >= 100 && statusCode <= 599) {
      return statusCode as HttpStatus;
    }
    return fallback;
  }

  /**
   * Obtiene un mensaje de éxito apropiado según el código de estado
   *
   * @private
   * @param status - Código de estado HTTP
   * @returns Mensaje de éxito
   */
  private getSuccessMessageByStatus(status: HttpStatus): string {
    const statusMessages: Partial<Record<HttpStatus, string>> = {
      [HttpStatus.OK]: 'Operación exitosa',
      [HttpStatus.CREATED]: 'Recurso creado exitosamente',
      [HttpStatus.ACCEPTED]: 'Solicitud aceptada',
      [HttpStatus.NO_CONTENT]: 'Operación completada sin contenido',
      [HttpStatus.PARTIAL_CONTENT]: 'Contenido parcial obtenido',
    };

    return statusMessages[status] ?? this.config.defaultSuccessMessage;
  }

  /**
   * Sincroniza el código de estado HTTP con la respuesta
   *
   * @private
   * @param apiStatus - Estado de la respuesta API
   * @param response - Objeto de respuesta HTTP
   */
  private syncHttpStatusCode(apiStatus: number, response: Response): void {
    if (response.statusCode !== apiStatus) {
      response.status(apiStatus);
    }
  }

  /**
   * Registra información sobre la respuesta (si el logging está habilitado)
   *
   * @private
   * @param request - Objeto de solicitud HTTP
   * @param response - Objeto de respuesta HTTP
   * @param startTime - Tiempo de inicio de la solicitud
   * @param apiResponse - Respuesta API estructurada
   */
  private logResponse(
    request: Request,
    response: Response,
    startTime: number,
    apiResponse: ApiResponse<TData>,
  ): void {
    const duration = Date.now() - startTime;
    const logMessage = `${request.method} ${request.url} - ${apiResponse.status} - ${duration}ms`;

    if (apiResponse.ok) {
      this.logger.log(logMessage);
    } else {
      this.logger.warn(`${logMessage} - ${apiResponse.message}`);
    }
  }
}
