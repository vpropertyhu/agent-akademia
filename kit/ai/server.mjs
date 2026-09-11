import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {AI_MODEL,AIError,createAIWork,validateAIInput,workMarkdown,aiJobs} from './ai-engine.mjs';

const uuid=s=>typeof s==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
const safeString=(s,max)=>typeof s==='string'&&s.length<=max;
export async function startLocalAgent({root=path.dirname(fileURLToPath(import.meta.url)),port=4317,fetcher=fetch,openBrowser=false}={}){
 const data=path.join(root,'.agent-akademia'),works=path.join(data,'works'),outputs=path.join(root,'munkak');
 await fs.mkdir(works,{recursive:true,mode:0o700});await fs.mkdir(outputs,{recursive:true});
 async function read(file,fallback){try{if((await fs.stat(file)).size>400000)throw new Error('Too large');return JSON.parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw new AIError('FILE','Egy mentett fájl nem olvasható. A korábbi munkákat nem írjuk felül.',503);}}
 async function atomic(file,value){const tmp=file+'.'+randomUUID()+'.tmp';try{await fs.writeFile(tmp,value,{mode:0o600,flag:'wx'});await fs.rename(tmp,file);}finally{await fs.rm(tmp,{force:true}).catch(()=>{});}}
 async function config(){const settings=await read(path.join(data,'settings.json'),{});return {apiKey:process.env.OPENAI_API_KEY||settings.key,model:process.env.OPENAI_MODEL||AI_MODEL};}
 const profileFile=path.join(data,'profile.json'),workFile=id=>path.join(works,id+'.json');
 const token=randomBytes(32).toString('hex');let active=false,mutation=false,base='';
 async function allWorks(){const files=(await fs.readdir(works)).filter(n=>/^[0-9a-f-]{36}\.json$/.test(n));const rows=[];for(const f of files)rows.push(await read(path.join(works,f),null));return rows.filter(Boolean).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
 function visible(w){return {id:w.id,parentId:w.parentId,job:w.job,brief:w.brief,status:w.status==='pending'&&Date.now()-Date.parse(w.createdAt)>150000?'failed':w.status,result:w.result||null,error:w.error||(w.status==='pending'?'A futás megszakadhatott. Később frissítsd az állapotot.':null),createdAt:w.createdAt};}
 const server=http.createServer(async(req,res)=>{
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"};
  function json(value,status=200){res.writeHead(status,{...headers,'Content-Type':'application/json;charset=utf-8'});res.end(JSON.stringify(value));}
  let jobId;
  try{
   if(req.headers.host!==new URL(base).host)return json({error:'Ez a cím nem engedélyezett.'},403);
   const url=new URL(req.url,base);
   if(req.headers.origin&&req.headers.origin!==base)return json({error:'Másik weboldal nem vezérelheti az agentet.'},403);
   if(req.headers['sec-fetch-site']==='cross-site')return json({error:'A kérést a saját agented felületéről indítsd.'},403);
   if(url.pathname.startsWith('/api/')){
    if(!req.headers.cookie?.split(';').some(c=>c.trim()==='aa_session='+token))return json({error:'Nyisd meg az agent kezdőlapját ebben a böngészőben.'},401);
    if(req.method!=='GET'&&(req.headers.origin!==base||!req.headers['content-type']?.startsWith('application/json')))return json({error:'A kérés nem engedélyezett.'},403);
    if(req.method==='GET'&&url.pathname==='/api/setup')return json({configured:!!(await config()).apiKey});
    if(req.method==='GET'&&url.pathname==='/api/ai'){
     const id=url.searchParams.get('id');if(id){if(!uuid(id))return json({error:'Érvénytelen munkaazonosító.'},400);const row=await read(workFile(id),null);return row?json({work:visible(row)}):json({error:'A munka nem található.'},404);}
     const p=await read(profileFile,{content:'',revision:null});return json({configured:!!(await config()).apiKey,profile:p.content,revision:p.revision,works:(await allWorks()).slice(0,30).map(visible)});
    }
    if(req.method!=='POST')return json({error:'Ismeretlen művelet.'},405);
    let length=0;const chunks=[];for await(const chunk of req){length+=chunk.length;if(length>80000)throw new AIError('SIZE','A kérés túl hosszú.',413);chunks.push(chunk);}
    let raw;try{raw=JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw new AIError('JSON','A kérés nem olvasható.');}if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new AIError('JSON','Érvénytelen kérés.');
    if(url.pathname==='/api/setup'){
     if(mutation||active)return json({error:'Várd meg az előző műveletet.'},409);
     if(!safeString(raw.key,400)||raw.key.length<15||/\s/.test(raw.key))return json({error:'Másold be a teljes API-kulcsot, szóköz nélkül.'},400);
     if(process.env.OPENAI_API_KEY)return json({error:'A program környezeti változóból használ kulcsot. A cseréhez a működtetőnek ott kell módosítania.'},409);
     mutation=true;
     try{let r;try{r=await fetcher('https://api.openai.com/v1/models/'+encodeURIComponent((await config()).model),{headers:{Authorization:'Bearer '+raw.key},signal:AbortSignal.timeout(15000)});}catch{throw new AIError('CONNECT','Nem érhető el az OpenAI. Ellenőrizd az internetkapcsolatot.',503);}if(!r.ok)throw new AIError('KEY','A hozzáférés vagy a kiválasztott modell nem ellenőrizhető. Nézd meg a kulcs engedélyeit és az API-fiók beállításait.',400);await atomic(path.join(data,'settings.json'),JSON.stringify({key:raw.key}));json({configured:true});}finally{mutation=false;}return;
    }
    if(url.pathname!=='/api/ai')return json({error:'Ismeretlen útvonal.'},404);
    if(raw.action==='profile'){
     if(mutation||active)return json({error:'Várd meg az előző műveletet.'},409);
     if(!safeString(raw.content,12000)||(raw.revision!==null&&(!Number.isInteger(raw.revision)||raw.revision<1)))return json({error:'A háttér legfeljebb 12 000 karakter lehet.'},400);
     mutation=true;try{const previous=await read(profileFile,{revision:null});if(previous.revision!==raw.revision)return json({error:'A háttér közben változott. Töltsd újra az oldalt; saját szövegedet előtte másold ki.'},409);const next={content:raw.content.trim(),revision:(previous.revision||0)+1};await atomic(profileFile,JSON.stringify(next));return json({profile:next.content,revision:next.revision});}finally{mutation=false;}
    }
    if(raw.action!=='create'||!uuid(raw.id)||(raw.parentId!==null&&!uuid(raw.parentId))||!safeString(raw.brief,6000)||raw.brief.trim().length<3||!aiJobs.some(j=>j.id===raw.job))return json({error:'Ellenőrizd a feladatot. Legfeljebb 6000 karakter lehet.'},400);
    const request={parentId:raw.parentId,job:raw.job,brief:raw.brief.trim()},hash=createHash('sha256').update(JSON.stringify(request)).digest('hex');
    const existing=await read(workFile(raw.id),null);if(existing){if(existing.hash!==hash)return json({error:'Ehhez az azonosítóhoz más feladat tartozik.'},409);return json({work:visible(existing)},existing.status==='pending'?202:200);}
    if(active||mutation)return json({error:'Az agent már dolgozik. Várd meg az eredményét.'},429);
    active=true;
    try{
     const rows=await allWorks();if(rows.filter(w=>Date.now()-Date.parse(w.createdAt)<86400000).length>=20)throw new AIError('LIMIT','Elérted a 24 óránkénti 20 kérés korlátját.',429);
     const settings=await config();if(!settings.apiKey)throw new AIError('KEY','Először csatlakoztasd az AI-t az oldal tetején.',503);
     let history=[];if(raw.parentId){const parent=await read(workFile(raw.parentId),null);if(!parent||parent.status!=='succeeded'||parent.job!==raw.job)throw new AIError('PARENT','Az előző munka nem folytatható.',404);history=[...parent.input.history,{brief:parent.brief,result:parent.result}];}
     const background=await read(profileFile,{content:''}),input=validateAIInput({...request,profile:background.content,history});
     const row={id:raw.id,...request,input,hash,status:'pending',createdAt:new Date().toISOString()};await atomic(workFile(raw.id),JSON.stringify(row));jobId=raw.id;
     const generated=await createAIWork(input,settings,fetcher);
     await atomic(path.join(outputs,raw.id+'.md'),workMarkdown(generated.result));
     const done={...row,status:'succeeded',result:generated.result,model:generated.model,tokens:generated.tokens};await atomic(workFile(raw.id),JSON.stringify(done));return json({work:visible(done)},201);
    }finally{active=false;}
   }
   if(req.method!=='GET'&&req.method!=='HEAD')return json({error:'Ismeretlen művelet.'},405);
   let file;if(url.pathname==='/')file=path.join(root,'web','index.html');else if(/^\/(assets|fonts)\/[a-zA-Z0-9_.-]+$/.test(url.pathname)||url.pathname==='/favicon.svg')file=path.join(root,'web',url.pathname);else return json({error:'Az oldal nem található.'},404);
   let bytes;try{bytes=await fs.readFile(file);}catch{return json({error:'Az alkalmazás fájlja hiányzik. Csomagold ki újra az eredeti ZIP-et.'},404);}
   const ext=path.extname(file),mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.svg':'image/svg+xml','.woff':'font/woff','.txt':'text/plain;charset=utf-8'}[ext]||'application/octet-stream';
   res.writeHead(200,{...headers,'Content-Type':mime,...(url.pathname==='/'?{'Set-Cookie':'aa_session='+token+'; HttpOnly; SameSite=Strict; Path=/'}:{})});res.end(req.method==='HEAD'?undefined:bytes);
  }catch(error){const e=error instanceof AIError?error:new AIError('SERVER','A helyi munka nem fejeződött be. A korábbi eredmények megmaradtak.',503);if(jobId){try{const row=await read(workFile(jobId),null);if(row?.status==='pending')await atomic(workFile(jobId),JSON.stringify({...row,status:'failed',error:e.message}));}catch{/* Keep the pending admission if storage failed; never auto-retry a paid call. */}}json({error:e.message,code:e.code},e.status);}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});base='http://127.0.0.1:'+server.address().port;
 if(openBrowser){const [command,args]=process.platform==='win32'?['cmd',['/c','start','',base]]:process.platform==='darwin'?['open',[base]]:['xdg-open',[base]];const child=spawn(command,args,{stdio:'ignore',detached:true});child.on('error',()=>{});child.unref();}
 return {server,url:base};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(Number(process.versions.node.split('.')[0])<22){console.error('A futtatáshoz Node.js 22 vagy újabb verzió kell. Nyisd meg a KEZDD-ITT.html útmutatót.');process.exitCode=1;}
 else try{const {server,url}=await startLocalAgent({openBrowser:!process.argv.includes('--no-open')});console.log('Az Agent Akadémia elindult: '+url+'\nHagyd nyitva ezt az ablakot használat közben. Leállítás: Ctrl+C.');let stopping=false;const stop=()=>{if(stopping)return;stopping=true;console.log('Leállítás. A futó munka befejezésére várunk.');server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),140000).unref();};process.on('SIGINT',stop);process.on('SIGTERM',stop);}catch(e){console.error(e.code==='EADDRINUSE'?'Az agent már fut, vagy a 4317-es port foglalt. Nyisd meg: http://127.0.0.1:4317':'Az agent nem indult el. Ellenőrizd, hogy a teljes csomagot írható mappába csomagoltad-e ki.');process.exitCode=1;}
}
