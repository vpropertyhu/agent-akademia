'use client';

import {useEffect,useMemo,useRef,useState,type DragEvent} from 'react';
import {ArrowDown,ArrowUp,ArrowUpRight,AudioLines,Check,CheckCheck,ChevronDown,ChevronRight,Clock,Download,FileText,FolderOutput,GripVertical,Image as ImageIcon,Languages,Layers3,LayoutTemplate,ListChecks,Maximize2,MousePointer2,Pause,PenLine,Play,Plus,RotateCcw,ScanText,Search,Send,ShieldCheck,Sparkles,Table2,Trash2,Upload,Volume2,X,Hand,ChartNoAxesCombined,AlignLeft,BookOpen,Link2} from 'lucide-react';
import {Pawn} from '../components/pawn';
import {blocks,clonePieces,connection,definition,families,flatten,groupPieces,initialDraft,insertionConnection,issues,kinds,makePieces,parseDraft,recipes,repairSteps,stepLabels,suggestedBlocks,uid,type Block,type Draft,type Family,type Piece} from '../lib/module-builder';

const iconMap:Record<string,typeof Layers3>={spark:Sparkles,audio:AudioLines,file:FileText,clock:Clock,scan:ScanText,align:AlignLeft,table:Table2,pen:PenLine,list:ListChecks,languages:Languages,image:ImageIcon,volume:Volume2,shield:ShieldCheck,hand:Hand,chart:ChartNoAxesCombined,layout:LayoutTemplate,folder:FolderOutput,send:Send,box:Layers3};
function BlockIcon({block,size=22}:{block:Block;size?:number}){const Icon=iconMap[block.icon]||Layers3;return <Icon size={size} strokeWidth={1.7}/>;}
function Port({kind}:{kind:string}){return <span className={`mb-port mb-port-${kind}`} aria-hidden="true"/>;}
const storageKey='agent-akademia-builder-v1';
const motion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant' as const:'smooth' as const;

export default function ModuleBuilder(){
 const [draft,setDraft]=useState<Draft>(initialDraft),[ready,setReady]=useState(false),[saved,setSaved]=useState(false);
 const [history,setHistory]=useState<Draft[]>([]),[active,setActive]=useState('first-0');
 const [family,setFamily]=useState<Family|'all'>('all'),[query,setQuery]=useState(''),[showAll,setShowAll]=useState(false);
 const [catalogOpen,setCatalogOpen]=useState(false),[insertAt,setInsertAt]=useState<number|null>(null);
 const [notice,setNotice]=useState('A kezdőlépést betettük. Válassz alatta egy folytatást; a kapcsolódást mi intézzük.');
 const [help,setHelp]=useState(false),[recipesOpen,setRecipesOpen]=useState(false);
 const [grouping,setGrouping]=useState(false),[marked,setMarked]=useState<string[]>([]),[moduleName,setModuleName]=useState('Saját alkotóműhely');
 const [dragged,setDragged]=useState<{block?:string;piece?:string;module?:string}|null>(null),[dropAt,setDropAt]=useState<number|null>(null);
 const [step,setStep]=useState(-1),[playing,setPlaying]=useState(false),[inspect,setInspect]=useState<'result'|'block'>('result');
 const importRef=useRef<HTMLInputElement>(null),catalogRef=useRef<HTMLElement>(null),trialRef=useRef<HTMLElement>(null);

 useEffect(()=>{
  try{const raw=localStorage.getItem(storageKey);if(raw){const loaded=parseDraft(raw);setDraft(loaded);setActive(loaded.pieces[0]?.uid||'');setNotice('A mentett terved megmaradt. A sor végén választhatsz következő lépést.');}}
  catch{setNotice('A korábbi tervet nem sikerült megnyitni. Egy kezdőlépéssel indulunk.');}
  setReady(true);
 },[]);
 useEffect(()=>{if(!ready)return;try{localStorage.setItem(storageKey,JSON.stringify(draft));setSaved(true);}catch{setSaved(false);setNotice('A helyi mentés nem sikerült. A Terv letöltése gombbal elteheted a munkádat.');}},[draft,ready]);
 const leaves=useMemo(()=>flatten(draft.pieces),[draft.pieces]);
 const problems=useMemo(()=>issues(draft.pieces),[draft.pieces]);
 const selected=draft.pieces.find(p=>p.uid===active),selectedBlock=selected?definition(selected):undefined;
 const runningPiece=step>=0?leaves[step]:undefined,currentBlock=runningPiece?definition(runningPiece):undefined;
 const done=leaves.length>0&&step===leaves.length-1;
 const output=draft.pieces.length?definition(draft.pieces.at(-1)!):undefined;
 const progress=leaves.length?Math.max(0,step+1)/leaves.length*100:0;
 const targetIndex=Math.min(insertAt??draft.pieces.length,draft.pieces.length);
 const targetBefore=draft.pieces[targetIndex-1];
 const endSuggestions=suggestedBlocks(draft.pieces).slice(0,3);

 useEffect(()=>{if(!playing)return;if(step>=leaves.length-1){setPlaying(false);return;}const timer=window.setTimeout(()=>setStep(s=>s+1),1500);return()=>window.clearTimeout(timer);},[playing,step,leaves.length]);
 function change(next:Draft,message:string){
  try{next=parseDraft(JSON.stringify(next));}catch(error){setNotice(error instanceof Error?error.message:'A terv nem menthető.');return false;}
  setHistory(h=>[...h.slice(-19),draft]);setDraft(next);setPlaying(false);setStep(-1);setNotice(message);setDragged(null);setDropAt(null);setInsertAt(null);return true;
 }
 function revealCard(id:string){window.requestAnimationFrame(()=>document.getElementById(`step-${id}`)?.scrollIntoView({block:'nearest',behavior:motion()}));}
 function showCatalog(index=draft.pieces.length){setInsertAt(index);setCatalogOpen(true);setShowAll(false);setQuery('');setFamily('all');window.requestAnimationFrame(()=>catalogRef.current?.scrollIntoView({block:'nearest',behavior:motion()}));}
 function undo(){const previous=history.at(-1);if(!previous)return;setDraft(previous);setHistory(h=>h.slice(0,-1));setPlaying(false);setStep(-1);setGrouping(false);setInsertAt(null);setActive(previous.pieces[0]?.uid||'');setNotice('Az előző módosítást visszavontuk.');}
 function add(blockId:string,index=draft.pieces.length,module=false){
  if(draft.pieces.length>=40){setNotice('Egy tervben legfeljebb 40 lépés lehet. Több lépést saját modullá egyesíthetsz.');return;}
  const custom=module?draft.modules.find(m=>m.id===blockId):undefined;if(module&&!custom)return;
  const piece:Piece=custom?{uid:uid(),block:custom.id,name:custom.name,children:clonePieces(custom.children)}:{uid:uid(),block:blockId};
  const fit=insertionConnection(draft.pieces,index,piece);if(!fit.ok){setNotice(fit.message);return;}
  if(change({...draft,pieces:[...draft.pieces.slice(0,index),piece,...draft.pieces.slice(index)]},`${definition(piece).name}: hozzáadtuk és összekapcsoltuk. Választhatsz újabb lépést, vagy megnézheted a bemutatót.`)){
   setActive(piece.uid);setInspect('result');setCatalogOpen(false);revealCard(piece.uid);
  }
 }
 function repair(index:number){
  const ids=repairSteps(draft.pieces,index);if(!ids.length)return;
  if(draft.pieces.length+ids.length>40){setNotice('A javításhoz több hely kell. Előbb egyesíts néhány lépést.');return;}
  const additions=makePieces(ids),pieces=[...draft.pieces.slice(0,index),...additions,...draft.pieces.slice(index)];
  if(issues(pieces).length>=problems.length){setNotice('Ez a javítás nem elég. Nézd meg a kapcsolat két oldalát.');return;}
  if(change({...draft,pieces},`Beillesztettük a hiányzó lépéseket: ${ids.map(id=>blocks.find(b=>b.id===id)!.name).join(' → ')}.`)){setActive(additions[0].uid);setCatalogOpen(false);revealCard(additions[0].uid);}
 }
 function moveTo(pieces:Piece[]){if(issues(pieces).length>problems.length){setNotice('Ebben a sorrendben megszakadna a kapcsolat. A lépés az eredeti helyén maradt.');return;}change({...draft,pieces},'A lépést áthelyeztük.');}
 function move(index:number,direction:number){const target=index+direction;if(target<0||target>=draft.pieces.length)return;const pieces=[...draft.pieces];[pieces[index],pieces[target]]=[pieces[target],pieces[index]];moveTo(pieces);}
 function drop(event:DragEvent,index:number){event.preventDefault();if(!dragged)return;
  if(dragged.piece){const old=draft.pieces.findIndex(p=>p.uid===dragged.piece);if(old<0)return;const pieces=[...draft.pieces],piece=pieces.splice(old,1)[0];pieces.splice(index>old?index-1:index,0,piece);moveTo(pieces);}
  else if(dragged.block)add(dragged.block,index);else if(dragged.module)add(dragged.module,index,true);setDragged(null);setDropAt(null);
 }
 function toggleGroup(){setGrouping(!grouping);setMarked(draft.pieces.filter((p,i)=>i>0||definition(p).inputs.length>0).map(p=>p.uid));setPlaying(false);setCatalogOpen(false);}
 function saveModule(){try{
  if(draft.modules.length>=30)throw new Error('Legfeljebb 30 saját modult menthetsz ebbe a tervbe.');
  const next=groupPieces(draft,marked,moduleName);
  if(change(next,'Elmentettük a lépéssort saját modulként. Később a Saját modulok között hozzáadhatod másik tervedhez.')){
   setActive(next.pieces.find(p=>p.block===next.modules.at(-1)?.id)?.uid||'');setGrouping(false);setInspect('block');
  }
 }catch(error){setNotice(error instanceof Error?error.message:'A modul nem menthető.');}}
 function loadRecipe(id:string){const recipe=recipes.find(r=>r.id===id)!;const pieces=makePieces(recipe.blocks);
  if(change({...draft,title:recipe.name,pieces},`Megnyitottuk: ${recipe.name}. A korábbi terv a Visszavonás gombbal visszahozható.`)){setActive(pieces[0].uid);setGrouping(false);setRecipesOpen(false);setCatalogOpen(false);setInspect('result');}
 }
 function startNew(){if(change({...draft,title:'Az én agentem',pieces:[]},'Válaszd ki, miből induljon az agented. A korábbi terv visszavonással helyreállítható.')){setGrouping(false);setRecipesOpen(false);setCatalogOpen(false);setActive('');}}
 function preview(){if(!draft.pieces.length||problems.length)return;if(playing){setPlaying(false);return;}setInspect('result');if(done||step<0)setStep(0);setPlaying(true);setNotice('Előre megírt példa halad végig a lépéseken. Ez a bemutató nem használ AI-t.');}
 function revealTrial(){preview();window.requestAnimationFrame(()=>trialRef.current?.scrollIntoView({block:'nearest',behavior:motion()}));}
 function download(){const blob=new Blob([JSON.stringify(draft,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='agent-akademia-epitesi-terv.json';anchor.click();window.setTimeout(()=>URL.revokeObjectURL(url),5000);setNotice('A tervet JSON-fájlként elmentheted, majd itt visszatöltheted. Ez még nem futtatható agent.');}
 async function importFile(file:File|undefined){if(!file)return;try{if(file.size>500_000)throw new Error('Legfeljebb 500 kB-os tervet válassz.');const next=parseDraft(await file.text());if(change(next,'A tervet betöltöttük.')){setActive(next.pieces[0]?.uid||'');setGrouping(false);setCatalogOpen(false);}}catch(error){setNotice(error instanceof Error?error.message:'A terv nem olvasható.');}if(importRef.current)importRef.current.value='';}
 const available=suggestedBlocks(draft.pieces,targetIndex);
 const palette=(showAll?blocks:available).filter(b=>(family==='all'||b.family===family)&&`${b.name} ${b.description}`.toLocaleLowerCase('hu').includes(query.toLocaleLowerCase('hu')));
 const customPalette=draft.modules.filter(m=>(family==='all'||family==='sajat')&&m.name.toLocaleLowerCase('hu').includes(query.toLocaleLowerCase('hu'))&&(showAll||insertionConnection(draft.pieces,targetIndex,{uid:'candidate',block:m.id,name:m.name,children:m.children}).ok));
 const dragPiece=dragged?.piece?draft.pieces.find(p=>p.uid===dragged.piece):dragged?.block?{uid:'drag-preview',block:dragged.block}:dragged?.module?(()=>{const m=draft.modules.find(m=>m.id===dragged.module);return m?{uid:'drag-preview',block:m.id,name:m.name,children:m.children}:undefined;})():undefined;
 function fitsAt(index:number){
  if(!dragPiece)return true;
  if(dragged?.piece){const pieces=[...draft.pieces],old=pieces.findIndex(p=>p.uid===dragged.piece);if(old<0)return false;const piece=pieces.splice(old,1)[0];pieces.splice(index>old?index-1:index,0,piece);return issues(pieces).length<=problems.length;}
  return insertionConnection(draft.pieces,index,dragPiece).ok;
 }

 return <div className="module-builder" onDragEnd={()=>{setDragged(null);setDropAt(null);}} onKeyDown={e=>{if(e.key==='Escape'){setDragged(null);setDropAt(null);setGrouping(false);setRecipesOpen(false);setCatalogOpen(false);}}}>
  <header className="mb-header">
   <a className="mb-brand" href="/" aria-label="Agent Akadémia kezdőlap"><Pawn size={35}/><span>Agent <b>Akadémia</b></span></a>
   <nav aria-label="Főmenü"><a className="mb-nav-active" href="/">Építőműhely</a><a href="/alkotas">Szövegalkotó <ArrowUpRight size={14}/></a><button onClick={()=>setHelp(!help)} aria-expanded={help}><BookOpen size={16}/> Segítség</button></nav>
   <span className="mb-lab">TERVEZŐ ÉS BEMUTATÓ</span>
  </header>
  <section className="mb-intro"><div><span className="mb-eyebrow">EGY KÁRTYA. EGY KÉPESSÉG.</span><h1>Lépésről lépésre. <em>A te agented.</em></h1><p>Válaszd ki, mit csináljon. A lépéseket összekapcsoljuk neked.</p></div><button className="mb-start-new" onClick={startNew}><Plus size={17}/> Új tervet kezdek</button></section>
  <nav className="mb-walkthrough" aria-label="Az építés három lépése">
   <button onClick={()=>setRecipesOpen(!recipesOpen)}><span>{draft.pieces.length?<Check size={17}/>:1}</span><strong>Kezdj egy mintával</strong><small>Kérés, hang vagy szöveg</small></button>
   <button className={!done?'mb-current-step':''} onClick={()=>showCatalog()}><span>2</span><strong>Add hozzá, mit tegyen</strong><small>Egy kattintással kapcsolódik</small></button>
   <button className={done?'mb-current-step':''} onClick={revealTrial} disabled={!draft.pieces.length||problems.length>0}><span>3</span><strong>Nézd meg, mi történne</strong><small>Bemutató egy megírt példával</small></button>
  </nav>
  {help&&<section className="mb-guide"><button className="mb-close" onClick={()=>setHelp(false)} aria-label="Segítség bezárása"><X size={19}/></button><h2>Elég rákattintanod egy folytatásra.</h2><p>A sor végén megjelenő kártyák az előző lépéshez illenek. Válassz egyet, és már a helyén is van. A <strong>További képességek</strong> gombbal több lehetőséget találsz. Két meglévő lépés között a <strong>+</strong> gombbal tehetsz be újabbat.</p><p>Kattints egy beillesztett kártyára a részletekért. A fel/le nyíllal átrendezheted, a kuka ikonnal kiveheted. A Visszavonás helyreállítja az előző állapotot.</p><p>A mentett lépéssor saját modulként másik tervben is használható. Ez egy tervezőfelület: a valódi AI-futtatás és az alkalmazáskapcsolatok még nincsenek bekötve.</p></section>}
  <main className={`mb-workbench ${catalogOpen?'mb-catalog-open':''}`}>
   {catalogOpen&&<aside ref={catalogRef} className="mb-palette" aria-label="Képesség választása">
    <div className="mb-panel-heading"><div><span className="mb-eyebrow">{targetIndex===draft.pieces.length?'A KÖVETKEZŐ LÉPÉS':'ÚJ LÉPÉS KÖZÉPRE'}</span><h2>Mit tegyen itt?</h2></div><button className="mb-close" onClick={()=>setCatalogOpen(false)} aria-label="Képességtár bezárása"><X size={20}/></button></div>
    <p className="mb-picker-context">{targetBefore?<><strong>{kinds[definition(targetBefore).output]}</strong> érkezik a(z) „{definition(targetBefore).name}” lépésből.</>:'Válassz egy indítást az első helyre.'} Kattints egy képességre.</p>
    <div className="mb-picker-mode"><button aria-pressed={!showAll} onClick={()=>setShowAll(false)}>Ide illők</button><button aria-pressed={showAll} onClick={()=>setShowAll(true)}>Összes ({blocks.length+draft.modules.length})</button></div>
    <label className="mb-search"><Search size={17}/><input aria-label="Képesség keresése" placeholder="Képesség keresése" value={query} onChange={e=>setQuery(e.target.value)}/>{query&&<button onClick={()=>setQuery('')} aria-label="Keresés törlése"><X size={15}/></button>}</label>
    <div className="mb-family-tabs" aria-label="Képességcsoportok"><button aria-pressed={family==='all'} onClick={()=>setFamily('all')}>Mind</button>{families.map(f=><button key={f.id} aria-pressed={family===f.id} onClick={()=>setFamily(f.id)}>{f.label}</button>)}</div>
    <div className="mb-palette-list">
     {palette.map(b=>{const fit=insertionConnection(draft.pieces,targetIndex,{uid:'candidate',block:b.id});return <button key={b.id} className={`mb-palette-block mb-family-${b.family}`} disabled={!fit.ok} draggable={fit.ok} onDragStart={e=>{e.dataTransfer.setData('text/plain',b.id);setDragged({block:b.id});}} onClick={()=>add(b.id,targetIndex)}><span className="mb-mini-icon"><BlockIcon block={b}/></span><span><strong>{b.name}</strong><small>{fit.ok?b.verb:fit.message}</small></span>{fit.ok&&<Plus size={18}/>}</button>;})}
     {customPalette.map(m=>{const piece={uid:'candidate',block:m.id,name:m.name,children:m.children},b=definition(piece),fit=insertionConnection(draft.pieces,targetIndex,piece);return <button key={m.id} className="mb-palette-block mb-family-sajat" disabled={!fit.ok} draggable={fit.ok} onDragStart={e=>{e.dataTransfer.setData('text/plain',m.id);setDragged({module:m.id});}} onClick={()=>add(m.id,targetIndex,true)}><span className="mb-mini-icon"><Layers3 size={23}/></span><span><strong>{m.name}</strong><small>{fit.ok?`${flatten(m.children).length} lépés együtt`:fit.message}</small></span>{fit.ok&&<Plus size={18}/>}</button>;})}
     {!palette.length&&!customPalette.length&&<div className="mb-palette-empty"><Layers3 size={28}/><strong>{family==='sajat'?'Nincs ide illő saját modul.':'Nincs ilyen találat.'}</strong><p>Válassz másik csoportot, vagy nézd meg az összes képességet.</p></div>}
    </div><p className="mb-palette-foot"><MousePointer2 size={16}/> Kattintásra a választott helyre kerül.</p>
   </aside>}
   <section className="mb-stage" aria-label="A terved lépései">
    <div className="mb-stage-toolbar"><div className="mb-project"><span className="mb-eyebrow">A TERVED</span><label><input aria-label="Összeállítás neve" value={draft.title} maxLength={100} onChange={e=>setDraft(d=>({...d,title:e.target.value}))}/><PenLine size={15}/></label></div><div className="mb-tools"><button onClick={undo} disabled={!history.length} aria-label="Utolsó módosítás visszavonása" title="Visszavonás"><RotateCcw size={18}/></button><button onClick={()=>setRecipesOpen(!recipesOpen)} aria-expanded={recipesOpen}><Layers3 size={17}/> Minták <ChevronDown size={14}/></button></div></div>
    {recipesOpen&&<div className="mb-recipes"><div className="mb-panel-heading"><span className="mb-eyebrow">VAGY NÉZZ MEG EGY KÉSZ MINTÁT</span><button onClick={()=>setRecipesOpen(false)} aria-label="Minták bezárása"><X size={18}/></button></div>{recipes.map(r=><button key={r.id} onClick={()=>loadRecipe(r.id)}><span><strong>{r.name}</strong><small>{r.caption}</small></span><ArrowUpRight size={19}/></button>)}<button onClick={startNew}>Saját kezdést választok <Plus size={17}/></button></div>}
    <div className="mb-stage-meta"><span>{problems.length?<><span className="mb-status-dot mb-dot-error"/>{problems.length} kapcsolat javítandó</>:<><Link2 size={15}/>{draft.pieces.length>1?'A kapcsolatok a helyükön vannak':draft.pieces.length?'A kezdés megvan. Most válassz folytatást.':'Válaszd ki az első lépést.'}</>}</span><span>{draft.pieces.length} lépés</span></div>
    {grouping&&<div className="mb-group-form"><h2>Ezeket a lépéseket együtt mentem</h2><p>A kijelölt lépéssornak adj nevet. Később egyetlen kártyaként használhatod másik tervben is. Kattintással módosíthatod a kijelölést.</p><label htmlFor="module-name">A saját modul neve</label><input id="module-name" value={moduleName} onChange={e=>setModuleName(e.target.value)} maxLength={60}/><div><button onClick={saveModule} disabled={marked.length<2||!moduleName.trim()}><Layers3 size={17}/> Mentem együtt ({marked.length})</button><button onClick={()=>setGrouping(false)}>Mégsem</button></div></div>}
    <div className={`mb-canvas ${dragged?'mb-dragging':''} ${grouping?'mb-grouping':''}`}>
     <div className="mb-chain">
      {draft.pieces.map((piece,i)=>{
       const b=definition(piece),link=connection(draft.pieces[i-1],piece),repairIds=repairSteps(draft.pieces,i);
       const activeLeaf=runningPiece&&(piece.children?flatten(piece.children).some(p=>p.uid===runningPiece.uid):piece.uid===runningPiece.uid);
       const completed=step>=0&&(piece.children?flatten(piece.children).every(p=>leaves.indexOf(p)<step):leaves.indexOf(piece)<step);
       const isMarked=marked.includes(piece.uid);
       return <div key={piece.uid} className={`mb-chain-unit ${activeLeaf?'mb-unit-running':''}`}>
        <div className={`mb-joint ${!link.ok?'mb-joint-error':''} ${dropAt===i?'mb-drop-active':''} ${dragged?(fitsAt(i)?'mb-slot-fits':'mb-slot-mismatch'):''}`} onDragOver={e=>{if(dragged){e.preventDefault();setDropAt(i);}}} onDrop={e=>drop(e,i)}>
         {i===0&&link.ok?<span className="mb-start">INNEN INDUL</span>:link.ok?<><span className="mb-wire"/><span className="mb-joint-label"><Port kind={definition(draft.pieces[i-1]).output}/>{kinds[definition(draft.pieces[i-1]).output]} megy tovább</span>{!grouping&&<button className="mb-insert" onClick={()=>showCatalog(i)} aria-label={`Új lépés a(z) ${i}. és ${i+1}. lépés közé`} title="Új lépés ide"><Plus size={15}/></button>}</>:<div className="mb-connection-error"><span>{link.message}</span>{repairIds.length?<button onClick={()=>repair(i)}><Plus size={15}/>Beillesztem: {repairIds.map(id=>blocks.find(item=>item.id===id)!.name).join(' → ')}</button>:<span className="mb-repair-hint">Ezt a lépést helyezd át, vagy a kártya kiválasztása után vedd ki a kuka ikonnal.</span>}</div>}
         {dragged&&<span className="mb-drop-label">{fitsAt(i)?'Ide kapcsolható':'Ide nem illik'}</span>}
        </div>
        <div id={`step-${piece.uid}`} className={`mb-block-shell mb-family-${b.family} ${active===piece.uid?'mb-selected':''} ${activeLeaf?'mb-running':''} ${completed?'mb-completed':''} ${grouping&&isMarked?'mb-marked':''}`}>
         <button className="mb-block-face" draggable={!grouping} onDragStart={e=>{e.dataTransfer.setData('text/plain',piece.uid);setDragged({piece:piece.uid});}} onClick={()=>{if(grouping)setMarked(m=>m.includes(piece.uid)?m.filter(id=>id!==piece.uid):[...m,piece.uid]);else{setActive(piece.uid);setInspect('block');}}} aria-pressed={grouping?isMarked:active===piece.uid} aria-label={`${i+1}. ${b.name}${grouping?', kijelölés az együtt mentéshez':''}`}>
          <span className="mb-step-number">{grouping?<span className="mb-select-box">{isMarked&&<Check size={18}/>}</span>:completed?<Check size={21}/>:String(i+1).padStart(2,'0')}</span>
          <span className="mb-block-icon"><BlockIcon block={b} size={25}/></span><span className="mb-block-copy"><strong>{piece.children?b.name:stepLabels[b.id]||b.name}</strong><small>{piece.children?`${flatten(piece.children).length} lépés együtt · saját modul`:b.verb}</small>{piece.children&&<span className="mb-inside-tags">{piece.children.slice(0,4).map(child=><span key={child.uid}><BlockIcon block={definition(child)} size={15}/></span>)}</span>}</span><GripVertical className="mb-grip" size={16}/>
         </button>
         {!grouping&&active===piece.uid&&<div className="mb-block-controls"><button disabled={i===0} onClick={()=>move(i,-1)} aria-label={`${b.name} feljebb`}><ArrowUp size={16}/></button><button disabled={i===draft.pieces.length-1} onClick={()=>move(i,1)} aria-label={`${b.name} lejjebb`}><ArrowDown size={16}/></button><button onClick={()=>{if(change({...draft,pieces:draft.pieces.filter(p=>p.uid!==piece.uid)},`${b.name}: kivettük. A Visszavonás gombbal helyreállítható.`))setActive('');}} aria-label={`${b.name} eltávolítása`}><Trash2 size={16}/></button></div>}
        </div>
       </div>;
      })}
      {!grouping&&<div className={`mb-next-step ${dropAt===draft.pieces.length?'mb-drop-active':''}`} onDragOver={e=>{if(dragged){e.preventDefault();setDropAt(draft.pieces.length);}}} onDrop={e=>drop(e,draft.pieces.length)}>
       {draft.pieces.length?<><span className="mb-next-badge"><Plus size={18}/></span><span className="mb-eyebrow">{kinds[output!.output].toLocaleUpperCase('hu')} ÁLL RENDELKEZÉSRE</span><h2>Mit csináljon ezután?</h2><p>Kattints egy folytatásra. Automatikusan a sorhoz kapcsoljuk.</p></>:<><span className="mb-next-badge"><Sparkles size={21}/></span><span className="mb-eyebrow">AZ ELSŐ LÉPÉS</span><h2>Miből induljon?</h2><p>Válassz egy kezdést. Saját adatot most még nem kell megadnod.</p></>}
       <div className="mb-suggestions">{endSuggestions.map(b=><button key={b.id} className={`mb-suggestion mb-family-${b.family}`} onClick={()=>add(b.id)}><span className="mb-mini-icon"><BlockIcon block={b} size={22}/></span><span><strong>{stepLabels[b.id]||b.name}</strong><small>{b.verb}</small></span><Plus size={18}/></button>)}</div>
       <button className="mb-more" onClick={()=>showCatalog()}>További képességek {draft.modules.length>0?'és saját modulok':''}<ChevronRight size={17}/></button>
       {draft.pieces.length>1&&!problems.length&&<div className="mb-enough"><span>Ennyi lépéssel is megnézheted.</span><button onClick={revealTrial}><Play size={15}/> Bemutató</button></div>}
      </div>}
     </div>
    </div>
    <div className="mb-stage-bottom"><button className="mb-make-module" disabled={draft.pieces.length<2} onClick={toggleGroup}><Layers3 size={19}/><span>{grouping?'Kijelölés bezárása':'Lépéseket együtt mentek'}</span></button><button className="mb-catalog-toggle" onClick={()=>showCatalog()}><Search size={17}/> Képességtár</button></div>
   </section>
   <aside className="mb-inspector" aria-label="Bemutató és részletek">
    <div className="mb-inspector-tabs"><button aria-pressed={inspect==='result'} onClick={()=>setInspect('result')}>Bemutató</button><button aria-pressed={inspect==='block'} onClick={()=>setInspect('block')}>Lépés részletei</button></div>
    {inspect==='block'&&selectedBlock&&selected?<div className="mb-inspect-body"><span className="mb-eyebrow">EZT TESZI EZ A LÉPÉS</span><div className={`mb-detail-icon mb-family-${selectedBlock.family}`}><BlockIcon block={selectedBlock} size={28}/></div><h2>{selectedBlock.name}</h2><p>{selectedBlock.description}</p><div className="mb-port-detail"><div><small>Ezt kapja</small><strong>{selectedBlock.inputs.length?selectedBlock.inputs.map(k=><span key={k}><Port kind={k}/>{kinds[k]}</span>):'Te indítod el'}</strong></div><ArrowDown size={18}/><div><small>Ezt adja tovább</small><strong><Port kind={selectedBlock.output}/>{kinds[selectedBlock.output]}</strong></div></div>
     {selected.children&&<section className="mb-inside"><h3>Az együtt mentett lépések</h3>{selected.children.map((p,i)=><div key={p.uid}><span>{i+1}.</span><BlockIcon block={definition(p)} size={18}/><strong>{definition(p).name}</strong></div>)}<button onClick={()=>{const index=draft.pieces.findIndex(p=>p.uid===selected.uid);if(change({...draft,pieces:[...draft.pieces.slice(0,index),...clonePieces(selected.children!),...draft.pieces.slice(index+1)]},'A példányt külön lépésekre bontottuk. A képességtárban mentett eredeti modul megmaradt.')){setActive('');setInspect('result');}}}><Maximize2 size={17}/> Külön lépésekre bontom</button></section>}
     <div className="mb-capability-note"><strong>A valódi futtatás még nincs bekötve.</strong><p>{selectedBlock.needs?`${selectedBlock.needs} szükséges hozzá.`:'A bemutató előre megírt példát mutat.'}</p></div>
    </div>:<div className="mb-inspect-body"><span className="mb-eyebrow">MI TÖRTÉNNE A LÉPÉSEKBEN?</span><h2>{currentBlock?currentBlock.name:'Nézd meg egy példával.'}</h2><p>{currentBlock?'Ezt adná tovább ez a lépés. A tartalom előre megírt szemléltetés.':'A Bemutató gomb lépésenként megmutatja, hogyan haladna tovább a kérésed.'}</p>
     <div className={`mb-result-preview ${currentBlock?'mb-result-live':''}`}><div className="mb-paper-top"><Pawn size={23}/><span>SZEMLÉLTETŐ MINTA</span></div>{currentBlock?<div className="mb-sample-content"><span className="mb-document-label">{kinds[currentBlock.output]}</span><h3>{currentBlock.name}</h3><p>{currentBlock.sample}</p>{currentBlock.output==='image'&&<div className="mb-image-placeholder"><ImageIcon size={34}/><span>A létrejövő kép helye</span></div>}</div>:<><span className="mb-document-label">A TERVED</span><h3>{draft.title||'A saját agented'}</h3><ol className="mb-result-steps">{draft.pieces.map(p=><li key={p.uid}>{p.children?definition(p).name:stepLabels[p.block]||definition(p).name}</li>)}</ol>{!draft.pieces.length&&<p className="mb-no-result">Válassz egy kezdést a műhelyben.</p>}</>}<div className="mb-paper-footer">Előre megírt példa, nem AI-eredmény.</div></div>
     <p className="mb-result-caption">{done?'A példa végigért. Valódi fájl nem készült.':step>=0?`${step+1}. mintalépés a(z) ${leaves.length}-ból`:'A bemutatóhoz nem kell saját adat.'}</p>
    </div>}
    <section ref={trialRef} className="mb-trial"><div className="mb-trial-heading"><span>{step<0?'KÉSZEN ÁLL A BEMUTATÓ':`${step+1} / ${leaves.length} LÉPÉS`}</span><span>{Math.round(progress)}%</span></div><div className="mb-progress"><span style={{width:`${progress}%`}}/></div><div className="mb-trial-actions"><button className="mb-play" disabled={!draft.pieces.length||problems.length>0} onClick={preview}>{playing?<Pause size={19}/>:<Play size={19}/>} {playing?'Megállítom':done?'Újra megnézem':'Bemutató indítása'}</button><button disabled={!leaves.length||problems.length>0||done} onClick={()=>{setPlaying(false);setStep(s=>Math.min(s+1,leaves.length-1));setInspect('result');}} aria-label="Következő mintalépés" title="Egy lépést mutass"><ChevronRight size={21}/></button><button disabled={step<0} onClick={()=>{setPlaying(false);setStep(-1);}} aria-label="Bemutató visszaállítása"><RotateCcw size={17}/></button></div><p><strong>Ez most szemléltetés.</strong> A valódi AI-futtatás még nincs bekötve.</p>{problems.length>0&&<p className="mb-trial-error">Előbb javítsd a megjelölt kapcsolatot a sorban.</p>}</section>
   </aside>
  </main>
  <div className="mb-notice" role="status" aria-live="polite"><CheckCheck size={16}/>{notice}</div>
  <footer className="mb-footer"><div className="mb-save-state"><span className={`mb-status-dot ${saved?'':'mb-dot-error'}`}/>{saved?'Ezen a böngészőn mentve':'Helyi mentésre vár'}</div><div><input ref={importRef} type="file" accept=".json,application/json" className="mb-sr-only" tabIndex={-1} onChange={e=>void importFile(e.target.files?.[0])}/><button onClick={()=>importRef.current?.click()}><Upload size={16}/>Terv betöltése</button><button onClick={download}><Download size={16}/>Terv letöltése</button></div></footer>
 </div>;
}
