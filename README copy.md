# open-swagger-ui

An easy cli/api to open `swagger.json` in Swagger UI.

![](https://github.com/vajahath/open-swagger-ui/workflows/Build/badge.svg)

## Install

Requires Node >=8.

From npm,

```sh
npm i -g open-swagger-ui
```

From [Github Package Registry](https://github.com/vajahath/open-swagger-ui/packages). ([Guide](https://help.github.com/en/github/managing-packages-with-github-packages/configuring-npm-for-use-with-github-packages)).

[![](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

Type definitions are bundled with this package.

## CLI Usage

```bash
$ open-swagger-ui ./swagger.json
# => starts the server.

$ open-swagger-ui ./swagger.json --open # # => starts server, opens it in browser.

$ open-swagger-ui <absolute-path-to-swagger.json>
# => you can put absolute/relative path for swagger.json
```

more

```bash
$ open-swagger-ui --help
```

## APIs

You can use this as a module too.

```ts
const { startServerWithSwaggerFile } = require('open-swagger-ui');
// or
import { startServerWithSwaggerFile } from 'open-swagger-ui';

startServerWithSwaggerFile('./path/to/swagger.json')
  .then(({ app, port }) => {
    console.log(`app started on port ${port}`);
    // app is the express server underneath
    // you may freely add routes to it like
    // app.use(stuff);
  })
  .catch(err => console.error('something went wrong', err));
```

[![](https://img.shields.io/badge/built%20with-ts--np%203.0.0-beta.7-lightgrey?style=flat-square)](https://github.com/vajahath/generator-ts-np)

## Licence

MIT &copy; [Vajahath Ahmed](https://twitter.com/vajahath7)
