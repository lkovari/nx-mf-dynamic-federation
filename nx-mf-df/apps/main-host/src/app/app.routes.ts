import { loadRemoteModule } from '@nx/angular/mf';
import { Route } from '@angular/router';

function getRemoteRoutes(m: unknown): Route[] {
  if (typeof m !== 'object' || m === null) return [];
  const direct = Object.getOwnPropertyDescriptor(m, 'remoteRoutes')?.value;
  if (Array.isArray(direct)) return direct;
  const defaultObj = Object.getOwnPropertyDescriptor(m, 'default')?.value;
  if (typeof defaultObj === 'object' && defaultObj !== null) {
    const inner = Object.getOwnPropertyDescriptor(
      defaultObj,
      'remoteRoutes'
    )?.value;
    if (Array.isArray(inner)) return inner;
  }
  const entries = Object.entries(m as object);
  const remoteEntry = entries.find(([k]) => k === 'remoteRoutes');
  const r = remoteEntry?.[1];
  return Array.isArray(r) ? r : [];
}

function remoteRoutes(remoteName: string): () => Promise<Route[]> {
  return () =>
    loadRemoteModule(remoteName, './Routes')
      .then((m) => getRemoteRoutes(m))
      .catch((err) => {
        console.error(`Failed to load remote ${remoteName}:`, err);
        return [];
      });
}

export const appRoutes: Route[] = [
  {
    path: 'mf_remote_home',
    loadChildren: remoteRoutes('mf_remote_home'),
  },
  {
    path: 'mf_remote_a',
    loadChildren: remoteRoutes('mf_remote_a'),
  },
  {
    path: 'mf_remote_b',
    loadChildren: remoteRoutes('mf_remote_b'),
  },
  {
    path: '',
    redirectTo: '/mf_remote_home',
    pathMatch: 'full',
  },
];
