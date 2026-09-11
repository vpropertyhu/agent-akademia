'use client';

import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ArrowUpRight,Check,Clipboard,Download,FileText,History,Monitor,ShieldCheck,X} from 'lucide-react';
import {Textarea} from '../components/ui/textarea';
import {definition,flatten,uid,type Draft} from '../lib/module-builder';
import {appendTrial,delivery,destinations,emptyRatings,exampleTask,instruction,planKey,readTrials,reviewQuestions,verdict,type Destination,type Rating,type TrialRecord} from '../lib/agent-handoff';
import './agent-handoff.css';

const logKey='agent-akademia-trials-v1';
const statusText={pending:'Még nem néztem át teljesen',pass:'Szerinted megfelelt',fail:'Javítás kell'};
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
 const trial=`FELADATOM\n${task.trim()}\n\nMI FONTOS NEKEM?\n${criteria.trim()}`;
 const messageForAI=`${rules}\n\n${trial}`;
 const currentRecords=records.filter(r=>r.plan===key&&r.destination===destination&&r.task===task&&r.criteria===criteria);
 const latest=currentRecords[0],older=records.length-currentRecords.length;
 const assessment=verdict(ratings),complete=reviewQuestions.filter(q=>ratings[q.id]!=='unchecked').length;

 useEffect(()=>{try{const raw=localStorage.getItem(logKey);if(raw)setRecords(readTrials(raw));}catch{setLoadError(true);setMessage('A korábbi próbáidat nem sikerült megnyitni. A mostani eredményt le tudod tölteni; a régieket megőrizzük.');}setLoaded(true);},[]);
 useEffect(()=>{heading.current?.focus({preventScroll:true});},[stage]);
 function go(next:number){setStage(next);window.requestAnimationFrame(()=>heading.current?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));}
 function resetReview(){setResult('');setRatings(emptyRatings());setLastSaved('');}
 async function copy(value:string,label:string){
  try{await navigator.clipboard.writeText(value);setMessage(`${label} a vágólapon. Nyisd meg a választott AI-t, illeszd be, majd küldd el.`);}catch{setMessage('A böngésző nem engedte a másolást. Nyisd le a szöveg előnézetét, jelöld ki és másold ki, vagy töltsd le az útmutatót.');textRef.current?.focus();textRef.current?.select();}
 }
 function guide(){
  downloadText('agent-akademia-hasznalati-utmutato.txt',`${draft.title} – kipróbálás a(z) ${target.name} segítségével\n\n1. Nézd át az alábbi feladatot és azt, hogy mi fontos neked.\n2. A TELJES BEMÁSOLANDÓ SZÖVEG részt másold ki.\n3. Nyisd meg: ${target.url} – indíts új beszélgetést, illeszd be a szöveget, és küldd el. Ha saját fájl kell, külön csatold.\n4. Ha választ kaptál, gyere vissza az Agent Akadémia oldalára. A Megnézem, jó lett-e résznél ellenőrizheted és elmentheted a tapasztalatodat.\n\nA letöltés nem telepít programot. A másik AI-ban te indítod el a feladatot.\n\nTELJES BEMÁSOLANDÓ SZÖVEG\n${messageForAI}\n\nEZEKET NÉZD MEG AZ EREDMÉNYEN\n${reviewQuestions.map(q=>`- ${q.label} ${q.hint}`).join('\n')}\n\nA másik AI beszélgetését innen nem látjuk. A választ te hozod vissza, és te ellenőrzöd.\nIsmételt használathoz a segítő leírását egy projektben is elmentheted: ${guideLinks[destination as 'chatgpt'|'claude']}\n`);
  setMessage('Az útmutató letöltését elindítottuk. A böngésződ a szokásos helyre menti, vagy mappát kérdez.');
 }
 function makeRecord():TrialRecord {return {id:uid(),createdAt:new Date().toISOString(),plan:key,title:draft.title,destination:destination as 'chatgpt'|'claude',task,criteria,result:result.trim(),ratings:{...ratings}};}
 function saveReview(){
  if(!result.trim()||!task.trim()||!criteria.trim()||destination==='local'||loadError||!loaded)return;
  const record=makeRecord();
  try{const next=appendTrial(records,record);localStorage.setItem(logKey,JSON.stringify(next));setRecords(next);setLastSaved(record.id);setMessage('Az ellenőrzést ezen a böngészőn elmentettük, ehhez az összeállításhoz és próbafeladathoz.');}catch{setMessage('A böngészős mentés nem sikerült. Az Eredmény letöltése gombbal elteheted az eredményt.');}
 }
 function exportReview(){const record=makeRecord();downloadText('agent-akademia-ellenorzes.txt',`${record.title}\nCél: ${target.name}\nDátum: ${record.createdAt}\nÁllapot: ${statusText[verdict(record.ratings)]}\nÉrtékelés forrása: felhasználó, nem automatikus mérés.\n\n${trial}\n\nÁLTALAD VISSZAHOZOTT EREDMÉNY VAGY MEGFIGYELÉS\n${record.result}\n\n${reviewQuestions.map(q=>`${q.label}: ${record.ratings[q.id]==='pass'?'Megfelelt':record.ratings[q.id]==='fail'?'Hibát találtam':'Nem ellenőriztem'}`).join('\n')}\n\nAZ ÉRTÉKELT ÖSSZEÁLLÍTÁS\n${key}\n`);setMessage('Az ellenőrzés letöltését elindítottuk.');}

 return <section className="ah-panel" aria-label="Az összeállítás használata">
  <div className="ah-top"><span className="mb-eyebrow">MOST PRÓBÁLD KI A SEGÍTŐDET</span><button onClick={onClose}><X size={17}/> Módosítom a feladatokat</button></div>
  <nav className="ah-steps" aria-label="Használati lépések">{['Hol próbálod ki?','Kipróbálás','Jó lett az eredmény?'].map((name,i)=><button key={name} aria-current={stage===i?'step':undefined} disabled={(i>0&&destination==='local')||(i===2&&(!task.trim()||!criteria.trim()))} onClick={()=>go(i)}><span>{i+1}</span>{name}</button>)}</nav>
  <div className="ah-body">
   <h2 ref={heading} tabIndex={-1}>{['Melyik AI-ban próbálnád ki?','Próbáld ki a saját feladatoddal.','Olyan lett, amilyet szerettél volna?'][stage]}</h2>
   {stage===0&&<>
    <p className="ah-lead">Válaszd azt, amelyiket ismered. A következő lépésben megmutatjuk, mit másolj be. Az AI-ban saját fiókoddal tudod kipróbálni.</p>
    <fieldset className="ah-destinations"><legend className="mb-sr-only">A használat helye</legend>{(Object.keys(destinations) as Destination[]).map(id=><label key={id} className={destination===id?'ah-selected':''}><input type="radio" name="agent-destination" checked={destination===id} onChange={()=>{setDestination(id);resetReview();}}/><span><strong>{destinations[id].name}</strong><small>{id==='local'?'Még nem használható':'Te másolod be a kész szöveget'}</small></span>{id==='local'?<Monitor size={21}/>:<ArrowUpRight size={21}/>}</label>)}</fieldset>
    {destination==='local'?<div className="ah-warning"><h3>A gépre telepíthető segítő még nincs kész.</h3><p>Egyelőre a ChatGPT vagy a Claude beszélgetésében próbálhatod ki. Az összeállítás letöltése még nem telepít semmit a gépedre.</p><button className="ah-primary" onClick={()=>setDestination('chatgpt')}>Beszélgetésben próbálom ki <ArrowRight size={17}/></button></div>:<>
     <div className="ah-location"><FileText size={28}/><div><strong>Hová kerül pontosan?</strong><p>A(z) <b>{target.name} új beszélgetésének üzenetmezőjébe</b>. Te másolod be és küldöd el az előkészített szöveget. Ettől még nem települ külön program a gépedre.</p></div></div>
     {dependencies.length>0&&<p className="ah-warning"><strong>Ezekhez további lehetőség kell: {dependencies.map(b=>b.name).join(', ')}.</strong> A választott AI-nak ezeket is tudnia kell. A részleteket lent találod.</p>}
     <details className="ah-capabilities" ><summary>{dependencies.length?`${dependencies.length} feladathoz az AI-nak többet is tudnia kell – részletek`:'Ezeket a feladatokat bemásolt szöveggel kérheted'}</summary><div>{capabilities.map(b=>{const d=delivery(b.id,destination);return <div className={`ah-capability ah-${d.mode}`} key={b.id}><strong>{b.name}<span>{d.label}</span></strong><p>{d.detail}</p></div>;})}</div></details>
     <p className="ah-note">A következő lépésben mindent előkészítünk a másoláshoz. Ha külön program kell egy feladathoz, azt a másolás nem állítja be.</p>
     <button className="ah-primary" onClick={()=>go(1)}>Mutasd, mit másoljak be <ArrowRight size={18}/></button>
    </>}
   </>}
   {stage===1&&destination!=='local'&&<>
    <div className="ah-instruction-step"><span className="ah-number">1</span><div><h3>Mit készítsen neked?</h3><p>{draft.request?.trim()?'Áthoztuk, amit az előbb leírtál. Itt még pontosíthatod.':'Beírtunk egy példát. Kipróbálhatod így, vagy átírhatod a saját feladatodra.'}</p>{example.attachment&&<p className="ah-warning">{example.attachment}</p>}<label className="ah-label" htmlFor="ah-task">Ezt szeretném</label><Textarea id="ah-task" value={task} maxLength={4000} onChange={e=>{setTask(e.target.value);resetReview();}} rows={4}/><label className="ah-label" htmlFor="ah-criteria">Mi fontos neked?</label><Textarea id="ah-criteria" value={criteria} maxLength={2000} onChange={e=>{setCriteria(e.target.value);resetReview();}} rows={3}/></div></div>
    <div className="ah-instruction-step"><span className="ah-number">2</span><div><h3>Másold be a(z) {target.name} beszélgetésébe.</h3><p>Előkészítettük egyben a segítőd leírását és a feladatodat. Másold ki, nyiss új beszélgetést, majd illeszd be és küldd el.</p><div className="ah-actions"><button className="ah-primary" disabled={!task.trim()||!criteria.trim()} onClick={()=>void copy(messageForAI,'A teljes szöveg')}><Clipboard size={18}/> Szöveg másolása</button><a className="ah-secondary" href={target.url} target="_blank" rel="noopener noreferrer">{target.name} megnyitása <ArrowUpRight size={17}/></a></div><details className="ah-preview"><summary>Mit másolok be? Mutasd a teljes szöveget.</summary><Textarea ref={textRef} aria-label="A teljes bemásolandó szöveg" readOnly value={messageForAI} rows={12}/></details><p className="ah-note">Ha a feladathoz saját szöveg, kép vagy felvétel kell, azt is add meg vagy csatold ugyanott.</p></div></div>
    <div className="ah-instruction-step"><span className="ah-number">3</span><div><h3>Ha elkészült, nézd meg az eredményt.</h3><p>Gyere vissza ide a válasszal. Ha kép vagy fájl készült, előbb nyisd meg, majd írd le, mit tapasztaltál.</p><button className="ah-primary" disabled={!task.trim()||!criteria.trim()} onClick={()=>go(2)}>Megnézem, jó lett-e <ArrowRight size={18}/></button></div></div>
    <details className="ah-reuse"><summary>Hogyan használom legközelebb is?</summary><p>Új feladathoz megint bemásolhatod a segítőd leírását. Ha gyakran használod, a(z) {target.name} egyik projektjében is elmentheted. A projekt olyan, mint egy közös hely az összetartozó beszélgetéseidnek.</p>{destination==='claude'?<p>Projects → + New Project → Set project instructions → illeszd be a leírást → Save instructions. Ezután a projekten belül indíts új beszélgetést.</p>:<p>Nyiss meg vagy hozz létre egy projektet. A projekt utasításai közé másold a leírást, és ott indíts új beszélgetést.</p>}<details className="ah-preview"><summary>Csak a segítő leírását mutasd, a próbafeladat nélkül</summary><Textarea aria-label="A segítő újra használható leírása" readOnly value={rules} rows={8}/></details><a href={guideLinks[destination]} target="_blank" rel="noopener noreferrer">A projekt beállításának útmutatója <ArrowUpRight size={15}/></a></details>
    <div className="ah-download"><button className="ah-secondary" onClick={guide}><Download size={17}/> Útmutató letöltése</button><p>Az útmutató a böngésződ letöltései közé kerül, vagy kiválaszthatod a mappáját. A letöltés nem telepít programot.</p></div>
   </>}
   {stage===2&&destination!=='local'&&<>
    <div className="ah-location"><ShieldCheck size={29}/><div><strong>A választ te hozod vissza, és te nézed át.</strong><p>A(z) {target.name} beszélgetését innen nem látjuk. A kész szöveget vagy fájlt nézd meg; az „elkészültem” üzenet önmagában nem elég.</p></div></div>
    <div className="ah-status-line"><span>Ezt mentetted el legutóbb erről a próbáról</span><strong>{latest?`${statusText[verdict(latest.ratings)]} · ${new Date(latest.createdAt).toLocaleString('hu-HU')}`:'Még nem mentettél eredményt'}</strong></div>
    <details className="ah-expectation" open><summary>Ezt kértük, ehhez hasonlítsd</summary><p>{task}</p><strong>Mi volt fontos?</strong><p>{criteria}</p></details>
    <label className="ah-label" htmlFor="ah-result">Másold ide az AI eredményét, vagy írd le, melyik fájlt nézted meg és mit tapasztaltál.</label><Textarea id="ah-result" value={result} maxLength={20000} onChange={e=>{setResult(e.target.value);setRatings(emptyRatings());setLastSaved('');}} placeholder="Ide a tényleges választ hozd vissza. Kép vagy fájl esetén pl.: megnyitottam a képet; a bögre kék, a háttér fehér…" rows={6}/>
    <p className="ah-note">A válasz itt, a böngésződben marad. A következő kérdéseket te válaszolod meg.</p>
    <div className="ah-checks">{reviewQuestions.map(q=><fieldset key={q.id} disabled={!result.trim()}><legend>{q.label}</legend><p>{q.hint}</p><div>{([{value:'unchecked',label:'Még nem ellenőriztem'},{value:'pass',label:'Igen, rendben van'},{value:'fail',label:'Hibát találtam'}] as {value:Rating;label:string}[]).map(option=><label key={option.value}><input type="radio" name={`ah-${q.id}`} value={option.value} checked={ratings[q.id]===option.value} onChange={()=>{setRatings(r=>({...r,[q.id]:option.value}));setLastSaved('');}}/>{option.label}</label>)}</div></fieldset>)}</div>
    <div className={`ah-verdict ah-verdict-${assessment}`} aria-live="polite"><span>{complete} / 3 szempontot néztél meg</span><strong>{result.trim()?statusText[assessment]:'Hozd vissza az eredményt az ellenőrzéshez.'}</strong><p>{assessment==='pass'?'Ez a saját értékelésed erről az egy próbáról. Más feladatra vagy módosított összeállításra új próba szükséges.':assessment==='fail'?'Menj vissza a kipróbáláshoz, pontosítsd a feladatot, és másold be újra az AI-ba.':'Csak akkor jelöld megfelelőnek, ha a tényleges eredményt megnézted.'}</p></div>
    <div className="ah-actions"><button className="ah-primary" disabled={!result.trim()||!task.trim()||!criteria.trim()||!loaded||loadError||!!lastSaved} onClick={saveReview}>{lastSaved?<Check size={18}/>:<ShieldCheck size={18}/>} {lastSaved?'Eredmény elmentve':'Eredmény mentése'}</button><button className="ah-secondary" disabled={!result.trim()||!task.trim()||!criteria.trim()} onClick={exportReview}><Download size={17}/> Eredmény letöltése</button><button className="ah-link" onClick={()=>{resetReview();go(1);}}><ArrowLeft size={16}/> Új próba előkészítése</button></div>
    <details className="ah-trial-history"><summary><History size={17}/> Korábbi próbáim ({records.length})</summary><p>Az utolsó 20 mentett ellenőrzés ezen a böngészőn. Mindegyik a saját tervéhez, céljához és próbafeladatához tartozik. Más böngészőben nem jelenik meg automatikusan.</p>{older>0&&<p>{older} bejegyzés másik összeállításhoz, célhoz vagy feladathoz tartozik; a mostani tervet nem igazolja.</p>}{!records.length&&<p>Még nincs elmentett ellenőrzés.</p>}{records.map(r=><details key={r.id} className="ah-history-item"><summary><span>{new Date(r.createdAt).toLocaleString('hu-HU')} · {destinations[r.destination].name}</span><strong>{r.title} · {statusText[verdict(r.ratings)]}</strong></summary><p><b>Próbafeladat:</b> {r.task}</p><p><b>Mi volt fontos:</b> {r.criteria}</p><p className="ah-record-result">{r.result}</p><ul>{reviewQuestions.map(q=><li key={q.id}>{q.label} — {r.ratings[q.id]==='pass'?'Megfelelt':r.ratings[q.id]==='fail'?'Hibát találtam':'Nem ellenőriztem'}</li>)}</ul></details>)}</details>
    <details className="ah-reuse"><summary>Látjátok, mit csinál a másik AI?</summary><p>Most még nem. Ehhez össze kell kapcsolnunk az oldalt a feladatot elvégző programmal. Addig te másolod vissza a választ, és a Korábbi próbáim résznél őrizzük meg, amit ellenőriztél.</p></details>
   </>}
  </div>
  <p className="ah-feedback" role="status">{message||'A feladatot a választott AI-ban te indítod el. Az eredményt ide másolhatod vissza.'}</p>
 </section>;
}
