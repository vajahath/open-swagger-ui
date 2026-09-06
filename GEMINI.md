# GEMINI.md - Agent Guide for open-swagger-ui

## Project Overview
`open-swagger-ui` is an npm package and CLI tool that starts an Express server to preview Swagger/OpenAPI (`.json` or `.yaml`) specifications in Swagger UI. It supports both CLI usage (`open-swagger-ui <file> [options]`) and programmatic usage (`startServerWithSwaggerFile(file, port)`).

## Core Architecture & Dual Build
- **Bundler**: Built with `tsdown` (powered by Rolldown + Oxc).
- **Dual Outputs**:
  - CommonJS: `dist/index.cjs` (targeting Node >= 10)
  - ESM: `dist/index.mjs` (for modern ESM consumers and bundlers)
  - CLI Binary: `dist/bin/open-swagger-ui.cjs`
  - Types: `dist/index.d.ts`, `dist/index.d.cts`, and `dist/index.d.mts`
- **Configuration**: `tsdown.config.mts`

## Critical Compatibility Requirements
> [!IMPORTANT]
> **Maintain Node.js >= 10 and Dual CJS/ESM Compatibility**:
> - The package must remain functional for end users running Node.js versions down to **Node 10**.
> - **DO NOT upgrade runtime dependencies** beyond versions that dropped CommonJS or dropped support for Node 10.
>   - `commander`: Keep at `^11.1.0` (v12+ dropped Node 10, v15 dropped CJS)
>   - `express`: Keep at `^4.21.2` (v5+ dropped Node 10)
>   - `swagger-ui-express`: Keep at `^5.0.1` (Swagger UI v5, supports Node 10 + CJS/ESM)
>   - `ora`: Keep at `^5.4.1` (v6+ is pure ESM and requires Node 14+)
>   - `update-notifier`: Keep at `^5.1.0` (v6+ is pure ESM and requires Node 14+)
>   - `upath`: Keep at `^2.0.1` (v3+ is pure ESM and requires Node 20+)
>   - `got`: Keep at `^11.8.6` (v12+ is pure ESM and requires Node 14+)
>   - `get-port`: Keep at `^5.1.1` (v6+ is pure ESM and requires Node 12+)
>   - `open`: Keep at `^8.4.2` (v9+ is pure ESM and requires Node 14+)
>   - `js-yaml`: Keep at `^4.1.0`
> - Target syntax for emitted CJS code is `node10` / `es2018`.

## Development Commands
- **Install dependencies**: `npm install`
- **Build**: `npm run build`
- **Run tests**: `npm test` (Vitest)
- **Run coverage**: `npm run test:coverage`
- **Compatibility check (local)**: `npm run test:compat`
- **Compatibility check (Docker)**: `npm run test:docker` (tests inside `node:10-alpine` through `node:22-alpine`)
- **Lint**: `npm run lint`
- **Format check**: `npm run format`
- **Format fix**: `npm run format:fix`

## Testing Guidelines
- Unit and integration tests are written in TypeScript in `tests/` using **Vitest**.
- Tests run directly against source files (`src/index.ts`) during development.
- End-to-end compatibility is verified against the compiled CJS bundle (`dist/index.cjs`) using `scripts/test-compat.cjs`.

## Release Safeguards
- **DO NOT** execute `npm publish` directly.
- **DO NOT** push commits to GitHub without user authorization.
- Deployment is configured in `.github/workflows/Deploy.yml` and is triggered strictly upon publishing a GitHub Release.
