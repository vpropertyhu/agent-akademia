import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root=path.resolve('.sites-runtime/portable-tests');fs.mkdirSync(root,{recursive:true});
const compile=file=>ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
fs.writeFileSync(root+'/engine.mjs',compile('lib/ai-agent.ts'));
fs.writeFileSync(root+'/workflow.mjs',compile('deploy/shared/workflow.ts').replaceAll('../../lib/ai-agent','./engine.mjs'));
fs.writeFileSync(root+'/signing.mjs',compile('deploy/shared/signing.ts'));
const {prepareWork,runWork,readWorkspace,saveProfile,userKey,visible}=await import(root+'/workflow.mjs');
const {sign,verify}=await import(root+'/signing.mjs');
class MemoryStore{data=new Map();version=0;async get(key){return structuredClone(this.data.get(key)?.data??null);}async getWithMetadata(key){return structuredClone(this.data.get(key)??null);}async setJSON(key,value,options={}){const previous=this.data.get(key);if(options.onlyIfNew&&previous||options.onlyIfMatch&&options.onlyIfMatch!==previous?.etag)return {modified:false};const etag=String(++this.version);this.data.set(key,{data:structuredClone(value),etag,metadata:{}});return {modified:true,etag};}}
const store=new MemoryStore(),alpha=userKey('alpha'),beta=userKey('beta');
const raw=()=>({id:crypto.randomUUID(),parentId:null,job:'egyedi',brief:'Írj egy új posztot.'});
const result={title:'Teszt',summary:'Csak tesztválasz.',documents:[{title:'Tartalom',body:'Tesztben alkotott szöveg.'}],questions:[],notes:[]};
await saveProfile(store,alpha,{content:'Alpha saját háttere',revision:null});await assert.rejects(()=>saveProfile(store,alpha,{content:'Elavult',revision:null}),e=>e.status===409);
const first=raw(),prepared=await prepareWork(store,alpha,first);assert.equal(prepared.work.input.profile,'Alpha saját háttere');assert.equal(prepared.created,true);assert.equal((await prepareWork(store,alpha,first)).created,false);assert.equal(visible(prepared.work).status,'pending');await assert.rejects(()=>prepareWork(store,alpha,raw()),e=>e.code==='ACTIVE');
let calls=0;const generate=async input=>{calls++;assert.equal(input.profile,'Alpha saját háttere');await Promise.resolve();return result;};await Promise.all([runWork(store,alpha,first.id,generate),runWork(store,alpha,first.id,generate)]);assert.equal(calls,1,'only one worker claims an admitted task');
let state=await readWorkspace(store,alpha);assert.equal(state.works[0].status,'succeeded');assert.equal((await readWorkspace(store,beta)).works.length,0);await assert.rejects(()=>prepareWork(store,beta,{...raw(),parentId:first.id}),e=>e.status===404);
const second=await prepareWork(store,alpha,{...raw(),parentId:first.id,brief:'Rövidítsd le.'});assert.equal(second.work.input.history.length,1);await runWork(store,alpha,second.work.id,async()=>{throw new Error('connection failed');});state=await readWorkspace(store,alpha);assert.equal(state.works[0].status,'failed');assert.equal(state.works[1].result.title,'Teszt');
await assert.rejects(()=>prepareWork(store,alpha,{...first,brief:'Más kérés'}),e=>e.status===409);
const limit=new MemoryStore();await limit.setJSON('usage',Array.from({length:20},()=>({owner:alpha,id:crypto.randomUUID(),active:false,at:Date.now()})));await assert.rejects(()=>prepareWork(limit,alpha,raw()),e=>e.code==='LIMIT');await limit.setJSON('usage',Array.from({length:200},(_,i)=>({owner:userKey('user-'+i),id:crypto.randomUUID(),active:false,at:Date.now()})));await assert.rejects(()=>prepareWork(limit,beta,raw()),e=>e.code==='LIMIT');
const race=new MemoryStore();const attempts=await Promise.allSettled([prepareWork(race,alpha,raw()),prepareWork(race,alpha,raw())]);assert.equal(attempts.filter(x=>x.status==='fulfilled').length,1,'CAS admission prevents concurrent user jobs');
const secret='only-for-testing-'.repeat(4),body='{"hello":"world"}',signed=sign(body,secret,'generate');assert(verify(body,secret,'generate',signed.at,signed.signature));assert(!verify(body+'x',secret,'generate',signed.at,signed.signature));assert(!verify(body,secret,'dispatch',signed.at,signed.signature));const old=sign(body,secret,'generate',String(Date.now()-120000));assert(!verify(body,secret,'generate',old.at,old.signature));
const {startServer}=await import(path.resolve('deploy/render/server.mjs'));let modelCalls=0;
const server=await startServer({host:'127.0.0.1',port:0,secret,apiKey:'test-only-key',fetcher:async()=>{modelCalls++;return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}]});}});
try{const url='http://127.0.0.1:'+server.address().port;assert.equal((await fetch(url+'/health')).status,200);assert.equal((await fetch(url+'/status')).status,401);const status=sign('',secret,'status');assert.equal((await(await fetch(url+'/status',{headers:{'X-Agent-Time':status.at,'X-Agent-Signature':status.signature}})).json()).configured,true);
 const payload=JSON.stringify({job:'egyedi',brief:'Írj egy új szöveget.',profile:'',history:[]}),sig=sign(payload,secret,'generate'),options={method:'POST',headers:{'Content-Type':'application/json','X-Agent-Time':sig.at,'X-Agent-Signature':sig.signature},body:payload};assert.equal((await fetch(url+'/generate',{...options,body:payload+' '})).status,401);assert.equal(modelCalls,0);assert.equal((await fetch(url+'/generate',options)).status,200);assert.equal(modelCalls,2);assert.equal((await fetch(url+'/generate',options)).status,409);assert.equal(modelCalls,2);
}finally{await new Promise(resolve=>server.close(resolve));}
// Exercise the actual Netlify handlers with storage and Identity boundaries stubbed.
fs.writeFileSync(root+'/netlify.mjs',compile('deploy/shared/netlify.ts').replace("import { getStore, getDeployStore } from '@netlify/blobs';", "const getStore=()=>globalThis.__portableTest.production,getDeployStore=()=>globalThis.__portableTest.preview;").replaceAll('../../lib/ai-agent','./engine.mjs'));
for(const name of ['ai','ai-worker-background'])fs.writeFileSync(root+'/'+name+'.mjs',compile('netlify/functions/'+name+'.mts').replace("import { getUser } from '@netlify/identity';", "const getUser=async()=>globalThis.__portableTest.user;").replaceAll('../../lib/ai-agent','./engine.mjs').replaceAll('../../deploy/shared/netlify','./netlify.mjs').replaceAll('../../deploy/shared/workflow','./workflow.mjs').replaceAll('../../deploy/shared/signing','./signing.mjs'));
const {default:apiHandler}=await import(root+'/ai.mjs'),{default:workerHandler}=await import(root+'/ai-worker-background.mjs');
const originalFetch=globalThis.fetch,originalNetlify=globalThis.Netlify;
const production=new MemoryStore(),preview=new MemoryStore();globalThis.__portableTest={user:null,production,preview};
const env={AGENT_API_URL:'https://render.test',AGENT_API_SECRET:secret};globalThis.Netlify={env:{get:key=>env[key]}};
const context={deploy:{context:'production'}},url='https://agent.test';let queue=null,checks=0,requests=0;
const request=(data,origin=url)=>new Request(url+'/api/ai',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(data)});
globalThis.fetch=async(target,options={})=>{const address=String(target);if(address==='https://render.test/status'){checks++;return Response.json({configured:true});}if(address===url+'/.netlify/functions/ai-worker-background'){queue={target,options};return new Response(null,{status:202});}if(address==='https://render.test/generate'){requests++;assert(verify(options.body,secret,'generate',options.headers['X-Agent-Time'],options.headers['X-Agent-Signature']));return Response.json({result});}throw new Error('Unexpected request: '+address);};
try{
 assert.equal((await apiHandler(new Request(url+'/api/ai'),context)).status,401);
 globalThis.__portableTest.user={id:'alpha'};
 assert.equal((await apiHandler(request({action:'profile',content:'Saját háttér',revision:null},'https://other.test'),context)).status,403);
 assert.equal((await apiHandler(request({action:'profile',content:'Saját háttér',revision:null}),context)).status,200);assert.equal(checks,0,'profile saves do not contact Render');
 const submitted={action:'create',...raw()},queued=await apiHandler(request(submitted),context);assert.equal(queued.status,202);assert.equal((await queued.json()).work.status,'pending');assert(queue);assert.equal(checks,1);
 const duplicate=await apiHandler(request(submitted),context);assert.equal(duplicate.status,202);assert.equal(checks,1,'replay never restarts service or task');
 await workerHandler(new Request(String(queue.target),{method:'POST',...queue.options}),context);assert.equal(requests,1);await workerHandler(new Request(String(queue.target),{method:'POST',...queue.options}),context);assert.equal(requests,1);
 const completed=await apiHandler(new Request(url+'/api/ai?id='+submitted.id),context);assert.equal((await completed.json()).work.status,'succeeded');assert.equal(checks,1,'polling only reads durable state');
 globalThis.__portableTest.user={id:'beta'};assert.equal((await apiHandler(new Request(url+'/api/ai?id='+submitted.id),context)).status,404);
 globalThis.__portableTest.user={id:'alpha'};assert.equal((await apiHandler(new Request(url+'/api/ai?id='+submitted.id),{deploy:{context:'deploy-preview'}})).status,404);
 assert.equal((await apiHandler(request({action:'create',...raw()}),'bad-context')).status,503);
}finally{globalThis.fetch=originalFetch;globalThis.Netlify=originalNetlify;delete globalThis.__portableTest;}
console.log('PASS: production/preview separation; actual Netlify handlers reject unauthenticated and cross-origin requests, scope saved work, dispatch signed background jobs, and poll without additional model calls. Identity and Blobs mocked.');
console.log('PASS: conditional Blob writes, isolated user context, profile conflict, atomic quota/admission, single worker claim, history and failure preservation; actual Render HTTP server, HMAC scope/tamper/expiry/replay checks and two generation stages. Blobs and OpenAI mocked.');
