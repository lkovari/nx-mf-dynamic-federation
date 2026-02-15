import { withModuleFederation } from '@nx/module-federation/angular';
import config from './module-federation.config';

const GH_PAGES_REMOTE_BASE = '/nx-mf-dynamic-federation/mf_remote_home/';

export default async (baseConfig: unknown) => {
  const withMF = await withModuleFederation({ ...config }, { dts: false });
  const configWithMF = withMF(baseConfig as Record<string, unknown>);
  return {
    ...configWithMF,
    output: {
      ...(configWithMF as { output?: Record<string, unknown> }).output,
      publicPath: GH_PAGES_REMOTE_BASE,
    },
  };
};
