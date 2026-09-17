import { createServer } from 'vite';

// Simple server script for testing
createServer({
  root: 'path',
  server: {
    port: 3000,
    open: false,
    host: '0.0.0.0'
  }
}).then(server => {
  console.log('🚀 Server running at:', server.httpServer.address);
}).catch(err => {
  console.error('Failed to start server:', err);
});
