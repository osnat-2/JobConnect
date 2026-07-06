import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { JobsComponent } from './components/jobs/jobs.component';

/**
 * Jobs Feature Module
 * Handles job listings, job details, and job-related operations
 */

const routes: Routes = [
  {
    path: '',
    component: JobsComponent
  },
  {
    path: ':id',
    component: JobsComponent
  }
];

@NgModule({
  declarations: [JobsComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class JobsModule {}
