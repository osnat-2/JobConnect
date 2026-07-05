import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent implements OnDestroy {
  @Input() message: string = 'Loading...';
  @Input() backdropColor: string = 'rgba(0, 0, 0, 0.5)';
  @Input() spinnerColor: string = '#007bff';

  @Output() visibilityChange = new EventEmitter<boolean>();

  private activeRequests$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();

  isLoading$: Observable<boolean> = this.activeRequests$.pipe(
    map(count => count > 0),
    distinctUntilChanged()
  );

  activeRequestCount = 0;

  constructor(private http: HttpClient) {
    this.isLoading$.pipe(takeUntil(this.destroy$)).subscribe(isLoading => {
      this.visibilityChange.emit(isLoading);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  requestStarted(): void {
    this.activeRequestCount += 1;
    this.activeRequests$.next(this.activeRequestCount);
  }

  requestCompleted(): void {
    this.activeRequestCount = Math.max(0, this.activeRequestCount - 1);
    this.activeRequests$.next(this.activeRequestCount);
  }
}
