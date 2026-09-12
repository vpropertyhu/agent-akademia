import {AIError,workMarkdown} from './ai-agent';
import {validatePilotPlan} from './pilot-plan';
import {emptyUsage,executePilotStep,sha256,type PilotRun,type PilotConfig,type PilotFile} from './pilot-engine';
type Row={id:string;user_id:string;state_json:string;status:PilotRun['status'];revision:number;lease_until:string|null;created_at:string};
type Dependencies={db:D1Database;bucket:R2Bucket;config:PilotConfig;fetcher?:typeof fetch};
const now=()=>new Date().toISOString();
function event(run:PilotRun,step:string,status:string,detail?:string){run.events.push({step,status,at:now(),...(detail?{detail}:{})});}
export class PilotService{
 constructor(private deps:Dependencies,private owner:string){}
 private async row(id:string){return this.deps.db.prepare('SELECT * FROM pilot_runs WHERE id=? AND user_id=?').bind(id,this.owner).first<Row>();}
 private decode(row:Row):PilotRun{return {...JSON.parse(row.state_json),status:row.status,revision:row.revision};}
 private async commit(run:PilotRun,revision:number,lease:string|null=null){
  const r=await this.deps.db.prepare('UPDATE pilot_runs SET state_json=?,status=?,revision=revision+1,lease_until=?,updated_at=? WHERE id=? AND user_id=? AND revision=?').bind(JSON.stringify(run),run.status,lease,now(),run.id,this.owner,revision).run();
  if(!r.meta.changes)throw new AIError('CONFLICT','A munka közben másik ablakban változott. Frissítjük az állapotát.',409);
  run.revision=revision+1;return run;
 }
 async read(id:string){
  let row=await this.row(id);if(!row)throw new AIError('NOT_FOUND','Ez a munka nem található.',404);
  if(row.status==='running'&&row.lease_until&&row.lease_until<now()){
   const stale=this.decode(row);stale.status='failed';stale.error='A lépés megszakadt. A korábbi anyag megmaradt. Az újrapróbálás új AI-használatot jelenthet.';event(stale,stale.plan.steps[stale.cursor]||'save','failed');
   try{await this.commit(stale,row.revision);}catch(e){if(!(e instanceof AIError)||e.code!=='CONFLICT')throw e;}
   row=await this.row(id);if(!row)throw new AIError('NOT_FOUND','Ez a munka nem található.',404);
  }
  return this.decode(row);
 }
 async list(){const rows=await this.deps.db.prepare('SELECT * FROM pilot_runs WHERE user_id=? ORDER BY created_at DESC LIMIT 30').bind(this.owner).all<Row>();return rows.results.map(r=>{const s=this.decode(r);return {id:s.id,plan:s.plan,status:s.status,createdAt:s.createdAt,verifiedAt:s.verifiedAt};});}
 async create(id:string,value:unknown){
  let plan;try{plan=validatePilotPlan(value);}catch(e){throw new AIError('PLAN',e instanceof Error?e.message:'A terv hibás.');}
  const old=await this.row(id);if(old){const r=this.decode(old);if(JSON.stringify(r.plan)!==JSON.stringify(plan))throw new AIError('CONFLICT','Ez az azonosító már másik feladatsorhoz tartozik.',409);return r;}
  if(await this.deps.db.prepare('SELECT id FROM pilot_admissions WHERE id=?').bind(id).first())throw new AIError('CONFLICT','Ezt a munkaazonosítót már felhasználtad. Indíts új munkát.',409);
  const run:PilotRun={id,plan,status:'draft',cursor:0,revision:1,attempts:0,approvedImage:false,result:null,research:null,outputs:[],usage:[],files:[],events:[],error:null,verifiedAt:null,createdAt:now()};event(run,'plan','saved');
  const cutoff=new Date(Date.now()-86400000).toISOString();
  const [inserted]=await this.deps.db.batch([this.deps.db.prepare(`INSERT INTO pilot_runs (id,user_id,state_json,status,revision,created_at,updated_at)
   SELECT ?,?,?,'draft',1,?,? WHERE (SELECT COUNT(*) FROM pilot_admissions WHERE user_id=? AND created_at>?)<20
   AND (SELECT COUNT(*) FROM pilot_admissions WHERE created_at>?)<200
   AND NOT EXISTS(SELECT 1 FROM pilot_admissions WHERE id=?) ON CONFLICT(id) DO NOTHING`).bind(id,this.owner,JSON.stringify(run),run.createdAt,run.createdAt,this.owner,cutoff,cutoff,id),
   this.deps.db.prepare('INSERT INTO pilot_admissions (id,user_id,created_at) SELECT id,user_id,created_at FROM pilot_runs WHERE id=? AND user_id=? ON CONFLICT(id) DO NOTHING').bind(id,this.owner)]);
  if(!inserted.meta.changes){const existing=await this.row(id);if(existing){const r=this.decode(existing);if(JSON.stringify(r.plan)!==JSON.stringify(plan))throw new AIError('CONFLICT','Eltérő feladat ugyanazzal az azonosítóval.',409);return r;}throw new AIError('QUOTA','A próbában egy nap legfeljebb 20 új feladatsor menthető fiókonként.',429);}
  return run;
 }
 async action(id:string,revision:number,action:'start'|'advance'|'approve'|'retry'|'cancel'){
  const run=await this.read(id);if(run.revision!==revision)throw new AIError('CONFLICT','A munka állapota megváltozott. Frissítsd, és folytasd onnan.',409);
  if(action==='cancel'){
   if(['succeeded','cancelled'].includes(run.status))return run;
   const leased=await this.row(id);run.status='cancelled';event(run,'run','cancelled','További lépést nem indítunk. A már elküldött AI-kérés még fogyaszthat.');return this.commit(run,revision,leased?.lease_until||null);
  }
  if(!this.deps.config.apiKey&&((action==='start')||run.cursor<run.plan.steps.length))throw new AIError('NOT_CONFIGURED','A feladatsor mentve van. A valódi indításhoz az AI-hozzáférést még csatlakoztatni kell.',503);
  if(action==='start'){
   if(!this.deps.bucket)throw new AIError('STORAGE','A fájlok mentési helye még nincs csatlakoztatva. AI-kérést nem indítottunk.',503);
   if(run.status!=='draft')throw new AIError('STATE','Ez a munka már elindult.',409);run.status='ready';event(run,'run','started');return this.commit(run,revision);
  }
  if(action==='approve'){
   if(run.status!=='waiting'||run.plan.steps[run.cursor]!=='image')throw new AIError('STATE','Ez a munka nem vár képkészítési jóváhagyásra.',409);
   run.approvedImage=true;run.status='ready';event(run,'image','approved');return this.commit(run,revision);
  }
  if(action==='retry'){
   if(run.status!=='failed')throw new AIError('STATE','Csak megállt munka folytatható innen.',409);
   if(run.cursor<run.plan.steps.length&&run.attempts>=10)throw new AIError('QUOTA','A feladatsor elérte a 10 AI-kéréses próbakorlátot.',429);
   run.status='ready';run.error=null;event(run,run.plan.steps[run.cursor]||'save','retry_requested');return this.commit(run,revision);
  }
  if(run.status!=='ready')return run;
  const step=run.cursor<run.plan.steps.length?run.plan.steps[run.cursor]:(run.cursor===run.plan.steps.length?'save':'verify');
  if(step==='image'&&!run.approvedImage){run.status='waiting';event(run,'image','waiting');return this.commit(run,revision);}
  if(step!=='save'&&step!=='verify'&&run.attempts>=10)throw new AIError('QUOTA','A feladatsor elérte a 10 AI-kéréses próbakorlátot.',429);
  const next=structuredClone(run);next.status='running';event(next,step,'running');
  if(step!=='save'&&step!=='verify'){next.attempts++;next.usage.push(emptyUsage(step,this.deps.config));}
  // Compare-and-swap plus an owner-wide live lease prevents concurrent billable calls.
  const claimed=await this.deps.db.prepare(`UPDATE pilot_runs SET state_json=?,status='running',revision=revision+1,lease_until=?,updated_at=?
   WHERE id=? AND user_id=? AND revision=? AND status='ready'
   AND NOT EXISTS(SELECT 1 FROM pilot_runs WHERE user_id=? AND id<>? AND lease_until>?)`).bind(JSON.stringify(next),new Date(Date.now()+180000).toISOString(),now(),id,this.owner,revision,this.owner,id,now()).run();
  if(!claimed.meta.changes)throw new AIError('BUSY','Már fut egy lépés. Várd meg, amíg elkészül.',409);
  next.revision=revision+1;
  try{
   if(step==='save'){
    if(!next.result?.documents.length)throw new AIError('OUTPUT','Még nincs menthető kész szöveg.',422);
    const source=next.research?'\n\n## Felhasznált források\n'+next.research.sources.map(s=>'- ['+s.title+']('+s.url+')').join('\n'):'';
    const file=await this.putFile(id,next.revision,'anyag.md',new TextEncoder().encode(workMarkdown(next.result)+source),'text/markdown;charset=utf-8');
    next.files=[...next.files.filter(f=>f.name!==file.name),file];
   }else if(step==='verify'){
    if(!next.files.some(f=>f.name==='anyag.md'))throw new AIError('VERIFY','A kész anyag hiányzik a mentésből.',503);
    if(next.plan.steps.includes('image')&&!next.files.some(f=>f.name==='kep.jpg'))throw new AIError('VERIFY','A kép hiányzik a mentésből.',503);
    // New storage reads, not a success flag from a preceding write.
    for(const f of next.files){const object=await this.deps.bucket.get(f.path);if(!object)throw new AIError('VERIFY','Az egyik mentett fájl nem olvasható vissza.',503);const bytes=new Uint8Array(await object.arrayBuffer());if(bytes.length!==f.bytes||await sha256(bytes)!==f.sha256)throw new AIError('VERIFY','A visszaolvasott fájl eltér az elkészült anyagtól.',503);}
    const persisted=await this.row(id);if(!persisted||persisted.revision!==next.revision||persisted.status!=='running')throw new AIError('CONFLICT','A mentés ellenőrzése közben a munka állapota változott.',409);
    const prior=this.decode(persisted);if(JSON.stringify(prior.result)!==JSON.stringify(next.result)||JSON.stringify(prior.files)!==JSON.stringify(next.files))throw new AIError('VERIFY','A mentett munkabejegyzés eltér az eredménytől.',503);
    next.verifiedAt=now();
   }else{
    const made=await executePilotStep(step,next,this.deps.config,this.deps.fetcher);
    next.usage[next.usage.length-1]=made.usage;next.research=made.research;next.result=made.result;
    if(next.result?.image){const image=next.result.image;const f=await this.putFile(id,next.revision,'kep.jpg',Uint8Array.from(atob(image.data),c=>c.charCodeAt(0)),image.mime);const {image:binary,...plain}=next.result;next.result=plain;next.files=[...next.files.filter(x=>x.name!==f.name),f];}
    if(next.result&&step!=='search'&&step!=='image')next.outputs.push({step,result:next.result});
   }
   event(next,step,'completed');next.cursor++;
   next.status=next.verifiedAt?'succeeded':next.result?.questions.length&&!next.result.documents.length?'clarification':'ready';
   return await this.commit(next,next.revision);
  }catch(error){
   const e=error instanceof AIError?error:new AIError('SERVER','A lépés nem fejeződött be. A korábbi mentett eredmény megmaradt.',503);
   // Never commit partially mutated step state: retries start at the last complete checkpoint.
   const failed=structuredClone(run);failed.revision=next.revision;failed.attempts=next.attempts;failed.usage=next.usage;failed.events=next.events.filter(e=>e.status!=='completed'||e.step!==step);failed.status='failed';failed.error=e.message;event(failed,step,'failed');
   try{return await this.commit(failed,next.revision);}catch(conflict){if(conflict instanceof AIError&&conflict.code==='CONFLICT')return this.read(id);throw conflict;}
  }
 }
 private async putFile(id:string,revision:number,name:string,bytes:Uint8Array,mime:string):Promise<PilotFile>{
  const before=await this.row(id);if(!before||before.revision!==revision||before.status!=='running'||!before.lease_until||before.lease_until<now())throw new AIError('CONFLICT','A mentést leállítottuk, mert a munka állapota megváltozott.',409);
  const hash=await sha256(bytes),path='pilot/'+await sha256(this.owner)+'/'+id+'/'+revision+'/'+hash+'-'+name;
  await this.deps.bucket.put(path,bytes,{httpMetadata:{contentType:mime}});
  const after=await this.row(id);if(!after||after.revision!==revision||after.status!=='running'){await this.deps.bucket.delete(path);throw new AIError('CONFLICT','A mentést közben leállították.',409);}
  return {name,path,sha256:hash,bytes:bytes.length,mime};
 }
 async file(id:string,name:string){const run=await this.read(id);const meta=run.files.find(f=>f.name===name);if(!meta)throw new AIError('NOT_FOUND','Ez a fájl nem található.',404);const value=await this.deps.bucket.get(meta.path);if(!value)throw new AIError('NOT_FOUND','A mentett fájl nem érhető el.',404);return {meta,value};}
 async remove(id:string,revision:number){
  const run=await this.read(id),row=await this.row(id);if(run.revision!==revision||run.status==='running'||row?.lease_until&&row.lease_until>now())throw new AIError('CONFLICT','A folyamatban lévő kérés még nem zárult le. Leállítás után várj legfeljebb három percet a törléssel.',409);
  run.status='cancelled';await this.commit(run,revision);
  const prefix='pilot/'+await sha256(this.owner)+'/'+id+'/';let cursor:string|undefined;
  do{const listed=await this.deps.bucket.list({prefix,cursor});for(const f of listed.objects)await this.deps.bucket.delete(f.key);cursor=listed.truncated?listed.cursor:undefined;}while(cursor);
  const removed=await this.deps.db.prepare('DELETE FROM pilot_runs WHERE id=? AND user_id=? AND revision=?').bind(id,this.owner,run.revision).run();if(!removed.meta.changes)throw new AIError('CONFLICT','A munka közben megváltozott.',409);
 }
}
