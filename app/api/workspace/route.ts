import { getChatGPTUser } from '../../chatgpt-auth';
import { getDB } from '@/lib/workspace-db';
import { samples, type Agent, type Run, type HelpRequest } from '@/lib/agent-data';
import { actionSchema, csvCell } from '@/lib/workspace-validation';
export const dynamic = 'force-dynamic';
const reply=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(request: Request) {
 const user=await getChatGPTUser();
 if(!user)return reply({error:'A mentéshez jelentkezz be.'},401);
 try {
  const db=getDB();
  const rows=await db.prepare('SELECT * FROM runs WHERE user_id = ? ORDER BY created_at DESC').bind(user.userId).all<Run>();
  if(new URL(request.url).searchParams.get('export')==='csv') {
   const csv=[['Kiállító','Számlaszám','Bruttó összeg','Pénznem','Fizetési határidő','Típus'],...rows.results.filter(r=>r.status==='approved').map(r=>[r.supplier,r.invoice_number,String(r.amount).replace('.',','),r.currency,r.due_date,'Mintaadat'])].map(row=>row.map(csvCell).join(';')).join('\r\n');
   return new Response('\uFEFF'+csv,{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="bizonylatok-minta.csv"','Cache-Control':'no-store'}});
  }
  const [agent,help]=await Promise.all([
   db.prepare('SELECT * FROM agents WHERE user_id = ?').bind(user.userId).first<Agent>(),
   db.prepare('SELECT * FROM help_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 20').bind(user.userId).all<HelpRequest>(),
  ]);
  return reply({agent,runs:rows.results,requests:help.results});
 }catch(e){console.error('Workspace read failed',e instanceof Error?e.message:'unknown');return reply({error:'A munkaterület most nem tölthető be. Próbáld újra.'},503);}
}
export async function POST(request: Request) {
 const user=await getChatGPTUser();
 if(!user)return reply({error:'A mentéshez jelentkezz be.'},401);
 const origin=request.headers.get('origin');
 if(origin && origin!==new URL(request.url).origin)return reply({error:'A kérés nem engedélyezett.'},403);
 try {
  const text=await request.text();
  if(text.length>12000)return reply({error:'Túl hosszú kérés.'},413);
  let json:unknown;try{json=JSON.parse(text);}catch{return reply({error:'Érvénytelen kérés.'},400);}
  const parsed=actionSchema.safeParse(json);
  if(!parsed.success)return reply({error:'Ellenőrizd a kitöltött mezőket és a dátumot.'},400);
  const data=parsed.data, db=getDB(), now=new Date().toISOString(), id=crypto.randomUUID();
  const conflict=()=>reply({error:'A beállítás időközben megváltozott egy másik lapon. A saját mezőidet megtartottuk. Frissítsd az oldalt az aktuális változat betöltéséhez.',code:'REVISION_CONFLICT'},409);
  if(data.action==='save_config') {
   const result=data.expectedRevision===null
    ? await db.prepare(`INSERT INTO agents (id,user_id,name,source_label,target_name,schedule,review_required,status,setup_step,revision,updated_at) VALUES (?,?,?,?,?,?,?,'draft',?,1,?) ON CONFLICT(user_id) DO NOTHING`).bind(id,user.userId,data.name,data.sourceLabel,data.targetName,data.schedule,Number(data.reviewRequired),data.setupStep,now).run()
    : await db.prepare(`UPDATE agents SET name=?,source_label=?,target_name=?,schedule=?,review_required=?,setup_step=?,status=CASE WHEN status='paused' THEN 'paused' WHEN name<>? OR source_label<>? OR target_name<>? OR schedule<>? OR review_required<>? THEN 'draft' ELSE status END,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?`).bind(data.name,data.sourceLabel,data.targetName,data.schedule,Number(data.reviewRequired),data.setupStep,data.name,data.sourceLabel,data.targetName,data.schedule,Number(data.reviewRequired),now,user.userId,data.expectedRevision).run();
   if(!result.meta.changes)return conflict();
  }else if(data.action==='save_progress') {
   if(data.setupStep===3){
    const run=await db.prepare("SELECT id FROM runs WHERE user_id=? AND status='approved' LIMIT 1").bind(user.userId).first();
    if(!run)return reply({error:'Előbb hagyj jóvá egy mintatételt.'},400);
   }
   const result=await db.prepare('UPDATE agents SET setup_step=?,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(data.setupStep,now,user.userId,data.expectedRevision).run();
   if(!result.meta.changes)return conflict();
  }else if(data.action==='run_sample') {
   const sample=samples.find(s=>s.id===data.sampleId)!;
   await db.prepare(`INSERT INTO runs (id,user_id,sample_id,supplier,invoice_number,amount,currency,due_date,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,'review',?,?) ON CONFLICT(user_id,sample_id) DO NOTHING`).bind(id,user.userId,sample.id,sample.supplier,sample.invoice,sample.amount,sample.currency,sample.due,now,now).run();
   const run=await db.prepare('SELECT * FROM runs WHERE user_id = ? AND sample_id = ?').bind(user.userId,sample.id).first<Run>();
   return reply({ok:true,run});
  }else if(data.action==='approve') {
   const result=await db.prepare(`UPDATE runs SET supplier=?,invoice_number=?,amount=?,currency=?,due_date=?,status='approved',updated_at=? WHERE id=? AND user_id=?`).bind(data.supplier,data.invoiceNumber,data.amount,data.currency,data.dueDate,now,data.id,user.userId).run();
   if(!result.meta.changes)return reply({error:'Ez a tétel nem található.'},404);
  }else if(data.action==='set_status') {
   if(data.status==='ready'){
    const run=await db.prepare("SELECT id FROM runs WHERE user_id=? AND status='approved' LIMIT 1").bind(user.userId).first();
    if(!run)return reply({error:'Előbb ellenőrizz és hagyj jóvá egy mintatételt.'},400);
   }
   const result=await db.prepare('UPDATE agents SET status=?,setup_step=CASE WHEN ?=\'ready\' THEN 3 ELSE setup_step END,revision=revision+1,updated_at=? WHERE user_id=? AND revision=?').bind(data.status,data.status,now,user.userId,data.expectedRevision).run();
   if(!result.meta.changes)return conflict();
  }else if(data.action==='help') {
   const recent=await db.prepare("SELECT id FROM help_requests WHERE user_id=? AND created_at>? LIMIT 1").bind(user.userId,new Date(Date.now()-60000).toISOString()).first();
   if(recent)return reply({error:'A kérésedet már rögzítettük. Egy perc múlva tudsz újat hozzáadni.'},429);
   await db.prepare("INSERT INTO help_requests (id,user_id,message,status,created_at) VALUES (?,?,?,'recorded',?)").bind(id,user.userId,data.message,now).run();
  }
  if(data.action==='save_config'||data.action==='save_progress'||data.action==='set_status'){
   const agent=await db.prepare('SELECT * FROM agents WHERE user_id=?').bind(user.userId).first<Agent>();
   return reply({ok:true,agent});
  }
  return reply({ok:true});
 }catch(e){console.error('Workspace write failed',e instanceof Error?e.message:'unknown');return reply({error:'Nem sikerült a mentés. Az űrlapot megtartottuk, próbáld újra.'},503);}
}
