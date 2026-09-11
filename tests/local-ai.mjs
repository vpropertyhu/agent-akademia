import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
const stage=path.resolve('.sites-runtime/local-ai');
const {startLocalAgent}=await import(path.join(stage,'server.mjs'));
const root=await fs.mkdtemp(path.join(os.tmpdir(),'aa-ai-test-'));await fs.cp(path.join(stage,'web'),path.join(root,'web'),{recursive:true});
let calls=0,fail=false;const contexts=[];
const result={title:'HTTP teszt',summary:'Tesztösszefoglaló',documents:[{title:'../../../nem-fajlnev',body:'Helyi tesztválasz.'}],questions:[],notes:[]};
const provider=async(url,options)=>{calls++;if(url.includes('/models/'))return Response.json({id:'test-model'});contexts.push(JSON.parse(options.body));if(fail)return new Response('',{status:429});return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}],usage:{total_tokens:20}});};
let app=await startLocalAgent({root,port:0,fetcher:provider});
try{
 let url=app.url,cookie='';const visit=async()=>{const r=await fetch(url);assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/frame-ancestors 'none'/);cookie=r.headers.get('set-cookie').split(';')[0];assert.match(r.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);return r.text();};
 const call=(endpoint,body,extra={})=>fetch(url+endpoint,{method:body?'POST':'GET',headers:{Cookie:cookie,...(body?{'Content-Type':'application/json',Origin:url}:{}),...extra},...(body?{body:JSON.stringify(body)}:{})});
 assert.equal((await fetch(url+'/api/ai')).status,401);const html=await visit();const asset=html.match(/src="([^"]+\.js)"/)[1];assert.equal((await fetch(url+asset)).status,200);assert.equal((await fetch(url+'/fonts/fonts.css')).status,200);
 assert.equal((await call('/api/ai',null,{Origin:'https://evil.example'})).status,403);const badHost=await new Promise((resolve,reject)=>{http.get(url+'/api/ai',{headers:{Host:'evil.example',Cookie:cookie}},r=>{r.resume();resolve(r.statusCode);}).on('error',reject);});assert.equal(badHost,403);assert.equal((await call('/.agent-akademia/settings.json')).status,404);
 assert.equal((await call('/api/setup',{key:'test-only-not-a-real-key'})).status,200);assert.equal(calls,1);assert.equal((await call('/api/setup')).status,200);assert.equal((await(await call('/api/setup')).json()).key,undefined);if(process.platform!=='win32')assert.equal((await fs.stat(path.join(root,'.agent-akademia/settings.json'))).mode&0o777,0o600);
 assert.equal((await call('/api/ai',{action:'profile',content:'Helyi tesztcég',revision:null})).status,200);assert.equal((await call('/api/ai',{action:'profile',content:'Elavult',revision:null})).status,409);
 const first={action:'create',id:crypto.randomUUID(),parentId:null,job:'egyedi',brief:'Írj új szöveget.'};let r=await call('/api/ai',first);assert.equal(r.status,201);assert.equal(calls,3);assert.equal((await call('/api/ai',first)).status,200);assert.equal(calls,3);assert.match(await fs.readFile(path.join(root,'munkak',first.id+'.md'),'utf8'),/Helyi tesztválasz/);assert.equal(JSON.parse(contexts[0].input[1].content).ceges_hatter,'Helyi tesztcég');
 const next={...first,id:crypto.randomUUID(),parentId:first.id,brief:'Rövidítsd le.'};assert.equal((await call('/api/ai',next)).status,201);assert.equal(JSON.parse(contexts[2].input[1].content).elozmenyek.length,1);assert.equal((await fs.readdir(path.join(root,'munkak'))).length,2,'versioned output filenames ignore model path-like titles');
 fail=true;const failed={...first,id:crypto.randomUUID()};assert.equal((await call('/api/ai',failed)).status,429);const billed=calls;assert.equal((await call('/api/ai',failed)).status,200);assert.equal(calls,billed);assert.equal((await fs.readdir(path.join(root,'munkak'))).length,2,'failure preserves prior files');fail=false;
 await new Promise(resolve=>app.server.close(resolve));app=await startLocalAgent({root,port:0,fetcher:provider});url=app.url;await visit();const state=await(await call('/api/ai')).json();assert.equal(state.profile,'Helyi tesztcég');assert.equal(state.configured,true);assert.equal(state.works.length,3,'state persists after restart');
 console.log('PASS: actual loopback HTTP server, compiled assets, session cookie, Origin/Host gates, private key storage, profile import contract, generation/review, idempotency, revision context, real files, failure preservation and restart. OpenAI mocked; no browser automation or live generation.');
}finally{await new Promise(resolve=>app.server.close(resolve));await fs.rm(root,{recursive:true,force:true});}
