const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

const options = {
  entryPoints: [path.resolve(__dirname, 'src/main.ts')],
  bundle: true,
  outfile: path.resolve(__dirname, 'code.js'),
  target: 'es2018',
  logLevel: 'info',
};

if (isWatch) {
  esbuild.context(options).then(ctx => {
    ctx.watch();
    console.log('[esbuild] Watching src/ for changes...');
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
} else {
  esbuild.build(options).then(() => {
    console.log('[esbuild] Successfully compiled to code.js');
  }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

