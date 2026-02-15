import { ModuleFederationConfig } from '@nx/module-federation';

const config: ModuleFederationConfig = {
  name: 'mf_remote_a',
  exposes: {
    './Routes': 'apps/mf_remote_a/src/app/remote-entry/entry.routes.ts',
  },
};

export default config;
