import { withModuleFederation } from '@nx/module-federation/angular';
import config from './module-federation.config';

/**
 * DTS Plugin is disabled in Nx Workspaces as Nx already provides Typing support for Module Federation
 * The DTS Plugin can be enabled by setting dts: true
 * Learn more about the DTS Plugin here: https://module-federation.io/configure/dts.html
 */
export default withModuleFederation(
  {
    ...config,
    // Explicitly configure remotes with localhost URLs for Docker
    // This ensures the browser loads remotes from localhost, not 0.0.0.0
    remotes: [
      ['mf_remote_a', 'http://localhost:4201/remoteEntry.mjs'],
      ['mf_remote_b', 'http://localhost:4202/remoteEntry.mjs'],
      ['mf_remote_home', 'http://localhost:4203/remoteEntry.mjs'],
    ],
  },
  { dts: false }
);
