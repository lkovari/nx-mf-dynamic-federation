import type { ModuleFederationConfig, SharedLibraryConfig } from '@nx/module-federation';

const isGhPagesBuild = process.env.NX_MF_GH_PAGES_BUILD === 'true';

const config: ModuleFederationConfig = {
  name: 'mf_remote_b',
  exposes: {
    './Routes': 'apps/mf_remote_b/src/app/remote-entry/entry.routes.ts',
  },
  shared: (libraryName: string, sharedConfig: SharedLibraryConfig) => {
    if (isGhPagesBuild && (libraryName.startsWith('@angular/') || libraryName === 'rxjs')) {
      return {
        ...sharedConfig,
        singleton: true,
        strictVersion: false,
        requiredVersion: false,
      };
    }
    return sharedConfig;
  },
};

export default config;
