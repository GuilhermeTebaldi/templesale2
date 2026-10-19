import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { build } from 'esbuild';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), {
      name: 'existing-startup-screen',
      apply: 'build',
      transformIndexHtml: {
        order: 'post',
        async handler(html) {
          const temporary = mkdtempSync(path.join(tmpdir(), 'templesale-startup-'));
          const output = path.join(temporary, 'startup.cjs');
          try {
            await build({
              stdin: {
                contents: `import React from 'react'; import { renderToStaticMarkup } from 'react-dom/server'; import Loading from './src/components/GlobalLoadingOverlay'; export default renderToStaticMarkup(React.createElement(Loading, { forceVisible: true }));`,
                resolveDir: process.cwd(),
                loader: 'tsx',
              },
              bundle: true, platform: 'node', format: 'cjs', outfile: output,
              define: { 'process.env.NODE_ENV': '"production"' },
            });
            const markup = require(output).default as string;
            delete require.cache[output];
            return html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
          } finally { rmSync(temporary, { recursive: true, force: true }); }
        },
      },
    }],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
