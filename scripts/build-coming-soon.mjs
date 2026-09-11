import fs from 'node:fs';
import path from 'node:path';

// Public releases contain only this landing page. The application and its
// downloads remain in source and on the separate owner-only Sites deployment.
const output=path.resolve('dist-soon');
fs.rmSync(output,{recursive:true,force:true});
fs.mkdirSync(path.join(output,'fonts'),{recursive:true});
for(const name of ['index.html','404.html']){
  fs.copyFileSync('deploy/coming-soon/index.html',path.join(output,name));
}
fs.copyFileSync('public/fonts/fraunces-700.woff',path.join(output,'fonts/fraunces-700.woff'));
fs.copyFileSync('public/favicon.svg',path.join(output,'favicon.svg'));
fs.writeFileSync(path.join(output,'robots.txt'),'User-agent: *\nDisallow: /\n');
console.log('Public release prepared: soon page, font, favicon, robots; no application or AI functions.');
