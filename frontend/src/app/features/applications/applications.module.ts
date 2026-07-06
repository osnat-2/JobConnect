import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';
import { ApplicationTrackerComponent } from './components/application-tracker/application-tracker.component';

/**
 * Applications Feature Module
 * Handles application tracking, kanban board, interview scheduling, and application workflows
 */

const routes: Routes = [
  {
    path: '',
    component: ApplicationTrackerComponent
  },
  {
    path: ':candidateId',
    component: ApplicationTrackerComponent
  },
  {
    path: 'kanban/:candidateId',
    component: KanbanBoardComponent
  }
];

@NgModule({
  declarations: [ApplicationTrackerComponent, KanbanBoardComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule]
})
export class ApplicationsModule {}
