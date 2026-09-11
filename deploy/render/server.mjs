import http from 'node:http';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {verify} from './signing.mjs';
import {createAIWork,AIError,AI_MODEL} from './ai-engine.mjs';
export async function startServer({port=Number(process.env.PORT||10000),host='0.0.0.0',secret=process.env.AGENT_API_SECRET||'',apiKey=process.env.OPENAI_API_KEY||'',model=process.env.OPENAI_MODEL||AI_MODEL,fetcher=fetch}={}){
 const consumed=new Map();let active=0;
 const server=http.createServer(async(req,res)=>{
  const json=(body,status=200)=>{res.writeHead(status,{'Content-Type':'application/json;charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
  try{
   if(req.method==='GET'&&req.url==='/health')return json({ok:true,service:'agent-akademia-ai'});
   if(req.method==='GET'&&req.url==='/status'){if(!verify('',secret,'status',req.headers['x-agent-time']||null,req.headers['x-agent-signature']||null))return json({error:'Nem engedélyezett.'},401);return json({configured:secret.length>=32&&!!apiKey});}
   if(req.method!=='POST'||req.url!=='/generate')return json({error:'Nem található.'},404);
   if(!req.headers['content-type']?.startsWith('application/json'))return json({error:'JSON kérés szükséges.'},415);
   const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>800000)throw new AIError('SIZE','A feladat túl hosszú.',413);chunks.push(chunk);}const body=Buffer.concat(chunks).toString('utf8');
   if(!verify(body,secret,'generate',req.headers['x-agent-time']||null,req.headers['x-agent-signature']||null))return json({error:'Nem engedélyezett.'},401);
   const now=Date.now();for(const [sig,at] of consumed)if(now-at>300000)consumed.delete(sig);const signature=req.headers['x-agent-signature'];if(consumed.has(signature))return json({error:'Ez a kérés már elindult.'},409);
   if(active>=4)return json({error:'Az agentek elfoglaltak. Próbáld később.'},429);
   if(!apiKey)return json({error:'Az AI-hozzáférés még nincs beállítva.'},503);
   let input;try{input=JSON.parse(body);}catch{throw new AIError('INPUT','A kérés nem olvasható.');}
   consumed.set(signature,now);active++;try{const work=await createAIWork(input,{apiKey,model},fetcher);json(work);}finally{active--;}
  }catch(e){json({error:e instanceof AIError?e.message:'A generálás nem fejeződött be.'},e instanceof AIError?e.status:503);}
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,host,resolve);});return server;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const server=await startServer();console.log('Agent Akadémia AI-szolgáltatás elindult.');let closing=false;
 const close=()=>{if(closing)return;closing=true;server.close(()=>process.exit(0));setTimeout(()=>process.exit(0),150000).unref();};process.on('SIGTERM',close);process.on('SIGINT',close);
}
