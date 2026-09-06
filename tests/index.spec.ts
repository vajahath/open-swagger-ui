import { describe, it, expect, afterEach, vi } from 'vitest';
import { startServerWithSwaggerFile } from '../src/index';
import { sanitizePort, handle, program } from '../src/bin/open-swagger-ui';
import '../src/bin/update-notifier';
import { join } from 'path';
import got from 'got';
import http, { Server } from 'http';
import { readFileSync } from 'fs';
import { spawnSync } from 'child_process';
import open from 'open';
import pkg from '../package.json';

vi.mock('open', () => ({
  default: vi.fn().mockResolvedValue(undefined),
}));

describe('open-swagger-ui test suite', () => {
  let theServer: Server | undefined;

  afterEach(async () => {
    if (theServer) {
      await new Promise<void>((resolve) => theServer!.close(() => resolve()));
      theServer = undefined;
    }
    program.open = undefined;
    program.port = undefined;
  });

  describe('Core Server & Spec Parsing', () => {
    it('serves swagger UI with JSON spec (absolute path)', async () => {
      const { port, server, swagFilePath } = await startServerWithSwaggerFile(
        join(__dirname, 'swagger.json'),
      );
      theServer = server;

      expect(swagFilePath).toContain('swagger.json');
      const resp = await got(`http://127.0.0.1:${port}/swagger-doc/`);
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toContain('Swagger UI');
    });

    it('serves swagger UI with relative file path', async () => {
      const { port, server, swagFilePath } =
        await startServerWithSwaggerFile('tests/swagger.json');
      theServer = server;

      expect(swagFilePath).toContain('swagger.json');
      const resp = await got(`http://127.0.0.1:${port}/swagger-doc/`);
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toContain('Swagger UI');
    });

    it('serves swagger UI with YAML spec', async () => {
      const { port, server, swagFilePath } = await startServerWithSwaggerFile(
        join(__dirname, 'swagger.yaml'),
      );
      theServer = server;

      expect(swagFilePath).toContain('swagger.yaml');
      const resp = await got(`http://127.0.0.1:${port}/swagger-doc/`);
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toContain('Swagger UI');
    });

    it('redirects root / to /swagger-doc', async () => {
      const { port, server } = await startServerWithSwaggerFile(
        join(__dirname, 'swagger.json'),
      );
      theServer = server;

      const resp = await got(`http://127.0.0.1:${port}`, {
        followRedirect: false,
        throwHttpErrors: false,
      });
      expect(resp.statusCode).toBe(302);
      expect(resp.headers.location).toBe('/swagger-doc');
    });

    it('respects requested custom port if available', async () => {
      const customPort = 9876;
      const { port, server } = await startServerWithSwaggerFile(
        join(__dirname, 'swagger.json'),
        customPort,
      );
      theServer = server;

      expect(port).toBe(customPort);
    });

    it('serves swagger UI from URL spec', async () => {
      const mockServer = http.createServer((req, res) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(readFileSync(join(__dirname, 'swagger.json')));
      });
      await new Promise<void>((res) => mockServer.listen(0, '127.0.0.1', res));
      const mockPort = (mockServer.address() as any).port;

      try {
        const { port, server } = await startServerWithSwaggerFile(
          `http://127.0.0.1:${mockPort}/swagger.json`,
        );
        theServer = server;

        const resp = await got(`http://127.0.0.1:${port}/swagger-doc/`);
        expect(resp.statusCode).toBe(200);
        expect(resp.body).toContain('Swagger UI');
      } finally {
        mockServer.close();
      }
    });
  });

  describe('Real-World & Modern OpenAPI Example Files', () => {
    it('loads and serves modern OpenAPI 3.0 YAML spec', async () => {
      const { port, server, swagFilePath } = await startServerWithSwaggerFile(
        join(__dirname, 'examples/openapi-3.0.yaml'),
      );
      theServer = server;

      expect(swagFilePath).toContain('openapi-3.0.yaml');
      const resp = await got(`http://127.0.0.1:${port}/swagger-doc/`);
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toContain('Swagger UI');
    });

    it('loads and serves modern OpenAPI 3.0 JSON spec', async () => {
      const { port, server, swagFilePath } = await startServerWithSwaggerFile(
        join(__dirname, 'examples/openapi-3.0.json'),
      );
      theServer = server;

      expect(swagFilePath).toContain('openapi-3.0.json');
      const resp = await got(`http://127.0.0.1:${port}/swagger-doc/`);
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toContain('Swagger UI');
    });

    it('loads and serves minimal Swagger YAML spec', async () => {
      const { port, server, swagFilePath } = await startServerWithSwaggerFile(
        join(__dirname, 'examples/minimal-swagger.yaml'),
      );
      theServer = server;

      expect(swagFilePath).toContain('minimal-swagger.yaml');
      const resp = await got(`http://127.0.0.1:${port}/swagger-doc/`);
      expect(resp.statusCode).toBe(200);
      expect(resp.body).toContain('Swagger UI');
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('throws error with invalid/non-existent file path', async () => {
      await expect(
        startServerWithSwaggerFile(join(__dirname, 'swagger.json-invalid')),
      ).rejects.toThrow(/could not be found/);
    });

    it('throws error when file exists but is empty (0-byte file)', async () => {
      await expect(
        startServerWithSwaggerFile(join(__dirname, 'examples/empty.json')),
      ).rejects.toThrow(/could not be read/);
    });

    it('throws error with malformed JSON spec', async () => {
      await expect(
        startServerWithSwaggerFile(join(__dirname, 'swagger.json-malformed')),
      ).rejects.toThrow(/Malformed or invalid swagger file/);
    });

    it('throws error with malformed YAML spec', async () => {
      await expect(
        startServerWithSwaggerFile(join(__dirname, 'swagger.yaml-malformed')),
      ).rejects.toThrow(/Malformed or invalid swagger file/);
    });

    it('throws error when YAML parses to non-object (e.g. array)', async () => {
      await expect(
        startServerWithSwaggerFile(join(__dirname, 'examples/non-object.yaml')),
      ).rejects.toThrow(/Malformed or invalid swagger file/);
    });
  });

  describe('CLI Helpers & Port Sanitization', () => {
    it('sanitizePort returns default port 3355 when no port provided', () => {
      expect(sanitizePort()).toBe(3355);
      expect(sanitizePort(0)).toBe(3355);
      expect(sanitizePort('')).toBe(3355);
    });

    it('sanitizePort handles numeric and string port inputs', () => {
      expect(sanitizePort(8080)).toBe(8080);
      expect(sanitizePort('9090')).toBe(9090);
    });

    it('CLI handle function successfully starts server', async () => {
      const res = await handle(
        join(__dirname, 'examples/minimal-swagger.yaml'),
      );
      expect(res).toBeDefined();
      expect(res?.port).toBeGreaterThan(0);
    });

    it('CLI handle function opens browser when --open is set', async () => {
      program.open = true;
      const res = await handle(
        join(__dirname, 'examples/minimal-swagger.yaml'),
      );
      expect(res).toBeDefined();
      expect(open).toHaveBeenCalled();
    });

    it('CLI handle function gracefully handles failure on invalid file', async () => {
      const res = await handle(join(__dirname, 'non-existent-file.json'));
      expect(res).toBeUndefined();
    });

    it('CLI binary executes --help without error (Issue #21)', () => {
      const binPath = join(__dirname, '../dist/bin/open-swagger-ui.cjs');
      const env = { ...process.env };
      delete env.VITEST;
      const res = spawnSync(process.execPath, [binPath, '--help'], {
        encoding: 'utf8',
        env,
      });
      expect(res.status).toBe(0);
      expect(res.stdout).toContain('Usage:');
      expect(res.stdout).toContain('--help');
      expect(res.stderr).not.toContain('ERR_INVALID_ARG_TYPE');
    });

    it('CLI binary executes --version without error', () => {
      const binPath = join(__dirname, '../dist/bin/open-swagger-ui.cjs');
      const env = { ...process.env };
      delete env.VITEST;
      const res = spawnSync(process.execPath, [binPath, '--version'], {
        encoding: 'utf8',
        env,
      });
      expect(res.status).toBe(0);
      expect(res.stdout.trim()).toBe(pkg.version);
    });
  });
});
