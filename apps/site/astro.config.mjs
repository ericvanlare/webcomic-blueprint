import { defineConfig, envField } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  session: {
    driver: 'memory',
  },
  vite: {
    build: {
      minify: false,
    },
  },
  env: {
    schema: {
      SANITY_PROJECT_ID: envField.string({
        context: 'server',
        access: 'secret',
      }),
      SANITY_DATASET: envField.string({
        context: 'server',
        access: 'secret',
        default: 'production',
      }),
      SANITY_API_VERSION: envField.string({
        context: 'server',
        access: 'secret',
        default: '2024-01-01',
      }),
      PUBLIC_WORKER_URL: envField.string({
        context: 'server',
        access: 'public',
        optional: true,
      }),
    },
  },
});
