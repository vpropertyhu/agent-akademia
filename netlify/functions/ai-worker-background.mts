import type {Context} from '@netlify/functions';
import {appStore,boundedBody,backendURL} from '../../deploy/shared/netlify';
import {runWork,uuid} from '../../deploy/shared/workflow';
import {sign,verify} from '../../deploy/shared/signing';
import {AIError,validateAIResult} from '../../lib/ai-agent';
export default async function(request:Request,context:Context){
 try{
  const secret=Netlify.env.get('AGENT_API_SECRET')||'',body=await boundedBody(request,1000);
  if(!verify(body,secret,'dispatch',request.headers.get('X-Agent-Time'),request.headers.get('X-Agent-Signature'),300000))return;
  const raw=JSON.parse(body) as {id:unknown;owner:unknown};if(!uuid(raw.id)||typeof raw.owner!=='string'||!/^[0-9a-f]{64}$/.test(raw.owner))return;
  const store=appStore(context),api=backendURL(Netlify.env.get('AGENT_API_URL'));
  await runWork(store,raw.owner,raw.id,async input=>{
   if(!api)throw new AIError('NOT_CONFIGURED','A háttérszolgáltatás még nincs csatlakoztatva.',503);
   const payload=JSON.stringify(input),signed=sign(payload,secret,'generate');let response:Response;
   try{response=await fetch(api+'/generate',{method:'POST',headers:{'Content-Type':'application/json','X-Agent-Time':signed.at,'X-Agent-Signature':signed.signature,'X-Agent-Job':raw.id as string},body:payload,signal:AbortSignal.timeout(145000)});}catch{throw new AIError('CONNECTION','Az AI-kapcsolat megszakadt. Nem indítjuk újra automatikusan.',504);}
   const data=await response.json() as {result?:unknown;error?:string};if(!response.ok)throw new AIError('PROVIDER',data.error||'Az AI nem tudta elkészíteni a munkát.',502);return validateAIResult(data.result);
  });
 }catch{/* No paid retry: the claimed job remains visible and eventually reports interruption. */}
}
