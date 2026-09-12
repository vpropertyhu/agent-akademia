import {z} from 'zod';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getDB} from '@/lib/workspace-db';
import {getAIConfig} from '@/lib/ai-config';
import {AIError} from '@/lib/ai-agent';
import {PilotService} from '@/lib/pilot-service';
import type {PilotRun} from '@/lib/pilot-engine';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
const requestSchema=z.discriminatedUnion('action',[
 z.object({action:z.literal('create'),id:z.string().uuid(),plan:z.unknown()}).strict(),
 z.object({action:z.enum(['start','advance','approve','retry','cancel','delete']),id:z.string().uuid(),revision:z.number().int().positive()}).strict(),
]);
function publicRun(run:PilotRun){return {...run,files:run.files.map(({path,...f})=>({...f,url:'/api/pilot?id='+run.id+'&file='+encodeURIComponent(f.name)}))};}
async function body(request:Request){const reader=request.body?.getReader();if(!reader)throw new AIError('BODY','Hiányzik a feladat.');const decoder=new TextDecoder();let text='',size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>40000){await reader.cancel();throw new AIError('BODY','A kérés túl hosszú.',413);}text+=decoder.decode(value,{stream:true});}text+=decoder.decode();try{return JSON.parse(text);}catch{throw new AIError('BODY','A kérés nem olvasható.');}}
async function handle(request:Request){
 try{
  const user=await getChatGPTUser();if(!user)return reply({error:'A saját munkáidhoz jelentkezz be.'},401);
  const config=getAIConfig();const bucket=(env as unknown as {BUCKET:R2Bucket}).BUCKET;const service=new PilotService({db:getDB(),bucket,config},user.userId);
  if(request.method==='GET'){
   const url=new URL(request.url),id=url.searchParams.get('id');if(!id)return reply({configured:!!config.apiKey&&!!bucket,works:await service.list()});
   if(!z.string().uuid().safeParse(id).success)return reply({error:'Érvénytelen munkaazonosító.'},400);
   const file=url.searchParams.get('file');if(file){const {meta,value}=await service.file(id,file);return new Response(value.body,{headers:{'Content-Type':meta.mime,'Content-Disposition':(meta.mime.startsWith('image/')?'inline':'attachment')+'; filename="'+meta.name+'"','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});}
   return reply({work:publicRun(await service.read(id)),configured:!!config.apiKey&&!!bucket});
  }
  if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'A kérés nem engedélyezett.'},403);
  if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON kérés szükséges.'},415);
  const parsed=requestSchema.safeParse(await body(request));if(!parsed.success)return reply({error:'A feladatsor vagy a művelet nem olvasható.'},400);
  const p=parsed.data;if(p.action==='delete'){await service.remove(p.id,p.revision);return reply({deleted:true});}
  const work=p.action==='create'?await service.create(p.id,p.plan):await service.action(p.id,p.revision,p.action);return reply({work:publicRun(work)},p.action==='create'?201:200);
 }catch(e){return e instanceof AIError?reply({error:e.message,code:e.code},e.status):reply({error:'A munkatér most nem érhető el. A beírt kérésedet megtartottuk.'},503);}
}
export const GET=handle;export const POST=handle;
