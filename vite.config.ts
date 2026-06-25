import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-interceptor',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url) {
              const claimIdMatch = req.url.match(/\/api\/calls\/claim\/(\d+)\/call/);
              if (claimIdMatch) {
                const claimId = claimIdMatch[1];
                try {
                  const checkRes = await fetch(`http://127.0.0.1:8000/api/claims/${claimId}`);
                  if (checkRes.status === 404) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      success: false,
                      message: `Claim with ID ${claimId} not found`
                    }));
                    return;
                  }
                } catch (err) {
                  // Fall through on error
                }
              }
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          secure: false, // Disables strict SSL check for self-signed development certificates on localhost
        }
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
