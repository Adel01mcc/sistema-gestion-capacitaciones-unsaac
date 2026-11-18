import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // El backend sólo carga .env; ignorar los archivos por modo de Vite evita destinos distintos.
  // Estas variables se usan en Node y no se inyectan al cliente.
  const env = existsSync('.env') ? parseEnv(readFileSync('.env', 'utf8')) : {};
  const port = Number((process.env.PORT ?? env.PORT) || 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe ser un puerto válido.');
  const apiHost = (process.env.HOST ?? env.HOST) || '127.0.0.1';
  const host = apiHost === '0.0.0.0' ? '127.0.0.1' : apiHost === '::' ? '::1' : apiHost;
  const authority = host.includes(':') && !host.startsWith('[') ? `[${host}]` : host;
  const target = new URL(`http://${authority}:${port}`).origin;

  return {
    server: {
      host: '127.0.0.1',
      port: 5173,
      strictPort: true,
      proxy: { '/api': { target, changeOrigin: false } },
    },
    build: { outDir: 'dist' },
  };
});
