'use client';

import {useEffect,useMemo,useRef,useState,type DragEvent} from 'react';
import {ArrowDown,ArrowUp,ArrowUpRight,AudioLines,Check,CheckCheck,ChevronDown,ChevronRight,Clock,Download,FileText,FolderOutput,GripVertical,Image as ImageIcon,Languages,Layers3,LayoutTemplate,ListChecks,Maximize2,MousePointer2,Pause,PenLine,Play,Plus,RotateCcw,ScanText,Search,Send,ShieldCheck,Sparkles,Table2,Trash2,Upload,Volume2,X,Hand,ChartNoAxesCombined,AlignLeft,BookOpen,Link2} from 'lucide-react';
import {Pawn} from '../components/pawn';
import {blocks,clonePieces,connection,definition,families,flatten,groupPieces,initialDraft,insertionConnection,issues,kinds,makePieces,parseDraft,placementIndex,recipes,repairSteps,stepLabels,suggestedBlocks,uid,type Block,type Draft,type Family,type Piece} from '../lib/module-builder';

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
 const [overCanvas,setOverCanvas]=useState(false),[detailsOpen,setDetailsOpen]=useState(false);
 const [previousDraft,setPreviousDraft]=useState<Draft|null>(null),[dirty,setDirty]=useState(false);
 const [notice,setNotice]=useState('Húzz egy elemet az üres mezőbe, vagy kattints az elemtárban a + jelre.');
 const [help,setHelp]=useState(false),[recipesOpen,setRecipesOpen]=useState(false);
 const [grouping,setGrouping]=useState(false),[marked,setMarked]=useState<string[]>([]),[moduleName,setModuleName]=useState('Saját alkotóműhely');
 const [dragged,setDragged]=useState<{block?:string;piece?:string;module?:string}|null>(null),[dropAt,setDropAt]=useState<number|null>(null);
 const [step,setStep]=useState(-1),[playing,setPlaying]=useState(false),[inspect,setInspect]=useState<'result'|'block'>('result');
 const importRef=useRef<HTMLInputElement>(null),catalogRef=useRef<HTMLElement>(null),trialRef=useRef<HTMLElement>(null),canvasRef=useRef<HTMLDivElement>(null);

 useEffect(()=>{
  for(const key of [storageKey,`${storageKey}-previous`]){
   try{const raw=localStorage.getItem(key);if(raw){const loaded=parseDraft(raw);if(loaded.pieces.length||loaded.modules.length||loaded.title!==initialDraft().title){setPreviousDraft(loaded);setNotice('Üres mezővel indulunk. Az előző tervedet a Visszatöltöm gombbal nyithatod meg.');break;}}}catch{/* Try the retained previous plan if this copy is unreadable. */}
  }
  setReady(true);
 },[]);
 useEffect(()=>{if(!ready||!dirty)return;try{localStorage.setItem(storageKey,JSON.stringify(draft));setSaved(true);}catch{setSaved(false);setNotice('A helyi mentés nem sikerült. A Terv letöltése gombbal elteheted a munkádat.');}},[draft,ready,dirty]);
 const leaves=useMemo(()=>flatten(draft.pieces),[draft.pieces]);
 const problems=useMemo(()=>issues(draft.pieces),[draft.pieces]);
 const selected=draft.pieces.find(p=>p.uid===active),selectedBlock=selected?definition(selected):undefined;
 const runningPiece=step>=0?leaves[step]:undefined,currentBlock=runningPiece?definition(runningPiece):undefined;
 const done=leaves.length>0&&step===leaves.length-1;
 const progress=leaves.length?Math.max(0,step+1)/leaves.length*100:0;
 const targetIndex=Math.min(insertAt??draft.pieces.length,draft.pieces.length);
 const summaryItems=Array.from(leaves.reduce((items,p)=>{const b=definition(p),existing=items.get(b.id);items.set(b.id,{block:b,count:(existing?.count||0)+1});return items;},new Map<string,{block:Block;count:number}>()).values());

 useEffect(()=>{if(!playing)return;if(step>=leaves.length-1){setPlaying(false);return;}const timer=window.setTimeout(()=>setStep(s=>s+1),1500);return()=>window.clearTimeout(timer);},[playing,step,leaves.length]);
 function beginEdit(){if(!dirty&&previousDraft){try{localStorage.setItem(`${storageKey}-previous`,JSON.stringify(previousDraft));}catch{/* The original remains recoverable in this session. */}}setDirty(true);}
 function change(next:Draft,message:string){
  try{next=parseDraft(JSON.stringify(next));}catch(error){setNotice(error instanceof Error?error.message:'A terv nem menthető.');return false;}
  beginEdit();setHistory(h=>[...h.slice(-19),draft]);setDraft(next);setPlaying(false);setStep(-1);setNotice(message);setDragged(null);setDropAt(null);setInsertAt(null);return true;
 }
 function revealCard(id:string){window.requestAnimationFrame(()=>document.getElementById(`step-${id}`)?.scrollIntoView({block:'nearest',behavior:motion()}));}
 function showCatalog(index=draft.pieces.length){setInsertAt(index);setShowAll(true);setQuery('');setFamily('all');window.requestAnimationFrame(()=>catalogRef.current?.scrollIntoView({block:'nearest',behavior:motion()}));}
 function undo(){const previous=history.at(-1);if(!previous)return;setDraft(previous);setHistory(h=>h.slice(0,-1));setDetailsOpen(false);setPlaying(false);setStep(-1);setGrouping(false);setInsertAt(null);setActive(previous.pieces[0]?.uid||'');setNotice('Az előző módosítást visszavontuk.');}
 function add(blockId:string,index=draft.pieces.length,module=false){
  if(draft.pieces.length>=40){setNotice('Egy tervben legfeljebb 40 lépés lehet. Több lépést saját modullá egyesíthetsz.');return;}
  const custom=module?draft.modules.find(m=>m.id===blockId):undefined;if(module&&!custom)return;
  const piece:Piece=custom?{uid:uid(),block:custom.id,name:custom.name,children:clonePieces(custom.children)}:{uid:uid(),block:blockId};
  index=placementIndex(draft.pieces,piece,index);
  if(change({...draft,pieces:[...draft.pieces.slice(0,index),piece,...draft.pieces.slice(index)]},`${definition(piece).name}: bekerült a mezőbe. Az összegzés frissült.`)){
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
  if(draft.modules.length>=30)throw new Error('Legfeljebb 30 saját modult menthetsz ebbe a tervbe.');
  const next=groupPieces(draft,marked,moduleName);
  if(change(next,'Elmentettük a lépéssort saját modulként. Később a Saját modulok között hozzáadhatod másik tervedhez.')){
   setActive(next.pieces.find(p=>p.block===next.modules.at(-1)?.id)?.uid||'');setGrouping(false);setInspect('block');setDetailsOpen(true);
  }
 }catch(error){setNotice(error instanceof Error?error.message:'A modul nem menthető.');}}
 function loadRecipe(id:string){const recipe=recipes.find(r=>r.id===id)!;const pieces=makePieces(recipe.blocks);
  if(change({...draft,title:recipe.name,pieces},`Megnyitottuk: ${recipe.name}. A korábbi terv a Visszavonás gombbal visszahozható.`)){setActive(pieces[0].uid);setGrouping(false);setRecipesOpen(false);setDetailsOpen(false);setInspect('result');}
 }
 function startNew(){if(draft.pieces.length){setPreviousDraft(draft);try{localStorage.setItem(`${storageKey}-previous`,JSON.stringify(draft));}catch{/* Undo remains available in this session. */}}if(change({...draft,title:'Az én agentem',pieces:[]},'Az építőmező üres. Az előző állapot visszavonással helyreállítható.')){setGrouping(false);setRecipesOpen(false);setActive('');setDetailsOpen(false);}}
 function preview(){if(!draft.pieces.length||problems.length)return;if(playing){setPlaying(false);return;}setInspect('result');setDetailsOpen(true);if(done||step<0)setStep(0);setPlaying(true);setNotice('Előre megírt példa halad végig a lépéseken. Ez a bemutató nem használ AI-t.');}
 function revealTrial(){preview();window.requestAnimationFrame(()=>trialRef.current?.scrollIntoView({block:'nearest',behavior:motion()}));}
 function download(){const blob=new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='agent-akademia-epitesi-terv.json';anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),5000);setNotice('A tervet JSON-fájlként elmentheted, majd itt visszatöltheted. Ez még nem futtatható agent.');}
 async function importFile(file:File|undefined){if(!file)return;try{if(file.size>500_000)throw new Error('Legfeljebb 500 kB-os tervet válassz.');const next=parseDraft(await file.text());if(change(next,'A tervet betöltöttük.')){setActive(next.pieces[0]?.uid||'');setGrouping(false);setDetailsOpen(false);}}catch(error){setNotice(error instanceof Error?error.message:'A terv nem olvasható.');}if(importRef.current)importRef.current.value='';}
 const available=suggestedBlocks(draft.pieces,targetIndex);
 const catalogueOrder=['write','file','image','summarize','transcribe','document'];
 const catalogue=[...blocks].sort((a,b)=>{const rank=(id:string)=>{const index=catalogueOrder.indexOf(id);return index<0?100:index;};return rank(a.id)-rank(b.id);});
 const palette=(showAll?catalogue:available).filter(b=>(family==='all'||b.family===family)&&`${b.name} ${b.description}`.toLocaleLowerCase('hu').includes(query.toLocaleLowerCase('hu')));
 const customPalette=draft.modules.filter(m=>(family==='all'||family==='sajat')&&m.name.toLocaleLowerCase('hu').includes(query.toLocaleLowerCase('hu'))&&(showAll||insertionConnection(draft.pieces,targetIndex,{uid:'candidate',block:m.id,name:m.name,children:m.children}).ok));

 return <div className="module-builder" onDragEnd={()=>{setDragged(null);setDropAt(null);setOverCanvas(false);}} onKeyDown={e=>{if(e.key==='Escape'){setDragged(null);setDropAt(null);setOverCanvas(false);setGrouping(false);setRecipesOpen(false);}}}>
  <header className="mb-header">
   <a className="mb-brand" href="/" aria-label="Agent Akadémia kezdőlap"><Pawn size={35}/><span>Agent <b>Akadémia</b></span></a>
   <nav aria-label="Főmenü"><a className="mb-nav-active" href="/">Építőműhely</a><a href="/alkotas">Szövegalkotó <ArrowUpRight size={14}/></a><button onClick={()=>setHelp(!help)} aria-expanded={help}><BookOpen size={16}/> Segítség</button></nav>
   <span className="mb-lab">TERVEZŐ ÉS BEMUTATÓ</span>
  </header>
  <section className="mb-intro"><div><span className="mb-eyebrow">VÁLASSZ ELEMEKET. ÉPÍTS SAJÁT AGENTET.</span><h1>Egy mező. <em>A te összeállításod.</em></h1><p>Húzd az elemeket a nagy mezőbe. Ugyanott látod, mit raktál össze.</p></div><button className="mb-start-new" onClick={startNew}><Plus size={17}/> Új, üres mező</button></section>
  {previousDraft&&!dirty&&<div className="mb-restore"><span>Van egy elmentett terved: <strong>{previousDraft.title}</strong> · {previousDraft.pieces.length} elem{previousDraft.modules.length>0?` · ${previousDraft.modules.length} saját modul`:''}</span><button onClick={()=>{if(change(previousDraft,'Az előző tervedet visszatöltöttük a mezőbe.'))setActive('');}}><RotateCcw size={16}/> Visszatöltöm</button></div>}
  {help&&<section className="mb-guide"><button className="mb-close" onClick={()=>setHelp(false)} aria-label="Segítség bezárása"><X size={19}/></button><h2>Minden egy helyre kerül.</h2><p>Az elemtárból fogj meg egy képességet, és engedd el a nagy, szaggatott keretű mezőben. Kattintással is hozzáadhatod. A mezőben az összes választott elem együtt látszik, alatta pedig a képességeik összegzése.</p><p>Az elemeket a mezőn belül is mozgathatod. Ha valamelyik kapcsolatból hiányzik egy lépés, az összegzésnél megmutatjuk. A bemutató előre megírt mintával működik; valódi AI-futtatás még nincs bekötve.</p></section>}
  <main className="mb-workbench mb-single-field">
   <aside ref={catalogRef} className="mb-palette" aria-label="Képesség választása">
    <div className="mb-panel-heading"><div><span className="mb-eyebrow">INNEN VÁLASSZ</span><h2>Elemek <span>{blocks.length+draft.modules.length}</span></h2></div><Layers3 size={24}/></div>
    <p className="mb-picker-context">Húzd át a nagy mezőbe, vagy kattints a <strong>+</strong> jelre.</p>
    <div className="mb-picker-mode"><button aria-pressed={showAll} onClick={()=>setShowAll(true)}>Összes elem</button><button aria-pressed={!showAll} onClick={()=>setShowAll(false)}>Javasolt</button></div>
    <label className="mb-search"><Search size={17}/><input aria-label="Képesség keresése" placeholder="Képesség keresése" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery('')} aria-label="Keresés törlése"><X size={15}/></button>}</label>
    <details className="mb-field-filters"><summary>Csoportok</summary><div className="mb-family-tabs" aria-label="Képességcsoportok"><button aria-pressed={family==='all'} onClick={()=>setFamily('all')}>Mind</button>{families.map(f=><button key={f.id} aria-pressed={family===f.id} onClick={()=>setFamily(f.id)}>{f.label}</button>)}</div></details>
    <div className="mb-palette-list">
     {palette.map(b=>{return <button key={b.id} className={`mb-palette-block mb-family-${b.family}`} draggable onDragStart={e=>{e.dataTransfer.setData('text/plain',b.id);setDragged({block:b.id});}} onClick={()=>add(b.id,targetIndex)}><span className="mb-mini-icon"><BlockIcon block={b}/></span><span><strong>{b.name}</strong><small>{b.verb}</small></span><Plus size={18}/></button>;})}
     {customPalette.map(m=>{return <button key={m.id} className="mb-palette-block mb-family-sajat" draggable onDragStart={e=>{e.dataTransfer.setData('text/plain',m.id);setDragged({module:m.id});}} onClick={()=>add(m.id,targetIndex,true)}><span className="mb-mini-icon"><Layers3 size={23}/></span><span><strong>{m.name}</strong><small>{`${flatten(m.children).length} lépés együtt`}</small></span><Plus size={18}/></button>;})}
     {!palette.length&&!customPalette.length&&<div className="mb-palette-empty"><Layers3 size={28}/><strong>{family==='sajat'?'Még nincs saját modul ebben a tervben.':'Nincs ilyen találat.'}</strong><p>Válassz másik csoportot, vagy nézd meg az összes képességet.</p></div>}
    </div><p className="mb-palette-foot"><MousePointer2 size={16}/> Kattintásra is a mezőbe kerül.</p>
   </aside>
   <section className="mb-stage" aria-label="A terved lépései">
    <div className="mb-stage-toolbar"><div className="mb-project"><span className="mb-eyebrow">A TERVED</span><label><input aria-label="Összeállítás neve" value={draft.title} maxLength={100} onChange={e=>{beginEdit();setDraft(d=>({...d,title:e.target.value}));}}/><PenLine size={15}/></label></div><div className="mb-tools"><button onClick={undo} disabled={!history.length} aria-label="Utolsó módosítás visszavonása" title="Visszavonás"><RotateCcw size={18}/></button><button onClick={()=>setRecipesOpen(!recipesOpen)} aria-expanded={recipesOpen}><Layers3 size={17}/> Minták <ChevronDown size={14}/></button></div></div>
    {recipesOpen&&<div className="mb-recipes"><div className="mb-panel-heading"><span className="mb-eyebrow">VAGY NÉZZ MEG EGY KÉSZ MINTÁT</span><button onClick={()=>setRecipesOpen(false)} aria-label="Minták bezárása"><X size={18}/></button></div>{recipes.map(r=><button key={r.id} onClick={()=>loadRecipe(r.id)}><span><strong>{r.name}</strong><small>{r.caption}</small></span><ArrowUpRight size={19}/></button>)}<button onClick={startNew}>Saját kezdést választok <Plus size={17}/></button></div>}
    <div className="mb-field-heading"><span><span className="mb-field-number">01</span> Építőmező</span><span>{draft.pieces.length} elem · {leaves.length} lépés</span></div>
    {grouping&&<div className="mb-group-form"><h2>Ezeket a lépéseket együtt mentem</h2><p>A kijelölt lépéssornak adj nevet. Később egyetlen kártyaként használhatod másik tervben is. Kattintással módosíthatod a kijelölést.</p><label htmlFor="module-name">A saját modul neve</label><input id="module-name" value={moduleName} onChange={e=>setModuleName(e.target.value)} maxLength={60}/><div><button onClick={saveModule} disabled={marked.length<2||!moduleName.trim()}><Layers3 size={17}/> Mentem együtt ({marked.length})</button><button onClick={()=>setGrouping(false)}>Mégsem</button></div></div>}
    <div ref={canvasRef} className={`mb-canvas mb-drop-field ${overCanvas?'mb-field-hover':''} ${grouping?'mb-grouping':''} ${!draft.pieces.length?'mb-field-empty':''}`} aria-label="Építőmező – ide helyezd az elemeket" onDragOver={e=>{if(dragged){e.preventDefault();e.dataTransfer.dropEffect=dragged.piece?'move':'copy';setOverCanvas(true);}}} onDragLeave={e=>{if(!(e.relatedTarget instanceof Node)||!e.currentTarget.contains(e.relatedTarget))setOverCanvas(false);}} onDrop={e=>drop(e,draft.pieces.length)}>
     {overCanvas&&<div className="mb-drop-feedback"><Plus size={20}/>Engedd el itt – bekerül az összeállításba</div>}
     {!draft.pieces.length?<div className="mb-empty-field-content"><span className="mb-empty-target"><Plus size={35}/></span><h2>Ide tedd az elemeket</h2><p>Húzz ide egy képességet az elemtárból.<br/>Vagy kattints mellette a + jelre.</p><span className="mb-empty-caption">Az összeállításod és az összegzése itt fog megjelenni.</span></div>:<>
      <div className="mb-placed-elements">
       {draft.pieces.map((piece,i)=>{const b=definition(piece),isMarked=marked.includes(piece.uid),activeLeaf=runningPiece&&(piece.children?flatten(piece.children).some(p=>p.uid===runningPiece.uid):piece.uid===runningPiece.uid);return <div id={`step-${piece.uid}`} key={piece.uid} className={`mb-field-element mb-family-${b.family} ${active===piece.uid?'mb-element-selected':''} ${dragged?.piece&&dropAt===i?'mb-element-drop-target':''} ${activeLeaf?'mb-element-running':''} ${grouping&&isMarked?'mb-element-marked':''}`} onDragOver={e=>{if(dragged?.piece){e.preventDefault();e.stopPropagation();setDropAt(i);setOverCanvas(true);}}} onDrop={e=>drop(e,i)}>
        <button className="mb-element-face" draggable={!grouping} onDragStart={e=>{e.dataTransfer.setData('text/plain',piece.uid);setDragged({piece:piece.uid});}} onClick={()=>{if(grouping)setMarked(m=>m.includes(piece.uid)?m.filter(id=>id!==piece.uid):[...m,piece.uid]);else{setActive(piece.uid);setInspect('block');setDetailsOpen(true);}}} aria-pressed={grouping?isMarked:active===piece.uid}>
         <span className="mb-element-top"><span>{grouping?(isMarked?<Check size={18}/>:<span className="mb-select-box"/>):String(i+1).padStart(2,'0')}</span><GripVertical size={17}/></span><BlockIcon block={b} size={30}/><strong>{b.name}</strong><small>{piece.children?`${flatten(piece.children).length} lépés egy modulban`:b.verb}</small>
        </button>
        {!grouping&&<div className="mb-element-controls"><button disabled={i===0} onClick={()=>move(i,-1)} aria-label={`${b.name} előrébb`}><ArrowUp size={15}/></button><button disabled={i===draft.pieces.length-1} onClick={()=>move(i,1)} aria-label={`${b.name} hátrébb`}><ArrowDown size={15}/></button><button className="mb-element-remove" onClick={()=>{if(change({...draft,pieces:draft.pieces.filter(p=>p.uid!==piece.uid)},`${b.name}: kivettük. Az összegzés frissült.`)){setActive('');setDetailsOpen(false);}}} aria-label={`${b.name} eltávolítása`}><X size={17}/></button></div>}
       </div>;})}
      </div>
      <div className="mb-field-continue"><Plus size={18}/><span>Újabb elemet is ide húzhatsz.</span></div>
      <section className="mb-assembly-summary" aria-label="Az összeállítás összegzése"><div className="mb-summary-heading"><div><span className="mb-eyebrow">A MEZŐ TARTALMA</span><h2>Ezt raktad össze</h2></div><span>{draft.pieces.length} elem<br/><strong>{leaves.length} lépés</strong></span></div>
       <div className="mb-summary-chips">{summaryItems.map(({block:b,count})=><span key={b.id}><BlockIcon block={b} size={17}/>{b.name}{count>1&&<b>×{count}</b>}</span>)}</div>
       {problems.length>0?<div className="mb-summary-warning"><strong>Az elemek bent vannak. A kapcsolódáson még igazítani kell.</strong>{draft.pieces.every((p,i)=>connection(draft.pieces[i-1],p).ok)&&<p>Egy saját modulon belül hiányzik kapcsolat. Kattints a modulra, és bontsd külön lépésekre a javításhoz.</p>}{draft.pieces.map((p,i)=>{const link=connection(draft.pieces[i-1],p);if(link.ok)return null;const repairIds=repairSteps(draft.pieces,i);return <div key={p.uid}><p>{definition(p).name}: {link.message}</p>{repairIds.length>0&&<button onClick={()=>repair(i)}><Plus size={15}/>{repairIds.map(id=>blocks.find(b=>b.id===id)!.name).join(' + ')} hozzáadása</button>}</div>;})}</div>:<p className="mb-summary-ok"><Link2 size={17}/>A kiválasztott elemek kapcsolódnak egymáshoz.</p>}
      </section>
     </>}
    </div>
    <div className="mb-stage-bottom"><button className="mb-make-module" disabled={draft.pieces.length<2} onClick={toggleGroup}><Layers3 size={19}/><span>{grouping?'Kijelölés bezárása':'Lépéseket együtt mentek'}</span></button><button className="mb-field-preview" onClick={revealTrial} disabled={!draft.pieces.length||problems.length>0}><Play size={17}/> Bemutató</button></div>
   </section>
   {detailsOpen&&<aside className="mb-inspector" aria-label="Bemutató és részletek"><button className="mb-detail-close" onClick={()=>{setDetailsOpen(false);setPlaying(false);}}><X size={17}/> Részletek bezárása</button>
    <div className="mb-inspector-tabs"><button aria-pressed={inspect==='result'} onClick={()=>setInspect('result')}>Bemutató</button><button aria-pressed={inspect==='block'} onClick={()=>setInspect('block')}>Lépés részletei</button></div>
    {inspect==='block'&&selectedBlock&&selected?<div className="mb-inspect-body"><span className="mb-eyebrow">EZT TESZI EZ A LÉPÉS</span><div className={`mb-detail-icon mb-family-${selectedBlock.family}`}><BlockIcon block={selectedBlock} size={28}/></div><h2>{selectedBlock.name}</h2><p>{selectedBlock.description}</p><div className="mb-port-detail"><div><small>Ezt kapja</small><strong>{selectedBlock.inputs.length?selectedBlock.inputs.map(k=><span key={k}><Port kind={k}/>{kinds[k]}</span>):'Te indítod el'}</strong></div><ArrowDown size={18}/><div><small>Ezt adja tovább</small><strong><Port kind={selectedBlock.output}/>{kinds[selectedBlock.output]}</strong></div></div>
     {selected.children&&<section className="mb-inside"><h3>A modulban lévő lépések</h3>{selected.children.map((p,i)=><div key={p.uid}><span>{i+1}.</span><BlockIcon block={definition(p)} size={18}/><strong>{definition(p).name}</strong></div>)}<button onClick={()=>{const index=draft.pieces.findIndex(p=>p.uid===selected.uid);if(change({...draft,pieces:[...draft.pieces.slice(0,index),...clonePieces(selected.children!),...draft.pieces.slice(index+1)]},'A példányt külön lépésekre bontottuk. A képességtárban mentett eredeti modul megmaradt.')){setActive('');setInspect('result');}}}><Maximize2 size={17}/> Külön lépésekre bontom</button></section>}
     <div className="mb-capability-note"><strong>A valódi futtatás még nincs bekötve.</strong><p>{selectedBlock.needs?`${selectedBlock.needs} szükséges hozzá.`:'A bemutató előre megírt példát mutat.'}</p></div>
    </div>:<div className="mb-inspect-body"><span className="mb-eyebrow">MI TÖRTÉNNE A LÉPÉSEKBEN?</span><h2>{currentBlock?currentBlock.name:'Nézd meg egy példával.'}</h2><p>{currentBlock?'Ezt adná tovább ez a lépés. A tartalom előre megírt szemléltetés.':'A Bemutató gomb lépésenként megmutatja, hogyan haladna tovább a kérésed.'}</p>
     <div className={`mb-result-preview ${currentBlock?'mb-result-live':''}`}><div className="mb-paper-top"><Pawn size={23}/><span>SZEMLÉLTETŐ MINTA</span></div>{currentBlock?<div className="mb-sample-content"><span className="mb-document-label">{kinds[currentBlock.output]}</span><h3>{currentBlock.name}</h3><p>{currentBlock.sample}</p>{currentBlock.output==='image'&&<div className="mb-image-placeholder"><ImageIcon size={34}/><span>A létrejövő kép helye</span></div>}</div>:<><span className="mb-document-label">A TERVED</span><h3>{draft.title||'A saját agented'}</h3><ol className="mb-result-steps">{draft.pieces.map(p=><li key={p.uid}>{p.children?definition(p).name:stepLabels[p.block]||definition(p).name}</li>)}</ol>{!draft.pieces.length&&<p className="mb-no-result">Válassz egy kezdést a műhelyben.</p>}</>}<div className="mb-paper-footer">Előre megírt példa, nem AI-eredmény.</div></div>
     <p className="mb-result-caption">{done?'A példa végigért. Valódi fájl nem készült.':step>=0?`${step+1}. mintalépés a(z) ${leaves.length}-ból`:'A bemutatóhoz nem kell saját adat.'}</p>
    </div>}
    <section ref={trialRef} className="mb-trial"><div className="mb-trial-heading"><span>{step<0?'KÉSZEN ÁLL A BEMUTATÓ':`${step+1} / ${leaves.length} LÉPÉS`}</span><span>{Math.round(progress)}%</span></div><div className="mb-progress"><span style={{width:`${progress}%`}}/></div><div className="mb-trial-actions"><button className="mb-play" disabled={!draft.pieces.length||problems.length>0} onClick={preview}>{playing?<Pause size={19}/>:<Play size={19}/>} {playing?'Megállítom':done?'Újra megnézem':'Bemutató indítása'}</button><button disabled={!leaves.length||problems.length>0||done} onClick={()=>{setPlaying(false);setStep(s=>Math.min(s+1,leaves.length-1));setInspect('result');}} aria-label="Következő mintalépés" title="Egy lépést mutass"><ChevronRight size={21}/></button><button disabled={step<0} onClick={()=>{setPlaying(false);setStep(-1);}} aria-label="Bemutató visszaállítása"><RotateCcw size={17}/></button></div><p><strong>Ez most szemléltetés.</strong> A valódi AI-futtatás még nincs bekötve.</p>{problems.length>0&&<p className="mb-trial-error">Előbb javítsd a megjelölt kapcsolatot a sorban.</p>}</section>
   </aside>}
  </main>
  <div className="mb-notice" role="status" aria-live="polite"><CheckCheck size={16}/>{notice}</div>
  <footer className="mb-footer"><div className="mb-save-state"><span className={`mb-status-dot ${saved?'':'mb-dot-error'}`}/>{saved?'Ezen a böngészőn mentve':dirty?'Helyi mentésre vár':'Az üres mező még nem módosítja a mentéseidet'}</div><div><input ref={importRef} type="file" accept=".json,application/json" className="mb-sr-only" tabIndex={-1} onChange={e=>void importFile(e.target.files?.[0])}/><button onClick={()=>importRef.current?.click()}><Upload size={16}/>Terv betöltése</button><button onClick={download}><Download size={16}/>Terv letöltése</button></div></footer>
 </div>;
}
