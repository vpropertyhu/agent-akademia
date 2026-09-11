import { getTool, parseTable, type ToolInput } from './daily-tools';
export type RowField={label:string;type:'text'|'number'|'date'|'time'|'email'|'select';options?:string[];optional?:boolean;default?:string};
export const startTasks=[
 {id:'ugyfelvalasz',title:'Ügyfélválaszt fogalmaznék',description:'A megadott válaszodból rendezett levél.'},
 {id:'feladatrendezo',title:'Rendet tennék a feladataimban',description:'Átlátható lista: mivel kezdj ma?'},
 {id:'ingatlanhirdetes',title:'Ingatlanhirdetést készítenék',description:'A saját adataidból hirdetésszöveg.'},
 {id:'koltsegosszesito',title:'Összeadnám a kiadásaimat',description:'Mennyit költöttél, és mire?'},
 {id:'ajanlatkeszito',title:'Árajánlatot készítenék',description:'Tételek, kedvezmény és végösszeg.'},
 {id:'hetitervezo',title:'Beosztanám a hetemet',description:'Feladatok a rendelkezésre álló időhöz.'},
];
const numberCols:Record<string,number[]>={feladatrendezo:[],hetitervezo:[1],ajanlatkeszito:[1,2],'hatarido-figyelo':[2],koltsegosszesito:[2],elofizetesek:[1],'ingatlan-osszehasonlito':[1,2,3],keszletfigyelo:[1,2,3,4],'naptar-export':[3]};
const dateCols:Record<string,number[]>={feladatrendezo:[2],megbeszeles:[2],'erdeklodo-rendezo':[3],'hatarido-figyelo':[4],'naptar-export':[1]};
const optionalCols:Record<string,number[]>={feladatrendezo:[1,2],megbeszeles:[1,2],'erdeklodo-rendezo':[1,3,4],'kontakt-tisztito':[1,2],hirlevel:[2],kampanylink:[2],ellenorzolista:[1,2],'naptar-export':[4]};
const choices:Record<string,Record<number,string[]>>={feladatrendezo:{3:['1','2','3']},'erdeklodo-rendezo':{2:['új','folyamatban','lezárt']},'hatarido-figyelo':{3:['HUF','EUR','USD'],5:['nyitott','fizetve']},koltsegosszesito:{3:['HUF','EUR','USD']},elofizetesek:{2:['HUF','EUR','USD'],3:['havi','éves']}};
export function rowHeaders(id:string):string[]{const source=getTool(id).sample.items;return source?source.split('\n')[0].split(';'):[];}
export function rowFields(id:string):RowField[]{return rowHeaders(id).map((label,index)=>{
 const options=choices[id]?.[index];const type:RowField['type']=options?'select':dateCols[id]?.includes(index)?'date':numberCols[id]?.includes(index)?'number':id==='naptar-export'&&index===2?'time':'text';
 return {label,type,options,optional:optionalCols[id]?.includes(index),default:id==='feladatrendezo'&&index===3?'2':options?.[0]??(id==='ajanlatkeszito'&&index===1?'1':id==='keszletfigyelo'&&index===4?'1':'')};
});}
export function blankRow(id:string):string[]{return rowFields(id).map(f=>f.default||'');}
export function readRows(id:string,raw:string):{rows:string[][];error:string|null}{
 if(!raw.trim())return {rows:[blankRow(id)],error:null};
 try{const fields=rowFields(id);return {rows:parseTable(raw,rowHeaders(id)).map(row=>row.map((value,i)=>fields[i].options?.find(option=>option.toLocaleLowerCase('hu')===value.toLocaleLowerCase('hu'))??value)),error:null};}catch(e){return {rows:[],error:e instanceof Error?e.message:'A listát nem sikerült megnyitni.'};}
}
export function writeRows(id:string,rows:string[][]):string{
 const cell=(v:string)=>'"'+v.replaceAll('"','""')+'"';return [rowHeaders(id),...rows].map(r=>r.map(cell).join(';')).join('\n');
}
export function prepareSimpleInput(id:string,input:ToolInput):ToolInput{
 if(!rowHeaders(id).length||input.items?.trim())return input;
 return {...input,items:writeRows(id,[blankRow(id)])};
}
export function addRowLabel(id:string):string{return id==='feladatrendezo'||id==='hetitervezo'?'Új feladat':id==='erdeklodo-rendezo'||id==='kontakt-tisztito'?'Új személy':id==='keszletfigyelo'?'Új termék':id==='naptar-export'?'Új időpont':'Új tétel';}
export function simpleChoice(id:string,index:number,value:string):string{return id==='feladatrendezo'&&index===3?({'1':'Sürgős','2':'Normál','3':'Ráér'}[value]||value):value;}
export function inputExplanation(id:string):string{
 const copy:Record<string,string>={
  ugyfelvalasz:'Kinek írsz, és mit szeretnél válaszolni? Ebben a változatban a válasz tartalmát te adod meg; a segéd levéllé formázza.',
  utanakovetes:'Add meg, kivel és miről egyeztettél, és mit szeretnél most kérni tőle.',
  feladatrendezo:'Írd be, mit kell elvégezned. A határidő és a felelős kihagyható. A listát határidő és fontosság szerint rendezzük.',
  ingatlanhirdetes:'A hirdetni kívánt ingatlan adatai kellenek: hely, méret, ár és ismert jellemzők. Ezekből készül a szöveg.',
  koltsegosszesito:'Írd be, mire mennyit költöttél. A segéd kategóriánként összeadja a kiadásokat.',
  ajanlatkeszito:'Milyen munkát vagy terméket ajánlasz, hány darabot és milyen egységáron? Ezekből számoljuk az ajánlatot.',
  hetitervezo:'Írd be a feladataidat és a becsült idejüket percben. A napi időkeretbe osztjuk be őket.'
 };return copy[id]||'A saját feladatod adatait add meg. Ha először csak kipróbálnád, válaszd a „Mutass egy példát” gombot.';
}
