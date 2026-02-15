import type { ModuleFederationConfig, SharedLibraryConfig } from '@nx/module-federation';

const EAGER_ANGULAR_PACKAGES_GH_PAGES = [
  '@angular/core',
  '@angular/core/primitives/signals',
  '@angular/core/primitives/di',
  '@angular/core/event-dispatch',
  '@angular/core/rxjs-interop',
  '@angular/common',
  '@angular/common/http',
  '@angular/animations',
  '@angular/platform-browser',
  '@angular/router',
  'rxjs',
];

const isGhPagesBuild = process.env.NX_MF_GH_PAGES_BUILD === 'true';

const config: ModuleFederationConfig = {
  name: 'main-host',
  remotes: [],
  shared: (libraryName: string, sharedConfig: SharedLibraryConfig) => {
    const isEagerPackage =
      EAGER_ANGULAR_PACKAGES_GH_PAGES.includes(libraryName) ||
      libraryName.startsWith('@angular/');
    if (isGhPagesBuild && isEagerPackage) {
      return { ...sharedConfig, eager: true };
    }
    return sharedConfig;
  },
};

export default config;
