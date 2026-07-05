# File Upload Component Specification

**Version:** 1.0  
**Last Updated:** 2026-07-05  
**Status:** In Development  
**Component Path:** `src/app/shared/components/file-upload/`

---

## Executive Summary

The **File Upload** component is a reusable, drag-and-drop enabled interface for resume and CV submissions. It provides users with an intuitive way to upload employment documents in PDF or DOCX formats, with clear visual feedback and seamless integration into the candidate profile workflow.

## Functional Requirements

### FR-1: Resume/CV File Submission
- Accept file uploads from candidates
- Support drag-and-drop file submission
- Validate file type (`.pdf`, `.docx` only)
- Validate file size (max 10MB recommended)
- Provide user feedback on validation errors

### FR-2: Multiple Upload Methods
- **Method 1**: Click on dashed zone to trigger file picker dialog
- **Method 2**: Drag and drop files directly onto the component
- **Method 3**: Click "Upload CV" button to trigger file picker with visual confirmation

### FR-3: File Validation
- Reject files not matching `.pdf` or `.docx` extensions
- Reject files exceeding 10MB
- Validate MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Display clear error messages for rejected files

### FR-4: User Feedback
- Show file name and size after selection
- Show validation error messages inline
- Show success state after file is processed
- Show upload progress indicator during CandidatesService.uploadResume() call

### FR-5: Event Emission
- Emit `fileSelected` event when valid file is selected
- Pass raw HTML5 File object to parent component
- Allow parent component to confirm/cancel upload

---

## Component Configuration

### Component Class
```typescript
// file-upload.component.ts
@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  @Output() fileSelected = new EventEmitter<File>();

  selectedFile: File | null = null;
  isDragover = false;
  errorMessage: string | null = null;
  isUploading = false;
}
```

### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `acceptedFormats` | `string[]` | `['.pdf', '.docx']` | Array of accepted file extensions |
| `maxFileSize` | `number` | `10485760` | Maximum file size in bytes (10MB) |
| `uploadLabel` | `string` | `'Upload CV'` | Label text for upload button |
| `dragText` | `string` | `'Drag & drop your CV here'` | Text displayed in drag-drop zone |
| `disabled` | `boolean` | `false` | Disable upload functionality |

### Outputs

| Output | Type | Payload | Description |
|--------|------|---------|-------------|
| `fileSelected` | `EventEmitter<File>` | `File` object | Emits when valid file is selected |
| `fileRemoved` | `EventEmitter<void>` | `void` | Emits when selected file is cleared |
| `uploadError` | `EventEmitter<string>` | Error message | Emits when file validation fails |

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `selectedFile` | `File \| null` | Currently selected file object |
| `isDragover` | `boolean` | Whether user is actively dragging over component |
| `errorMessage` | `string \| null` | Current validation error message |
| `isUploading` | `boolean` | Whether file upload is in progress |

---

## UI Specification

### Visual Structure
```
┌─────────────────────────────────────────────┐
│  Upload CV                                  │
├─────────────────────────────────────────────┤
│                                             │
│  ╭─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─╮  │
│  ┆                                       ┆  │
│  ┆  📄 Drag & drop your CV here        ┆  │
│  ┆                                       ┆  │
│  ┆        [Upload CV Button]             ┆  │
│  ┆                                       ┆  │
│  ╰─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─╯  │
│                                             │
│  Supported formats: PDF, DOCX (max 10MB)   │
│                                             │
└─────────────────────────────────────────────┘

AFTER FILE SELECTED:
┌─────────────────────────────────────────────┐
│  Upload CV                                  │
├─────────────────────────────────────────────┤
│                                             │
│  ✓ resume.pdf (245 KB)  [Remove]           │
│                                             │
│  [Confirm Upload]  [Cancel]                │
│                                             │
└─────────────────────────────────────────────┘

WITH ERROR:
┌─────────────────────────────────────────────┐
│  Upload CV                                  │
├─────────────────────────────────────────────┤
│                                             │
│  ⚠️ Error: File must be PDF or DOCX         │
│                                             │
│  ╭─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─╮  │
│  ┆  Drag & drop your CV here             ┆  │
│  ┆  [Upload CV Button]                    ┆  │
│  ╰─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─╯  │
│                                             │
└─────────────────────────────────────────────┘
```

### Layout Constraints
- **Dashed Zone Dimensions**: Min width 300px, Min height 180px
- **Dashed Border**: `2px dashed #cccccc` (normal state), `2px dashed #007bff` (dragover state)
- **Border Radius**: `8px`
- **Padding**: `20px` inside dashed zone
- **Text Alignment**: Centered vertically and horizontally
- **Icon**: Document icon (📄) or custom SVG icon

### Dragover State
```css
.drag-zone.dragover {
  background-color: rgba(0, 123, 255, 0.05);
  border-color: #007bff;
  border-style: solid;
}
```

### Selected File Display
```html
<!-- After file is selected -->
<div class="file-selected">
  <span class="file-icon">📄</span>
  <span class="file-name">{{ selectedFile.name }}</span>
  <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
  <button type="button" (click)="removeFile()" class="remove-btn">Remove</button>
</div>
```

### Action Buttons
- **Upload CV Button**: Primary button (blue background, white text), full width in dashed zone
- **Confirm Upload Button**: Primary button, appears after file selection
- **Cancel Button**: Secondary button, appears after file selection
- **Remove Button**: Small text button (red color), appears next to selected file

---

## Validation Rules

### File Extension Validation
```typescript
validateFileExtension(file: File): boolean {
  const acceptedExtensions = ['.pdf', '.docx'];
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
  return acceptedExtensions.includes(fileExtension);
}
```

### File MIME Type Validation
```typescript
validateMimeType(file: File): boolean {
  const acceptedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return acceptedMimes.includes(file.type);
}
```

### File Size Validation
```typescript
validateFileSize(file: File, maxSizeBytes: number): boolean {
  return file.size <= maxSizeBytes;
}
```

### Error Messages
| Scenario | Error Message |
|----------|---------------|
| Invalid format | `"File must be PDF or DOCX format"` |
| File too large | `"File size exceeds 10MB limit"` |
| No file selected | `"Please select a file"` |
| Upload failed | `"Failed to upload file. Please try again."` |
| Network error | `"Network error. Please check your connection."` |

---

## Component Architecture

### File Selection Handler
```typescript
onFileSelected(event: Event): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) return;

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
```

### Drag & Drop Handlers
```typescript
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
```

### File Validation
```typescript
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
```

### CandidatesService Integration
```typescript
confirmUpload(candidateId: string): void {
  if (!this.selectedFile) return;

  this.isUploading = true;
  
  this.candidatesService.uploadResume(candidateId, this.selectedFile)
    .pipe(
      finalize(() => this.isUploading = false)
    )
    .subscribe({
      next: (profile: CandidateProfile) => {
        console.log('Resume uploaded successfully:', profile);
        this.selectedFile = null;
        this.removeFile();
      },
      error: (error) => {
        this.errorMessage = 'Failed to upload file. Please try again.';
        this.uploadError.emit(this.errorMessage);
      }
    });
}
```

---

## HTML Template

```html
<!-- file-upload.component.html -->
<div class="file-upload-container">
  <h3 class="upload-title">{{ uploadLabel }}</h3>

  <!-- Selected File Display -->
  <div *ngIf="selectedFile" class="file-selected">
    <span class="file-icon">📄</span>
    <span class="file-info">
      <span class="file-name">{{ selectedFile.name }}</span>
      <span class="file-size">({{ formatFileSize(selectedFile.size) }})</span>
    </span>
    <button type="button" (click)="removeFile()" class="remove-btn">
      Remove
    </button>
  </div>

  <!-- Error Message -->
  <div *ngIf="errorMessage" class="error-message">
    <span class="error-icon">⚠️</span>
    {{ errorMessage }}
  </div>

  <!-- Drag & Drop Zone -->
  <div
    *ngIf="!selectedFile"
    class="drag-zone"
    [ngClass]="{ dragover: isDragover }"
    (dragover)="onDragOver($event)"
    (dragleave)="onDragLeave($event)"
    (drop)="onDrop($event)"
  >
    <span class="document-icon">📄</span>
    <p class="drag-text">{{ dragText }}</p>
    <button
      type="button"
      (click)="fileInput.click()"
      class="upload-btn"
      [disabled]="isUploading || disabled"
    >
      {{ isUploading ? 'Uploading...' : uploadLabel }}
    </button>
    <p class="supported-formats">
      Supported formats: {{ acceptedFormats.join(', ').toUpperCase() }} (max {{ formatFileSize(maxFileSize) }})
    </p>
  </div>

  <!-- Hidden File Input -->
  <input
    #fileInput
    type="file"
    hidden
    [accept]="acceptedFormats.join(',')"
    (change)="onFileSelected($event)"
  />

  <!-- Action Buttons (After Selection) -->
  <div *ngIf="selectedFile" class="action-buttons">
    <button
      type="button"
      (click)="confirmUpload()"
      class="btn-primary"
      [disabled]="isUploading"
    >
      {{ isUploading ? 'Uploading...' : 'Confirm Upload' }}
    </button>
    <button
      type="button"
      (click)="cancelUpload()"
      class="btn-secondary"
      [disabled]="isUploading"
    >
      Cancel
    </button>
  </div>
</div>
```

---

## CSS Styling

```css
.file-upload-container {
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #fafafa;
}

.upload-title {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.drag-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 180px;
  min-width: 300px;
  border: 2px dashed #cccccc;
  border-radius: 8px;
  padding: 20px;
  background-color: white;
  transition: all 300ms ease;
  cursor: pointer;
}

.drag-zone.dragover {
  background-color: rgba(0, 123, 255, 0.05);
  border-color: #007bff;
  border-style: solid;
}

.document-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.drag-text {
  margin: 10px 0;
  font-size: 16px;
  color: #666;
  text-align: center;
}

.upload-btn {
  padding: 10px 24px;
  margin: 10px 0;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 200ms ease;
}

.upload-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.upload-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.supported-formats {
  margin: 10px 0 0 0;
  font-size: 12px;
  color: #999;
  text-align: center;
}

.file-selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 15px;
  background-color: #e8f4f8;
  border-left: 4px solid #007bff;
  border-radius: 4px;
}

.file-icon {
  font-size: 24px;
  margin-right: 10px;
}

.file-info {
  flex: 1;
}

.file-name {
  display: block;
  font-weight: 600;
  color: #333;
}

.file-size {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.remove-btn {
  padding: 6px 12px;
  background-color: transparent;
  color: #dc3545;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 200ms ease;
}

.remove-btn:hover {
  background-color: rgba(220, 53, 69, 0.1);
}

.error-message {
  display: flex;
  align-items: center;
  padding: 12px;
  margin-bottom: 15px;
  background-color: #fff3cd;
  border-left: 4px solid #ffc107;
  border-radius: 4px;
  color: #856404;
  font-size: 14px;
}

.error-icon {
  font-size: 18px;
  margin-right: 10px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

---

## Usage Example

### In Candidate Profile Component
```typescript
import { FileUploadComponent } from '@app/shared/components/file-upload/file-upload.component';
import { CandidatesService } from '@app/features/candidates/services/candidates.service';

@Component({
  selector: 'app-candidate-profile',
  template: `
    <div class="profile-container">
      <h2>Candidate Profile</h2>
      <form>
        <input [(ngModel)]="candidate.firstName" placeholder="First Name" />
        <input [(ngModel)]="candidate.lastName" placeholder="Last Name" />
        
        <app-file-upload
          (fileSelected)="onFileSelected($event)"
          (uploadError)="onUploadError($event)"
          uploadLabel="Upload Resume"
          dragText="Drag your resume here or click to select"
        ></app-file-upload>
      </form>
    </div>
  `
})
export class CandidateProfileComponent implements OnInit {
  candidate: CandidateProfile;
  selectedFile: File | null = null;

  constructor(private candidatesService: CandidatesService) {}

  onFileSelected(file: File): void {
    this.selectedFile = file;
    // Confirmation handled by file-upload component
  }

  onUploadError(errorMessage: string): void {
    console.error('File upload error:', errorMessage);
  }
}
```

---

## Backend Service Integration

### CandidatesService.uploadResume()
```typescript
uploadResume(candidateId: string, file: File): Observable<CandidateProfile> {
  const formData = new FormData();
  formData.append('file', file);
  return this.post<CandidateProfile>(`${this.endpoint}/${candidateId}/resume`, formData);
}
```

### BFF Endpoint
- **Route**: `POST /api/candidates/:candidateId/resume`
- **Content-Type**: `multipart/form-data`
- **Response**: `CandidateProfile` with updated `resumeUrl` and `resumeFileName`

---

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 60+ | ✅ Full |
| Firefox | 55+ | ✅ Full |
| Safari | 12+ | ✅ Full |
| Edge | 79+ | ✅ Full |
| IE 11 | Any | ⚠️ Limited (no drag-drop) |

---

## Testing Strategy

### Unit Tests
- [ ] File extension validation works correctly
- [ ] File MIME type validation works correctly
- [ ] File size validation works correctly
- [ ] Drag-over state updates correctly
- [ ] fileSelected event emits with correct File object
- [ ] uploadError event emits with error message
- [ ] File removal clears selectedFile

### E2E Tests
- [ ] Select file via click on dashed zone
- [ ] Select file via drag-and-drop
- [ ] Reject invalid file extensions
- [ ] Reject files exceeding size limit
- [ ] Confirm upload triggers CandidatesService.uploadResume()
- [ ] Cancel removes selected file without upload

### Accessibility Tests
- [ ] File input keyboard accessible
- [ ] Error messages announced to screen readers
- [ ] Buttons have proper aria labels
- [ ] Color contrast meets WCAG standards

---

## Performance Considerations

1. **File Size Validation**: Validate client-side before sending to server
2. **FormData**: Use native FormData API for efficient file handling
3. **Progress Tracking**: Consider adding upload progress via HttpEvent
4. **Memory**: Properly handle large file objects

---

## Related Components & Services

- [CandidatesService](../../frontend/src/app/features/candidates/services/candidates.service.ts)
- [LoadingSpinnerComponent](#loading-spinner-component)
- [API Service](../../frontend/src/app/shared/services/api.service.ts)

---

## Acceptance Criteria

- [x] Accepts `.pdf` and `.docx` files only
- [x] Rejects files larger than 10MB
- [x] Dashed drag-drop zone with proper styling
- [x] Drag-over state changes zone appearance
- [x] fileSelected event emits File object
- [x] Confirms upload before sending to server
- [x] Shows error messages for validation failures
- [x] Displays file name and size after selection
- [x] Integration with CandidatesService.uploadResume()
- [x] Loading indicator during upload
