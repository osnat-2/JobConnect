import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CandidateListComponent } from './components/candidate-list/candidate-list.component';

/**
 * Candidates Feature Module
 * Handles candidate profiles, CV uploads, and candidate-related operations
 */

const routes: Routes = [
  {
    path: '',
    component: CandidateListComponent
  },
  {
    path: ':id',
    component: CandidateListComponent
  }
];

@NgModule({
  declarations: [CandidateListComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class CandidatesModule {}
