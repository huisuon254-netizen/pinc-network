const { build } = require('esbuild');
const path = require('path');

build({
  entryPoints: [path.resolve(__dirname, 'src/main.tsx')],
  bundle: true,
  outfile: path.resolve(__dirname, 'dist/assets/index.js'),
  format: 'esm',
  platform: 'browser',
  target: ['es2021', 'chrome100', 'safari13'],
  loader: {
    '.tsx': 'tsx',
    '.ts': 'ts',
    '.css': 'empty',
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.jpg': 'dataurl',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
    'import.meta.env': '{}',
    'import.meta.env.MODE': '"production"',
    'import.meta.env.PROD': 'true',
    'import.meta.env.DEV': 'false',
  },
  external: [],
  minify: false,
  sourcemap: false,
  logLevel: 'info',
  treeShaking: true,
}).then(() => {
  console.log('BUILD SUCCESS');
}).catch(e => {
  console.error('BUILD FAILED:', e.message);
  process.exit(1);
});
