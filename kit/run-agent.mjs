#!/usr/bin/env node
// Zero-dependency local agent runner. No network access, shell execution, or third-party services.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {getTool,runTool,resultCSV,localDate} from './agent-engine.mjs';

function fail(message){throw new Error(message);}
export function validateConfig(raw){
 if(!raw||raw.version!==1)fail('A konfiguráció version mezője 1 legyen.');
 getTool(raw.toolId);
 if(typeof raw.inputFile!=='string'||!raw.inputFile.trim()||typeof raw.outputDirectory!=='string'||!raw.outputDirectory.trim())fail('inputFile és outputDirectory szükséges.');
 if(!['change','daily'].includes(raw.trigger?.mode))fail('A trigger.mode change vagy daily lehet.');
 const poll=raw.trigger.pollSeconds??60;if(!Number.isInteger(poll)||poll<10||poll>86400)fail('Az ellenőrzési idő 10–86400 egész másodperc legyen.');
 if(raw.trigger.mode==='daily'&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.trigger.time||''))fail('Érvényes ÓÓ:PP trigger.time szükséges.');
 if(raw.input&&(!Object.values(raw.input).every(x=>typeof x==='string')||Array.isArray(raw.input)))fail('Az input szöveges mezőket tartalmazó objektum legyen.');
 return {...raw,input:raw.input||{},trigger:{...raw.trigger,pollSeconds:poll}};
}
export async function atomicWrite(file,data){
 const temporary=file+'.'+randomUUID()+'.tmp';
 try{await fs.writeFile(temporary,data,{encoding:'utf8',flag:'wx'});await fs.rename(temporary,file);}finally{await fs.rm(temporary,{force:true}).catch(()=>{});}
}
export async function createRunner(configFile,{logger=console.log}={}){
 const configPath=path.resolve(configFile),base=path.dirname(configPath),config=validateConfig(JSON.parse(await fs.readFile(configPath,'utf8')));
 const inputPath=path.resolve(base,config.inputFile),outputPath=path.resolve(base,config.outputDirectory);
 if(inputPath===outputPath||inputPath.startsWith(outputPath+path.sep))fail('A bemenet nem lehet az eredménymappában.');
 const signature=createHash('sha256').update(JSON.stringify(config)).digest('hex');
 let state={};
 try{state=JSON.parse(await fs.readFile(path.join(outputPath,'allapot.json'),'utf8'));if(state.signature!==signature)state={};}catch(e){if(e.code!=='ENOENT')logger('Az előző állapot nem olvasható; új ellenőrzéssel indul.');}
 let running=false,lastError='';
 async function tick({now=new Date(),force=false}={}){
  if(running)return {status:'busy'};running=true;
  try{
   const today=localDate(now),time=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
   if(!force&&config.trigger.mode==='daily'&&(time<config.trigger.time||state.lastDay===today))return {status:'not-due'};
   const handle=await fs.open(inputPath,'r');let source;
   try{const stat=await handle.stat();if(stat.size>100000)fail('A bemenet legfeljebb 100 kB lehet.');source=await handle.readFile({encoding:'utf8'});}finally{await handle.close();}
   if(source.length>100000||source.includes('\uFFFD')||source.includes('\0'))fail('UTF-8 kódolású szöveges CSV vagy JSON szükséges.');
   const digest=createHash('sha256').update(source).digest('hex');
   if(!force&&config.trigger.mode==='change'&&state.hash===digest&&state.lastDay===today)return {status:'unchanged'};
   let input;
   if(path.extname(inputPath).toLowerCase()==='.json'){
    const parsed=JSON.parse(source);input=parsed.input||parsed;if(!input||Array.isArray(input)||!Object.values(input).every(v=>typeof v==='string'))fail('A JSON szöveges mezőket tartalmazó input objektumot adjon.');
   }else input={items:source};
   input={...config.input,...input};for(const [key,value] of Object.entries(input)){if(value==='@today')input[key]=today;}
   const result=runTool(config.toolId,input),stamp=now.toISOString().replace(/[:.]/g,'-'),name=`${stamp}-${randomUUID().slice(0,8)}`;
   await fs.mkdir(outputPath,{recursive:true});const staging=path.join(outputPath,'.keszul-'+name),final=path.join(outputPath,name);await fs.mkdir(staging);
   try{
    await fs.writeFile(path.join(staging,'eredmeny.txt'),result.text,'utf8');
    await fs.writeFile(path.join(staging,'eredmeny.json'),JSON.stringify({toolId:config.toolId,engineVersion:1,createdAt:now.toISOString(),input,result},null,2),'utf8');
    if(result.columns)await fs.writeFile(path.join(staging,'eredmeny.csv'),resultCSV(result),'utf8');
    if(result.file)await fs.writeFile(path.join(staging,result.file.name),result.file.content,'utf8');
    await fs.rename(staging,final);
   }catch(e){await fs.rm(staging,{recursive:true,force:true});throw e;}
   const next={signature,hash:digest,lastDay:today,lastRun:now.toISOString(),directory:name};
   await atomicWrite(path.join(outputPath,'legutobbi.json'),JSON.stringify({directory:name,createdAt:now.toISOString()},null,2));
   await atomicWrite(path.join(outputPath,'allapot.json'),JSON.stringify(next,null,2));state=next;lastError='';
   const message=`${now.toISOString()} KÉSZ: ${config.toolId} → ${final}`;logger(message);
   await fs.appendFile(path.join(outputPath,'naplo.txt'),message+'\n','utf8').catch(()=>{});
   return {status:'completed',directory:final,result};
  }catch(e){
   const error=e instanceof Error?e.message:String(e);if(error!==lastError){logger('HIBA: '+error+' A korábbi eredmény megmaradt.');lastError=error;}
   return {status:'error',error};
  }finally{running=false;}
 }
 return {tick,config};
}

async function main(){
 if(Number(process.versions.node.split('.')[0])<22)fail('Node.js 22 vagy újabb szükséges.');
 const args=process.argv.slice(2),file=args.find(x=>!x.startsWith('--'));
 if(!file){console.log('Használat: node run-agent.mjs sajat-agent.json [--once]\nLeállítás: Ctrl+C. Az időzítés a gép helyi idejét használja.');return;}
 const absolute=path.resolve(file),lock=absolute+'.lock';let held;
 try{held=await fs.open(lock,'wx');await held.writeFile(JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}));}catch(e){if(e.code==='EEXIST')fail('Ehhez a konfigurációhoz már tartozik zárolás. Állítsd le a másik futtatót. Összeomlás után csak akkor töröld a .lock fájlt, ha az előző folyamat biztosan nem fut.');throw e;}
 const cleanup=async()=>{if(held){await held.close();held=null;await fs.rm(lock,{force:true});}};
 let timer,stopping=false,inflight=Promise.resolve();
 const stop=async()=>{if(stopping)return;stopping=true;clearTimeout(timer);await inflight;await cleanup();console.log('Az agent leállt.');};
 process.once('SIGINT',()=>void stop());process.once('SIGTERM',()=>void stop());
 try{
  const runner=await createRunner(absolute);
  if(args.includes('--once')){const r=await runner.tick({force:true});await cleanup();if(r.status==='error')process.exitCode=1;return;}
  console.log(`Agent Akadémia · ${runner.config.toolId}\nA figyelés aktív. Leállítás: Ctrl+C. A gépet hagyd bekapcsolva.`);
  const loop=async()=>{if(stopping)return;inflight=runner.tick();await inflight;if(!stopping)timer=setTimeout(()=>void loop(),runner.config.trigger.pollSeconds*1000);};
  await loop();
 }catch(e){await cleanup();throw e;}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);process.exitCode=1;});
