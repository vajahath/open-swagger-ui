const { startServerWithSwaggerFile } = require('../dist/index');
import { join } from 'path';
import got from 'got';
import { Server } from 'http';

let theServer: Server;

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

afterEach(done => theServer.close(err => (err ? done(err) : done())));
