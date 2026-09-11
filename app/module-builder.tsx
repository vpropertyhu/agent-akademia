'use client';

import {useEffect,useMemo,useRef,useState,type DragEvent} from 'react';
import {ArrowDown,ArrowUp,ArrowUpRight,AudioLines,Check,CheckCheck,ChevronDown,ChevronRight,Clock,Download,FileText,FolderOutput,GripVertical,Image as ImageIcon,Languages,Layers3,LayoutTemplate,ListChecks,Maximize2,MousePointer2,Pause,PenLine,Play,Plus,RotateCcw,ScanText,Search,Send,ShieldCheck,Sparkles,Table2,Trash2,Upload,Volume2,X,Hand,ChartNoAxesCombined,AlignLeft,BookOpen,Link2} from 'lucide-react';
import {Pawn} from '../components/pawn';
import {Textarea} from '../components/ui/textarea';
import AgentHandoff from './agent-handoff';
import {planKey} from '../lib/agent-handoff';
import {blocks,clonePieces,connection,definition,editingIndex,families,flatten,groupPieces,initialDraft,insertionConnection,issues,kinds,makePieces,parseDraft,placementIndex,recipes,repairSteps,stepLabels,suggestedBlocks,uid,type Block,type Draft,type Family,type Piece} from '../lib/module-builder';

const iconMap:Record<string,typeof Layers3>={spark:Sparkles,audio:AudioLines,file:FileText,clock:Clock,scan:ScanText,align:AlignLeft,table:Table2,pen:PenLine,list:ListChecks,languages:Languages,image:ImageIcon,volume:Volume2,shield:ShieldCheck,hand:Hand,chart:ChartNoAxesCombined,layout:LayoutTemplate,folder:FolderOutput,send:Send,box:Layers3};
function BlockIcon({block,size=22}:{block:Block;size?:number}){const Icon=iconMap[block.icon]||Layers3;return <Icon size={size} strokeWidth={1.7}/>;}
function Port({kind}:{kind:string}){return <span className={`mb-port mb-port-${kind}`} aria-hidden="true"/>;}
const storageKey='agent-akademia-builder-v1';
const motion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant' as const:'smooth' as const;

export default function ModuleBuilder(){
 const [draft,setDraft]=useState<Draft>(initialDraft),[ready,setReady]=useState(false),[saved,setSaved]=useState(false);
 const [history,setHistory]=useState<Draft[]>([]),[active,setActive]=useState('');
 const [family,setFamily]=useState<Family|'all'>('all'),[query,setQuery]=useState(''),[showAll,setShowAll]=useState(true);
 const [insertAt,setInsertAt]=useState<number|null>(null);
 const [removedName,setRemovedName]=useState('');
 const [overCanvas,setOverCanvas]=useState(false),[detailsOpen,setDetailsOpen]=useState(false);
 const [handoffOpen,setHandoffOpen]=useState(false);
 const [previousDraft,setPreviousDraft]=useState<Draft|null>(null),[dirty,setDirty]=useState(false);
 const [notice,setNotice]=useState('Kattints egy feladat melletti + jelre, vagy húzd a kártyát a nagy mezőbe.');
 const [help,setHelp]=useState(false),[recipesOpen,setRecipesOpen]=useState(false);
 const [grouping,setGrouping]=useState(false),[marked,setMarked]=useState<string[]>([]),[moduleName,setModuleName]=useState('Saját feladataim');
 const [dragged,setDragged]=useState<{block?:string;piece?:string;module?:string}|null>(null),[dropAt,setDropAt]=useState<number|null>(null);
 const [step,setStep]=useState(-1),[playing,setPlaying]=useState(false),[inspect,setInspect]=useState<'result'|'block'>('result');
 const importRef=useRef<HTMLInputElement>(null),catalogRef=useRef<HTMLElement>(null),trialRef=useRef<HTMLElement>(null),canvasRef=useRef<HTMLDivElement>(null);

 useEffect(()=>{
  for(const key of [storageKey,`${storageKey}-previous`]){
   try{const raw=localStorage.getItem(key);if(raw){const loaded=parseDraft(raw);if(loaded.pieces.length||loaded.modules.length||loaded.request?.trim()||loaded.title!==initialDraft().title){setPreviousDraft(loaded);setNotice('Üres mezővel indulunk. Az előző tervedet a Folytatom gombbal nyithatod meg.');break;}}}catch{/* Try the retained previous plan if this copy is unreadable. */}
  }
  setReady(true);
 },[]);
 useEffect(()=>{if(!ready||!dirty)return;try{localStorage.setItem(storageKey,JSON.stringify(draft));setSaved(true);}catch{setSaved(false);setNotice('A helyi mentés nem sikerült. Az Összeállítás letöltése gombbal elteheted a munkádat.');}},[draft,ready,dirty]);
 const leaves=useMemo(()=>flatten(draft.pieces),[draft.pieces]);
 const problems=useMemo(()=>issues(draft.pieces),[draft.pieces]);
 const selected=draft.pieces.find(p=>p.uid===active),selectedBlock=selected?definition(selected):undefined;
 const runningPiece=step>=0?leaves[step]:undefined,currentBlock=runningPiece?definition(runningPiece):undefined;
 const done=leaves.length>0&&step===leaves.length-1;
 const progress=leaves.length?Math.max(0,step+1)/leaves.length*100:0;
 const targetIndex=editingIndex(draft.pieces,insertAt);
 const summaryItems=Array.from(leaves.reduce((items,p)=>{const b=definition(p),existing=items.get(b.id);items.set(b.id,{block:b,count:(existing?.count||0)+1});return items;},new Map<string,{block:Block;count:number}>()).values());

 useEffect(()=>{if(!playing)return;if(step>=leaves.length-1){setPlaying(false);return;}const timer=window.setTimeout(()=>setStep(s=>s+1),1500);return()=>window.clearTimeout(timer);},[playing,step,leaves.length]);
 function beginEdit(){if(!dirty&&previousDraft){try{localStorage.setItem(`${storageKey}-previous`,JSON.stringify(previousDraft));}catch{/* The original remains recoverable in this session. */}}setDirty(true);}
 function change(next:Draft,message:string){
  try{next=parseDraft(JSON.stringify(next));}catch(error){setNotice(error instanceof Error?error.message:'A terv nem menthető.');return false;}
  beginEdit();setHistory(h=>[...h.slice(-19),draft]);setDraft(next);setPlaying(false);setStep(-1);setNotice(message);setDragged(null);setDropAt(null);setOverCanvas(false);setInsertAt(null);setGrouping(false);setMarked([]);setHandoffOpen(false);setRemovedName('');return true;
 }
 function revealCard(id:string){window.requestAnimationFrame(()=>document.getElementById(`step-${id}`)?.scrollIntoView({block:'nearest',behavior:motion()}));}
 function showCatalog(index=targetIndex){setInsertAt(index);setShowAll(true);setQuery('');setFamily('all');window.requestAnimationFrame(()=>catalogRef.current?.scrollIntoView({block:'nearest',behavior:motion()}));}
 function undo(){const previous=history.at(-1);if(!previous)return;setDraft(previous);setHistory(h=>h.slice(0,-1));setDetailsOpen(false);setPlaying(false);setStep(-1);setGrouping(false);setMarked([]);setInsertAt(null);setHandoffOpen(false);setDragged(null);setDropAt(null);setOverCanvas(false);setRemovedName('');setShowAll(true);setQuery('');setFamily('all');setActive(previous.pieces[0]?.uid||'');setNotice('Az előző módosítást visszavontuk. Az összeállítás tovább szerkeszthető.');}
 function restoreRemoved(){const title=draft.title,request=draft.request;undo();setDraft(restored=>({...restored,title,request}));}
 function removePiece(piece:Piece){
  const index=draft.pieces.findIndex(p=>p.uid===piece.uid);if(index<0)return;
  const name=definition(piece).name,pieces=draft.pieces.filter(p=>p.uid!==piece.uid);
  if(change({...draft,pieces},`${name}: kivettük. Választhatsz helyette másik elemet, vagy visszateheted.`)){
   setInsertAt(Math.min(index,pieces.length));setRemovedName(name);setShowAll(true);setQuery('');setFamily('all');setActive('');setDetailsOpen(false);
  }
 }
 function add(blockId:string,index=draft.pieces.length,module=false){
  if(draft.pieces.length>=40){setNotice('Egy tervben legfeljebb 40 lépés lehet. Több lépést egy kártyán is elmenthetsz.');return;}
  const custom=module?draft.modules.find(m=>m.id===blockId):undefined;if(module&&!custom)return;
  const piece:Piece=custom?{uid:uid(),block:custom.id,name:custom.name,children:clonePieces(custom.children)}:{uid:uid(),block:blockId};
  const additions=!draft.pieces.length&&!custom&&definition(piece).inputs.includes('brief')?[...makePieces(['request']),piece]:[piece];
  index=placementIndex(draft.pieces,piece,index);
  if(change({...draft,pieces:[...draft.pieces.slice(0,index),...additions,...draft.pieces.slice(index)]},`${definition(piece).name}: hozzáadtuk.${additions.length>1?' A kezdést is előkészítettük: írd le, mit szeretnél.':''}`)){
   setActive(piece.uid);setInspect('result');revealCard(piece.uid);
  }
 }
 function repair(index:number){
  const ids=repairSteps(draft.pieces,index);if(!ids.length)return;
  if(draft.pieces.length+ids.length>40){setNotice('A javításhoz több hely kell. Előbb egyesíts néhány lépést.');return;}
  const additions=makePieces(ids),pieces=[...draft.pieces.slice(0,index),...additions,...draft.pieces.slice(index)];
  if(issues(pieces).length>=problems.length){setNotice('Ez a javítás nem elég. Nézd meg a kapcsolat két oldalát.');return;}
  if(change({...draft,pieces},`Beillesztettük a hiányzó lépéseket: ${ids.map(id=>blocks.find(b=>b.id===id)!.name).join(' → ')}.`)){setActive(additions[0].uid);revealCard(additions[0].uid);}
 }
 function moveTo(pieces:Piece[]){change({...draft,pieces},'Az elemet áthelyeztük. Az összegzést és a kapcsolódást újra ellenőriztük.');}
 function move(index:number,direction:number){const target=index+direction;if(target<0||target>=draft.pieces.length)return;const pieces=[...draft.pieces];[pieces[index],pieces[target]]=[pieces[target],pieces[index]];moveTo(pieces);}
 function drop(event:DragEvent,index:number){event.preventDefault();event.stopPropagation();setOverCanvas(false);if(!dragged)return;
  if(dragged.piece){const old=draft.pieces.findIndex(p=>p.uid===dragged.piece);if(old<0)return;const pieces=[...draft.pieces],piece=pieces.splice(old,1)[0];pieces.splice(index>old?index-1:index,0,piece);moveTo(pieces);}
  else if(dragged.block)add(dragged.block,index);else if(dragged.module)add(dragged.module,index,true);setDragged(null);setDropAt(null);
 }
 function toggleGroup(){setGrouping(!grouping);setMarked(draft.pieces.filter((p,i)=>i>0||definition(p).inputs.length>0).map(p=>p.uid));setPlaying(false);}
 function saveModule(){try{
  if(draft.modules.length>=30)throw new Error('Legfeljebb 30 feladatsort menthetsz együtt.');
  const next=groupPieces(draft,marked,moduleName);
  if(change(next,'Elmentettük a lépéseket együtt. Az Elmentett lépések között legközelebb is megtalálod.')){
   setActive(next.pieces.find(p=>p.block===next.modules.at(-1)?.id)?.uid||'');setGrouping(false);setInspect('block');setDetailsOpen(true);
  }
 }catch(error){setNotice(error instanceof Error?error.message:'Ezeket a lépéseket most nem sikerült együtt menteni.');}}
 function loadRecipe(id:string){const recipe=recipes.find(r=>r.id===id)!;const pieces=makePieces(recipe.blocks);
  if(change({...draft,title:recipe.name,request:'',pieces},`Megnyitottuk: ${recipe.name}. A korábbi terv a Visszavonás gombbal visszahozható.`)){setActive(pieces[0].uid);setGrouping(false);setRecipesOpen(false);setDetailsOpen(false);setInspect('result');}
 }
 function startNew(){if(draft.pieces.length){setPreviousDraft(draft);try{localStorage.setItem(`${storageKey}-previous`,JSON.stringify(draft));}catch{/* Undo remains available in this session. */}}if(change({...draft,title:'Az én segítőm',request:'',pieces:[]},'Az építőmező üres. Az előző állapot visszavonással helyreállítható.')){setGrouping(false);setRecipesOpen(false);setActive('');setDetailsOpen(false);}}
 function preview(){if(!draft.pieces.length||problems.length)return;if(playing){setPlaying(false);return;}setInspect('result');setDetailsOpen(true);if(done||step<0)setStep(0);setPlaying(true);setNotice('Előre megírt példa halad végig a lépéseken. Ez a bemutató nem használ AI-t.');}
 function revealTrial(){preview();window.requestAnimationFrame(()=>trialRef.current?.scrollIntoView({block:'nearest',behavior:motion()}));}
 function download(){const blob=new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='agent-akademia-epitesi-terv.json';anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),5000);setNotice('A böngésződ a beállított letöltési helyre menti a tervet, vagy mappát kérdez. A letöltött összeállítást később itt nyithatod meg. Nem telepít programot az AI-ba.');}
 function openHandoff(){setHandoffOpen(true);setDetailsOpen(false);setPlaying(false);window.requestAnimationFrame(()=>document.getElementById('agent-handoff')?.scrollIntoView({block:'start',behavior:motion()}));}
 async function importFile(file:File|undefined){if(!file)return;try{if(file.size>500_000)throw new Error('Legfeljebb 500 kB-os tervet válassz.');const next=parseDraft(await file.text());if(change(next,'A tervet betöltöttük.')){setActive(next.pieces[0]?.uid||'');setGrouping(false);setDetailsOpen(false);}}catch(error){setNotice(error instanceof Error?error.message:'A terv nem olvasható.');}if(importRef.current)importRef.current.value='';}
 const available=suggestedBlocks(draft.pieces,targetIndex);
 const catalogueOrder=['request','write','summarize','tasks','translate','image','audio','file'];
 const catalogue=[...blocks].sort((a,b)=>{const rank=(id:string)=>{const index=catalogueOrder.indexOf(id);return index<0?100:index;};return rank(a.id)-rank(b.id);});
 const palette=(showAll?catalogue:available).filter(b=>(family==='all'||b.family===family)&&`${b.name} ${b.description}`.toLocaleLowerCase('hu').includes(query.toLocaleLowerCase('hu')));
 const customPalette=draft.modules.filter(m=>(family==='all'||family==='sajat')&&m.name.toLocaleLowerCase('hu').includes(query.toLocaleLowerCase('hu'))&&(showAll||insertionConnection(draft.pieces,targetIndex,{uid:'candidate',block:m.id,name:m.name,children:m.children}).ok));

 return <div className="module-builder" onDragEnd={()=>{setDragged(null);setDropAt(null);setOverCanvas(false);}} onKeyDown={e=>{if(e.key==='Escape'){setDragged(null);setDropAt(null);setOverCanvas(false);setGrouping(false);setRecipesOpen(false);}}}>
  <header className="mb-header">
   <a className="mb-brand" href="/" aria-label="Agent Akadémia kezdőlap"><Pawn size={35}/><span>Agent <b>Akadémia</b></span></a>
   <nav aria-label="Főmenü"><a className="mb-nav-active" href="/">Segítő összeállítása</a><a href="/alkotas">Szövegalkotó <ArrowUpRight size={14}/></a><button onClick={()=>setHelp(!help)} aria-expanded={help}><BookOpen size={16}/> Segítség</button></nav>
   <span className="mb-lab">VÁLASZTÁS · KIPRÓBÁLÁS · ELLENŐRZÉS</span>
  </header>
  <section className="mb-intro"><div><span className="mb-eyebrow">SAJÁT AI-SEGÍTŐ, LÉPÉSRŐL LÉPÉSRE</span><h1>Miben segítsen <em>neked az AI?</em></h1><p>Válassz feladatokat a listából. Megmutatjuk, hogyan próbáld ki őket a ChatGPT-ben vagy a Claude-ban.</p></div><button className="mb-start-new" onClick={startNew}><Plus size={17}/> Újrakezdem</button></section>
  {previousDraft&&!dirty&&<div className="mb-restore"><span>Ezt mentetted el legutóbb: <strong>{previousDraft.title}</strong> · {previousDraft.pieces.length} elem{previousDraft.modules.length>0?` · ${previousDraft.modules.length} elmentett feladatsor`:''}</span><button onClick={()=>{if(change(previousDraft,'Az előző tervedet visszatöltöttük a mezőbe.'))setActive('');}}><RotateCcw size={16}/> Folytatom</button></div>}
  {help&&<section className="mb-guide"><button className="mb-close" onClick={()=>setHelp(false)} aria-label="Segítség bezárása"><X size={19}/></button><h2>Válassz, próbáld ki, nézd meg az eredményt.</h2><p>Válassz például Szövegírást, majd írd le, mit szeretnél. A „Mutasd, hogyan próbáljam ki” gomb megmutatja, mit másolj a ChatGPT-be vagy a Claude-ba.</p><p>Ha választ kaptál, másold vissza ide, és nézd meg, megfelel-e. A letöltött összeállítást később itt tudod megnyitni. A „Példa megtekintése” gomb csak egy előre elkészített példát mutat.</p></section>}
  <main className="mb-workbench mb-single-field">
   <aside ref={catalogRef} className="mb-palette" aria-label="Feladat választása">
    <div className="mb-panel-heading"><div><span className="mb-eyebrow">INNEN VÁLASSZ</span><h2>Feladatok <span>{blocks.length+draft.modules.length}</span></h2></div><Layers3 size={24}/></div>
    <p className="mb-picker-context">A <strong>+</strong> jelre kattintva hozzáadod a feladatot. Be is húzhatod a nagy mezőbe.</p>
    {draft.pieces.length>0&&targetIndex<draft.pieces.length&&<p className="mb-insertion-context">Itt folytathatod: <strong>{definition(draft.pieces[targetIndex]).name} elé.</strong> A következő választásodat ide próbáljuk betenni.</p>}
    <div className="mb-picker-mode"><button aria-pressed={showAll} onClick={()=>setShowAll(true)}>Minden feladat</button><button aria-pressed={!showAll} onClick={()=>setShowAll(false)}>Ide illő feladatok</button></div>
    <label className="mb-search"><Search size={17}/><input aria-label="Feladat keresése" placeholder="Pl. írás, fordítás, kép" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery('')} aria-label="Keresés törlése"><X size={15}/></button>}</label>
    <details className="mb-field-filters"><summary>Szűrés feladattípus szerint</summary><div className="mb-family-tabs" aria-label="Képességcsoportok"><button aria-pressed={family==='all'} onClick={()=>setFamily('all')}>Mind</button>{families.map(f=><button key={f.id} aria-pressed={family===f.id} onClick={()=>setFamily(f.id)}>{f.label}</button>)}</div></details>
    <div className="mb-palette-list">
     {palette.map(b=>{return <button key={b.id} className={`mb-palette-block mb-family-${b.family}`} draggable onDragStart={e=>{e.dataTransfer.setData('text/plain',b.id);setDragged({block:b.id});}} onClick={()=>add(b.id,targetIndex)}><span className="mb-mini-icon"><BlockIcon block={b}/></span><span><strong>{b.name}</strong><small>{b.verb}</small>{b.needs&&<em>{b.needs}</em>}</span><Plus size={18}/></button>;})}
     {customPalette.map(m=>{return <button key={m.id} className="mb-palette-block mb-family-sajat" draggable onDragStart={e=>{e.dataTransfer.setData('text/plain',m.id);setDragged({module:m.id});}} onClick={()=>add(m.id,targetIndex,true)}><span className="mb-mini-icon"><Layers3 size={23}/></span><span><strong>{m.name}</strong><small>{`${flatten(m.children).length} lépés együtt`}</small></span><Plus size={18}/></button>;})}
     {!palette.length&&!customPalette.length&&<div className="mb-palette-empty"><Layers3 size={28}/><strong>{family==='sajat'?'Még nem mentettél együtt lépéseket.':'Nincs ilyen találat.'}</strong><p>Próbálj másik szót, vagy nézd meg az összes feladatot.</p><button className="mb-show-elements" onClick={()=>showCatalog()}>Összes feladat mutatása</button></div>}
    </div><p className="mb-palette-foot"><MousePointer2 size={16}/> A választás még nem indítja el az AI-t.</p>
   </aside>
   <section className="mb-stage" aria-label="A kiválasztott feladatok">
    <div className="mb-stage-toolbar"><div className="mb-project"><span className="mb-eyebrow">A SEGÍTŐD FELADATAI</span><label><input aria-label="A segítőd neve" value={draft.title} maxLength={100} onChange={e=>{beginEdit();setDraft(d=>({...d,title:e.target.value}));}}/><PenLine size={15}/></label></div><div className="mb-tools"><button onClick={undo} disabled={!history.length} aria-label="Utolsó módosítás visszavonása" title="Visszavonás"><RotateCcw size={18}/></button><button onClick={()=>setRecipesOpen(!recipesOpen)} aria-expanded={recipesOpen}><Layers3 size={17}/> Kész példák <ChevronDown size={14}/></button></div></div>
    {recipesOpen&&<div className="mb-recipes"><div className="mb-panel-heading"><span className="mb-eyebrow">VÁLASSZ EGY ELŐKÉSZÍTETT PÉLDÁT</span><button onClick={()=>setRecipesOpen(false)} aria-label="Minták bezárása"><X size={18}/></button></div>{recipes.map(r=><button key={r.id} onClick={()=>loadRecipe(r.id)}><span><strong>{r.name}</strong><small>{r.caption}</small></span><ArrowUpRight size={19}/></button>)}<button onClick={startNew}>Magam választok feladatokat <Plus size={17}/></button></div>}
    <div className="mb-field-heading"><span><span className="mb-field-number">01</span> Ide gyűjtöd a feladatokat</span><span>{draft.pieces.length} elem · {leaves.length} lépés</span></div>
    {removedName&&<div className="mb-removal-recovery" role="status"><div><strong>{removedName}: kivetted.</strong><p>Választhatsz helyette másik feladatot, vagy visszateheted.</p></div><div><button onClick={restoreRemoved}><RotateCcw size={17}/> Visszateszem</button><button onClick={()=>showCatalog()}><Plus size={17}/> Másik feladatot választok</button></div></div>}
    {grouping&&<div className="mb-group-form"><h2>Elmentem ezeket a lépéseket együtt</h2><p>Adj nevet a kiválasztott lépéseknek. Legközelebb egyetlen kártyával hozzáadhatod mindet. A kártyákra kattintva választod ki, mit mentsünk együtt.</p><label htmlFor="module-name">Milyen néven mentsem?</label><input id="module-name" value={moduleName} onChange={e=>setModuleName(e.target.value)} maxLength={60}/><div><button onClick={saveModule} disabled={marked.length<2||!moduleName.trim()}><Layers3 size={17}/> Mentem együtt ({marked.length})</button><button onClick={()=>setGrouping(false)}>Mégsem</button></div></div>}
    <div ref={canvasRef} className={`mb-canvas mb-drop-field ${overCanvas?'mb-field-hover':''} ${grouping?'mb-grouping':''} ${!draft.pieces.length?'mb-field-empty':''}`} aria-label="Ide tedd a kiválasztott feladatokat" onDragOver={e=>{if(dragged){e.preventDefault();e.dataTransfer.dropEffect=dragged.piece?'move':'copy';setOverCanvas(true);}}} onDragLeave={e=>{if(!(e.relatedTarget instanceof Node)||!e.currentTarget.contains(e.relatedTarget))setOverCanvas(false);}} onDrop={e=>drop(e,draft.pieces.length)}>
     {overCanvas&&<div className="mb-drop-feedback"><Plus size={20}/>Engedd el itt – bekerül az összeállításba</div>}
     {!draft.pieces.length?<div className="mb-empty-field-content"><span className="mb-empty-target"><Plus size={35}/></span><h2>Ide kerülnek a választott feladatok</h2><p>Kattints például a <strong>Szövegírás</strong> melletti + jelre.<br/>A kártyát ide is húzhatod.</p><span className="mb-empty-caption">Először kiválasztod, miben segítsen. Utána végigvezetünk a kipróbáláson.</span></div>:<>
      {(leaves.some(p=>p.block==='request')||draft.request)&&<div className="mb-request-input"><label htmlFor="builder-request">Mit szeretnél, hogy elkészítsen?</label><Textarea id="builder-request" value={draft.request||''} maxLength={4000} rows={3} placeholder="Pl. Írj egy rövid bemutatkozást a vállalkozásomnak, barátságos hangnemben." onChange={e=>{beginEdit();setSaved(false);setHandoffOpen(false);setDraft(d=>({...d,request:e.target.value}));}}/><p>Ezt a kérést visszük tovább a kipróbáláshoz. Itt még nem indul el az AI.</p></div>}
      <div className="mb-placed-elements">
       {draft.pieces.map((piece,i)=>{const b=definition(piece),isMarked=marked.includes(piece.uid),activeLeaf=runningPiece&&(piece.children?flatten(piece.children).some(p=>p.uid===runningPiece.uid):piece.uid===runningPiece.uid);return <div id={`step-${piece.uid}`} key={piece.uid} className={`mb-field-element mb-family-${b.family} ${active===piece.uid?'mb-element-selected':''} ${dragged?.piece&&dropAt===i?'mb-element-drop-target':''} ${activeLeaf?'mb-element-running':''} ${grouping&&isMarked?'mb-element-marked':''}`} onDragOver={e=>{if(dragged?.piece){e.preventDefault();e.stopPropagation();setDropAt(i);setOverCanvas(true);}}} onDrop={e=>drop(e,i)}>
        <button className="mb-element-face" draggable={!grouping} onDragStart={e=>{e.dataTransfer.setData('text/plain',piece.uid);setDragged({piece:piece.uid});}} onClick={()=>{if(grouping)setMarked(m=>m.includes(piece.uid)?m.filter(id=>id!==piece.uid):[...m,piece.uid]);else{setActive(piece.uid);setInspect('block');setDetailsOpen(true);}}} aria-pressed={grouping?isMarked:active===piece.uid}>
         <span className="mb-element-top"><span>{grouping?(isMarked?<Check size={18}/>:<span className="mb-select-box"/>):String(i+1).padStart(2,'0')}</span><GripVertical size={17}/></span><BlockIcon block={b} size={30}/><strong>{b.name}</strong><small>{piece.children?`${flatten(piece.children).length} lépés együtt`:b.verb}</small>
        </button>
        {!grouping&&<div className="mb-element-controls"><button disabled={i===0} onClick={()=>move(i,-1)} aria-label={`${b.name} előrébb`}><ArrowUp size={15}/></button><button disabled={i===draft.pieces.length-1} onClick={()=>move(i,1)} aria-label={`${b.name} hátrébb`}><ArrowDown size={15}/></button><button className="mb-element-remove" onClick={()=>removePiece(piece)} aria-label={`${b.name} eltávolítása`}><X size={17}/></button></div>}
       </div>;})}
      </div>
      <div className="mb-field-continue"><Plus size={18}/><span>További feladatokat is ide tehetsz.</span></div>
      <section className="mb-assembly-summary" aria-label="A kiválasztott feladatok összefoglalója"><div className="mb-summary-heading"><div><span className="mb-eyebrow">EZEKET VÁLASZTOTTAD</span><h2>A segítőd feladatai</h2></div><span>{draft.pieces.length} elem<br/><strong>{leaves.length} lépés</strong></span></div>
       <div className="mb-summary-chips">{summaryItems.map(({block:b,count})=><span key={b.id}><BlockIcon block={b} size={17}/>{b.name}{count>1&&<b>×{count}</b>}</span>)}</div>
       {problems.length>0?<div className="mb-summary-warning"><strong>A folytatáshoz ezen még igazítani kell:</strong>{draft.pieces.every((p,i)=>connection(draft.pieces[i-1],p).ok)&&<p>Egy együtt mentett kártyán belül nem jó a sorrend. Kattints rá, majd válaszd a „Lépések különválasztása” gombot.</p>}{draft.pieces.map((p,i)=>{const link=connection(draft.pieces[i-1],p);if(link.ok)return null;const repairIds=repairSteps(draft.pieces,i);return <div key={p.uid}><p>{definition(p).name}: {link.message}</p>{repairIds.length>0&&<button onClick={()=>repair(i)}><Plus size={15}/>{repairIds.map(id=>blocks.find(b=>b.id===id)!.name).join(' + ')} hozzáadása</button>}</div>;})}</div>:<p className="mb-summary-ok"><Link2 size={17}/>A feladatok sorrendje megfelelő. Most megmutatjuk, hogyan próbáld ki.</p>}
       <div className="mb-use-next"><div><strong>Mit csinálj ezután?</strong><p>{problems.length?'Használd a fenti javítógombot, vagy válassz másik feladatot. Utána továbbléphetsz.':'Válaszd ki, hol próbálnád ki. Előkészítjük a bemásolható szöveget.'}</p></div><button disabled={problems.length>0} onClick={openHandoff}>Mutasd, hogyan próbáljam ki <ArrowUpRight size={19}/></button></div>
      </section>
     </>}
    </div>
    <div className="mb-stage-bottom"><button className="mb-make-module" disabled={draft.pieces.length<2} onClick={toggleGroup}><Layers3 size={19}/><span>{grouping?'Kiválasztás befejezése':'Ezeket együtt is elmentem'}</span></button><button className="mb-field-preview" onClick={revealTrial} disabled={!draft.pieces.length||problems.length>0}><Play size={17}/> Példa megtekintése</button></div>
    {handoffOpen&&draft.pieces.length>0&&problems.length===0&&<div id="agent-handoff"><AgentHandoff key={planKey(draft)} draft={draft} onClose={()=>{setHandoffOpen(false);canvasRef.current?.scrollIntoView({block:'start',behavior:motion()});}}/></div>}
   </section>
   {detailsOpen&&<aside className="mb-inspector" aria-label="Bemutató és részletek"><button className="mb-detail-close" onClick={()=>{setDetailsOpen(false);setPlaying(false);}}><X size={17}/> Részletek bezárása</button>
    <div className="mb-inspector-tabs"><button aria-pressed={inspect==='result'} onClick={()=>setInspect('result')}>Példa</button><button aria-pressed={inspect==='block'} onClick={()=>setInspect('block')}>Lépés részletei</button></div>
    {inspect==='block'&&selectedBlock&&selected?<div className="mb-inspect-body"><span className="mb-eyebrow">EZT TESZI EZ A LÉPÉS</span><div className={`mb-detail-icon mb-family-${selectedBlock.family}`}><BlockIcon block={selectedBlock} size={28}/></div><h2>{selectedBlock.name}</h2><p>{selectedBlock.description}</p><div className="mb-port-detail"><div><small>Mi kell hozzá?</small><strong>{selectedBlock.inputs.length?selectedBlock.inputs.map(k=><span key={k}><Port kind={k}/>{kinds[k]}</span>):'Te indítod el'}</strong></div><ArrowDown size={18}/><div><small>Mi készül belőle?</small><strong><Port kind={selectedBlock.output}/>{kinds[selectedBlock.output]}</strong></div></div>
     {selected.children&&<section className="mb-inside"><h3>Ezeket a lépéseket mentetted együtt</h3>{selected.children.map((p,i)=><div key={p.uid}><span>{i+1}.</span><BlockIcon block={definition(p)} size={18}/><strong>{definition(p).name}</strong></div>)}<button onClick={()=>{const index=draft.pieces.findIndex(p=>p.uid===selected.uid);if(change({...draft,pieces:[...draft.pieces.slice(0,index),...clonePieces(selected.children!),...draft.pieces.slice(index+1)]},'Külön kártyákra tettük a lépéseket. A korábban elmentett közös változat is megmaradt.')){setActive('');setInspect('result');}}}><Maximize2 size={17}/> Lépések különválasztása</button></section>}
     <div className="mb-capability-note"><strong>Ezt itt még nem indítjuk el.</strong><p>{selectedBlock.needs?`${selectedBlock.needs} szükséges hozzá.`:'A bemutató előre megírt példát mutat.'}</p></div>
    </div>:<div className="mb-inspect-body"><span className="mb-eyebrow">MI TÖRTÉNNE A LÉPÉSEKBEN?</span><h2>{currentBlock?currentBlock.name:'Nézd meg egy példával.'}</h2><p>{currentBlock?'Ez a lépés ilyen eredményt készítene. Most egy előre megírt példát látsz.':'A Példa gomb megmutatja, mit csinálnának egymás után a kiválasztott feladatok.'}</p>
     <div className={`mb-result-preview ${currentBlock?'mb-result-live':''}`}><div className="mb-paper-top"><Pawn size={23}/><span>ELŐRE ELKÉSZÍTETT PÉLDA</span></div>{currentBlock?<div className="mb-sample-content"><span className="mb-document-label">{kinds[currentBlock.output]}</span><h3>{currentBlock.name}</h3><p>{currentBlock.sample}</p>{currentBlock.output==='image'&&<div className="mb-image-placeholder"><ImageIcon size={34}/><span>A létrejövő kép helye</span></div>}</div>:<><span className="mb-document-label">A SEGÍTŐD FELADATAI</span><h3>{draft.title||'A saját segítőd'}</h3><ol className="mb-result-steps">{draft.pieces.map(p=><li key={p.uid}>{p.children?definition(p).name:stepLabels[p.block]||definition(p).name}</li>)}</ol>{!draft.pieces.length&&<p className="mb-no-result">Válassz egy kezdést a műhelyben.</p>}</>}<div className="mb-paper-footer">Előre megírt példa, nem AI-eredmény.</div></div>
     <p className="mb-result-caption">{done?'A példa végigért. Valódi fájl nem készült.':step>=0?`${step+1}. mintalépés a(z) ${leaves.length}-ból`:'A bemutatóhoz nem kell saját adat.'}</p>
    </div>}
    <section ref={trialRef} className="mb-trial"><div className="mb-trial-heading"><span>{step<0?'ELŐRE ELKÉSZÍTETT PÉLDA':`${step+1} / ${leaves.length} LÉPÉS`}</span><span>{Math.round(progress)}%</span></div><div className="mb-progress"><span style={{width:`${progress}%`}}/></div><div className="mb-trial-actions"><button className="mb-play" disabled={!draft.pieces.length||problems.length>0} onClick={preview}>{playing?<Pause size={19}/>:<Play size={19}/>} {playing?'Megállítom':done?'Újra megnézem':'Példa lejátszása'}</button><button disabled={!leaves.length||problems.length>0||done} onClick={()=>{setPlaying(false);setStep(s=>Math.min(s+1,leaves.length-1));setInspect('result');}} aria-label="Következő mintalépés" title="Egy lépést mutass"><ChevronRight size={21}/></button><button disabled={step<0} onClick={()=>{setPlaying(false);setStep(-1);}} aria-label="Bemutató visszaállítása"><RotateCcw size={17}/></button></div><p><strong>Ez egy előre elkészített példa.</strong> Az AI-t a kipróbálásnál, a választott alkalmazásban indítod el.</p>{problems.length>0&&<p className="mb-trial-error">Előbb pótold a fent jelzett hiányzó lépést.</p>}</section>
   </aside>}
  </main>
  <div className="mb-notice" role="status" aria-live="polite"><CheckCheck size={16}/>{notice}</div>
  <footer className="mb-footer"><div className="mb-save-state"><span className={`mb-status-dot ${saved?'':'mb-dot-error'}`}/>{saved?'Ezen a böngészőn mentve':dirty?'Helyi mentésre vár':'Az üres mező még nem módosítja a mentéseidet'}</div><div><input ref={importRef} type="file" accept=".json,application/json" className="mb-sr-only" tabIndex={-1} onChange={e=>void importFile(e.target.files?.[0])}/><button onClick={()=>importRef.current?.click()}><Upload size={16}/>Korábbi összeállítás megnyitása</button><button onClick={download}><Download size={16}/>Összeállítás letöltése</button></div></footer>
  <p className="mb-export-explanation">A letöltött összeállítást később itt nyithatod meg. A használathoz kattints a „Mutasd, hogyan próbáljam ki” gombra.</p>
 </div>;
}
