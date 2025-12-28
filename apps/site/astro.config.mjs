import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  // Use memory driver to avoid KV binding requirement for sessions
  // The Cloudflare adapter auto-enables KV sessions by default which
  // requires creating a KV namespace - this bypasses that requirement
  session: {
    driver: 'memory',
  },
});
