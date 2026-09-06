/**
 * test-compat.cjs
 * Standalone verification script for Node.js >= 10.
 * Zero external test framework dependencies.
 */
const path = require('path');
const http = require('http');
const assert = require('assert');
const { spawnSync } = require('child_process');

const pkg = require('../package.json');
const { startServerWithSwaggerFile } = require('../dist/index.cjs');

console.log('--- Compatibility Verification ---');
console.log('Running on Node.js:', process.version);
console.log('Package version:   ', pkg.version);

function httpGet(url) {
  return new Promise(function (resolve, reject) {
    http
      .get(url, function (res) {
        let data = '';
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          resolve({ statusCode: res.statusCode, body: data });
        });
      })
      .on('error', reject);
  });
}

async function run() {
  // Test 1: Start server with legacy swagger.json
  console.log('Test 1: Testing startServerWithSwaggerFile with legacy swagger.json...');
  const jsonResult = await startServerWithSwaggerFile(
    path.join(__dirname, '../tests/swagger.json'),
    3391
  );
  assert.strictEqual(typeof jsonResult.port, 'number', 'Port should be a number');
  assert.ok(jsonResult.server, 'Server instance should exist');

  const jsonResp = await httpGet('http://localhost:' + jsonResult.port + '/swagger-doc/');
  assert.strictEqual(jsonResp.statusCode, 200, 'Swagger UI should return HTTP 200');
  assert.ok(jsonResp.body.indexOf('Swagger UI') !== -1, 'Body should contain "Swagger UI"');
  await new Promise(function (res) {
    jsonResult.server.close(res);
  });
  console.log('Test 1 passed!');

  // Test 2: Start server with legacy swagger.yaml
  console.log('Test 2: Testing startServerWithSwaggerFile with legacy swagger.yaml...');
  const yamlResult = await startServerWithSwaggerFile(
    path.join(__dirname, '../tests/swagger.yaml'),
    3392
  );
  const yamlResp = await httpGet('http://localhost:' + yamlResult.port + '/swagger-doc/');
  assert.strictEqual(yamlResp.statusCode, 200, 'Swagger UI YAML should return HTTP 200');
  await new Promise(function (res) {
    yamlResult.server.close(res);
  });
  console.log('Test 2 passed!');

  // Test 3: Start server with modern OpenAPI 3.0 YAML
  console.log('Test 3: Testing startServerWithSwaggerFile with OpenAPI 3.0 YAML...');
  const openapiYamlResult = await startServerWithSwaggerFile(
    path.join(__dirname, '../tests/examples/openapi-3.0.yaml'),
    3393
  );
  const openapiYamlResp = await httpGet('http://localhost:' + openapiYamlResult.port + '/swagger-doc/');
  assert.strictEqual(openapiYamlResp.statusCode, 200, 'OpenAPI 3.0 YAML should return HTTP 200');
  assert.ok(openapiYamlResp.body.indexOf('Swagger UI') !== -1, 'Body should contain "Swagger UI"');
  await new Promise(function (res) {
    openapiYamlResult.server.close(res);
  });
  console.log('Test 3 passed!');

  // Test 4: Start server with modern OpenAPI 3.0 JSON
  console.log('Test 4: Testing startServerWithSwaggerFile with OpenAPI 3.0 JSON...');
  const openapiJsonResult = await startServerWithSwaggerFile(
    path.join(__dirname, '../tests/examples/openapi-3.0.json'),
    3394
  );
  const openapiJsonResp = await httpGet('http://localhost:' + openapiJsonResult.port + '/swagger-doc/');
  assert.strictEqual(openapiJsonResp.statusCode, 200, 'OpenAPI 3.0 JSON should return HTTP 200');
  assert.ok(openapiJsonResp.body.indexOf('Swagger UI') !== -1, 'Body should contain "Swagger UI"');
  await new Promise(function (res) {
    openapiJsonResult.server.close(res);
  });
  console.log('Test 4 passed!');

  // Test 5: Test CLI --help output
  console.log('Test 5: Testing CLI binary execution (--help)...');
  const binPath = path.join(__dirname, '../dist/bin/open-swagger-ui.cjs');
  const cliRes = spawnSync(process.execPath, [binPath, '--help'], {
    encoding: 'utf8',
  });
  assert.strictEqual(cliRes.status, 0, 'CLI should exit with code 0: ' + cliRes.stderr);
  assert.ok(
    cliRes.stdout.indexOf('open-swagger-ui') !== -1 || cliRes.stdout.indexOf('Usage') !== -1,
    'CLI help output should mention open-swagger-ui/Usage'
  );
  console.log('Test 5 passed!');

  console.log('All compatibility tests passed successfully on Node.js ' + process.version + '!');
}

run().catch(function (err) {
  console.error('Compatibility test failed:', err);
  process.exit(1);
});
