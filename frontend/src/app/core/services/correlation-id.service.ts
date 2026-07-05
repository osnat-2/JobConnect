import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service to manage and provide Correlation IDs for request tracing.
 * Ensures a single correlation ID is maintained throughout the application lifecycle.
 */
@Injectable({
  providedIn: 'root'
})
export class CorrelationIdService {
  private correlationId: string = '';

  constructor() {
    this.initializeCorrelationId();
  }

  /**
   * Initialize correlation ID from storage or generate new one
   */
  private initializeCorrelationId(): void {
    // Try to retrieve from session storage
    const stored = sessionStorage.getItem('x-correlation-id');
    if (stored) {
      this.correlationId = stored;
    } else {
      // Generate new UUID for this session
      this.correlationId = uuidv4();
      sessionStorage.setItem('x-correlation-id', this.correlationId);
    }
  }

  /**
   * Get existing correlation ID or generate new one
   */
  getOrGenerateId(): string {
    if (!this.correlationId) {
      this.correlationId = uuidv4();
      sessionStorage.setItem('x-correlation-id', this.correlationId);
    }
    return this.correlationId;
  }

  /**
   * Get current correlation ID
   */
  getId(): string {
    return this.correlationId || this.getOrGenerateId();
  }

  /**
   * Reset correlation ID (useful for testing or new sessions)
   */
  reset(): void {
    this.correlationId = uuidv4();
    sessionStorage.setItem('x-correlation-id', this.correlationId);
  }

  /**
   * Clear correlation ID from storage
   */
  clear(): void {
    this.correlationId = '';
    sessionStorage.removeItem('x-correlation-id');
  }
}
