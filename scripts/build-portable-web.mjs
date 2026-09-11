import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {build} from 'vite';
import react from '@vitejs/plugin-react';
const root=process.cwd();
function compile(file){return ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;}
fs.writeFileSync('deploy/render/ai-engine.mjs',compile('lib/ai-agent.ts'));
fs.writeFileSync('deploy/render/signing.mjs',compile('deploy/shared/signing.ts'));
await build({configFile:false,root:path.join(root,'deploy/web'),publicDir:false,css:{postcss:{plugins:[]}},plugins:[react()],resolve:{alias:{'@':root}},build:{outDir:path.join(root,'dist-netlify'),emptyOutDir:true}});
for(const folder of ['fonts','letoltes'])fs.cpSync(path.join('public',folder),path.join('dist-netlify',folder),{recursive:true});fs.copyFileSync('public/favicon.svg','dist-netlify/favicon.svg');
fs.writeFileSync('dist-netlify/404.html',fs.readFileSync('dist-netlify/index.html'));
console.log('Built Netlify web application and Render engine from the shared source.');
