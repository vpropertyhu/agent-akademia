'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Copy, Download, FileUp, Loader2, Play, Save, SlidersHorizontal, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { getTool, initialInput, sampleInput, runTool, resultCSV, type ToolInput, type ToolResult } from '@/lib/daily-tools';
import RowEditor from './row-editor';
import { prepareSimpleInput, readRows, inputExplanation } from '@/lib/simple-input';
import type { SavedTool } from '@/lib/tool-save';

export function downloadFile(name:string,content:string,mime='text/plain;charset=utf-8'){
 const href=URL.createObjectURL(new Blob([content],{type:mime}));const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);
}
export default function ToolWorkbench({toolId,user}:{toolId:string;user:boolean}){
 const tool=getTool(toolId);
 const [input,setInput]=useState<ToolInput>(()=>prepareSimpleInput(toolId,initialInput(tool))),[output,setOutput]=useState<ToolResult|null>(null),[executed,setExecuted]=useState('');
 const [title,setTitle]=useState(tool.name),[text,setText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[loadedSample,setLoadedSample]=useState(false),[loadedId,setLoadedId]=useState<string|null>(null);
 const [phase,setPhase]=useState<'input'|'result'>('input');
 const resultHeading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{if(phase==='result')resultHeading.current?.focus();},[phase]);
 const operation=useRef(false),retry=useRef<{key:string;id:string}|null>(null),fileRef=useRef<HTMLInputElement>(null);
 const changed=!!output&&executed!==JSON.stringify(input);
 const signIn='/signin-with-chatgpt?return_to='+encodeURIComponent('/eszkozok/'+toolId);
 useEffect(()=>{const id=new URLSearchParams(window.location.search).get('mentes');if(!id)return;let canceled=false;setLoadedId(id);if(!user){setError('A mentés megnyitásához jelentkezz be.');return;}setLoading(true);
  fetch('/api/tools',{cache:'no-store'}).then(async r=>{const b=await r.json() as {error?:string;saves?:SavedTool[]};if(!r.ok)throw new Error(b.error||'Nem sikerült a művelet.');const save=(b.saves as SavedTool[]).find(s=>s.id===id&&s.toolId===toolId);if(!save)throw new Error('Ez a mentés nem található a munkaterületeden.');if(!canceled){setInput(save.input);setTitle(save.title);setOutput(save.result);setPhase(save.result?'result':'input');setText(save.result?.text||'');setExecuted(save.result?JSON.stringify(save.input):'');setError('');}}).catch(e=>{if(!canceled)setError(e.message||'Nem sikerült betölteni a mentést.');}).finally(()=>{if(!canceled)setLoading(false);});return ()=>{canceled=true;};
 },[toolId,user]);
 function run(){try{const r=runTool(toolId,input);setOutput(r);setText(r.text);setExecuted(JSON.stringify(input));setError('');setPhase('result');}catch(e){setError(e instanceof Error?e.message:'Ellenőrizd a mezőket.');}}
 async function save(kind:'preset'|'result'){
  if(operation.current)return;if(!user){setError('A fiókba mentéshez jelentkezz be. Az eredményt addig letöltheted.');return;}if(kind==='result'&&(!output||changed))return;
  try{runTool(toolId,input);}catch(e){setError(e instanceof Error?e.message:'Ellenőrizd a mezőket.');return;}
  operation.current=true;setBusy(true);setError('');const payload={toolId,kind,title,input,...(kind==='result'?{editedText:text}:{})},key=JSON.stringify(payload);if(retry.current?.key!==key)retry.current={key,id:crypto.randomUUID()};
  try{const r=await fetch('/api/tools',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,id:retry.current!.id})});const b=await r.json() as {error?:string;saves?:SavedTool[]};if(!r.ok)throw new Error(b.error||'Nem sikerült a művelet.');toast.success(kind==='preset'?'A saját változatot elmentettük.':'Az eredményt elmentettük.');}
  catch(e){setError(e instanceof Error?e.message:'Nem sikerült a mentés. Próbáld újra.');}finally{operation.current=false;setBusy(false);}
 }
 async function importFile(file:File|undefined){if(!file)return;try{if(file.size>80000)throw new Error('Legfeljebb 80 kB-os szöveges CSV vagy TSV tölthető be.');const raw=await file.text();if(raw.includes('\0')||raw.includes('\uFFFD'))throw new Error('UTF-8 kódolású szöveges fájlt válassz.');if(raw.length>20000)throw new Error('Legfeljebb 20 000 karakter tölthető be.');setInput(prev=>({...prev,items:raw}));setLoadedSample(false);setError('');toast.success('A fájl tartalmát betöltöttük. Ellenőrizd az oszlopokat.');}catch(e){setError(e instanceof Error?e.message:'A fájl nem olvasható.');}if(fileRef.current)fileRef.current.value='';}
 async function copy(){try{await navigator.clipboard.writeText(text);toast.success('Az eredmény a vágólapra került.');}catch{setError('A böngésző nem engedte a másolást. Jelöld ki az eredményt, vagy töltsd le TXT-ként.');}}
 function fieldControl(field:typeof tool.fields[number]){return <div className="form-field" key={field.key}><Label htmlFor={'tool-'+field.key}>{field.key==='today'?'Melyik naphoz viszonyítsunk?':field.label}{field.required===false&&<span className="optional-label"> · kihagyható</span>}</Label>{field.hint&&<p id={'hint-'+field.key} className="field-note">{field.hint}</p>}{field.type==='select'?<Select value={input[field.key]||''} onValueChange={value=>setInput({...input,[field.key]:value})}><SelectTrigger id={'tool-'+field.key}><SelectValue placeholder="Válassz…"/></SelectTrigger><SelectContent>{field.options?.map(x=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>:field.type==='textarea'?<Textarea id={'tool-'+field.key} rows={4} maxLength={20000} required={field.required!==false} value={input[field.key]||''} onChange={e=>setInput({...input,[field.key]:e.target.value})}/>:<Input id={'tool-'+field.key} type={field.type||'text'} min={field.type==='date'?'1900-01-01':field.min} max={field.type==='date'?'2100-12-31':field.max} step={field.type==='number'?'any':undefined} maxLength={20000} required={field.required!==false} value={input[field.key]||''} onChange={e=>setInput({...input,[field.key]:e.target.value})}/>}</div>;}
 const settings=tool.fields.filter(f=>f.key==='today'||f.required===false),mainFields=tool.fields.filter(f=>f.key!=='today'&&f.required!==false);
 const hasItems=tool.fields.some(f=>f.key==='items'),badRows=hasItems?readRows(toolId,input.items||'').error:null;
 return <div className="simple-workbench">
  <Link href="/" className="back-link">← Másik feladat</Link>
  <ol className="simple-steps" aria-label="Lépések"><li>1. Feladat kiválasztva</li><li aria-current={phase==='input'?'step':undefined}>2. Adatok megadása</li><li aria-current={phase==='result'?'step':undefined}>3. Kész eredmény</li></ol>
  <div className="page-heading"><div><h1>{tool.name}</h1><p>{phase==='input'?tool.description:'Ellenőrizd, és már használhatod is.'}</p></div></div>
  {error&&<div className="error-callout" role="alert"><AlertCircle/><span>{error}</span></div>}
  {loading?<div className="panel tool-loading"><Loader2 className="spin"/> A munkád betöltése…</div>:phase==='input'?<section className="panel simple-form-panel">
   <div className="simple-form-intro"><h2>Add meg az adatokat.</h2><Button type="button" variant="ghost" size="sm" disabled={busy} onClick={()=>{setInput(sampleInput(tool));setOutput(null);setText('');setLoadedSample(true);setError('');}}>Mutass egy példát</Button></div>
   <p className="input-explanation">{inputExplanation(toolId)}</p>
   {loadedSample&&<p className="sample-notice">Ez egy példa. Átírhatod a saját adataidra.</p>}
   {loadedId&&<p className="field-note">A korábban mentett adataidból indulsz.</p>}
   <form onSubmit={e=>{e.preventDefault();run();}}><fieldset disabled={busy} className="tool-fields">
    {mainFields.map(field=>field.key==='items'?<RowEditor key={field.key} toolId={toolId} value={input.items||''} onChange={items=>setInput({...input,items})}/>:fieldControl(field))}
    {settings.length>0&&<details className="simple-advanced"><summary>További beállítások{input.today?' · '+input.today:''}</summary>{settings.map(fieldControl)}</details>}
    <Button type="submit" className="run-tool-button">Készítsd el <ArrowRight size={17}/></Button>
   </fieldset></form>
   <details className="simple-advanced" open={badRows?true:undefined}><summary>Mentés és haladó lehetőségek</summary>
    {hasItems&&<><p className="field-note">{tool.fields.find(f=>f.key==='items')?.hint}</p><input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" onChange={e=>void importFile(e.target.files?.[0])} aria-label="Lista betöltése fájlból"/><Label htmlFor="raw-items">Beillesztett lista</Label><Textarea id="raw-items" rows={5} maxLength={20000} value={input.items||''} onChange={e=>setInput({...input,items:e.target.value})}/></>}
    <Label htmlFor="variant-title">Mentés neve</Label><Input id="variant-title" maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/>{user?<Button type="button" disabled={busy||title.trim().length<2} variant="outline" onClick={()=>void save('preset')}><Save/> Kitöltés mentése</Button>:<a href={signIn} target="_top" className="text-link">Belépek a mentéshez</a>}
   </details>
   <details className="simple-advanced"><summary>Segítség ehhez a feladathoz</summary><p>{tool.outcome}</p><p>{tool.method==='Sablon'?'A saját szövegedből és tényeidből készül a vázlat. Küldés előtt olvasd át.':'A megadott értékekkel számol és rendez. Elsőre próbáld ki a példával.'}</p><Link href="/utmutato" className="text-link">Részletes útmutató</Link></details>
  </section>:output&&<section className="panel simple-result-panel">
   <h2 ref={resultHeading} tabIndex={-1}>Elkészült.</h2>
   {changed&&<p className="simple-error">Az adatok változtak. Lépj vissza, és készíts új eredményt.</p>}
   {output.columns&&output.rows?<div className="output-table"><Table><TableHeader><TableRow>{output.columns.map((c,i)=><TableHead key={i}>{c}</TableHead>)}</TableRow></TableHeader><TableBody>{output.rows.map((row,i)=><TableRow key={i}>{row.map((c,j)=><TableCell key={j}>{c}</TableCell>)}</TableRow>)}</TableBody></Table></div>:<Textarea aria-label="Az elkészült szöveg, szabadon szerkeszthető" className="result-editor" rows={14} maxLength={40000} value={text} onChange={e=>setText(e.target.value)} disabled={changed}/>}
   {output.notes.length>0&&<ul className="output-notes">{output.notes.map((note,i)=><li key={i}>{note}</li>)}</ul>}
   <div className="simple-result-actions">{output.file?<Button disabled={changed} onClick={()=>downloadFile(output.file!.name,output.file!.content,output.file!.mime)}><Download/> Naptárfájl letöltése</Button>:output.columns?<Button disabled={changed} onClick={()=>downloadFile(tool.id+'.csv',resultCSV(output),'text/csv;charset=utf-8')}><Download/> Táblázat letöltése</Button>:<Button disabled={changed} onClick={()=>void copy()}><Copy/> Szöveg másolása</Button>}<Button variant="outline" onClick={()=>setPhase('input')}>Adatok módosítása</Button></div>
   <details className="simple-advanced"><summary>Mentés és további lehetőségek</summary>
    <Label htmlFor="result-title">Mentés neve</Label><Input id="result-title" maxLength={100} value={title} onChange={e=>setTitle(e.target.value)}/>{user?<Button disabled={busy||changed||title.trim().length<2} variant="outline" onClick={()=>void save('result')}>{busy?<Loader2 className="spin"/>:<Save/>} Eredmény mentése</Button>:<a href={signIn} target="_top" className="text-link">Belépek a mentéshez</a>}
    {output.columns&&<><Label htmlFor="result-text">Szöveges változat</Label><Textarea id="result-text" rows={8} maxLength={40000} value={text} onChange={e=>setText(e.target.value)}/><p className="field-note">A szöveg szerkesztése a táblázatot nem változtatja meg.</p></>}
    <div className="output-actions"><Button disabled={changed} variant="outline" onClick={()=>void copy()}>Szöveg másolása</Button><Button disabled={changed} variant="outline" onClick={()=>downloadFile(tool.id+'.txt',text)}>Szöveg letöltése</Button><Button disabled={changed} variant="outline" onClick={()=>downloadFile(tool.id+'-eredmeny.json',JSON.stringify({toolId,engineVersion:1,input,result:{...output,text}},null,2),'application/json')}>Adatfájl letöltése (JSON)</Button>{output.file&&output.columns&&<Button variant="outline" disabled={changed} onClick={()=>downloadFile(tool.id+'.csv',resultCSV(output),'text/csv;charset=utf-8')}>Táblázat letöltése</Button>}</div>
   </details><p className="simple-privacy">A másolás vagy letöltés nem küldi el és nem teszi közzé az eredményt.</p>
  </section>}
 </div>;
}
