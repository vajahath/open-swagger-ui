import express from 'express';
import SwaggerHandle from 'swagger-ui-express';
import getPort from 'get-port';

/**
 * Start server by calling this function
 * @param {string} file swagger.json file
 * @return {object} server object, just incase if required
 */
export async function startServerWithSwaggerFile(file: string) {
  const port = await getPort();
  const swaggerDoc = getSwaggerDoc(file);
  const app = express();

  app.use('/swagger-doc', SwaggerHandle.serve, SwaggerHandle.setup(swaggerDoc));

  console.log(`Swagger open on port ${port}`);
  app.listen(port);
  return { app, port };
}

/**
 *
 * @param {string} file The swagger file path
 * @return {object} swagger doc
 */
function getSwaggerDoc(file: string): object {
  try {
    const swaggerDoc = require(file);
    return swaggerDoc;
  } catch (err) {
    console.error(new Error('The given swagger file could not be found.'));
    process.exit(1);
  }
}
