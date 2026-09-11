'use client';

import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,Clipboard,Download,FileText,History,Monitor,ShieldCheck,X} from 'lucide-react';
import {Textarea} from '../components/ui/textarea';
import {definition,flatten,uid,type Draft} from '../lib/module-builder';
import {appendTrial,delivery,destinations,emptyRatings,exampleTask,instruction,planKey,readTrials,reviewQuestions,verdict,type Destination,type Rating,type TrialRecord} from '../lib/agent-handoff';
import './agent-handoff.css';

const logKey='agent-akademia-trials-v1';
const statusText={pending:'Még nincs teljesen ellenőrizve',pass:'Szerinted megfelelt',fail:'Javítás kell'};
const guideLinks={chatgpt:'https://learn.chatgpt.com/docs/projects',claude:'https://support.claude.com/en/articles/9519177-how-can-i-create-and-manage-projects'};

function downloadText(name:string,text:string,type='text/plain;charset=utf-8'){
 const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();window.setTimeout(()=>URL.revokeObjectURL(url),5000);
}

export default function AgentHandoff({draft,onClose}:{draft:Draft;onClose:()=>void}){
 const [stage,setStage]=useState(0),[destination,setDestination]=useState<Destination>('chatgpt');
 const example=exampleTask(draft),[task,setTask]=useState(example.task),[criteria,setCriteria]=useState(example.criteria);
 const [result,setResult]=useState(''),[ratings,setRatings]=useState(emptyRatings),[records,setRecords]=useState<TrialRecord[]>([]);
 const [message,setMessage]=useState(''),[loaded,setLoaded]=useState(false),[loadError,setLoadError]=useState(false),[lastSaved,setLastSaved]=useState('');
 const heading=useRef<HTMLHeadingElement>(null),textRef=useRef<HTMLTextAreaElement>(null);
 const key=planKey(draft),leaves=flatten(draft.pieces),target=destinations[destination];
 const capabilities=Array.from(new Map(leaves.map(p=>[p.block,definition(p)])).values());
 const dependencies=capabilities.filter(b=>delivery(b.id,destination).mode!=='text');
 const rules=destination==='local'?'':instruction(draft,destination);
 const trial=`PRÓBAFELADAT\n${task.trim()}\n\nELVÁRT EREDMÉNY\n${criteria.trim()}`;
 const currentRecords=records.filter(r=>r.plan===key&&r.destination===destination&&r.task===task&&r.criteria===criteria);
 const latest=currentRecords[0],older=records.length-currentRecords.length;
 const assessment=verdict(ratings),complete=reviewQuestions.filter(q=>ratings[q.id]!=='unchecked').length;

 useEffect(()=>{try{const raw=localStorage.getItem(logKey);if(raw)setRecords(readTrials(raw));}catch{setLoadError(true);setMessage('A korábbi próbanaplót nem tudtuk beolvasni. A jelenlegi ellenőrzést le tudod tölteni; a régi naplót nem írjuk felül.');}setLoaded(true);},[]);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[stage]);
 function go(next:number){setStage(next);window.requestAnimationFrame(()=>heading.current?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));}
 function resetReview(){setResult('');setRatings(emptyRatings());setLastSaved('');}
 async function copy(value:string,label:string){
  try{await navigator.clipboard.writeText(value);setMessage(`${label} a vágólapon. A célalkalmazásba te illeszted be.`);}catch{setMessage('A böngésző nem engedte a másolást. Nyisd le a szöveg előnézetét, jelöld ki és másold ki, vagy töltsd le az útmutatót.');textRef.current?.focus();textRef.current?.select();}
 }
 function guide(){
  downloadText('agent-akademia-hasznalati-utmutato.txt',`${draft.title} – használat a(z) ${target.name} felületén\n\nHOVÁ KERÜL?\nTe illeszted be a lenti utasítást egy új ${target.name}-beszélgetésbe. A letöltés nem telepít semmit, és nem kapcsol össze fiókokat.\n\n1. Nyisd meg: ${target.url}\n2. Indíts új beszélgetést, másold be és küldd el az UTASÍTÁST.\n3. Ugyanott küldd el a PRÓBAFELADATOT. A szükséges fájlokat külön csatold.\n4. Hozd vissza az eredményt az Agent Akadémia „Eredmény ellenőrzése” részébe.\n\nUTASÍTÁS\n${rules}\n\n${trial}\n\nELLENŐRZŐLISTA\n${reviewQuestions.map(q=>`- ${q.label} ${q.hint}`).join('\n')}\n\nA külső beszélgetésbe az Agent Akadémia nem lát bele. A próbanapló a felhasználó saját ellenőrzése.\nÚjrahasználathoz a projekt utasításai között is elmentheted: ${guideLinks[destination as 'chatgpt'|'claude']}\n`);
  setMessage('Az útmutató letöltését elindítottuk. A böngésződ a beállított letöltési helyre menti, vagy rákérdez a mappára.');
 }
 function makeRecord():TrialRecord {return {id:uid(),createdAt:new Date().toISOString(),plan:key,title:draft.title,destination:destination as 'chatgpt'|'claude',task,criteria,result:result.trim(),ratings:{...ratings}};}
 function saveReview(){
  if(!result.trim()||!task.trim()||!criteria.trim()||destination==='local'||loadError||!loaded)return;
  const record=makeRecord();
  try{const next=appendTrial(records,record);localStorage.setItem(logKey,JSON.stringify(next));setRecords(next);setLastSaved(record.id);setMessage('Az ellenőrzést ezen a böngészőn elmentettük, ehhez az összeállításhoz és próbafeladathoz.');}catch{setMessage('A böngészős mentés nem sikerült. Az Ellenőrzés letöltése gombbal elteheted az eredményt.');}
 }
 function exportReview(){const record=makeRecord();downloadText('agent-akademia-ellenorzes.txt',`${record.title}\nCél: ${target.name}\nDátum: ${record.createdAt}\nÁllapot: ${statusText[verdict(record.ratings)]}\nÉrtékelés forrása: felhasználó, nem automatikus mérés.\n\n${trial}\n\nÁLTALAD VISSZAHOZOTT EREDMÉNY VAGY MEGFIGYELÉS\n${record.result}\n\n${reviewQuestions.map(q=>`${q.label}: ${record.ratings[q.id]==='pass'?'Megfelelt':record.ratings[q.id]==='fail'?'Hibát találtam':'Nem ellenőriztem'}`).join('\n')}\n\nAZ ÉRTÉKELT ÖSSZEÁLLÍTÁS\n${key}\n`);setMessage('Az ellenőrzés letöltését elindítottuk.');}

 return <section className="ah-panel" aria-label="Az összeállítás használata">
  <div className="ah-top"><span className="mb-eyebrow">AZ ÖSSZEÁLLÍTÁSTÓL AZ ELLENŐRZÖTT PRÓBÁIG</span><button onClick={onClose}><X size={17}/> Vissza az építéshez</button></div>
  <nav className="ah-steps" aria-label="Használati lépések">{['Hol használod?','Átadás és próba','Eredmény ellenőrzése'].map((name,i)=><button key={name} aria-current={stage===i?'step':undefined} disabled={(i>0&&destination==='local')||(i===2&&(!task.trim()||!criteria.trim()))} onClick={()=>go(i)}><span>{i+1}</span>{name}</button>)}</nav>
  <div className="ah-body">
   <h2 ref={heading} tabIndex={-1}>{['Hol szeretnéd használni?','Másold át, és adj neki egy próbafeladatot.','Nézd meg, valóban jól dolgozott-e.'][stage]}</h2>
   {stage===0&&<>
    <p className="ah-lead">Itt a munkamenetet állítod össze. A feladatot a választott AI beszélgetésében kéred majd tőle.</p>
    <fieldset className="ah-destinations"><legend className="mb-sr-only">A használat helye</legend>{(Object.keys(destinations) as Destination[]).map(id=><label key={id} className={destination===id?'ah-selected':''}><input type="radio" name="agent-destination" checked={destination===id} onChange={()=>{setDestination(id);resetReview();}}/><span><strong>{destinations[id].name}</strong><small>{id==='local'?'Telepítő még nincs':'Kézi átadás egy beszélgetésbe'}</small></span>{id==='local'?<Monitor size={21}/>:<ArrowUpRight size={21}/>}</label>)}</fieldset>
    {destination==='local'?<div className="ah-warning"><h3>A saját gépes futtató még nincs elkészítve.</h3><p>Ehhez telepítő, AI-kapcsolat, mappaengedélyek és futási napló szükséges. Az építési tervet elmentheted, de attól még nem indul el agent a gépeden.</p><button className="ah-primary" onClick={()=>setDestination('chatgpt')}>Beszélgetésben próbálom ki <ArrowRight size={17}/></button></div>:<>
     <div className="ah-location"><FileText size={28}/><div><strong>Hová kerül pontosan?</strong><p>A(z) <b>{target.name} új beszélgetésének üzenetmezőjébe</b>. Te másolod be és küldöd el az utasítást. A modulok nem települnek automatikusan a fiókodba vagy a gépedre.</p></div></div>
     <details className="ah-capabilities" open={dependencies.length>0}><summary>{dependencies.length?`${dependencies.length} képességhez további eszköz vagy bekötés kell`:'A kiválasztott képességek szöveges utasításként átadhatók'}</summary><div>{capabilities.map(b=>{const d=delivery(b.id,destination);return <div className={`ah-capability ah-${d.mode}`} key={b.id}><strong>{b.name}<span>{d.label}</span></strong><p>{d.detail}</p></div>;})}</div></details>
     <p className="ah-note">A következő lépésben pontosan látod az átadandó szöveget. A hiányzó kapcsolatokat a másolás nem kapcsolja be.</p>
     <button className="ah-primary" onClick={()=>go(1)}>Mutasd az átadás menetét <ArrowRight size={18}/></button>
    </>}
   </>}
   {stage===1&&destination!=='local'&&<>
    <div className="ah-instruction-step"><span className="ah-number">1</span><div><h3>Az utasítást a(z) {target.name} új beszélgetésébe tedd.</h3><p>Másold ki, nyisd meg az AI-t, indíts új beszélgetést, majd illeszd be az üzenetmezőbe és küldd el.</p><div className="ah-actions"><button className="ah-primary" onClick={()=>void copy(rules,'Az utasítás')}><Clipboard size={18}/> Utasítás másolása</button><a className="ah-secondary" href={target.url} target="_blank" rel="noopener noreferrer">{target.name} megnyitása <ArrowUpRight size={17}/></a></div><details className="ah-preview"><summary>Ez kerül a másik AI-ba – teljes utasítás</summary><Textarea ref={textRef} aria-label="Az átadandó teljes utasítás" readOnly value={rules} rows={12}/></details></div></div>
    <div className="ah-instruction-step"><span className="ah-number">2</span><div><h3>Ugyanabban a beszélgetésben indíts egy próbát.</h3><p>Előkészítettünk egy próbafeladatot. Átírhatod arra, amire használni szeretnéd; új tartalomhoz elég megmondanod, mi készüljön.</p>{example.attachment&&<p className="ah-warning">{example.attachment}</p>}<label className="ah-label" htmlFor="ah-task">Ezt végezze el</label><Textarea id="ah-task" value={task} maxLength={4000} onChange={e=>{setTask(e.target.value);resetReview();}} rows={4}/><label className="ah-label" htmlFor="ah-criteria">Akkor jó az eredmény, ha…</label><Textarea id="ah-criteria" value={criteria} maxLength={2000} onChange={e=>{setCriteria(e.target.value);resetReview();}} rows={3}/><button className="ah-secondary" disabled={!task.trim()||!criteria.trim()} onClick={()=>void copy(trial,'A próbafeladat')}><Clipboard size={17}/> Próbafeladat másolása</button><details className="ah-preview"><summary>Másolható próbafeladat és elvárt eredmény</summary><Textarea aria-label="Teljes próbafeladat" readOnly value={trial} rows={7}/></details></div></div>
    <div className="ah-instruction-step"><span className="ah-number">3</span><div><h3>Ha választ kaptál, gyere vissza ide.</h3><p>Másold vissza az eredményt a következő lépésben. Kép vagy fájl esetén nyisd meg az AI-ban, és itt írd le, mit ellenőriztél.</p><button className="ah-primary" disabled={!task.trim()||!criteria.trim()} onClick={()=>go(2)}>Tovább az eredmény ellenőrzéséhez <ArrowRight size={18}/></button></div></div>
    <details className="ah-reuse"><summary>Hogyan használom legközelebb is?</summary><p>Az utasítást bemásolhatod egy új beszélgetésbe, vagy elmentheted egy {target.name}-projekt utasításai közé. A projektben indított új beszélgetések ezeket használják. Ez továbbra is kézzel indított használat.</p>{destination==='claude'?<p>Projects → + New Project → Set project instructions → beillesztés → Save instructions → új beszélgetés a projektben.</p>:<p>Nyiss meg vagy hozz létre egy projektet, add hozzá az utasítást a projekt utasításaihoz, majd azon belül indíts új beszélgetést.</p>}<a href={guideLinks[destination]} target="_blank" rel="noopener noreferrer">Hivatalos útmutató <ArrowUpRight size={15}/></a></details>
    <div className="ah-download"><button className="ah-secondary" onClick={guide}><Download size={17}/> Használati útmutató letöltése (.txt)</button><p>A böngésződ a beállított letöltési helyre menti, vagy mappát kérdez. A szöveges útmutató nem telepítő.</p></div>
   </>}
   {stage===2&&destination!=='local'&&<>
    <div className="ah-location"><ShieldCheck size={29}/><div><strong>Te ellenőrzöd a visszahozott eredményt.</strong><p>A(z) {target.name} beszélgetését innen nem látjuk. Az AI saját „elkészültem” üzenete és lépésnaplója önmagában nem bizonyíték.</p></div></div>
    <div className="ah-status-line"><span>Legutóbb mentett ellenőrzés ehhez a próbához</span><strong>{latest?`${statusText[verdict(latest.ratings)]} · ${new Date(latest.createdAt).toLocaleString('hu-HU')}`:'Még nincs rögzített ellenőrzés'}</strong></div>
    <details className="ah-expectation" open><summary>Ezt kértük, ehhez hasonlítsd</summary><p>{task}</p><strong>Elvárt eredmény</strong><p>{criteria}</p></details>
    <label className="ah-label" htmlFor="ah-result">Másold ide az AI eredményét, vagy írd le, melyik fájlt nézted meg és mit tapasztaltál.</label><Textarea id="ah-result" value={result} maxLength={20000} onChange={e=>{setResult(e.target.value);setRatings(emptyRatings());setLastSaved('');}} placeholder="Ide a tényleges választ hozd vissza. Kép vagy fájl esetén pl.: megnyitottam a képet; a bögre kék, a háttér fehér…" rows={6}/>
    <p className="ah-note">A tartalom ezen a böngészőn marad. Nem küldjük el másik AI-nak automatikus pontozásra.</p>
    <div className="ah-checks">{reviewQuestions.map(q=><fieldset key={q.id} disabled={!result.trim()}><legend>{q.label}</legend><p>{q.hint}</p><div>{([{value:'unchecked',label:'Még nem ellenőriztem'},{value:'pass',label:'Igen, megnéztem'},{value:'fail',label:'Hibát találtam'}] as {value:Rating;label:string}[]).map(option=><label key={option.value}><input type="radio" name={`ah-${q.id}`} value={option.value} checked={ratings[q.id]===option.value} onChange={()=>{setRatings(r=>({...r,[q.id]:option.value}));setLastSaved('');}}/>{option.label}</label>)}</div></fieldset>)}</div>
    <div className={`ah-verdict ah-verdict-${assessment}`} aria-live="polite"><span>{complete} / 3 szempontot néztél meg</span><strong>{result.trim()?statusText[assessment]:'Hozd vissza az eredményt az ellenőrzéshez.'}</strong><p>{assessment==='pass'?'Ez a saját értékelésed erről az egy próbáról. Más feladatra vagy módosított összeállításra új próba szükséges.':assessment==='fail'?'Térj vissza az átadáshoz: pontosítsd a kérést vagy javítsd a hiányzó eszközt, majd kérj új eredményt.':'Csak akkor jelöld megfelelőnek, ha a tényleges eredményt megnézted.'}</p></div>
    <div className="ah-actions"><button className="ah-primary" disabled={!result.trim()||!task.trim()||!criteria.trim()||!loaded||loadError||!!lastSaved} onClick={saveReview}>{lastSaved?<Check size={18}/>:<ShieldCheck size={18}/>} {lastSaved?'Ellenőrzés elmentve':'Ellenőrzés mentése'}</button><button className="ah-secondary" disabled={!result.trim()||!task.trim()||!criteria.trim()} onClick={exportReview}><Download size={17}/> Ellenőrzés letöltése</button><button className="ah-link" onClick={()=>{resetReview();go(1);}}><ArrowLeft size={16}/> Új próbát kérek</button></div>
    <details className="ah-trial-history"><summary><History size={17}/> Próbanapló ({records.length})</summary><p>Az utolsó 20 mentett ellenőrzés ezen a böngészőn. Mindegyik a saját tervéhez, céljához és próbafeladatához tartozik. Más böngészőben nem jelenik meg automatikusan.</p>{older>0&&<p>{older} bejegyzés másik összeállításhoz, célhoz vagy feladathoz tartozik; a mostani tervet nem igazolja.</p>}{!records.length&&<p>Még nincs elmentett ellenőrzés.</p>}{records.map(r=><details key={r.id} className="ah-history-item"><summary><span>{new Date(r.createdAt).toLocaleString('hu-HU')} · {destinations[r.destination].name}</span><strong>{r.title} · {statusText[verdict(r.ratings)]}</strong></summary><p><b>Próbafeladat:</b> {r.task}</p><p><b>Elvárt eredmény:</b> {r.criteria}</p><p className="ah-record-result">{r.result}</p><ul>{reviewQuestions.map(q=><li key={q.id}>{q.label} — {r.ratings[q.id]==='pass'?'Megfelelt':r.ratings[q.id]==='fail'?'Hibát találtam':'Nem ellenőriztem'}</li>)}</ul></details>)}</details>
    <details className="ah-reuse"><summary>Mikor lesz automatikus a nyomon követés?</summary><p>Ha a feladatot bekötött futtatón keresztül indítjuk: az valódi futásazonosítót, lépésállapotokat, hibákat és eredményfájlokat küld vissza. Ezt a kapcsolatot még ki kell építeni. A letöltés vagy a bemásolás önmagában nem ad hozzáférést a külső beszélgetéshez.</p></details>
   </>}
  </div>
  <p className="ah-feedback" role="status">{message||'Az utasítás átadása és a próba kézzel történik. Automatikus külső kapcsolat nincs.'}</p>
 </section>;
}
