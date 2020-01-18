#!/usr/bin/env node

import './update-notifier';
import program from 'commander';
import { startServerWithSwaggerFile } from '../index';
import open from 'open';
const pkgVer = require('../../package.json').version;
import ora from 'ora';

program
  .version(pkgVer)
  .arguments('<swagger-file>')
  .action(handle)
  .option('-o, --open', 'open stuff in browser');

program.parse(process.argv);

/**
 * Handles incoming file
 * @param {string} file swagger file
 */
async function handle(file: string) {
  const spinner = ora('Loading file ..').start();

  try {
    const { port, swagFilePath } = await startServerWithSwaggerFile(file);

    spinner.text = `Loading file ${swagFilePath}`;

    if (program.open) {
      await open(`http://localhost:${port}/swagger-doc`);
    }
    spinner.succeed();
    console.log(`Swagger open on port ${port}`);
  } catch (err) {
    spinner.fail();
    console.error(err);
  }
}
