import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'mf_remote_home',
  exposes: {
    './Routes': 'apps/mf_remote_home/src/app/remote-entry/entry.routes.ts',
  },
};

export default config;
