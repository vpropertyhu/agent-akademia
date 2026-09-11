'use client';
import Link from 'next/link';
import { ArrowRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { lessons, troubleshooting } from '@/lib/learning';
export default function LearningGuide(){return <>
 <div className="page-heading"><div><div className="eyebrow">HASZNÁLATI ÚTMUTATÓ</div><h1>Így használd.</h1><p>Válassz egy feladatot → add meg az adatokat → kattints a Készítsd el gombra.</p></div><Button variant="outline" asChild><a href="/letoltes/hasznalati-utmutato.html" download><Download/> Útmutató letöltése</a></Button></div>
 <div className="learning-lessons">{lessons.map(l=><details className="panel learning-lesson" id={l.id} key={l.id}><summary><h2>{l.title}</h2></summary><p>{l.intro}</p><ol>{l.steps.map(s=><li key={s}>{s}</li>)}</ol><div className="learning-check"><strong>Ezt ellenőrizd</strong><p>{l.check}</p></div>{l.toolId&&<Button asChild><Link href={'/eszkozok/'+l.toolId}>Megnyitom a gyakorlat segédjét <ArrowRight/></Link></Button>}{l.id==='automatizalas'&&<Button asChild variant="outline"><Link href="/automatizalas">Fájlfigyelő beállítása <ArrowRight/></Link></Button>}</details>)}</div>
 <section className="panel learning-lesson" id="elakadas"><h2>Ha elakadtál</h2><Accordion type="single" collapsible>{troubleshooting.map(([q,a],i)=><AccordionItem value={String(i)} key={q}><AccordionTrigger>{q}</AccordionTrigger><AccordionContent>{a}</AccordionContent></AccordionItem>)}</Accordion><Button variant="outline" asChild><Link href="/segitseg">Más kérdésem van <ArrowRight/></Link></Button></section>
 </>;}
