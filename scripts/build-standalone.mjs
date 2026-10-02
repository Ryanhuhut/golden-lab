import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const order=[
  'src/core/animation.js',
  'src/core/theme.js',
  'src/core/canvas.js',
  'src/ui/controls.js',
  'src/ui/slider.js',
  'src/ui/pascal.js',
  'src/state.js',
  'src/ui/overview.js',
  'src/ui/workspace.js',
  'src/experiments/fibonacci.js',
  'src/experiments/phyllotaxis.js',
  'src/experiments/petals.js',
  'src/experiments/mechanics.js',
  'src/app.js'
];
const js=order.map(file=>{
  const source=fs.readFileSync(path.join(root,file),'utf8');
  return `// ${file}\n${source.replace(/^import .*?;\s*$/gm,'').replace(/^export /gm,'')}`;
}).join('\n\n');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8')
  .replace('<link rel="stylesheet" href="./styles.css">',`<style>\n${css}\n</style>`)
  .replace('<script type="module" src="./src/app.js"></script>',`<script>\n${js}\n</script>`);
fs.writeFileSync(path.join(root,'preview.html'),html);
console.log('Created preview.html');
