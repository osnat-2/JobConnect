import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { CorrelationIdService } from '../services/correlation-id.service';

/**
 * HTTP Interceptor that injects a unique Correlation ID header into every outgoing request.
 * This enables end-to-end request tracing across all microservices.
 *
 * Features:
 * - Auto-generates a UUID if no correlation ID exists yet
 * - Injects 'X-Correlation-ID' header into all HTTP requests
 * - Logs request/response with correlation ID for debugging
 */
@Injectable()
export class CorrelationIdInterceptor implements HttpInterceptor {
  constructor(private correlationIdService: CorrelationIdService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get or generate correlation ID
    const correlationId = this.correlationIdService.getOrGenerateId();

    // Clone request and inject correlation ID header
    const correlatedRequest = request.clone({
      setHeaders: {
        'X-Correlation-ID': correlationId
      }
    });

    return next.handle(correlatedRequest).pipe(
      tap((event: HttpEvent<unknown>) => {
        if (event instanceof HttpResponse) {
          console.debug(
            `[${correlationId}] HTTP ${correlatedRequest.method} ${correlatedRequest.url} - ${event.status}`
          );
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.error(
          `[${correlationId}] HTTP Error ${correlatedRequest.method} ${correlatedRequest.url} - ${error.status}`,
          error
        );
        return throwError(() => error);
      })
    );
  }
}
