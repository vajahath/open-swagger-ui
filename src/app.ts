import express from 'express';
import SwaggerHandle from 'swagger-ui-express';
import getPort from 'get-port';
import got from 'got';
import { resolve as pathResolve, isAbsolute } from 'path';
import isUrl from 'is-url';
import { toUnix } from 'upath';
import { existsSync, readFileSync } from 'fs';
import YAML from 'js-yaml';
import isPlainObject from 'lodash.isplainobject';

/**
 * Start server by calling this function
 * @param {string} file swagger.json file
 * @param {string} requestedPort choose a port, if not available
 * a random port is selected
 * @return {object} server object, just incase if required
 */
export async function startServerWithSwaggerFile(
  file: string,
  requestedPort: number = 3344
) {
  const port = await getPort({ port: requestedPort });
  const { parsedDoc, swagFilePath } = await getSwaggerDoc(file);
  const app = express();

  app.use('/swagger-doc', SwaggerHandle.serve, SwaggerHandle.setup(parsedDoc));

  app.use((req, res) => {
    res.redirect('/swagger-doc');
    return;
  });

  const server = app.listen(port);

  return { app, port, server, swagFilePath };
}

/**
 * Resolves the path to either url or correct file path
 * @param {string} file url or file path to swagger.json
 * @return {string} resolved file name/url
 */
function pathResolver(file: string): { type: 'url' | 'path'; path: string } {
  return isUrl(file) // is file url
    ? { path: file, type: 'url' }
    : isAbsolute(file)
    ? { path: toUnix(file), type: 'path' }
    : { type: 'path', path: toUnix(pathResolve(process.cwd(), file)) };
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

  let swaggerDoc: string | undefined;

  if (swagFilePath.type === 'url') {
    swaggerDoc = (await got(swagFilePath.path)).body;
  } else if (existsSync(swagFilePath.path)) {
    swaggerDoc = readFileSync(swagFilePath.path).toString();
  } else {
    throw new Error(
      `The given swagger file (${JSON.stringify(
        swagFilePath
      )}) could not be found.`
    );
  }

  if (!swaggerDoc) {
    throw new Error(
      `The given swagger file (${JSON.stringify(
        swagFilePath
      )}) could not be read. Please report`
    );
  }

  let parsedDoc: unknown;

  try {
    // try JSON
    parsedDoc = JSON.parse(swaggerDoc);
  } catch (errFromJSONParse) {
    try {
      // try YAML
      parsedDoc = YAML.load(swaggerDoc);
      if (!isPlainObject(parsedDoc)) {
        throw new Error('YAML is invalid');
      }
    } catch (errFromYAMLParse) {
      const error = new Error('Malformed or invalid swagger file (JSON/YAML)');

      (error as any).details =
        'Unable to parse the file with JSON/YAML parsers';
      console.error((error as any).details);
      throw error;
    }
  }

  return { parsedDoc: parsedDoc as object, swagFilePath: swagFilePath.path };
}
