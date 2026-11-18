import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);
export const tokenHash = value => createHash('sha256').update(value).digest('hex');
export const randomToken = () => randomBytes(32).toString('hex');
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 });
  return `scrypt$32768$8$3$${salt}$${derived.toString('hex')}`;
}
export async function verifyPassword(password, hash) {
  if (typeof hash !== 'string') return false;
  const parts = hash.split('$');
  const [algorithm, n, r, p, salt, digest] = parts;
  if (parts.length !== 6 || !/^[a-f0-9]{32}$/.test(salt || '') || algorithm !== 'scrypt' || n !== '32768' || r !== '8' || p !== '3' || !/^[a-f0-9]{128}$/.test(digest || '')) return false;
  const derived = await scrypt(password, salt, 64, { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(derived, Buffer.from(digest, 'hex'));
}
