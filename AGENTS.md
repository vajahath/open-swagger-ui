# AGENTS.md - Multi-Agent Operating Guide

This repository contains `open-swagger-ui`, an npm package and CLI tool used to preview Swagger/OpenAPI files in Swagger UI.

## Golden Rules for Agents Working on this Codebase
1. **Zero Breaking Changes**: This package has active downloads. Maintain the public API interface `startServerWithSwaggerFile(file, requestedPort)` and CLI flag behavior exactly as documented.
2. **Node.js Engine Floor (>= 10)**: All runtime bundle output and dependencies must run on Node.js 10+. Never convert the package to ESM-only or upgrade dependencies to versions that drop Node 10 or CJS support.
3. **Dual Build Contract**: Emitted files in `dist/` must include both `.cjs` and `.mjs` variants with appropriate `.d.ts` definitions.
4. **Always Verify with Docker**: Run `npm run test:docker` or verify with `scripts/test-compat.cjs` in a container to confirm Node 10 backward compatibility.
5. **Release Restraint**: Never publish to npm or push directly to remote branches without explicit user permission.

## Quick Reference
```bash
# Build
npm run build

# Vitest tests
npm test

# Verify runtime compatibility on Node 10+
npm run test:compat

# Run containerized matrix test (Node 10..22)
npm run test:docker

# Lint & Format
npm run lint
npm run format
```
