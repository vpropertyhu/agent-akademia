'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { dailyTools } from '@/lib/daily-tools';
import { startTasks } from '@/lib/simple-input';
export default function ToolCatalog(){
 const [all,setAll]=useState(false),[query,setQuery]=useState('');
 const found=useMemo(()=>{const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();return dailyTools.filter(t=>normalize(t.name+' '+t.description+' '+t.category).includes(normalize(query)));},[query]);
 return <div className="simple-home"><div className="page-heading"><div><h1>Miben segítsek?</h1><p>Válassz egy feladatot. A többit lépésről lépésre mutatom.</p></div></div>
 <div className="task-choices">{startTasks.map(t=><Link href={'/eszkozok/'+t.id} className="task-choice" key={t.id}><div><h2>{t.title}</h2><p>{t.description}</p></div><ArrowRight size={22}/></Link>)}</div>
 <Button className="show-all-tasks" variant="ghost" aria-expanded={all} onClick={()=>setAll(!all)}>{all?'Kevesebb feladat':'Más feladatot keresek'}</Button>
 {all&&<section className="all-tasks" aria-label="Összes feladat"><div className="tool-search"><Search size={18}/><Input aria-label="Feladat keresése" placeholder="Például: naptár, készlet, hírlevél…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="compact-task-list">{found.map(t=><Link key={t.id} href={'/eszkozok/'+t.id}><div><strong>{t.name}</strong><p>{t.description}</p></div><ArrowRight size={18}/></Link>)}</div>{!found.length&&<p className="field-note">Nincs találat. Próbáld másik szóval.</p>}</section>}
 <p className="simple-home-note">Saját adatokkal működő segédek. A szöveges feladatok a megadott tartalomból készítenek vázlatot.</p>
 <details className="simple-advanced"><summary>Haladó lehetőségek</summary><div className="advanced-links"><Link href="/automatizalas">Automatikus fájlfigyelő beállítása</Link><Link href="/agentek/bizonylatrendezo">Bizonylatrendező mintapróba</Link><a href="/letoltes/agent-akademia-csomag.zip" download>Teljes csomag letöltése</a></div></details>
 </div>;
}
