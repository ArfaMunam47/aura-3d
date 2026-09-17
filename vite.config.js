import { defineConfig } from 'vite';

export default defineConfig({
  root: 'path',
  publicDir: '../public',
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: true
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  },
  plugins: [
    {
      name: 'path-redirect-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/path/')) {
            res.writeHead(301, { Location: req.url.replace(/^\/path\//, '/') });
            res.end();
            return;
          }
          next();
        });
      }
    }
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: ['es2020', 'firefox115', 'chrome110'],
    assetsInlineLimit: 0
  }
});

