const { startServerWithSwaggerFile } = require('../dist/index');
import { join } from 'path';
import got from 'got';
import { Server } from 'http';

let theServer: Server | undefined;

test('testing base function with file path', async done => {
  const { port, server } = await startServerWithSwaggerFile(
    join(__dirname, 'swagger.json')
  );

  theServer = server;

  got(`http://localhost:${port}/swagger-doc`)
    .then(resp => {
      if (resp?.statusCode && resp?.statusCode < 400) {
        return done();
      }
      throw new Error('invalid status code');
    })
    .catch(err => {
      throw err;
    });
});

test('testing base function with INVALID file path', async done => {
  try {
    await startServerWithSwaggerFile(join(__dirname, 'swagger.json-invalid'));
  } catch (err) {
    expect(err.message).toContain('could not be found');
    theServer = undefined;
    return done();
  }
});

test('testing base function with MALFORMED JSON file path', async done => {
  try {
    await startServerWithSwaggerFile(join(__dirname, 'swagger.json-malformed'));
  } catch (err) {
    expect(err.details).toContain('The JSON may be malformed');
    theServer = undefined;
    return done();
  }
});

test('testing base function with url', async done => {
  const { port, server } = await startServerWithSwaggerFile(
    'https://petstore.swagger.io/v2/swagger.json'
  );

  theServer = server;

  got(`http://localhost:${port}/swagger-doc`)
    .then(resp => {
      if (resp?.statusCode && resp?.statusCode < 400) {
        return done();
      }
      throw new Error('invalid status code');
    })
    .catch(err => {
      throw err;
    });
});

test('testing base function with url - using base path', async done => {
  const { port, server } = await startServerWithSwaggerFile(
    'https://petstore.swagger.io/v2/swagger.json'
  );

  theServer = server;

  got(`http://localhost:${port}`)
    .then(resp => {
      if (resp?.statusCode && resp?.statusCode < 400) {
        return done();
      }
      throw new Error('invalid status code');
    })
    .catch(err => {
      throw err;
    });
});

afterEach(done => (theServer ? theServer.close(() => done()) : done()), 8000);
