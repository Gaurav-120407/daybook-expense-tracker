import { spawn } from 'node:child_process';
import { access, mkdir } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import 'dotenv/config';

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker';
const localMatch = uri.match(/^mongodb:\/\/(?:127\.0\.0\.1|localhost)(?::(\d+))?(?:\/|$)/i);

if (!localMatch) {
  console.log('MONGODB_URI points to a remote database; skipping local MongoDB startup.');
} else {
  const port = Number(localMatch[1] || 27017);
  const isListening = () => new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(800);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
  });

  if (await isListening()) {
    console.log(`MongoDB is already accepting local connections on port ${port}.`);
  } else if (port !== 27017) {
    console.log(`No MongoDB server is listening on port ${port}; skipping bundled local startup.`);
  } else {
    const appData = process.env.LOCALAPPDATA;
    const executable = process.env.MONGOD_PATH || (appData && path.join(appData, 'CodexExpenseTracker', 'mongodb', 'bin', 'mongod.exe'));
    if (!executable) {
      console.log('Local MongoDB runtime was not found. Start MongoDB or set MONGODB_URI.');
    } else {
      try {
        await access(executable);
        const root = path.join(appData || path.dirname(executable), 'CodexExpenseTracker');
        const data = path.join(root, 'data');
        await mkdir(data, { recursive: true });
        const child = spawn(executable, ['--dbpath', data, '--bind_ip', '127.0.0.1', '--port', String(port), '--logpath', path.join(root, 'mongod.log'), '--logappend'], { detached: true, stdio: 'ignore', windowsHide: true });
        child.once('error', (error) => console.error(`Could not start MongoDB: ${error.message}`));
        child.unref();
        let ready = false;
        for (let attempt = 0; attempt < 30; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          if (await isListening()) { ready = true; break; }
        }
        if (ready) console.log(`Started local MongoDB on port ${port}.`);
        else throw new Error('MongoDB did not open its port within 15 seconds. Check the mongod log in your local app-data folder.');
      } catch (error) {
        console.error(`Local MongoDB startup failed: ${error.message}`);
        process.exitCode = 1;
      }
    }
  }
}
