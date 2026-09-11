'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { rowFields, readRows, writeRows, blankRow, addRowLabel, simpleChoice } from '@/lib/simple-input';
export default function RowEditor({toolId,value,onChange}:{toolId:string;value:string;onChange:(s:string)=>void}){
 const {rows,error}=readRows(toolId,value),fields=rowFields(toolId);
 function update(i:number,j:number,v:string){onChange(writeRows(toolId,rows.map((r,idx)=>idx===i?r.map((c,col)=>col===j?v:c):r)));}
 if(error)return <p className="simple-error" role="alert">A feltöltött listát javítani kell: {error} A „Lista betöltése vagy beillesztése” részben az eredeti adatok megmaradtak.</p>;
 return <div className="simple-rows">{rows.map((row,i)=><fieldset className="simple-row" key={i}><legend>{i+1}. tétel</legend><div className="simple-row-grid">{fields.map((field,j)=><div className="simple-cell" key={j}><Label htmlFor={`row-${i}-${j}`}>{field.label}{field.optional&&<span className="optional-label"> · kihagyható</span>}</Label>{field.options?<Select value={row[j]} onValueChange={v=>update(i,j,v)}><SelectTrigger id={`row-${i}-${j}`}><SelectValue/></SelectTrigger><SelectContent>{field.options.map(v=><SelectItem key={v} value={v}>{simpleChoice(toolId,j,v)}</SelectItem>)}</SelectContent></Select>:<Input id={`row-${i}-${j}`} type={field.type==='number'?'text':field.type} inputMode={field.type==='number'?'decimal':undefined} value={row[j]} onChange={e=>update(i,j,e.target.value)} required={!field.optional} maxLength={2000} min={field.type==='date'?'1900-01-01':undefined} max={field.type==='date'?'2100-12-31':undefined}/>}</div>)}</div><Button type="button" variant="ghost" size="sm" className="remove-row" aria-label={`${i+1}. tétel törlése`} onClick={()=>onChange(writeRows(toolId,rows.length===1?[blankRow(toolId)]:rows.filter((_,j)=>j!==i)))}><Trash2 size={14}/> Törlés</Button></fieldset>)}<Button type="button" variant="outline" disabled={rows.length>=500} onClick={()=>onChange(writeRows(toolId,[...rows,blankRow(toolId)]))}><Plus size={16}/>{addRowLabel(toolId)}</Button></div>;
}
