import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import expenses from './routes/expenses.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
const sessions = new Map();
const sessionCookie = 'daybook_session';
const passwordEnabled = () => Boolean(process.env.APP_PASSWORD);
const passwordMisconfigured = () => process.env.NODE_ENV === 'production' && !passwordEnabled();
const readToken = (req) => (req.headers.cookie || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(`${sessionCookie}=`))?.slice(sessionCookie.length + 1);
const isAuthenticated = (req) => {
  const token = readToken(req);
  const expires = token && sessions.get(token);
  if (!expires) return false;
  if (expires <= Date.now()) { sessions.delete(token); return false; }
  return true;
};
const unavailableAuth = (res) => res.status(503).json({ message: 'Hosted password protection is not configured.' });
app.get('/api/session', (req, res) => {
  if (passwordMisconfigured()) return unavailableAuth(res);
  res.json({ passwordRequired: passwordEnabled(), authenticated: !passwordEnabled() || isAuthenticated(req) });
});
const loginAttempts = new Map();
app.post('/api/session', (req, res) => {
  if (passwordMisconfigured()) return unavailableAuth(res);
  if (!passwordEnabled()) return res.json({ passwordRequired: false, authenticated: true });
  const ip = req.ip;
  const attempt = loginAttempts.get(ip) || { count: 0, until: 0 };
  if (attempt.until > Date.now() && attempt.count >= 10) return res.status(429).json({ message: 'Too many attempts. Please wait 15 minutes and try again.' });
  if (attempt.until <= Date.now()) { attempt.count = 0; attempt.until = Date.now() + 15 * 60 * 1000; }
  const expected = createHash('sha256').update(process.env.APP_PASSWORD).digest();
  const actual = createHash('sha256').update(String(req.body?.password || '')).digest();
  if (!timingSafeEqual(expected, actual)) {
    attempt.count += 1; loginAttempts.set(ip, attempt);
    return res.status(401).json({ message: 'That password is not correct.' });
  }
  loginAttempts.delete(ip);
  const token = randomBytes(32).toString('hex');
  sessions.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000);
  res.cookie(sessionCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ passwordRequired: true, authenticated: true });
});
app.delete('/api/session', (req, res) => {
  const token = readToken(req); if (token) sessions.delete(token);
  res.clearCookie(sessionCookie, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
  res.status(204).end();
});
app.use('/api/expenses', (_req, res, next) => {
  if (passwordMisconfigured()) return unavailableAuth(res);
  if (passwordEnabled() && !isAuthenticated(_req)) return res.status(401).json({ message: 'Please sign in to access your records.' });
  if (mongoose.connection.readyState !== 1) return res.status(503).json({ message: 'The database is not connected. Start MongoDB, then try again.' });
  next();
});
app.use('/api/expenses', expenses);
app.use('/api', (req, res) => res.status(404).json({ message: 'That endpoint was not found.' }));
const clientBuild = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (existsSync(path.join(clientBuild, 'index.html'))) {
  app.use(express.static(clientBuild));
  app.get('*', (_req, res) => res.sendFile(path.join(clientBuild, 'index.html')));
} else {
  app.use((req, res) => res.status(404).json({ message: 'That endpoint was not found.' }));
}
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid expense id.' });
  res.status(500).json({ message: 'Something went wrong. Please try again.' });
});
export default app;
