import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  @Input() acceptedFormats: string[] = ['.pdf', '.docx'];
  @Input() maxFileSize: number = 10485760;
  @Input() uploadLabel: string = 'Upload CV';
  @Input() dragText: string = 'Drag & drop your CV here';
  @Input() disabled: boolean = false;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() fileRemoved = new EventEmitter<void>();
  @Output() uploadError = new EventEmitter<string>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  selectedFile: File | null = null;
  isDragover = false;
  errorMessage: string | null = null;
  isUploading = false;

  candidatesService: { uploadResume: (candidateId: string, file: File) => Observable<any> } | null = null;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const validationError = this.validateFile(file);

    if (validationError) {
      this.errorMessage = validationError;
      this.uploadError.emit(validationError);
      return;
    }

    this.selectedFile = file;
    this.errorMessage = null;
    this.fileSelected.emit(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.onFileSelected({ target: { files } } as unknown as Event);
    }
  }

  validateFile(file: File): string | null {
    if (!this.validateFileExtension(file)) {
      return 'File must be PDF or DOCX format';
    }

    if (!this.validateMimeType(file)) {
      return 'Invalid file type. Please upload a PDF or DOCX file.';
    }

    if (!this.validateFileSize(file, this.maxFileSize)) {
      return `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`;
    }

    return null;
  }

  validateFileExtension(file: File): boolean {
    const acceptedExtensions = this.acceptedFormats;
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    return acceptedExtensions.includes(fileExtension);
  }

  validateMimeType(file: File): boolean {
    const acceptedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    return acceptedMimes.includes(file.type);
  }

  validateFileSize(file: File, maxSizeBytes: number): boolean {
    return file.size <= maxSizeBytes;
  }

  confirmUpload(candidateId: string = ''): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Please select a file';
      this.uploadError.emit(this.errorMessage);
      return;
    }

    this.isUploading = true;

    if (this.candidatesService?.uploadResume) {
      this.candidatesService.uploadResume(candidateId, this.selectedFile)
        .pipe(
          finalize(() => this.isUploading = false)
        )
        .subscribe({
          next: () => {
            console.log('Resume uploaded successfully');
            this.removeFile();
          },
          error: () => {
            this.errorMessage = 'Failed to upload file. Please try again.';
            this.uploadError.emit(this.errorMessage);
          }
        });
      return;
    }

    setTimeout(() => {
      this.isUploading = false;
      this.removeFile();
    }, 800);
  }

  cancelUpload(): void {
    this.removeFile();
  }

  removeFile(): void {
    this.selectedFile = null;
    this.errorMessage = null;
    this.fileRemoved.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
