import express from 'express';
import SwaggerHandle from 'swagger-ui-express';
import getPort from 'get-port';
import got from 'got';
import { resolve as pathResolve, isAbsolute } from 'path';
import isUrl from 'is-url';
import { toUnix } from 'upath';

/**
 * Start server by calling this function
 * @param {string} file swagger.json file
 * @return {object} server object, just incase if required
 */
export async function startServerWithSwaggerFile(file: string) {
  const port = await getPort();
  const swaggerDoc = await getSwaggerDoc(file);
  const app = express();

  app.use('/swagger-doc', SwaggerHandle.serve, SwaggerHandle.setup(swaggerDoc));

  console.log(`Swagger open on port ${port}`);
  const server = app.listen(port);

  return { app, port, server };
}

/**
 * Resolves the path to either url or correct file path
 * @param {string} file url or file path to swagger.json
 * @return {string} resolved file name/url
 */
function pathResolver(file: string): string {
  const swagFilePath = isUrl(file) // is file url
    ? file
    : isAbsolute(file) // is absolute path
    ? toUnix(file)
    : toUnix(pathResolve(process.cwd(), file));
  return swagFilePath;
}

/**
 *
 * @param {string} file The swagger file path
 * @return {object} swagger doc
 */
async function getSwaggerDoc(file: string): Promise<object> {
  const swagFilePath = pathResolver(file);
  console.log('> gotten file: ' + swagFilePath);

  try {
    // check file
    const swaggerDoc = require(swagFilePath);
    return swaggerDoc;
  } catch (err) {
    // fall back to url
    try {
      const swaggerDocString = (await got(swagFilePath)).body;

      try {
        return JSON.parse(swaggerDocString);
      } catch (err) {
        console.error('The JSON is malformed');
        throw err;
      }
    } catch (err) {
      throw new Error('The given swagger file could not be found.');
    }
  }
}
