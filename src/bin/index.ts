#!/usr/bin/env node

import './update-notifier';
import program from 'commander';
import { resolve as pathResolve, isAbsolute } from 'path';
import { startServerWithSwaggerFile } from '../index';
import open from 'open';
const pkgVer = require('../../package.json').version;

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
  const swagFilePath = isAbsolute(file)
    ? file
    : pathResolve(process.cwd(), file);

  console.log('gotten', swagFilePath);

  const { port } = await startServerWithSwaggerFile(swagFilePath);

  if (program.open) {
    await open(`http://localhost:${port}/swagger-doc`);
  }
}
