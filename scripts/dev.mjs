import { spawn } from 'node:child_process';
import net from 'node:net';
import { platform } from 'node:os';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDirectory = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const npmCommand = platform() === 'win32' ? 'npm.cmd' : 'npm';
const spawnCommand = platform() === 'win32' ? process.env.ComSpec || 'cmd.exe' : npmCommand;
const backendPort = Number(process.env.PORT || 5000);
const commands = [{ name: 'frontend', args: ['--prefix', 'frontend', 'run', 'dev'] }];

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
}

if (await isPortInUse(backendPort)) {
  console.warn(`[backend] Port ${backendPort} is already in use; keeping the existing backend process.`);
} else {
  commands.push({ name: 'backend', args: ['--prefix', 'backend', 'run', 'dev'] });
}

const children = [];
for (const { name, args } of commands) {
  const spawnArgs = platform() === 'win32' ? ['/d', '/s', '/c', npmCommand, ...args] : args;
  const child = spawn(spawnCommand, spawnArgs, {
    cwd: rootDirectory,
    env: { ...process.env, FORCE_COLOR: '1' },
    stdio: 'inherit',
    windowsHide: false,
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
