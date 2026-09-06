# AGENTS.md - Multi-Agent Operating Guide

This repository contains `open-swagger-ui`, an npm package and CLI tool used to preview Swagger/OpenAPI files in Swagger UI.

## Project Overview
`open-swagger-ui` starts an Express server to preview Swagger/OpenAPI (`.json` or `.yaml`) specifications in Swagger UI. It supports both CLI usage (`open-swagger-ui <file> [options]`) and programmatic usage (`startServerWithSwaggerFile(file, port)`).

## Core Architecture & Dual Build
- **Bundler**: Built with `tsdown` (powered by Rolldown + Oxc).
- **Dual Outputs**:
  - CommonJS: `dist/index.cjs` (targeting Node >= 10)
  - ESM: `dist/index.mjs` (for modern ESM consumers and bundlers)
  - CLI Binary: `dist/bin/open-swagger-ui.cjs`
  - Types: `dist/index.d.ts`, `dist/index.d.cts`, and `dist/index.d.mts`
- **Configuration**: `tsdown.config.mts`

## Golden Rules for Agents Working on this Codebase
1. **Zero Breaking Changes**: This package has active downloads. Maintain the public API interface `startServerWithSwaggerFile(file, requestedPort)` and CLI flag behavior exactly as documented.
2. **Node.js Engine Floor (>= 10)**: All runtime bundle output and dependencies must run on Node.js 10+. Never convert the package to ESM-only or upgrade dependencies to versions that drop Node 10 or CJS support.
3. **Dual Build Contract**: Emitted files in `dist/` must include both `.cjs` and `.mjs` variants with appropriate `.d.ts` definitions.
4. **Always Verify Locally First & with Docker**: Run `npm test`, `npm run test:compat`, and `npm run test:docker` (or verify with `scripts/test-compat.cjs` in a container) to confirm Node 10 backward compatibility. Local testing is the primary means; CI is a fallback.
5. **Release Restraint**: Never publish to npm or push directly to remote branches without explicit user permission.
6. **Consumer Verification Gate**: Run `npm run test:consumer` to verify real-world package installation, native ESM imports, CommonJS requires, TypeScript type compilation (0 TS7016 errors), and CLI binary execution.

## Critical Compatibility Requirements
> [!IMPORTANT]
> **Maintain Node.js >= 10 and Dual CJS/ESM Compatibility**:
> - The package must remain functional for end users running Node.js versions down to **Node 10**.
> - **DO NOT upgrade runtime dependencies** beyond versions that dropped CommonJS or dropped support for Node 10:
>   - `commander`: Keep at `^11.1.0` (v12+ dropped Node 10, v15 dropped CJS)
>   - `express`: Keep at `^4.21.2` (v5+ dropped Node 10)
>   - `swagger-ui-express`: Keep at `^5.0.1` (Swagger UI v5, supports Node 10 + CJS/ESM)
>   - `ora`: Keep at `^5.4.1` (v6+ is pure ESM and requires Node 14+)
>   - `update-notifier`: Keep at `^5.1.0` (v6+ is pure ESM and requires Node 14+)
>   - `upath`: Keep at `^2.0.1` (v3+ is pure ESM and requires Node 20+)
>   - `got`: Keep at `^11.8.6` (v12+ is pure ESM and requires Node 14+)
>   - `get-port`: Keep at `^5.1.1` (v6+ is pure ESM and requires Node 12+)
>   - `open`: Keep at `^8.4.2` (v9+ is pure ESM and requires Node 14+)
>   - `js-yaml`: Keep at `^4.3.2`
> - Target syntax for emitted CJS code is `node10` / `es2018`.

## Development Commands & Quick Reference
```bash
# Build
npm run build

# Vitest tests & Consumer gate
npm test

# Unit tests only
npm run test:unit

# Real-world consumer gate (isolated npm pack install, ESM, CJS, TS types, CLI)
npm run test:consumer

# Verify runtime compatibility on Node 10+
npm run test:compat

# Run containerized matrix test (Node 10..22)
npm run test:docker

# Coverage
npm run test:coverage

# Lint & Format
npm run lint
npm run format
npm run format:fix
```

## Testing Guidelines
- Unit and integration tests are written in TypeScript in `tests/` using **Vitest**.
- Tests run directly against source files (`src/index.ts`) during development.
- End-to-end compatibility is verified against the compiled CJS bundle (`dist/index.cjs`) using `scripts/test-compat.cjs`.
- External consumer contract (isolated npm install, ESM named imports, TypeScript declaration resolution, CLI flags) is gated via `scripts/test-consumer.cjs`.

## Release Safeguards
- **DO NOT** execute `npm publish` directly.
- **DO NOT** push commits to GitHub without user authorization.
- Deployment is configured in `.github/workflows/Deploy.yml` and is triggered strictly upon publishing a GitHub Release.
