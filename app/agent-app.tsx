'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, Clock3, Download, FileText, FolderOpen, HelpCircle, LayoutGrid, LifeBuoy, Loader2, Mail, Pause, Play, Plug, ReceiptText, ShieldCheck, SlidersHorizontal, Sparkles, Table2, Workflow, AlertCircle, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import LearningGuide from './learning-guide';
import AIStudio, {AILessons} from './ai-studio';
import ToolCatalog from './tool-catalog';
import ToolWorkbench from './tool-workbench';
import ToolLibrary from './tool-library';
import AutomationBuilder from './automation-builder';
import { Pawn } from '@/components/pawn';
import { samples, money, dateLabel, type WorkspaceData, type Run, type Agent } from '@/lib/agent-data';

export type View='studio'|'catalog'|'detail'|'setup'|'agents'|'help'|'tool'|'automation'|'guide';
type User={name:string;email:string}|null;
const empty:WorkspaceData={agent:null,runs:[],requests:[]};
const views={studio:'Az első agented',guide:'Használati útmutató',tool:'Segéd munkapad',automation:'Fájlfigyelő agentek',catalog:'Feladatok',detail:'Bizonylatrendező',setup:'Személyre szabás',agents:'Mentett munkák',help:'Segítség'};
const configInitial={name:'Bizonylatrendezőm',sourceLabel:'Számlák',targetName:'Beérkező számlák',schedule:'hourly' as 'hourly'|'daily',reviewRequired:true};

export default function AgentApp({view,user,toolId}:{view:View;user:User;toolId?:string}) {
 const [data,setData]=useState<WorkspaceData>(empty);
 const [loading,setLoading]=useState(!!user),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [demoOpen,setDemoOpen]=useState(false),[sampleId,setSampleId]=useState<string>('iroda'),[demoRun,setDemoRun]=useState<Run|null>(null);
 const [editRun,setEditRun]=useState<Run|null>(null),[edit,setEdit]=useState({supplier:'',invoiceNumber:'',amount:'',currency:'HUF',dueDate:''});
 const [config,setConfig]=useState(configInitial),[step,setStep]=useState(0),[helpText,setHelpText]=useState('');
 const init=useRef(false), operation=useRef(false), loaded=useRef(false), revision=useRef<number|null>(null);
 const approved=data.runs.filter(r=>r.status==='approved'),review=data.runs.filter(r=>r.status==='review');
 const sample=samples.find(s=>s.id===sampleId)||samples[0];
 const signIn='/signin-with-chatgpt?return_to='+encodeURIComponent(view==='studio'?'/':'/'+({catalog:'eszkozok',guide:'utmutato',tool:'eszkozok/'+toolId,automation:'automatizalas',detail:'agentek/bizonylatrendezo',setup:'beallitas',agents:'sajat-agentek',help:'segitseg'}[view]||''));

 const refresh=useCallback(async()=>{
  if(!user){setLoading(false);return;}
  try {
   const res=await fetch('/api/workspace',{cache:'no-store'}),body=await res.json() as WorkspaceData & {error?:string};
   if(!res.ok)throw new Error(body.error||'Nem sikerült betölteni az adatokat.');
   setData(body);setError('');loaded.current=true;
   // Keep the revision attached to the editable fields, not unrelated result refreshes.
   if(!init.current){revision.current=body.agent?.revision??null;if(body.agent){const a=body.agent;setConfig({name:a.name,sourceLabel:a.source_label,targetName:a.target_name,schedule:a.schedule,reviewRequired:!!a.review_required});setStep(a.setup_step===0&&a.status==='ready'?3:a.setup_step);}init.current=true;}
   return true;
  }catch(e){loaded.current=false;setError(e instanceof Error?e.message:'Nem sikerült a betöltés.');return false;}
  finally{setLoading(false);}
 },[user]);
 useEffect(()=>{if(['detail','setup','agents','help'].includes(view))void refresh();else setLoading(false);},[refresh,view]);
 useEffect(()=>{if(view==='help'){const topic=new URLSearchParams(window.location.search).get('tema');if(topic)setHelpText(`Ebben kérek segítséget: ${topic}. `);}},[view]);

 const perform=useCallback(async(payload:object)=>{
  if(operation.current)return null;
  if(!loaded.current){toast.error('A munkaterületet előbb sikeresen be kell tölteni. Használd az Újrapróbálom gombot.');return null;}
  operation.current=true;setBusy(true);
  try{
   const response=await fetch('/api/workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const body=await response.json() as {ok?:boolean;run?:Run;agent?:Agent;error?:string};if(!response.ok)throw new Error(body.error||'Nem sikerült a művelet.');
   if(body.agent){
    // Each accepted config/progress/status write increments exactly once. A later
    // concurrent write may already appear in the read-back; do not adopt its revision.
    const expected=(payload as {expectedRevision:number|null}).expectedRevision;
    revision.current=(expected??0)+1;
    setData(previous=>({...previous,agent:body.agent!}));
   }
   const reloaded=await refresh();
   if(!reloaded)toast.warning('A műveletet elmentettük, de a friss adatok nem tölthetők be. Próbáld újra a betöltést.');
   return body;
  }catch(e){toast.error(e instanceof Error?e.message:'Nem sikerült a művelet.');return null;}
  finally{operation.current=false;setBusy(false);}
 },[refresh]);

 function openDemo(){setDemoRun(null);setDemoOpen(true);}
 async function runSample(){
  if(!user){setDemoRun({id:'guest',sample_id:sample.id,supplier:sample.supplier,invoice_number:sample.invoice,amount:sample.amount,currency:sample.currency,due_date:sample.due,status:'review',created_at:'',updated_at:''});return;}
  const result=await perform({action:'run_sample',sampleId:sample.id});
  if(result?.run){setDemoRun(result.run);toast.success(result.run.status==='approved'?'Ezt a mintát már jóváhagytad.':'A mintatétel ellenőrzésre vár.');}
 }
 function beginEdit(run:Run){setEditRun(run);setEdit({supplier:run.supplier,invoiceNumber:run.invoice_number,amount:String(run.amount),currency:run.currency,dueDate:run.due_date||''});}
 async function approve(e:FormEvent){e.preventDefault();if(!editRun)return;const result=await perform({action:'approve',id:editRun.id,...edit,amount:Number(edit.amount)});if(result){setEditRun(null);setDemoRun(null);setDemoOpen(false);toast.success('A mintaeredményt jóváhagytad. Már exportálható.');}}
 async function saveConfig(next:boolean){const nextStep=next?Math.min(step+1,2):Math.min(step,2);const result=await perform({action:'save_config',...config,setupStep:nextStep,expectedRevision:revision.current});if(result){toast.success('A beállításokat elmentettük.');if(next)setStep(nextStep);}return result;}
 async function saveProgress(nextStep:number){if(await perform({action:'save_progress',setupStep:nextStep,expectedRevision:revision.current}))setStep(nextStep);}
 async function changeStatus(status:'ready'|'paused'){if(await perform({action:'set_status',status,expectedRevision:revision.current}))toast.success(status==='ready'?'Előkészítve. A Gmail-kapcsolat még szükséges.':'Az előkészítést szüneteltetted.');}
 function exportConfig(){if(!data.agent)return;const a=data.agent;const blob=new Blob([JSON.stringify({format:'agent-akademia-config',version:1,agent:'bizonylatrendezo',name:a.name,source:{type:'gmail_label',label:a.source_label},target:{type:'google_sheets',name:a.target_name},schedule:a.schedule,reviewRequired:!!a.review_required,connectionStatus:'not_connected',notice:'Beállítási fájl. Nem tartalmaz hitelesítő adatokat, és önmagában nem futtatható agent.'},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const aLink=document.createElement('a');aLink.href=url;aLink.download='bizonylatrendezo-beallitasok.json';aLink.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

 useEffect(()=>{
  type Context={registerTool:(tool:{name:string;title:string;description:string;inputSchema:object;annotations:object;execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>void|Promise<void>};
  const context=(document as unknown as {modelContext?:Context}).modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try {void Promise.resolve(context.registerTool({name:'open_invoice_sample',title:'Mintaszámla megnyitása',description:'Megnyitja a Bizonylatrendező mintapróbáját. Nem ment és nem indít valódi feldolgozást.',inputSchema:{type:'object',properties:{sampleId:{type:'string',enum:['iroda','hianyos','euro']}},required:['sampleId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:unknown)=>{
   if(!input||typeof input!=='object'||!('sampleId' in input)||Object.keys(input).length!==1||!samples.some(s=>s.id===(input as {sampleId:unknown}).sampleId))throw new Error('Ismeretlen minta.');
   const id=(input as {sampleId:string}).sampleId;setSampleId(id);setDemoRun(null);setDemoOpen(true);
   await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
   return {sampleId:id,opened:true,saved:false};
  }},{signal:lifecycle.signal})).catch(()=>{});}catch{/* Unsupported registry: regular UI remains available. */}
  return()=>lifecycle.abort();
 },[]);

 function InvoicePreview({compact=false}:{compact?:boolean}){return <div className={'invoice-paper '+(compact?'compact':'')}>
  <div className="invoice-top"><span className="invoice-word">SZÁMLA</span><span className="small-label">MINTA</span></div>
  <p className="invoice-supplier">{sample.supplier}</p><p className="muted text-sm">{sample.invoice}</p>
  <div className="invoice-divider"/>
  <dl className="invoice-lines"><div><dt>Nettó összeg</dt><dd>{sample.net}</dd></div><div><dt>Áfa</dt><dd>{sample.tax}</dd></div><div className="invoice-total"><dt>Fizetendő</dt><dd>{money(sample.amount,sample.currency)}</dd></div><div><dt>Fizetési határidő</dt><dd className={!sample.due?'amber-text':''}>{dateLabel(sample.due)}</dd></div></dl>
  <div className="invoice-stamp"><FileText size={14}/> Szemléltető mintaadatok</div>
 </div>;}

 function RunsTable({rows}:{rows:Run[]}){return rows.length?<div className="results-table"><Table><TableHeader><TableRow><TableHead>Kiállító / számlaszám</TableHead><TableHead>Összeg</TableHead><TableHead>Határidő</TableHead><TableHead>Állapot</TableHead><TableHead><span className="sr-only">Művelet</span></TableHead></TableRow></TableHeader><TableBody>{rows.map(r=><TableRow key={r.id}><TableCell><strong>{r.supplier}</strong><span className="cell-secondary">{r.invoice_number} · Minta</span></TableCell><TableCell className="nowrap">{money(r.amount,r.currency)}</TableCell><TableCell className={!r.due_date?'amber-text':''}>{dateLabel(r.due_date)}</TableCell><TableCell><span className={'status '+(r.status==='approved'?'green':'amber')}>{r.status==='approved'?'Jóváhagyva':'Ellenőrizendő'}</span></TableCell><TableCell><Button variant="ghost" size="sm" onClick={()=>beginEdit(r)}>{r.status==='approved'?'Megnyitás':'Ellenőrzöm'}<ChevronRight/></Button></TableCell></TableRow>)}</TableBody></Table></div>:<div className="empty-results"><FolderOpen size={30}/><h3>Még nincs itt eredmény.</h3><p>Próbálj ki egy mintaszámlát, és itt követheted a feldolgozás lépéseit.</p><Button variant="outline" onClick={openDemo}><Play/> Mintapróba indítása</Button></div>;}

 const signInNotice=!user?<div className="callout"><LogIn/><div><strong>A saját munkaterületedhez jelentkezz be.</strong><p>A mintát bejelentkezés nélkül is megnézheted. A mentés a saját fiókodhoz tartozik.</p><a className="text-link" href={signIn} target="_top">Bejelentkezés ChatGPT-vel <ArrowUpRight size={15}/></a></div></div>:null;

 return <SidebarProvider style={{'--sidebar-width':'15.5rem'} as React.CSSProperties}>
  <a href="#main-content" className="skip-link">Ugrás a tartalomra</a>
  <Sidebar className="app-sidebar">
   <SidebarHeader className="brand-area"><Link href="/" className="brand"><Pawn size={38}/><span>Agent<br/><b>Akadémia</b></span></Link></SidebarHeader>
   <SidebarContent className="side-content"><span className="nav-caption">MUNKATERÜLET</span><SidebarMenu>{[{href:'/',label:'Az első agented',icon:LayoutGrid,active:['studio','catalog','detail','setup','tool'].includes(view)},{href:'/sajat-agentek',label:'Mentett munkák',icon:Workflow,active:view==='agents'},{href:'/utmutato',label:'Segítség',icon:LifeBuoy,active:['guide','help'].includes(view)}].map(item=><SidebarMenuItem key={item.href}><SidebarMenuButton asChild isActive={item.active} className="nav-item"><Link href={item.href} aria-current={item.active?'page':undefined}><item.icon/><span>{item.label}</span>{item.href==='/sajat-agentek'&&data.agent&&<span className="nav-count">1</span>}</Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu>
   <details className="sidebar-advanced" open={view==='automation'?true:undefined}><summary>További eszközök</summary><Link href="/eszkozok">Számolás és rendezés</Link><Link href="/automatizalas">Automatikus működés</Link><Link href="/agentek/bizonylatrendezo">Bizonylatrendező mintapróba</Link><a href="/letoltes/agent-akademia-csomag.zip" download>Letölthető csomag</a></details>
   </SidebarContent>
   <SidebarFooter className="account-area"><span className="avatar">{user?user.email.slice(0,1).toUpperCase():'A'}</span><div><strong>{user?'Saját munkaterület':'Üdv az Akadémián!'}</strong><span title={user?.email}>{user?.email||'Próbáld ki szabadon'}</span></div></SidebarFooter>
  </Sidebar>
  <SidebarInset className="app-inset"><header className="topbar"><div className="breadcrumb"><SidebarTrigger className="mobile-nav"/><span>Agent Akadémia</span><ChevronRight size={14}/><strong>{views[view]}</strong></div><div className="topbar-right"><Link href="/utmutato" aria-label="Segítség"><HelpCircle size={21}/></Link></div></header>
   <main id="main-content" className="workspace">
    {error&&<div className="error-callout" role="alert"><AlertCircle/><span>{error}</span><Button variant="outline" size="sm" onClick={()=>{setLoading(true);void refresh();}}>Újrapróbálom</Button></div>}
    {view==='studio'&&<AIStudio user={!!user}/>}
    {view==='guide'&&<><AILessons/><section className="ai-panel"><h2>Induljon az első saját agented.</h2><p>1. Nyisd meg a kezdőlapot, és adj egy rövid feladatot. 2. Olvasd el az anyagot, és kérj rajta javítást. 3. Töltsd le a saját gépes csomagot, és nyisd meg a KEZDD-ITT.html útmutatót.</p><p>A webes AI-hoz a működtető csatlakoztatja a szolgáltatást. A saját gépes csomaghoz Node.js 22 vagy újabb verzió és OpenAI API-hozzáférés kell. Az indítófelület végigvezet az egyszeri csatlakoztatáson. Később ugyanebben a felületben adhatod a feladatokat.</p><Button asChild><a href="/letoltes/agent-akademia-ai.zip" download>Saját gépes AI-csomag</a></Button></section><details className="simple-advanced"><summary>A korábbi számoló és rendező eszközök útmutatója</summary><LearningGuide/></details></>}
    {view==='catalog'&&<ToolCatalog/>}
    {view==='tool'&&toolId&&<ToolWorkbench key={toolId} toolId={toolId} user={!!user}/>}
    {view==='automation'&&<AutomationBuilder/>}

    {view==='detail'&&<>
     <Link href="/" className="back-link">← Kész agentek</Link><div className="page-heading"><div><div className="eyebrow">PÉNZÜGY ÉS ADMINISZTRÁCIÓ</div><h1>Bizonylatrendező</h1><p>A számla adataitól az ellenőrzött táblázatsorig.</p></div><span className="status green">Mintával kipróbálható</span></div>
     <div className="detail-grid"><div><section className="panel detail-main"><div className="section-heading"><h2>Mit végez el?</h2><ReceiptText className="teal-text" size={28}/></div><div className="contract-grid">{[['Mikor?','A kijelölt postafiók ellenőrzésekor.'],['Miből?','A számlák PDF-csatolmányaiból.'],['Mit keres?','Kiállító, számlaszám, összeg és határidő.'],['Hová kerül?','A kiválasztott Google-táblázatba.']].map(([title,desc])=><div key={title}><span className="mini-label">{title}</span><p>{desc}</p></div>)}</div><div className="callout"><Plug/><div><strong>Az automatikus működéshez még csatlakoztatás kell.</strong><p>Ebben a verzióban a mintapróba és a beállítások mentése működik. A Gmail olvasása és a Google-táblázatba írás még nincs bekötve.</p></div></div><div className="button-row"><Button onClick={openDemo}><Play/> Kipróbálom mintával</Button><Button asChild variant="outline"><Link href="/beallitas"><SlidersHorizontal/> Magamra szabom</Link></Button></div></section>
     <section className="panel detail-main"><h2>Akkor hasznos neked, ha…</h2><ul className="check-list"><li><CheckCircle2/> Rendszeresen másolsz adatokat számlákból.</li><li><CheckCircle2/> Szeretnéd egy helyen látni az összegeket és határidőket.</li><li><CheckCircle2/> A bizonytalan adatokat jóváhagynád, mielőtt továbbmennének.</li></ul><p className="muted">Az agent adatokat rendez. A mintapróba nem könyvelési ellenőrzés.</p></section></div><aside><div className="sample-label"><FileText size={16}/> Így néz ki egy mintabemenet</div><InvoicePreview/><div className="panel detail-support"><LifeBuoy size={23}/><h3>Közösen állítanád be?</h3><p>Írd le, milyen munkafolyamatban használnád.</p><Button asChild variant="outline"><Link href="/segitseg?tema=Bizonylatrendező beüzemelése">Segítséget kérek <ArrowUpRight/></Link></Button></div></aside></div>
    </>}

    {view==='setup'&&<>
     <Link href="/agentek/bizonylatrendezo" className="back-link">← Bizonylatrendező</Link><div className="page-heading"><div><div className="eyebrow">A SAJÁT AGENTED</div><h1>Állítsuk a munkádhoz.</h1><p>Néhány beállítás, egy ellenőrzött minta, és készen áll az előkészítés.</p></div></div>{signInNotice}
     <div className="setup-layout"><section className="panel setup-panel"><ol className="wizard-steps">{['Forrás','Eredmény','Próba','Előkészítés'].map((title,i)=><li key={title} className={i===step?'current':i<step?'done':''}><span>{i<step?<Check size={15}/>:i+1}</span><b>{title}</b></li>)}</ol><Progress value={(step+1)*25} className="wizard-progress"/>
      {loading?<div className="loading-form"><Skeleton className="h-12 w-full"/><Skeleton className="h-28 w-full"/></div>:<>
      {step===0&&<div className="wizard-body"><span className="mini-label">01 / FORRÁS</span><h2>Miből dolgozzon az agent?</h2><p className="muted">Nevezd el, majd add meg a figyelni kívánt Gmail-címkét.</p><div className="form-field"><Label htmlFor="agent-name">Az agent neve</Label><Input id="agent-name" maxLength={80} value={config.name} onChange={e=>setConfig({...config,name:e.target.value})}/></div><div className="connection-tile"><span className="service-icon"><Mail/></span><div><strong>Gmail</strong><p>Címkével kijelölt levelek és csatolmányok</p></div><span className="status amber">Nincs csatlakoztatva</span></div><div className="form-field"><Label htmlFor="source-label">Figyelni kívánt címke</Label><Input id="source-label" maxLength={80} value={config.sourceLabel} onChange={e=>setConfig({...config,sourceLabel:e.target.value})}/><p className="field-note">A címke nevét mentjük. A postafiókodhoz még nem férünk hozzá.</p></div></div>}
      {step===1&&<div className="wizard-body"><span className="mini-label">02 / EREDMÉNY</span><h2>Hová kerüljenek az adatok?</h2><p className="muted">Add meg a táblázat tervezett nevét és a működés szabályait.</p><div className="form-field"><Label htmlFor="target-name">A Google-táblázat neve</Label><Input id="target-name" maxLength={100} value={config.targetName} onChange={e=>setConfig({...config,targetName:e.target.value})}/><p className="field-note">A tényleges táblázat kiválasztása a Google-kapcsolat bekötésekor történik.</p></div><div className="form-field"><Label htmlFor="schedule">Milyen gyakran ellenőrizzen?</Label><Select value={config.schedule} onValueChange={(v:'hourly'|'daily')=>setConfig({...config,schedule:v})}><SelectTrigger id="schedule"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="hourly">Óránként</SelectItem><SelectItem value="daily">Naponta</SelectItem></SelectContent></Select></div><div className="checkbox-field"><Checkbox id="review" checked={config.reviewRequired} onCheckedChange={v=>setConfig({...config,reviewRequired:v===true})}/><div><Label htmlFor="review">Minden eredményt szeretnék jóváhagyni</Label><p className="field-note">Hiányos adatnál az agent mindenképpen ellenőrzést kér. A mintapróba mindig kézi jóváhagyással zárul.</p></div></div></div>}
      {step===2&&<div className="wizard-body"><span className="mini-label">03 / PRÓBA</span><h2>Nézzük meg az első eredményt.</h2><p className="muted">Tölts be egy mintát, ellenőrizd a mezőket, és hagyd jóvá a sort.</p><div className={'test-result '+(approved.length?'test-success':'')}><span>{approved.length?<CheckCircle2 size={32}/>:<ReceiptText size={32}/>}</span><h3>{approved.length?'A mintapróba kész.':'Egy számlával kezdjük.'}</h3><p>{approved.length?`${approved.length} jóváhagyott mintatétel a munkaterületeden.`:'Egy teljes, egy hiányos és egy devizás példát próbálhatsz ki.'}</p><Button onClick={openDemo} variant={approved.length?'outline':'default'}><Play/>{approved.length?'Másik mintát is kipróbálok':'Mintapróba indítása'}</Button></div><p className="field-note">A próba előre elkészített mintaadatokkal működik. Nem indít élő AI-feldolgozást vagy Google-táblázatba írást.</p></div>}
      {step===3&&<div className="wizard-body"><span className="mini-label">04 / ELŐKÉSZÍTÉS</span><h2>{data.agent?.status==='ready'?'Az agentedet előkészítettük.':'Minden beállítás egy helyen.'}</h2><p className="muted">A beállításokat és a mintapróbát megőrizzük a csatlakoztatáshoz.</p><dl className="summary-list"><div><dt>Agent</dt><dd>{config.name}</dd></div><div><dt>Gmail-címke</dt><dd>{config.sourceLabel}</dd></div><div><dt>Táblázat</dt><dd>{config.targetName}</dd></div><div><dt>Ellenőrzés</dt><dd>{config.schedule==='hourly'?'Óránként':'Naponta'}</dd></div><div><dt>Mintapróba</dt><dd>{approved.length?'Jóváhagyva':'Még szükséges'}</dd></div></dl><div className="callout"><Plug/><div><strong>A következő lépés a Google-kapcsolat.</strong><p>Automatikus feldolgozás még nem indul. A beállításaidat exportálhatod vagy segítséget kérhetsz a folytatáshoz.</p></div></div>{data.agent?.status==='ready'?<Button asChild><Link href="/sajat-agentek">Saját agentem megnyitása <ArrowRight/></Link></Button>:<Button disabled={busy||!user||!approved.length} onClick={()=>changeStatus('ready')}>{busy?<Loader2 className="spin"/>:<Check/>} Előkészítés befejezése</Button>}</div>}
      <div className="wizard-footer"><Button variant="ghost" disabled={step===0||busy} onClick={()=>void saveProgress(step-1)}>Vissza</Button>{step<3&&<Button disabled={busy||!user||!config.name.trim()||!config.sourceLabel.trim()||!config.targetName.trim()||(step===2&&!approved.length)} onClick={()=>step===2?void saveProgress(3):void saveConfig(true)}>{busy?<Loader2 className="spin"/>:null}{step===2?'Tovább az előkészítéshez':'Mentés és tovább'}<ArrowRight/></Button>}</div></>}
     </section><aside className="setup-aside"><div className="setup-agent-title"><span className="soft-icon"><ReceiptText/></span><div><strong>Bizonylatrendező</strong><span className="muted text-sm">A te munkádra hangolva</span></div></div><h3>Te maradsz az irányító.</h3><p>A mentett beállításokat később is módosíthatod. A valódi fiókkapcsolat külön engedélyezést igényel.</p><div className="aside-divider"/><LifeBuoy className="muted" size={23}/><h3>Elakadtál?</h3><p>Írd le, melyik lépésnél tartasz.</p><Link href="/segitseg?tema=Beállítás közbeni segítség" className="text-link">Segítséget kérek <ArrowRight size={16}/></Link></aside></div>
    </>}

    {view==='agents'&&<>
     <AIStudio user={!!user} library/><details className="simple-advanced"><summary>Korábbi eszközök mentései</summary><ToolLibrary user={!!user}/></details>
     <details className="simple-advanced"><summary>Korábbi bizonylatminták és beállítások</summary>
     <div className="page-heading"><div><div className="eyebrow">MINDEN EGY HELYEN</div><h1>Saját agentjeim</h1><p>Beállítások, ellenőrizendő tételek és elmentett eredmények.</p></div><Button asChild variant="outline"><Link href="/beallitas"><SlidersHorizontal/> {data.agent?'Beállítások':'Agent előkészítése'}</Link></Button></div>{signInNotice}
     {loading?<div className="stats-grid">{[1,2,3].map(i=><Skeleton key={i} className="h-32 w-full"/>)}</div>:<>
      {data.agent?<section className="panel agent-overview"><div className="agent-overview-title"><span className="soft-icon"><ReceiptText/></span><div><h2>{data.agent.name}</h2><p>Gmail → Google Táblázatok</p></div><span className={'status '+(data.agent.status==='paused'?'neutral':data.agent.status==='ready'?'green':'amber')}>{data.agent.status==='paused'?'Szüneteltetve':data.agent.status==='ready'?'Előkészítve':'Beállítás alatt'}</span></div><div className="overview-details"><span><Mail size={16}/>{data.agent.source_label}</span><span><Table2 size={16}/>{data.agent.target_name}</span><span><Clock3 size={16}/>{data.agent.schedule==='hourly'?'Óránkénti ellenőrzés tervezve':'Napi ellenőrzés tervezve'}</span></div><div className="connection-pending"><Plug size={17}/><p>A Google-kapcsolat még hiányzik. Jelenleg csak mintatételek kezelhetők.</p></div><div className="button-row"><Button onClick={openDemo}><Play/> Új mintapróba</Button><Button variant="outline" onClick={exportConfig}><Download/> Beállítások exportálása</Button>{data.agent.status!=='draft'&&<Button variant="ghost" disabled={busy} onClick={()=>changeStatus(data.agent?.status==='paused'?'ready':'paused')}>{data.agent.status==='paused'?<Play/>:<Pause/>}{data.agent.status==='paused'?'Előkészítés folytatása':'Szüneteltetés'}</Button>}</div></section>:<div className="callout"><Workflow/><div><strong>Még nincs előkészített agented.</strong><p>A mintákat már kipróbálhatod. A saját beállításokhoz készítsd elő a Bizonylatrendezőt.</p><Link href="/beallitas" className="text-link">Előkészítem <ArrowRight size={16}/></Link></div></div>}
      <div className="stats-grid"><div className="stat"><span>Jóváhagyott minták</span><div><strong>{approved.length}</strong><CheckCircle2/></div><p>Exportálható eredmény</p></div><div className="stat"><span>Ellenőrizendő</span><div><strong>{review.length}</strong><AlertCircle className="amber-text"/></div><p>A jóváhagyásodra vár</p></div><div className="stat"><span>Google-kapcsolat</span><div><strong className="stat-word">Nincs bekötve</strong><Plug/></div><p>Automatikus futás még nem indul</p></div></div>
      <section className="panel results-panel"><div className="section-heading"><div><h2>Mintaeredmények</h2><p>A tételek a saját munkaterületedhez tartoznak.</p></div><Button asChild variant="outline" disabled={!approved.length}><a href={approved.length?'/api/workspace?export=csv':undefined} aria-disabled={!approved.length} onClick={e=>{if(!approved.length)e.preventDefault();}}><Download/> CSV-export</a></Button></div><Tabs defaultValue="all"><TabsList className="result-tabs"><TabsTrigger value="all">Összes ({data.runs.length})</TabsTrigger><TabsTrigger value="review">Ellenőrizendő ({review.length})</TabsTrigger><TabsTrigger value="approved">Jóváhagyott ({approved.length})</TabsTrigger></TabsList><TabsContent value="all"><RunsTable rows={data.runs}/></TabsContent><TabsContent value="review"><RunsTable rows={review}/></TabsContent><TabsContent value="approved"><RunsTable rows={approved}/></TabsContent></Tabs></section>
     </>}
     </details>
    </>}

    {view==='help'&&<>
     <div className="callout"><FileText/><div><strong>Először használod a műhelyt?</strong><p>Az útmutató mintafeladattal vezet végig a használaton, a mentésen és az automatizáláson.</p><Link href="/utmutato" className="text-link">Használati útmutató <ArrowRight size={16}/></Link></div></div>
     <div className="page-heading"><div><div className="eyebrow">ITT SEGÍTÜNK</div><h1>Együtt is beállíthatjuk.</h1><p>Válaszok a kezdéshez, és hely a saját kérdésednek.</p></div></div>
     <div className="help-grid"><section className="panel help-panel"><h2>Gyakori kérdések</h2><Accordion type="single" collapsible>{[
      ['Mi használható most?','20 segéd saját adatokkal számol, rendez vagy szövegsablont tölt ki. A saját változatok és az eredmények bejelentkezve menthetők. A letölthető csomag 8 fájlfigyelő agentet is tartalmaz: ezek a saját gépeden, futó Node.js folyamatban dolgoznak. A weboldal nem végez háttérfuttatást. A Bizonylatrendező továbbra is mintapróba; A kezdőlapon külön, valódi modellhívással működő Tartalomkészítő is található; a generálásához a működtetőnek AI-hozzáférést kell csatlakoztatnia. A Gmail-kapcsolat még hiányzik.'],
      ['Kell tudnom programozni?','A mintapróbához és a beállítások megadásához nem. A felület lépésről lépésre vezet. Az automatikus működés beüzemelése a Google-kapcsolat bekötése után válik elérhetővé.'],
      ['A saját leveleimet olvassa a mintapróba?','Nem. A próba előre elkészített, szemléltető mintaadatokat tölt be. Nem fér hozzá a postafiókodhoz, és nem dolgoz fel saját feltöltött számlát.'],
      ['Mi történik, ha hiányzik egy adat?','Az eredmény ellenőrizendő állapotba kerül. A hiányzó határidőt megadhatod, majd jóváhagyhatod a tételt. A rendszer nem pótolja kitalált adattal.'],
      ['Megmaradnak a beállításaim?','Bejelentkezve a beállítások, a mintatételek és a segítségigények a saját munkaterületedhez mentődnek. Később ugyanazzal a fiókkal folytathatod.'],
      ['Mit kapok a letöltésben?','A teljes ZIP-csomagban egy böngészőben offline használható HTML, az integrálható JavaScript-feldolgozó, egy automatikus fájlfigyelő futtató és nyolc mintakonfiguráció van. A fájlfigyelőhöz Node.js 22 vagy újabb és folyamatosan futó számítógép kell. A Bizonylatrendező külön JSON-exportja továbbra is csak beállítás, nem futtatható számlafeldolgozó.'],
      ['Indul fizetés a kipróbálással?','Ebben a verzióban nincs fizetési lépés vagy automatikus díjterhelés. A későbbi szolgáltatás díja és kerete az éles beüzemelés előtt kerül meghatározásra.'],
     ].map(([q,a],i)=><AccordionItem value={String(i)} key={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{a}</AccordionContent></AccordionItem>)}</Accordion></section>
     <section className="panel help-panel"><span className="soft-icon"><LifeBuoy/></span><h2>Miben segíthetünk?</h2><p className="muted">Írd le a feladatodat és azt, hol akadtál el.</p>{signInNotice}<form onSubmit={async e=>{e.preventDefault();if(await perform({action:'help',message:helpText})){setHelpText('');toast.success('A segítségigényt elmentettük a munkaterületedre.');}}}><div className="form-field"><Label htmlFor="help-message">A kérdésed vagy a megoldandó feladat</Label><Textarea id="help-message" placeholder="Például: hetente 20 számla érkezik, és a könyvelőm táblázatába szeretném rendezni…" rows={6} minLength={15} maxLength={2000} value={helpText} onChange={e=>setHelpText(e.target.value)} required/></div><Button disabled={busy||!user||helpText.trim().length<15} type="submit">{busy?<Loader2 className="spin"/>:<Check/>} Segítségigény mentése</Button><p className="field-note">A kérést itt rögzítjük. Ebben az első verzióban még nem küldünk róla e-mailt.</p></form>{data.requests.length>0&&<div className="saved-requests"><h3>Elmentett kéréseid</h3>{data.requests.map(r=><div key={r.id}><span className="small-label">{dateLabel(r.created_at)} · Rögzítve</span><p>{r.message}</p></div>)}</div>}</section></div>
    </>}
    <footer className="workspace-footer"><span>Agent Akadémia</span><span>A te adataidból. A te szabályaid szerint.</span></footer>
   </main>
  </SidebarInset>

  <Dialog open={demoOpen} onOpenChange={setDemoOpen}><DialogContent className="demo-dialog"><DialogHeader><div className="eyebrow">BIZONYLATRENDEZŐ / MINTAPRÓBA</div><DialogTitle>Nézd meg, miből lesz az eredmény.</DialogTitle><DialogDescription>Előre elkészített mintaadatok. A próba nem fér hozzá a saját leveleidhez, és nem indít élő AI-feldolgozást.</DialogDescription></DialogHeader><div className="demo-layout"><div><div className="form-field"><Label htmlFor="sample-picker">Válassz egy mintát</Label><Select value={sampleId} onValueChange={v=>{setSampleId(v);setDemoRun(null);}}><SelectTrigger id="sample-picker"><SelectValue/></SelectTrigger><SelectContent>{samples.map(s=><SelectItem value={s.id} key={s.id}>{s.label}</SelectItem>)}</SelectContent></Select></div><InvoicePreview compact/></div><div className="demo-result"><span className="mini-label">EREDMÉNY ELŐNÉZETE</span>{demoRun?<><span className={'status '+(demoRun.status==='approved'?'green':'amber')}>{demoRun.status==='approved'?'Jóváhagyott minta':'Ellenőrizendő minta'}</span><dl className="summary-list"><div><dt>Kiállító</dt><dd>{demoRun.supplier}</dd></div><div><dt>Számlaszám</dt><dd>{demoRun.invoice_number}</dd></div><div><dt>Bruttó összeg</dt><dd>{money(demoRun.amount,demoRun.currency)}</dd></div><div><dt>Határidő</dt><dd className={!demoRun.due_date?'amber-text':''}>{dateLabel(demoRun.due_date)}</dd></div></dl>{!demoRun.due_date&&<p className="inline-warning"><AlertCircle size={17}/> A határidő hiányzik. Add meg az ellenőrzéskor.</p>}{user?<Button onClick={()=>beginEdit(demoRun)}><Check/> Ellenőrzöm a mezőket</Button>:<a className="text-link" href={signIn} target="_top">Belépek és elmentem <ArrowUpRight size={16}/></a>}<p className="field-note">A minta a munkaterületen menthető. A Google-táblázatba nem írunk.</p></>:<div className="demo-before"><span className="soft-icon"><Table2 size={26}/></span><h3>Egy rendezett sor.</h3><p>A minta betöltése után ellenőrizheted a kiállítót, az összeget és a határidőt.</p><Button onClick={runSample} disabled={busy}>{busy?<Loader2 className="spin"/>:<Play/>} Minta betöltése</Button></div>}</div></div></DialogContent></Dialog>

  <Dialog open={!!editRun} onOpenChange={open=>{if(!open)setEditRun(null);}}><DialogContent className="review-dialog"><DialogHeader><div className="eyebrow">EMBERI ELLENŐRZÉS</div><DialogTitle>Ellenőrizd a minta adatait.</DialogTitle><DialogDescription>Javítsd a mezőket, majd hagyd jóvá a tételt. A jóváhagyott eredmény CSV-ben exportálható.</DialogDescription></DialogHeader><form onSubmit={approve}><div className="form-field"><Label htmlFor="edit-supplier">Kiállító</Label><Input id="edit-supplier" required minLength={2} maxLength={120} value={edit.supplier} onChange={e=>setEdit({...edit,supplier:e.target.value})}/></div><div className="form-field"><Label htmlFor="edit-invoice">Számlaszám</Label><Input id="edit-invoice" required maxLength={80} value={edit.invoiceNumber} onChange={e=>setEdit({...edit,invoiceNumber:e.target.value})}/></div><div className="form-grid"><div className="form-field"><Label htmlFor="edit-amount">Bruttó összeg</Label><Input id="edit-amount" type="number" min="0.01" max="1000000000" step="0.01" required value={edit.amount} onChange={e=>setEdit({...edit,amount:e.target.value})}/></div><div className="form-field"><Label htmlFor="edit-currency">Pénznem</Label><Select value={edit.currency} onValueChange={v=>setEdit({...edit,currency:v})}><SelectTrigger id="edit-currency"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="HUF">HUF</SelectItem><SelectItem value="EUR">EUR</SelectItem></SelectContent></Select></div></div><div className="form-field"><Label htmlFor="edit-due">Fizetési határidő</Label><Input id="edit-due" type="date" required value={edit.dueDate} onChange={e=>setEdit({...edit,dueDate:e.target.value})}/>{!edit.dueDate&&<p className="field-note amber-text">Ezt az adatot még meg kell adnod.</p>}</div><Button type="submit" disabled={busy} className="w-full">{busy?<Loader2 className="spin"/>:<CheckCircle2/>} Jóváhagyom a mintatételt</Button></form></DialogContent></Dialog>
  <Toaster position="bottom-right" richColors closeButton/>
 </SidebarProvider>;
}
