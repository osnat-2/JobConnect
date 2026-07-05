import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';

@NgModule({
  declarations: [FileUploadComponent, LoadingSpinnerComponent],
  imports: [CommonModule],
  exports: [FileUploadComponent, LoadingSpinnerComponent]
})
export class SharedModule {}
