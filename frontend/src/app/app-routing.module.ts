import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

/**
 * Main Application Routes
 * Lazy-loads feature modules for optimal code splitting and performance
 */
const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'jobs',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/jobs/jobs.module').then((m) => m.JobsModule)
  },
  {
    path: 'candidates',
    canActivate: [AuthGuard],
    data: { roles: ['Manager'] },
    loadChildren: () =>
      import('./features/candidates/candidates.module').then((m) => m.CandidatesModule)
  },
  {
    path: 'applications',
    canActivate: [AuthGuard],
    loadChildren: () =>
      import('./features/applications/applications.module').then(
        (m) => m.ApplicationsModule
      )
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.module').then((m) => m.AuthModule)
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
