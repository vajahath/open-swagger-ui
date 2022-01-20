#!/usr/bin/env node

import './update-notifier';
import program from 'commander';
import { startServerWithSwaggerFile } from '../index';
import open from 'open';
const pkgVer = require('../../package.json').version;
import ora from 'ora';

const DEFAULT_PORT = 3355;

program
  .version(pkgVer)
  .description('An easy CLI tool to open swagger.json files in Swagger UI.')
  .arguments('<swagger-file>')
  .action(handle)
  .option('-O, --open', 'Open stuff in browser')
  .option(
    '-P, --port <port>',
    'Preferred port. If not available, a random port is selected'
  );

program.parse(process.argv);

/**
 * Handles incoming file
 * @param {string} file swagger file
 */
async function handle(file: string) {
  const spinner = ora('Loading file ..').start();

  try {
    const { port, swagFilePath } = await startServerWithSwaggerFile(
      file,
      sanitizePort(program.port)
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
  } catch (err) {
    spinner.fail();
    console.error(err);
  }
}

/**
 * Handle the incoming preferred port request
 * @param {number|string} port preferred port
 * @return {number}
 */
function sanitizePort(port: string | number): number {
  if (!port) {
    return DEFAULT_PORT;
  }
  if (typeof port === 'string') {
    port = +port;
  }
  return port;
}
