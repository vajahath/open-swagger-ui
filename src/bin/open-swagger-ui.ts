#!/usr/bin/env node

import './update-notifier';
import program from 'commander';
import { startServerWithSwaggerFile } from '../index';
import open from 'open';
import pkg from '../../package.json';
import ora from 'ora';

const DEFAULT_PORT = 3355;

program
  .version(pkg.version)
  .description(
    'An easy CLI tool to open swagger.json or .yaml files in Swagger UI.',
  )
  .arguments('<swagger-file>')
  .action(handle)
  .option('-O, --open', 'Open stuff in browser')
  .option(
    '-P, --port <port>',
    'Preferred port. If not available, a random port is selected',
  );

if (!process.env.VITEST) {
  program.parse(process.argv);
}

/**
 * Handles incoming file
 * @param {string} file swagger file
 */
export async function handle(file: string) {
  const spinner = ora('Loading file ..').start();

  try {
    const { port, swagFilePath } = await startServerWithSwaggerFile(
      file,
      sanitizePort(program.port),
    );

    spinner.text = `Loading file ${swagFilePath}`;

    const viewUrl = `http://localhost:${port}/swagger-doc`;
    if (program.open) {
      await open(viewUrl);
    }
    spinner.succeed();
    console.log(`Swagger open on port ${port}`);
    if (program.open) {
      console.log('Opening browser at ' + viewUrl);
    }
    return { port, swagFilePath };
  } catch (err) {
    spinner.fail();
    console.error(err);
  }
}

/**
 * Handle the incoming preferred port request
 * @param {number|string} [port] preferred port
 * @return {number}
 */
export function sanitizePort(port?: string | number): number {
  if (!port) {
    return DEFAULT_PORT;
  }
  if (typeof port === 'string') {
    port = +port;
  }
  return port;
}

export { program };
