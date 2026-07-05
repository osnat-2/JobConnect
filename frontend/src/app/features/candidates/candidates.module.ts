import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

/**
 * Candidates Feature Module
 * Handles candidate profiles, CV uploads, and candidate-related operations
 */

const routes: Routes = [
  {
    path: '',
    component: CandidatesListComponent
  },
  {
    path: 'profile/:id',
    component: CandidateProfileComponent
  }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class CandidatesModule {}

// Placeholder components (to be created)
class CandidatesListComponent {}
class CandidateProfileComponent {}
