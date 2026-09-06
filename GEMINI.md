# GEMINI.md - Agent Guide for open-swagger-ui

## Project Overview
`open-swagger-ui` is an npm package and CLI tool that starts an Express server to preview Swagger/OpenAPI (`.json` or `.yaml`) specifications in Swagger UI. It supports both CLI usage (`open-swagger-ui <file> [options]`) and programmatic usage (`startServerWithSwaggerFile(file, port)`).

## Core Architecture & Dual Build
- **Bundler**: Built with `tsdown` (powered by Rolldown + Oxc).
- **Dual Outputs**:
  - CommonJS: `dist/index.cjs` (targeting Node >= 10)
  - ESM: `dist/index.mjs` (for modern ESM consumers and bundlers)
  - CLI Binary: `dist/bin/open-swagger-ui.cjs`
  - Types: `dist/index.d.ts` and `dist/index.d.mts`
- **Configuration**: `tsdown.config.ts`

## Critical Compatibility Requirements
> [!IMPORTANT]
> **Maintain Node.js >= 10 Compatibility**:
> - The package must remain functional for end users running Node.js versions down to **Node 10**.
> - **DO NOT upgrade runtime dependencies** (`got`, `ora`, `get-port`, `open`, `update-notifier`) to major versions that dropped CommonJS or dropped support for Node 10.
>   - `got`: Keep at `^11.8.5` (v12+ is pure ESM and requires Node 14+)
>   - `get-port`: Keep at `^5.1.1` (v6+ is pure ESM and requires Node 12+)
>   - `open`: Keep at `^8.4.0` (v9+ is pure ESM and requires Node 14+)
>   - `ora`: Keep at `^4.0.3` (v5+ requires Node 10+, v6+ requires Node 14+)
>   - `update-notifier`: Keep at `^4.0.0` (v5+ requires Node 10+, v6+ requires Node 14+)
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
