import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/**
 * Main Application Routes
 * Lazy-loads feature modules for optimal code splitting and performance
 */
const routes: Routes = [
  {
    path: '',
    redirectTo: '/jobs',
    pathMatch: 'full'
  },
  {
    path: 'jobs',
    loadChildren: () =>
      import('./features/jobs/jobs.module').then((m) => m.JobsModule)
  },
  {
    path: 'candidates',
    loadChildren: () =>
      import('./features/candidates/candidates.module').then((m) => m.CandidatesModule)
  },
  {
    path: 'applications',
    loadChildren: () =>
      import('./features/applications/applications.module').then(
        (m) => m.ApplicationsModule
      )
  },
  {
    path: '**',
    redirectTo: '/jobs'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
