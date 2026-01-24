import { NxWelcome } from './nx-welcome';
import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'mf_remote_home',
    loadChildren: () =>
      import('mf_remote_home/Routes').then((m) => m!.remoteRoutes),
  },
  {
    path: 'mf_remote_b',
    loadChildren: () =>
      import('mf_remote_b/Routes').then((m) => m!.remoteRoutes),
  },
  {
    path: 'mf_remote_a',
    loadChildren: () =>
      import('mf_remote_a/Routes').then((m) => m!.remoteRoutes),
  },
  {
    path: '',
    component: NxWelcome,
  },
];
