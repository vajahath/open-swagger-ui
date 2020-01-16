# open-swagger-ui

An easy CLI to open `swagger.json` in [Swagger UI](https://swagger.io/tools/swagger-ui/).

```bash
$ open-swagger-ui ./swagger.json --open # done !
```

![](https://github.com/vajahath/open-swagger-ui/workflows/Build/badge.svg) [![](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## Install

Requires Node `>=10`.

From npm,

```sh
npm i -g open-swagger-ui
```

From [Github Package Registry](https://github.com/vajahath/open-swagger-ui/packages). ([Guide](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-npm-for-use-with-github-packages)).

Type definitions are bundled with this package.

## CLI Usage

```bash
$ open-swagger-ui ./swagger.json
# => starts the server.

$ open-swagger-ui ./swagger.json --open # or -O for short
# => starts server, opens it in browser.

$ open-swagger-ui <absolute-path-to-swagger.json> --port 8899
# => you can put absolute/relative path for swagger.json
# => if the requested port is not available, a random port is chosen.

# Oh yes! You can put urls too..
$ open-swagger-ui https://petstore.swagger.io/v2/swagger.json
```

### `--help` for help

```bash
$ open-swagger-ui --help
Usage: open-swagger-ui [options] <swagger-file>

An easy CLI tool to open swagger.json files in Swagger UI.

Options:
  -V, --version      output the version number
  -O, --open         Open stuff in browser
  -P, --port <port>  Preferred port. If not available, a random port is selected
  -h, --help         output usage information
```

## APIs

You can use this as a module too, just in case you want.

```ts
const { startServerWithSwaggerFile } = require('open-swagger-ui');
// or
import { startServerWithSwaggerFile } from 'open-swagger-ui';

startServerWithSwaggerFile('./path/to/swagger.json', port)
  .then(({ app, port, swagFilePath, server }) => {
    console.log(`app started on port ${port}`);
    // app is the express server underneath
    // you may freely add routes to it like
    // app.use(stuff);
  })
  .catch(err => console.error('something went wrong', err));
```

The `startServerWithSwaggerFile` function returns express `app`, the [HTTP `server`](https://nodejs.org/dist/latest-v13.x/docs/api/http.html#http_class_http_server) instance, `port` in which the file is open and the reference `swagFilePath`.

_(Project scaffolded with [ts-np-generator](https://github.com/vajahath/generator-ts-np))_

## Licence

MIT &copy; [Vajahath Ahmed](https://twitter.com/vajahath7)
