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
  const { parsedDoc, swagFilePath } = await getSwaggerDoc(file);
  const app = express();

  app.use('/swagger-doc', SwaggerHandle.serve, SwaggerHandle.setup(parsedDoc));

  const server = app.listen(port);

  return { app, port, server, swagFilePath };
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
async function getSwaggerDoc(
  file: string
): Promise<{ parsedDoc: object; swagFilePath: string }> {
  const swagFilePath = pathResolver(file);

  let parsedDoc: object = {};

  try {
    // check file
    parsedDoc = require(swagFilePath);
  } catch (err) {
    // fall back to url
    try {
      const swaggerDocString = (await got(swagFilePath)).body;

      try {
        parsedDoc = JSON.parse(swaggerDocString);
      } catch (err) {
        throw new Error('The JSON is malformed');
      }
    } catch (err) {
      throw new Error(
        `The given swagger file (${swagFilePath}) could not be found.`
      );
    }
  }

  return { parsedDoc, swagFilePath };
}
