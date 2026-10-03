import { spawn } from 'node:child_process';
import net from 'node:net';
import { platform } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from '../backend/node_modules/dotenv/lib/main.js';

const rootDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const npmCommand = platform() === 'win32' ? 'npm.cmd' : 'npm';
const spawnCommand = platform() === 'win32' ? process.env.ComSpec || 'cmd.exe' : npmCommand;
// Read backend settings without adding them to the frontend's environment.
const backendEnv = { ...process.env };
dotenv.config({ path: path.join(rootDirectory, 'backend', '.env'), processEnv: backendEnv });
const backendPort = Number(backendEnv.PORT || 5000);
const frontendPort = Number(process.env.FRONTEND_PORT || 3000);
const commands = [];

function probePort(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (connected) => {
      socket.destroy();
      resolve(connected ? host : null);
    };
    socket.setTimeout(2000);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

async function listeningHost(port) {
  const hosts = await Promise.all(['127.0.0.1', '::1'].map(host => probePort(host, port)));
  return hosts.find(Boolean);
}

const backendHost = await listeningHost(backendPort);
if (backendHost) {
  const health = await fetch(`http://${backendHost.includes(':') ? `[${backendHost}]` : backendHost}:${backendPort}/api/health`, { signal: AbortSignal.timeout(3000) })
    .then(response => response.ok ? response.json() : null)
    .catch(() => null);
  if (health?.service !== 'computerstoreai-backend') {
    console.error(`[backend] Port ${backendPort} belongs to another application. Update backend/.env PORT and frontend/.env.local NEXT_PUBLIC_API_URL to use a free port.`);
    process.exit(1);
  }
  console.warn(`[backend] Port ${backendPort} is already in use; keeping the existing backend process.`);
} else {
  commands.push({ name: 'backend', args: ['--prefix', 'backend', 'run', 'dev'] });
}

const frontendHost = await listeningHost(frontendPort);
if (frontendHost) {
  const health = await fetch(`http://${frontendHost.includes(':') ? `[${frontendHost}]` : frontendHost}:${frontendPort}/api/dev-health`, { signal: AbortSignal.timeout(15000) })
    .then(response => response.ok ? response.json() : null)
    .catch(() => null);
  if (health?.service !== 'computerstoreai-frontend') {
    console.error(`[frontend] Port ${frontendPort} belongs to another application or the frontend is not responding. Stop that application before running npm run dev again.`);
    process.exit(1);
  }
  console.log(`[frontend] Already running at http://localhost:${frontendPort}; keeping the existing frontend process.`);
} else {
  commands.push({ name: 'frontend', args: ['--prefix', 'frontend', 'run', 'dev'] });
}

const children = [];
for (const { name, args } of commands) {
  const spawnArgs = platform() === 'win32' ? ['/d', '/s', '/c', npmCommand, ...args] : args;
  const child = spawn(spawnCommand, spawnArgs, {
    cwd: rootDirectory,
    env: name === 'backend'
      ? { ...backendEnv, FORCE_COLOR: '1' }
      : { ...process.env, PORT: String(frontendPort), FORCE_COLOR: '1' },
    stdio: 'inherit',
    windowsHide: true,
  });

  child.on('error', (error) => {
    console.error(`[${name}] failed to start: ${error.message}`);
  });

  child.on('exit', (code) => {
    if (!shuttingDown && code && code !== 0) {
      console.error(`[${name}] exited with code ${code}.`);
      shutdown(code);
    }
  });

  children.push(child);
}

let shuttingDown = false;

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(exitCode), 500);
}

process.on('SIGINT', () => shutdown());
process.on('SIGTERM', () => shutdown());
