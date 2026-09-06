import { describe, it, expect, afterEach } from 'vitest';
import { startServerWithSwaggerFile } from '../src/index';
import { join } from 'path';
import got from 'got';
import http, { Server } from 'http';
import { readFileSync } from 'fs';

describe('open-swagger-ui test suite', () => {
  let theServer: Server | undefined;

  afterEach(async () => {
    if (theServer) {
      await new Promise<void>((resolve) => theServer!.close(() => resolve()));
      theServer = undefined;
    }
  });

  it('serves swagger UI with JSON spec', async () => {
    const { port, server, swagFilePath } = await startServerWithSwaggerFile(
      join(__dirname, 'swagger.json'),
    );
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

  it('throws error with invalid file path', async () => {
    await expect(
      startServerWithSwaggerFile(join(__dirname, 'swagger.json-invalid')),
    ).rejects.toThrow(/could not be found/);
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
