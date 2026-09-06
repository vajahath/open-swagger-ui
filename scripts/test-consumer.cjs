/**
 * test-consumer.cjs
 *
 * Real-world end-to-end consumer verification gate.
 * Simulates external consumers installing and using open-swagger-ui:
 * 1. Packages tarball via `npm pack`.
 * 2. Installs the packaged tarball into a clean isolated directory outside the repo.
 * 3. Validates CLI binary execution, flags (-P, --port, -O, --help, --version), and error handling.
 * 4. Validates native ES Module (ESM) consumer imports (`import { startServerWithSwaggerFile }`).
 * 5. Validates CommonJS consumer requires (`const { startServerWithSwaggerFile } = require(...)`).
 * 6. Validates TypeScript type declarations via `tsc` (NodeNext resolution with zero missing types).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const http = require('http');
const assert = require('assert');
const { spawnSync, spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const pkg = require(path.join(rootDir, 'package.json'));
const tscBin = path.join(rootDir, 'node_modules/.bin/tsc');

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () =>
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data })
        );
      })
      .on('error', reject);
  });
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...options,
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const errorMsg = `Command failed [exit ${result.status}]: ${command} ${args.join(' ')}\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`;
    throw new Error(errorMsg);
  }
  return result;
}

async function main() {
  console.log('====================================================');
  console.log(' Starting Real-World Consumer Verification Gate');
  console.log('====================================================');

  // Step 1: Ensure package is built
  console.log('\n[Gate Step 1] Building package...');
  runCommand('npm', ['run', 'build'], { cwd: rootDir });

  // Step 2: Create packaged tarball
  console.log('\n[Gate Step 2] Packaging tarball with npm pack...');
  const packResult = runCommand('npm', ['pack'], { cwd: rootDir });
  const packLines = packResult.stdout.trim().split('\n').filter(Boolean);
  const tarballName = packLines[packLines.length - 1].trim();
  const tarballPath = path.join(rootDir, tarballName);
  assert.ok(fs.existsSync(tarballPath), `Tarball not found at ${tarballPath}`);
  console.log(`Generated tarball: ${tarballPath}`);

  // Step 3: Setup clean isolated consumer project in os.tmpdir()
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'open-swagger-ui-consumer-'));
  console.log(`\n[Gate Step 3] Setting up isolated consumer project in: ${tempDir}`);

  try {
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'consumer-test', version: '1.0.0', private: true }, null, 2)
    );

    // Install packaged tarball
    console.log('Installing tarball in consumer directory...');
    runCommand('npm', ['install', tarballPath, '--no-audit', '--no-fund'], { cwd: tempDir });

    // Copy sample swagger fixtures
    fs.copyFileSync(path.join(rootDir, 'tests/swagger.json'), path.join(tempDir, 'swagger.json'));
    fs.copyFileSync(path.join(rootDir, 'tests/swagger.yaml'), path.join(tempDir, 'swagger.yaml'));
    fs.copyFileSync(
      path.join(rootDir, 'tests/examples/openapi-3.0.json'),
      path.join(tempDir, 'openapi-3.0.json')
    );

    const cliBin = path.join(
      tempDir,
      'node_modules/.bin',
      process.platform === 'win32' ? 'open-swagger-ui.cmd' : 'open-swagger-ui'
    );
    assert.ok(fs.existsSync(cliBin), `CLI binary not found in consumer node_modules: ${cliBin}`);

    // ==========================================
    // Gate 1: CLI binary execution & flags
    // ==========================================
    console.log('\n--- Gate 1: CLI Binary & Flags Execution ---');

    console.log('Checking open-swagger-ui --help & -h...');
    const helpRes = runCommand(cliBin, ['--help'], { cwd: tempDir });
    assert.ok(helpRes.stdout.includes('Usage:'), 'Help output must contain "Usage:"');
    assert.ok(helpRes.stdout.includes('--port'), 'Help output must list --port');

    const hRes = runCommand(cliBin, ['-h'], { cwd: tempDir });
    assert.ok(hRes.stdout.includes('Usage:'), '-h output must contain "Usage:"');

    console.log('Checking open-swagger-ui --version & -V...');
    const verRes = runCommand(cliBin, ['--version'], { cwd: tempDir });
    assert.strictEqual(verRes.stdout.trim(), pkg.version, 'CLI version must match package.json');

    const vShortRes = runCommand(cliBin, ['-V'], { cwd: tempDir });
    assert.strictEqual(vShortRes.stdout.trim(), pkg.version, '-V version must match package.json');

    console.log('Checking CLI server invocation with JSON spec and -P flag...');
    await new Promise((resolve, reject) => {
      const proc = spawn(cliBin, ['swagger.json', '-P', '6221'], {
        cwd: tempDir,
        shell: process.platform === 'win32',
      });
      let output = '';
      let timer;
      proc.stdout.on('data', (chunk) => {
        output += chunk.toString();
        if (output.includes('Swagger open on port 6221')) {
          clearTimeout(timer);
          (async () => {
            try {
              const rootRes = await httpGet('http://127.0.0.1:6221/');
              assert.strictEqual(rootRes.statusCode, 302, 'Root path must redirect');
              assert.strictEqual(rootRes.headers.location, '/swagger-doc');

              const docRes = await httpGet('http://127.0.0.1:6221/swagger-doc/');
              assert.strictEqual(docRes.statusCode, 200, 'Swagger UI must return 200');
              assert.ok(docRes.body.includes('Swagger UI'), 'Page must contain "Swagger UI"');

              proc.kill();
              resolve();
            } catch (err) {
              proc.kill();
              reject(err);
            }
          })();
        }
      });
      timer = setTimeout(() => {
        proc.kill();
        reject(new Error(`Timed out waiting for CLI server to start: ${output}`));
      }, 7000);
    });
    console.log('CLI JSON spec server passed!');

    console.log('Checking CLI server invocation with YAML spec and --port flag...');
    await new Promise((resolve, reject) => {
      const proc = spawn(cliBin, ['swagger.yaml', '--port', '6222'], {
        cwd: tempDir,
        shell: process.platform === 'win32',
      });
      let output = '';
      let timer;
      proc.stdout.on('data', (chunk) => {
        output += chunk.toString();
        if (output.includes('Swagger open on port 6222')) {
          clearTimeout(timer);
          (async () => {
            try {
              const docRes = await httpGet('http://127.0.0.1:6222/swagger-doc/');
              assert.strictEqual(docRes.statusCode, 200, 'YAML Swagger UI must return 200');
              assert.ok(docRes.body.includes('Swagger UI'), 'Page must contain "Swagger UI"');
              proc.kill();
              resolve();
            } catch (err) {
              proc.kill();
              reject(err);
            }
          })();
        }
      });
      timer = setTimeout(() => {
        proc.kill();
        reject(new Error(`Timed out waiting for YAML CLI server: ${output}`));
      }, 7000);
    });
    console.log('CLI YAML spec server passed!');

    console.log('Checking CLI graceful error handling on non-existent file...');
    const invalidFileRes = spawnSync(cliBin, ['non-existent-spec.yaml'], {
      cwd: tempDir,
      encoding: 'utf8',
      shell: process.platform === 'win32',
    });
    assert.ok(
      invalidFileRes.stderr.includes('could not be found') ||
        invalidFileRes.stdout.includes('could not be found'),
      'Missing file must produce a clear error message'
    );
    console.log('CLI error handling passed!');

    // ==========================================
    // Gate 2: Native ES Module (ESM) Consumer
    // ==========================================
    console.log('\n--- Gate 2: Native ES Module (ESM) Consumer ---');
    const esmScript = `
import { startServerWithSwaggerFile } from 'open-swagger-ui';
import http from 'http';
import assert from 'assert';

async function run() {
  const result = await startServerWithSwaggerFile('swagger.yaml', 6223);
  assert.strictEqual(result.port, 6223, 'Port must be 6223');
  assert.ok(result.server, 'Server must exist');

  await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:6223/swagger-doc/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        assert.strictEqual(res.statusCode, 200);
        assert.ok(data.includes('Swagger UI'));
        resolve();
      });
    }).on('error', reject);
  });

  await new Promise(r => result.server.close(r));
  console.log('Native ESM consumer executed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
`;
    fs.writeFileSync(path.join(tempDir, 'consumer-esm.mjs'), esmScript);
    runCommand('node', ['consumer-esm.mjs'], { cwd: tempDir });

    // ==========================================
    // Gate 3: CommonJS Consumer
    // ==========================================
    console.log('\n--- Gate 3: CommonJS Consumer ---');
    const cjsScript = `
const { startServerWithSwaggerFile } = require('open-swagger-ui');
const http = require('http');
const assert = require('assert');

async function run() {
  const result = await startServerWithSwaggerFile('swagger.json', 6224);
  assert.strictEqual(result.port, 6224, 'Port must be 6224');
  assert.ok(result.server, 'Server must exist');

  await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:6224/swagger-doc/', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        assert.strictEqual(res.statusCode, 200);
        assert.ok(data.includes('Swagger UI'));
        resolve();
      });
    }).on('error', reject);
  });

  await new Promise(r => result.server.close(r));
  console.log('CommonJS consumer executed successfully!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
`;
    fs.writeFileSync(path.join(tempDir, 'consumer-cjs.cjs'), cjsScript);
    runCommand('node', ['consumer-cjs.cjs'], { cwd: tempDir });

    // ==========================================
    // Gate 4: TypeScript Types & Compilation Gate
    // ==========================================
    console.log('\n--- Gate 4: TypeScript Types & Compilation Gate ---');
    const tsConsumer = `
import { startServerWithSwaggerFile, type SwaggerServerResult } from 'open-swagger-ui';
import type { Server } from 'http';

async function testTypings(): Promise<void> {
  const res: SwaggerServerResult = await startServerWithSwaggerFile('openapi-3.0.json', 6225);
  const p: number = res.port;
  const s: Server = res.server;
  const f: string = res.swagFilePath;
  const a: any = res.app;
  if (p < 0 || !s || !f || a === undefined) {
    throw new Error('Type check assertion failure');
  }
}
testTypings();
`;
    fs.writeFileSync(path.join(tempDir, 'consumer-ts.ts'), tsConsumer);
    fs.writeFileSync(
      path.join(tempDir, 'tsconfig.json'),
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2020',
            module: 'NodeNext',
            moduleResolution: 'NodeNext',
            types: ['node'],
            noEmit: true,
          },
          files: ['consumer-ts.ts'],
        },
        null,
        2
      )
    );

    console.log('Running tsc compilation on consumer TypeScript file...');
    runCommand(tscBin, ['--project', 'tsconfig.json'], { cwd: tempDir });
    console.log('TypeScript compilation passed with 0 errors!');

    console.log('\n====================================================');
    console.log(' All Real-World Consumer Gates Passed Successfully! ');
    console.log('====================================================\n');
  } finally {
    // Cleanup temporary directory and packaged tarball
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    try {
      if (fs.existsSync(tarballPath)) {
        fs.unlinkSync(tarballPath);
      }
    } catch {}
  }
}

main().catch((err) => {
  console.error('\n❌ Consumer Gate Failed:\n', err);
  process.exit(1);
});
