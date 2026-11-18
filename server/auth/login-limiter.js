import { HttpError } from '../errors.js';

export function createLoginLimiter({ enabled = true, clock = Date.now } = {}) {
  const attempts = new Map();
  return {
    check(key) {
      if (!enabled) return;
      const timestamp = clock();
      for (const [ip, item] of attempts) if (item.until <= timestamp) attempts.delete(ip);
      const item = attempts.get(key) || { count: 0, until: timestamp + 15 * 60 * 1000 };
      if (item.count >= 10) {
        const error = new HttpError(429, 'Demasiados intentos. Espere 15 minutos e inténtelo de nuevo.');
        error.retryAfter = Math.max(1, Math.ceil((item.until - timestamp) / 1000));
        throw error;
      }
      item.count += 1;
      attempts.set(key, item);
    },
  };
}
