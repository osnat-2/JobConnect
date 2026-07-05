import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { CorrelationIdInterceptor } from './core/interceptors/correlation-id.interceptor';

/**
 * Root Application Module
 * Configures:
 * - HTTP Interceptors for request tracing (Correlation ID injection)
 * - Core services and global infrastructure
 * - Feature modules
 */
@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, HttpClientModule],
  providers: [
    /**
     * Register HTTP Interceptor for Correlation ID injection
     * This ensures every outgoing HTTP request includes the X-Correlation-ID header
     */
    {
      provide: HTTP_INTERCEPTORS,
      useClass: CorrelationIdInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
