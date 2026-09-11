import { z } from 'zod';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { getDB } from '@/lib/workspace-db';
import { getAIConfig } from '@/lib/ai-config';
import { AIError, createAIWork, validateAIInput, aiJobs, type AITurn } from '@/lib/ai-agent';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store'}});
type Row={id:string;user_id:string;parent_id:string|null;job:string;brief:string;profile:string;history_json:string;request_hash:string;status:string;result_json:string|null;error:string|null;model:string;tokens:number;created_at:string;updated_at:string};
function decode(row:Row){const stale=row.status==='pending'&&Date.now()-Date.parse(row.updated_at)>150000;return {id:row.id,parentId:row.parent_id,job:row.job,brief:row.brief,status:stale?'failed':row.status,result:row.result_json?JSON.parse(row.result_json):null,error:stale?'A futás megszakadt. Nem indítjuk újra automatikusan.':row.error,createdAt:row.created_at};}
async function readBody(request:Request){const reader=request.body?.getReader();if(!reader)throw new AIError('BODY','Hiányzik a kérés.');let size=0;const chunks:Uint8Array[]=[];while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>80000){await reader.cancel();throw new AIError('BODY','A kérés túl hosszú.',413);}chunks.push(value);}const all=new Uint8Array(size);let p=0;for(const c of chunks){all.set(c,p);p+=c.length;}try{return JSON.parse(new TextDecoder().decode(all)) as unknown;}catch{throw new AIError('BODY','A kérés nem olvasható.');}}
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'A saját agented használatához jelentkezz be.'},401);
 try{const db=getDB(),id=new URL(request.url).searchParams.get('id');if(id){if(!z.string().uuid().safeParse(id).success)return reply({error:'Érvénytelen munkaazonosító.'},400);const row=await db.prepare('SELECT * FROM ai_works WHERE id=? AND user_id=?').bind(id,user.userId).first<Row>();return row?reply({work:decode(row)}):reply({error:'Ez a munka nem található.'},404);}
 const profile=await db.prepare('SELECT content,revision FROM ai_profiles WHERE user_id=?').bind(user.userId).first<{content:string;revision:number}>();
 const works=await db.prepare('SELECT * FROM ai_works WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(user.userId).all<Row>();
 return reply({configured:!!getAIConfig().apiKey,profile:profile?.content||'',revision:profile?.revision??null,works:works.results.map(decode)});
 }catch{return reply({error:'A munkatér most nem tölthető be. Próbáld újra.'},503);}
}
const profileSchema=z.object({action:z.literal('profile'),content:z.string().max(12000),revision:z.number().int().positive().nullable()}).strict();
const workSchema=z.object({action:z.literal('create'),id:z.string().uuid(),parentId:z.string().uuid().nullable(),job:z.string(),brief:z.string().trim().min(3).max(6000)}).strict();
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'A saját agented használatához jelentkezz be.'},401);
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'A kérés nem engedélyezett.'},403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return reply({error:'JSON kérés szükséges.'},415);
 let workId:string|undefined;
 try{
  const raw=await readBody(request),db=getDB(),profile=profileSchema.safeParse(raw);
  if(profile.success){const p=profile.data,now=new Date().toISOString();const saved=p.revision===null?await db.prepare('INSERT INTO ai_profiles (user_id,content,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(user_id) DO NOTHING').bind(user.userId,p.content.trim(),now).run():await db.prepare('UPDATE ai_profiles SET content=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(p.content.trim(),now,user.userId,p.revision).run();if(!saved.meta.changes)return reply({error:'A háttér közben másik ablakban változott. Töltsd újra az oldalt; a saját szövegedet előtte másold ki.'},409);return reply({profile:p.content.trim(),revision:(p.revision??0)+1});}
  const parsed=workSchema.safeParse(raw);if(!parsed.success||!aiJobs.some(j=>j.id===parsed.data.job))return reply({error:'Írd le a feladatot, legfeljebb 6000 karakterben.'},400);
  const p=parsed.data,hashBytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(p))),hash=Array.from(new Uint8Array(hashBytes),b=>b.toString(16).padStart(2,'0')).join('');
  const existing=await db.prepare('SELECT * FROM ai_works WHERE id=? AND user_id=?').bind(p.id,user.userId).first<Row>();
  if(existing){if(existing.request_hash!==hash)return reply({error:'Ehhez a kéréshez már más feladat tartozik. Indíts új munkát.'},409);return reply({work:decode(existing)},existing.status==='pending'?202:200);}
  const config=getAIConfig();if(!config.apiKey)throw new AIError('NOT_CONFIGURED','Az AI-kapcsolat még nincs beállítva. A működtetőnek egyszer csatlakoztatnia kell az AI-szolgáltatást.',503);
  let history:AITurn[]=[];
  if(p.parentId){const parent=await db.prepare('SELECT * FROM ai_works WHERE id=? AND user_id=?').bind(p.parentId,user.userId).first<Row>();if(!parent||parent.status!=='succeeded'||!parent.result_json)return reply({error:'Az előző munka nem található, vagy még nem készült el.'},404);if(parent.job!==p.job)return reply({error:'A javítás az előző feladatfajtát folytatja.'},400);history=[...JSON.parse(parent.history_json),{brief:parent.brief,result:JSON.parse(parent.result_json)}];}
  const background=await db.prepare('SELECT content FROM ai_profiles WHERE user_id=?').bind(user.userId).first<{content:string}>();
  const input=validateAIInput({job:p.job,brief:p.brief,profile:background?.content||'',history});
  const now=new Date().toISOString(),dayAgo=new Date(Date.now()-86400000).toISOString(),activeSince=new Date(Date.now()-150000).toISOString();
  // One atomic admission: at most 20 attempts/user and 200/site in any 24 h, including failures.
  const admitted=await db.prepare(`INSERT INTO ai_works (id,user_id,parent_id,job,brief,profile,history_json,request_hash,status,model,created_at,updated_at)
   SELECT ?,?,?,?,?,?,?,?,'pending',?,?,?
   WHERE (SELECT COUNT(*) FROM ai_works WHERE user_id=? AND created_at>?)<20
   AND (SELECT COUNT(*) FROM ai_works WHERE created_at>?)<200
   AND NOT EXISTS(SELECT 1 FROM ai_works WHERE user_id=? AND status='pending' AND updated_at>?)
   ON CONFLICT(id) DO NOTHING`).bind(p.id,user.userId,p.parentId,p.job,input.brief,input.profile,JSON.stringify(history),hash,config.model||'',now,now,user.userId,dayAgo,dayAgo,user.userId,activeSince).run();
  if(!admitted.meta.changes)return reply({error:'Már fut egy feladat, vagy elfogyott a napi keret. Egy fiókkal 24 óránként legfeljebb 20 kérés indítható.'},429);
  workId=p.id;
  const generated=await createAIWork(input,config);
  const saved=await db.prepare("UPDATE ai_works SET status='succeeded',result_json=?,tokens=?,updated_at=? WHERE id=? AND user_id=? AND status='pending'").bind(JSON.stringify(generated.result),generated.tokens,new Date().toISOString(),p.id,user.userId).run();
  if(!saved.meta.changes)throw new AIError('SAVE','A válasz nem menthető. A korábbi munkád megmaradt.',503);
  const row=await db.prepare('SELECT * FROM ai_works WHERE id=? AND user_id=?').bind(p.id,user.userId).first<Row>();if(!row)throw new AIError('SAVE','A mentett válasz nem tölthető be.',503);
  return reply({work:decode(row)},201);
 }catch(error){const e=error instanceof AIError?error:new AIError('SERVER','A munka nem készült el. A korábbi mentések megmaradtak.',503);if(workId){try{await getDB().prepare("UPDATE ai_works SET status='failed',error=?,updated_at=? WHERE id=? AND user_id=? AND status='pending'").bind(e.message,new Date().toISOString(),workId,user.userId).run();}catch{/* Admission row preserves idempotency even after a database outage. */}}return reply({error:e.message,code:e.code},e.status);}
}
