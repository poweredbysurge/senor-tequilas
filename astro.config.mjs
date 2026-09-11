import { defineConfig } from 'astro/config';

// Astro is a shell and a build step only. No client framework, no CSS framework.
// The markup in src/pages/ is the design's markup; components wrap it, never rewrite it.
export default defineConfig({
  site: 'https://senortequilas.com',
  build: { format: 'directory' },
});
