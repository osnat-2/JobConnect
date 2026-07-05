import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

/**
 * Jobs Feature Module
 * Handles job listings, job details, and job-related operations
 */

const routes: Routes = [
  {
    path: '',
    component: JobsListComponent
  },
  {
    path: ':id',
    component: JobDetailComponent
  }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class JobsModule {}

// Placeholder components (to be created)
class JobsListComponent {}
class JobDetailComponent {}
