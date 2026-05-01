import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite';

type HandlerModule = {
  default: (req: LocalVercelRequest, res: LocalVercelResponse) => Promise<void> | void;
};

type LocalVercelRequest = IncomingMessage & {
  body?: unknown;
  query: Record<string, string | string[]>;
};

class LocalVercelResponse {
  private statusCode = 200;

  constructor(private readonly response: ServerResponse) {}

  status(code: number) {
    this.statusCode = code;
    this.response.statusCode = code;
    return this;
  }

  setHeader(name: string, value: number | string | readonly string[]) {
    this.response.setHeader(name, value);
    return this;
  }

  json(value: unknown) {
    if (!this.response.headersSent) {
      this.response.statusCode = this.statusCode;
      this.response.setHeader('content-type', 'application/json; charset=utf-8');
    }
    this.response.end(JSON.stringify(value));
  }

  end(value?: string) {
    if (!this.response.headersSent) {
      this.response.statusCode = this.statusCode;
    }
    this.response.end(value);
  }
}

function parseQuery(searchParams: URLSearchParams): Record<string, string | string[]> {
  const query: Record<string, string | string[]> = {};
  for (const [key, value] of searchParams.entries()) {
    const current = query[key];
    if (Array.isArray(current)) {
      current.push(value);
    } else if (typeof current === 'string') {
      query[key] = [current, value];
    } else {
      query[key] = value;
    }
  }
  return query;
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve(undefined);
        return;
      }
      const contentType = req.headers['content-type'] ?? '';
      if (String(contentType).includes('application/json')) {
        try {
          resolve(JSON.parse(raw) as unknown);
        } catch {
          resolve(undefined);
        }
        return;
      }
      resolve(raw);
    });
  });
}

function localApiPlugin(): Plugin {
  const routes = new Map<string, string>([
    ['POST /api/auth/view', '/api/auth/view.ts'],
    ['POST /api/auth/editor', '/api/auth/editor.ts'],
    ['POST /api/auth/logout', '/api/auth/logout.ts'],
    ['GET /api/session', '/api/session.ts'],
    ['GET /api/stats', '/api/stats.ts'],
    ['POST /api/stats', '/api/stats.ts'],
    ['DELETE /api/stats', '/api/stats.ts'],
  ]);

  return {
    name: 'local-vercel-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api', async (req, res) => {
        const method = req.method ?? 'GET';
        const url = new URL(req.originalUrl ?? req.url ?? '/', 'http://localhost');
        const pathname = url.pathname.startsWith('/api') ? url.pathname : `/api${url.pathname}`;
        const route = routes.get(`${method} ${pathname}`);
        if (!route) {
          res.statusCode = 404;
          res.setHeader('content-type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: 'not_found' }));
          return;
        }

        try {
          const mod = (await server.ssrLoadModule(route)) as HandlerModule;
          const localReq = req as LocalVercelRequest;
          localReq.query = parseQuery(url.searchParams);
          localReq.body = await readBody(req);
          await mod.default(localReq, new LocalVercelResponse(res));
        } catch (error) {
          server.config.logger.error(error instanceof Error ? error.stack ?? error.message : String(error));
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('content-type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'server_error' }));
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [react(), localApiPlugin()],
    server: {
      port: 5173,
    },
  };
});
