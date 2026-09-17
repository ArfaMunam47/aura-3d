import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const vite = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

vite.on('error', (err) => {
  console.error('Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  vite.kill('SIGINT');
  process.exit(0);
});

console.log('🚀 Starting AURA Server...');
console.log('📱 Open your browser to: http://localhost:3000/');
console.log('💡 Press Ctrl+C to stop the server\n');
