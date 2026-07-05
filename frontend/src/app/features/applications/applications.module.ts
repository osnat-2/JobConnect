import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';

/**
 * Applications Feature Module
 * Handles application tracking, kanban board, interview scheduling, and application workflows
 */

class ApplicationsListComponent {}
class ApplicationDetailComponent {}

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
  declarations: [KanbanBoardComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule]
})
export class ApplicationsModule {}
