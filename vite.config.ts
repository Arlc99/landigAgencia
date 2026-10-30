import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

type Handler = (request: Request, env: Record<string, string | undefined>) => Promise<Response>;

/** Ruta de desarrollo → [módulo, función exportada]. Es la misma lógica que corre en Vercel. */
const ROUTES: Record<string, [string, string]> = {
  '/api/submit': ['/server/handlers.ts', 'handleSubmit'],
  '/api/progreso': ['/server/handlers.ts', 'handleProgress'],
  '/api/contacto': ['/server/contact.ts', 'handleContact'],
};

/**
 * Sirve las rutas /api en desarrollo con la misma lógica que se despliega en Vercel.
 * Las claves solo viven en el servidor: nunca se exponen al navegador.
 */
function devApi(env: Record<string, string>): Plugin {
  return {
    name: 'dev-api',
    configureServer(server: ViteDevServer) {
      for (const route of Object.keys(ROUTES)) {
        server.middlewares.use(route, (req, res, next) => {
          void handle(server, env, req, res, route).catch(next);
        });
      }
    },
  };
}

async function handle(
  server: ViteDevServer,
  env: Record<string, string>,
  req: IncomingMessage,
  res: ServerResponse,
  route: string,
) {
  const [file, name] = ROUTES[route]!;
  const mod = (await server.ssrLoadModule(file)) as Record<string, Handler>;

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value);
  }
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const request = new Request(`http://${req.headers.host ?? 'localhost'}${route}`, {
    method: req.method,
    headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  });

  const response = await mod[name]!(request, { ...process.env, ...env });
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), devApi(env)],
    base: '/',
  };
});
