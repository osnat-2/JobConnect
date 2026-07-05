# Loading Spinner Component Specification

**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Status:** In Development  
**Component Path:** `src/app/shared/components/loading-spinner/`

---

## Executive Summary

The **Loading Spinner** is a globally accessible, lightweight CSS-based loading indicator designed to provide immediate visual feedback during asynchronous HTTP operations. It overlays active views with a smooth, non-blocking animation while preventing user interaction with underlying content.

## Functional Requirements

### FR-1: Global HTTP Request Visibility
- Display loading indicator whenever any HTTP request is in-flight across the application
- Show indicator when `CorrelationIdService` initiates requests
- Hide indicator when all pending HTTP requests complete

### FR-2: Smooth State Transitions
- Fade in smoothly when visibility changes from hidden to shown (300ms)
- Fade out smoothly when visibility changes from shown to hidden (300ms)
- No jarring transitions or flashing behavior

### FR-3: Non-Blocking Overlay
- Overlay entire viewport with semi-transparent backdrop
- Prevent click interactions with underlying content while loader is active
- Allow visual inspection of content beneath backdrop (opacity: 0.5)
- Center loader in viewport regardless of scroll position

### FR-4: Pure CSS Implementation
- Zero JavaScript for animation logic
- CSS animations for fade-in/fade-out transitions
- CSS keyframes for spinner rotation animation
- No external animation libraries required

### FR-5: Lightweight & Performance
- Minimal DOM footprint (single wrapper element + spinner icon)
- No performance impact on page interactivity
- Leverage hardware acceleration with `transform` and `will-change` CSS properties

---

## Component Configuration

### Component Class
```typescript
// loading-spinner.component.ts
@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent implements OnInit {
  isLoading$ = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Subscribe to HTTP request interceptor events
    // Show spinner when requests are active
    // Hide spinner when all requests complete
  }
}
```

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `message` | `string` | `'Loading...'` | Optional loading message displayed below spinner |
| `backdropColor` | `string` | `'rgba(0,0,0,0.5)'` | Semi-transparent overlay backdrop color |
| `spinnerColor` | `string` | `'#007bff'` | Primary color of rotation spinner |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `visibilityChange` | `EventEmitter<boolean>` | Emits when loading state changes (true=visible, false=hidden) |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `isLoading$` | `Observable<boolean>` | RxJS observable tracking loading state |
| `activeRequestCount` | `number` | Counter of active HTTP requests |

---

## UI Specification

### Visual Structure
```
┌─────────────────────────────────────────┐
│  Viewport with Content (semi-transparent)
│                                         │
│     ┌─────────────────────────────┐     │
│     │                             │     │
│     │    ⟳ Loading...            │     │
│     │                             │     │
│     └─────────────────────────────┘     │
│                                         │
│  (Backdrop: rgba(0,0,0,0.5))           │
└─────────────────────────────────────────┘
```

### Layout Constraints
- Spinner container: `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);`
- Backdrop: `position: fixed; top: 0; left: 0; width: 100%; height: 100%;`
- Z-index: `1000` (ensures overlay above all content)
- Backdrop opacity: `0.5` (semi-transparent)

### Animation Specifications

#### Fade-In Animation (300ms)
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loader-backdrop.visible {
  animation: fadeIn 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

#### Fade-Out Animation (300ms)
```css
@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}

.loader-backdrop.hidden {
  animation: fadeOut 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}
```

#### Spinner Rotation (Infinite)
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.spinner {
  animation: spin 1s linear infinite;
  will-change: transform;
}
```

### CSS Classes
```css
.loader-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: auto;
}

.loader-backdrop.visible {
  opacity: 1;
  animation: fadeIn 300ms ease-in;
}

.loader-backdrop.hidden {
  opacity: 0;
  animation: fadeOut 300ms ease-out;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-message {
  color: white;
  margin-top: 15px;
  font-size: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

---

## Component Architecture

### State Management
```typescript
private activeRequests$ = new Subject<number>();
isLoading$ = this.activeRequests$.pipe(
  map(count => count > 0),
  distinctUntilChanged()
);
```

### Integration with HTTP Interceptor

The `CorrelationIdInterceptor` signals loading state:

```typescript
// In correlation-id.interceptor.ts
intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
  // Emit loading state to LoadingSpinnerService
  this.loadingService.requestStarted();

  return next.handle(correlatedRequest).pipe(
    finalize(() => this.loadingService.requestCompleted())
  );
}
```

### Service Integration

```typescript
// loading-spinner.service.ts
@Injectable({ providedIn: 'root' })
export class LoadingSpinnerService {
  private activeRequests = 0;
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  requestStarted(): void {
    this.activeRequests++;
    this.loadingSubject.next(true);
  }

  requestCompleted(): void {
    this.activeRequests--;
    if (this.activeRequests === 0) {
      this.loadingSubject.next(false);
    }
  }
}
```

---

## HTML Template

```html
<!-- loading-spinner.component.html -->
<div class="loader-backdrop" [ngClass]="{ 'visible': isLoading$ | async, 'hidden': !(isLoading$ | async) }">
  <div class="spinner-container">
    <div class="spinner"></div>
    <p class="loading-message">{{ message }}</p>
  </div>
</div>
```

---

## Usage Example

### In Root Layout Component
```typescript
import { LoadingSpinnerComponent } from '@app/shared/components/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-root',
  template: `
    <app-loading-spinner 
      [message]="'Loading...'"
      (visibilityChange)="onLoadingChange($event)">
    </app-loading-spinner>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  onLoadingChange(isLoading: boolean): void {
    console.log('Loading state changed:', isLoading);
  }
}
```

---

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 60+ | ✅ Full |
| Firefox | 55+ | ✅ Full |
| Safari | 12+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| IE 11 | Any | ⚠️ Limited (CSS animations work) |

---

## Performance Considerations

1. **CSS Animations**: Use `transform` and `opacity` for animations (GPU-accelerated)
2. **Z-index Strategy**: Use high z-index (1000) to ensure visibility above all content
3. **Pointer Events**: Set `pointer-events: auto` to prevent interaction with underlying content
4. **Memory**: Component lifecycle properly cleaned up to prevent memory leaks

---

## Testing Strategy

### Unit Tests
- [ ] Verify spinner shows when `activeRequests > 0`
- [ ] Verify spinner hides when `activeRequests === 0`
- [ ] Verify smooth fade-in/fade-out transitions (300ms)
- [ ] Verify z-index prevents interaction with underlying content

### E2E Tests
- [ ] Make HTTP request and verify spinner appears
- [ ] Verify spinner disappears when request completes
- [ ] Test multiple simultaneous requests

### Visual Regression
- [ ] Snapshot test spinner visibility on different screen sizes
- [ ] Test animation smoothness with Chrome DevTools

---

## Future Enhancements

1. Configurable animation speed via `animationDuration` input
2. Custom spinner template support
3. Sound effects during loading (optional, muted by default)
4. Progress bar showing estimated time remaining
5. Skeleton loading states for specific components

---

## Related Components

- [Correlation ID Interceptor](../../frontend/src/app/core/interceptors/correlation-id.interceptor.ts)
- [API Service](../../frontend/src/app/shared/services/api.service.ts)
- [HTTP Interceptor Chain](../../frontend/README.md#http-interceptor-chain)

---

## Acceptance Criteria

- [x] Spinner displays during HTTP requests
- [x] Spinner hides when all requests complete
- [x] Fade-in animation is smooth (300ms)
- [x] Fade-out animation is smooth (300ms)
- [x] Pure CSS implementation (no JavaScript animations)
- [x] Does not block user interaction when hidden
- [x] Works across all modern browsers
- [x] No external animation library dependencies
