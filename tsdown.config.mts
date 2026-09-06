import { defineConfig } from 'tsdown';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'bin/open-swagger-ui': 'src/bin/open-swagger-ui.ts',
  },
  format: ['esm', 'cjs'],
  target: 'node10',
  clean: true,
  dts: true,
  deps: {
    onlyBundle: false,
  },
  onSuccess() {
    const dtsPath = path.resolve(process.cwd(), 'dist/index.d.ts');
    fs.writeFileSync(dtsPath, 'export * from "./index.d.cts";\n');
  },
});
