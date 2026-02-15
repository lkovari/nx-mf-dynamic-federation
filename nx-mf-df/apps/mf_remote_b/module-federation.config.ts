import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'mf_remote_b',
  exposes: {
    './Routes': 'apps/mf_remote_b/src/app/remote-entry/entry.routes.ts',
  },
};

export default config;
