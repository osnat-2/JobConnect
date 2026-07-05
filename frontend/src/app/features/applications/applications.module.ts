import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

/**
 * Applications Feature Module
 * Handles application tracking, kanban board, interview scheduling, and application workflows
 */

const routes: Routes = [
  {
    path: '',
    component: ApplicationsListComponent
  },
  {
    path: 'kanban/:candidateId',
    component: KanbanBoardComponent
  },
  {
    path: 'detail/:applicationId',
    component: ApplicationDetailComponent
  }
];

@NgModule({
  declarations: [],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class ApplicationsModule {}

// Placeholder components (to be created)
class ApplicationsListComponent {}
class KanbanBoardComponent {}
class ApplicationDetailComponent {}
