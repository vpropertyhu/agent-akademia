import {getUser} from '@netlify/identity';
import type {Context,Config} from '@netlify/functions';
import {AIError} from '../../lib/ai-agent';
import {appStore,reply,boundedBody,backendURL} from '../../deploy/shared/netlify';
import {readWorkspace,saveProfile,prepareWork,visible,userKey,uuid,key,failWork,type Work} from '../../deploy/shared/workflow';
import {sign} from '../../deploy/shared/signing';

async function connected(api:string|null,secret:string|undefined){
 if(!api||!secret||secret.length<32)return false;
 try{const at=sign('',secret,'status'),r=await fetch(api+'/status',{headers:{'X-Agent-Time':at.at,'X-Agent-Signature':at.signature},signal:AbortSignal.timeout(5000)});if(!r.ok)return false;const body=await r.json() as {configured?:boolean};return body.configured===true;}catch{return false;}
}
export default async function(request:Request,context:Context){
 try{
  const origin=new URL(request.url).origin;if(request.method!=='GET'&&(request.headers.get('origin')!==origin||!request.headers.get('content-type')?.startsWith('application/json')))return reply({error:'A kérés nem engedélyezett.'},403);
  const user=await getUser();if(!user)return reply({error:'A saját munkatérhez jelentkezz be.'},401);
  const owner=userKey(user.id),store=appStore(context),api=backendURL(Netlify.env.get('AGENT_API_URL')),secret=Netlify.env.get('AGENT_API_SECRET');
  if(request.method==='GET'){const id=new URL(request.url).searchParams.get('id');if(id){if(!uuid(id))return reply({error:'Érvénytelen azonosító.'},400);const w=await store.get(key(owner,id),{type:'json'}) as Work|null;return w&&w.owner===owner?reply({work:visible(w)}):reply({error:'A munka nem található.'},404);}const [workspace,configured]=await Promise.all([readWorkspace(store,owner),connected(api,secret)]);return reply({...workspace,configured});}
  if(request.method!=='POST')return reply({error:'Ismeretlen művelet.'},405);
  let raw:Record<string,unknown>;try{raw=JSON.parse(await boundedBody(request));}catch(e){if(e instanceof AIError)throw e;throw new AIError('BODY','A kérés nem olvasható.');}
  if(!raw||typeof raw!=='object')throw new AIError('BODY','Érvénytelen kérés.');
  if(raw.action==='profile')return reply(await saveProfile(store,owner,raw));
  if(raw.action!=='create')return reply({error:'Ismeretlen művelet.'},400);
  // Read-only replay stays available even while the AI service is offline.
  if(uuid(raw.id)){const existing=await store.get(key(owner,raw.id),{type:'json'});if(existing){const retried=await prepareWork(store,owner,raw);return reply({work:visible(retried.work)},['queued','pending'].includes(retried.work.status)?202:200);}}
  if(!secret||!await connected(api,secret))throw new AIError('NOT_CONFIGURED','Az AI-szolgáltatás még nincs csatlakoztatva, vagy éppen indul. A mentett munkák elérhetők; próbáld újra később.',503);
  const prepared=await prepareWork(store,owner,raw);if(!prepared.created)return reply({work:visible(prepared.work)},200);
  const body=JSON.stringify({owner,id:prepared.work.id}),headers=sign(body,secret,'dispatch');
  try{const response=await fetch(new URL('/.netlify/functions/ai-worker-background',request.url),{method:'POST',headers:{'Content-Type':'application/json','X-Agent-Time':headers.at,'X-Agent-Signature':headers.signature},body,signal:AbortSignal.timeout(10000)});if(response.status!==202)throw new Error('dispatch');}catch{await failWork(store,owner,prepared.work.id,'A háttérfeldolgozás nem indult el. Próbáld újra egy új munkával.');throw new AIError('DISPATCH','A háttérfeldolgozás nem indult el.',503);}
  return reply({work:visible(prepared.work)},202);
 }catch(e){return e instanceof AIError?reply({error:e.message,code:e.code},e.status):reply({error:'A munkatér most nem érhető el. Próbáld újra.'},503);}
}
export const config:Config={path:'/api/ai'};
