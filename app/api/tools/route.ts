import { z } from 'zod';
import { getChatGPTUser } from '../../chatgpt-auth';
import { getDB } from '@/lib/workspace-db';
import { getTool, runTool, validateInput } from '@/lib/daily-tools';
export const dynamic='force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
type Row={id:string;tool_id:string;kind:string;title:string;input_json:string;result_json:string|null;created_at:string};
const decode=(r:Row)=>({id:r.id,toolId:r.tool_id,kind:r.kind,title:r.title,input:JSON.parse(r.input_json),result:r.result_json?JSON.parse(r.result_json):null,createdAt:r.created_at});
const saveSchema=z.object({id:z.string().uuid(),toolId:z.string().max(80),kind:z.enum(['preset','result']),title:z.string().trim().min(2).max(100),input:z.record(z.string().max(20000)),editedText:z.string().max(40000).optional()}).strict();
export async function GET(){
 const user=await getChatGPTUser();if(!user)return reply({error:'A mentett munkákhoz jelentkezz be.'},401);
 try{const rows=await getDB().prepare('SELECT * FROM tool_saves WHERE user_id=? ORDER BY created_at DESC LIMIT 100').bind(user.userId).all<Row>();return reply({saves:rows.results.map(decode)});}
 catch{console.error('Tool saves read failed');return reply({error:'A mentett munkák most nem tölthetők be. Próbáld újra.'},503);}
}
export async function POST(request:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'A mentéshez jelentkezz be.'},401);
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'A kérés nem engedélyezett.'},403);
 let raw:unknown;try{const body=await request.text();if(body.length>100000)return reply({error:'A mentés legfeljebb 100 000 karakter lehet.'},413);raw=JSON.parse(body);}catch{return reply({error:'Érvénytelen kérés.'},400);}
 const parsed=saveSchema.safeParse(raw);if(!parsed.success)return reply({error:'Ellenőrizd a nevet és a mezők hosszát.'},400);
 const data=parsed.data;let input,result;
 try{const tool=getTool(data.toolId);input=validateInput(tool,data.input);const calculated=runTool(tool.id,input);result=data.kind==='result'?{...calculated,text:data.editedText??calculated.text}:null;}
 catch(error){return reply({error:error instanceof Error?error.message:'Hibás bemenet.'},400);}
 try{
  const db=getDB();
  // Idempotent immutable snapshots. Replaying the same ID never overwrites another save.
  const existing=await db.prepare('SELECT * FROM tool_saves WHERE id=? AND user_id=?').bind(data.id,user.userId).first<Row>();
  if(existing)return reply({save:decode(existing)});
  const inserted=await db.prepare(`INSERT INTO tool_saves (id,user_id,tool_id,kind,title,input_json,result_json,engine_version,created_at)
   SELECT ?,?,?,?,?,?,?,1,? WHERE (SELECT COUNT(*) FROM tool_saves WHERE user_id=?)<100 ON CONFLICT(id) DO NOTHING`).bind(data.id,user.userId,data.toolId,data.kind,data.title,JSON.stringify(input),result?JSON.stringify(result):null,new Date().toISOString(),user.userId).run();
  if(!inserted.meta.changes){const retried=await db.prepare('SELECT * FROM tool_saves WHERE id=? AND user_id=?').bind(data.id,user.userId).first<Row>();if(retried)return reply({save:decode(retried)});return reply({error:'A mentés nem hozható létre. Legfeljebb 100 munkát tarthatsz meg; törölj egy régi mentést, vagy próbáld újra.'},409);}
  const saved=await db.prepare('SELECT * FROM tool_saves WHERE id=? AND user_id=?').bind(data.id,user.userId).first<Row>();
  if(!saved)throw new Error('Missing saved row');return reply({save:decode(saved)},201);
 }catch{console.error('Tool save failed');return reply({error:'Nem sikerült a mentés. Az eredményed megmaradt a megnyitott oldalon; próbáld újra.'},503);}
}
export async function DELETE(request:Request){
 const user=await getChatGPTUser();if(!user)return reply({error:'Jelentkezz be.'},401);
 if(request.headers.get('origin')&&request.headers.get('origin')!==new URL(request.url).origin)return reply({error:'A kérés nem engedélyezett.'},403);
 const parsed=z.string().uuid().safeParse(new URL(request.url).searchParams.get('id'));if(!parsed.success)return reply({error:'Érvénytelen azonosító.'},400);
 try{const deleted=await getDB().prepare('DELETE FROM tool_saves WHERE id=? AND user_id=?').bind(parsed.data,user.userId).run();return deleted.meta.changes?reply({ok:true}):reply({error:'A mentés nem található.'},404);}
 catch{console.error('Tool delete failed');return reply({error:'A törlés nem sikerült. Próbáld újra.'},503);}
}
