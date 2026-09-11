/** Shared, dependency-free engine: identical behavior on the Site and in the offline kit. */
export type Field = { key: string; label: string; type?: 'text'|'textarea'|'number'|'date'|'select'|'url'; hint?: string; required?: boolean; options?: string[]; default?: string; min?: number; max?: number };
export type Tool = { id: string; name: string; category: string; method: 'Rendezés'|'Számítás'|'Sablon'; description: string; outcome: string; fields: Field[]; sample: Record<string,string> };
export type ToolInput = Record<string,string>;
export type ToolResult = { title: string; text: string; columns?: string[]; rows?: string[][]; notes: string[]; file?: {name:string;mime:string;content:string} };
const f=(key:string,label:string,type:Field['type']='text',hint='',required=true):Field=>({key,label,type,hint,required});
const choice=(key:string,label:string,options:string[]):Field=>({...f(key,label,'select'),options,default:options[0]});
const dateField=f('today','Viszonyítási nap','date');
const list=(label:string,hint:string)=>f('items',label,'textarea',hint);
const signature=f('sender','Aláírás');
const recipient=f('recipient','Címzett neve');
const currency=choice('currency','Pénznem',['HUF','EUR','USD']);

export const dailyTools: Tool[] = [
 {id:'feladatrendezo',name:'Feladatrendező',category:'Szervezés',method:'Rendezés',description:'Határidő és fontosság szerint sorba teszi a teendőidet.',outcome:'Rangsorolt feladatlista, felelőssel és késési jelzéssel.',fields:[list('Feladatok','Oszlopok: Feladat; Felelős; Határidő; Prioritás (1–3). Az 1 a legsürgősebb. A határidő maradhat üres.'),dateField],sample:{items:'Feladat;Felelős;Határidő;Prioritás\nAjánlat elküldése;Anna;@today;1\nHonlap ellenőrzése;Bence;@next;2\nArchívum rendezése;Anna;;3',today:'@today'}},
 {id:'hetitervezo',name:'Heti kapacitástervező',category:'Szervezés',method:'Számítás',description:'Öt munkanapra osztja a feladatokat a napi időkereted alapján.',outcome:'Napi beosztás és külön lista arról, ami már nem fér bele.',fields:[list('Feladatok fontossági sorrendben','Oszlopok: Feladat; Perc. A feladatokat egészben, ebben a sorrendben helyezi el.'),f('start','Első nap','date'),{...f('capacity','Napi szabad idő (perc)','number'),min:15,max:720,default:'240'}],sample:{items:'Feladat;Perc\nAjánlatok;90\nTartalomterv;120\nAdminisztráció;60\nÜgyfélhívások;180\nProjektmunka;300',start:'@today',capacity:'240'}},
 {id:'megbeszeles',name:'Megbeszélés-emlékeztető',category:'Szervezés',method:'Sablon',description:'A döntésekből és vállalásokból továbbküldhető emlékeztetőt állít össze.',outcome:'Emlékeztető, döntési lista és felelősökhöz rendelt teendők.',fields:[f('title','Megbeszélés témája'),f('date','Időpont','date'),f('people','Résztvevők'),f('decisions','Meghozott döntések','textarea','Egy döntés soronként.'),list('Vállalások','Oszlopok: Feladat; Felelős; Határidő. A határidő üresen is hagyható.')],sample:{title:'Heti csapategyeztetés',date:'@today',people:'Anna, Bence',decisions:'A kampány kedden indul.\nA végleges szöveget Anna ellenőrzi.',items:'Feladat;Felelős;Határidő\nSzöveg véglegesítése;Anna;@next\nKépek kiválasztása;Bence;@next'}},
 {id:'heti-jelentes',name:'Heti összefoglaló',category:'Szervezés',method:'Sablon',description:'Rövid státuszjelentés az eredményekből, akadályokból és következő lépésekből.',outcome:'Csapatnak vagy ügyfélnek továbbítható heti jelentés.',fields:[f('period','Időszak'),f('done','Elkészült feladatok','textarea','Egy eredmény soronként.'),f('blocked','Akadályok, szükséges döntések','textarea','Csak tényleges akadályt adj meg.',false),f('next','Következő lépések','textarea')],sample:{period:'Szeptember második hete',done:'Az ajánlatok kiküldve.\nAz új tájékoztató elkészült.',blocked:'A fotók jóváhagyására várunk.',next:'Visszajelzések összegyűjtése.\nTájékoztató közzététele jóváhagyás után.'}},
 {id:'erdeklodo-rendezo',name:'Érdeklődő-rendező',category:'Ügyfélkezelés',method:'Rendezés',description:'Kiemeli, kivel kell ma foglalkoznod és kinél csúszik a visszahívás.',outcome:'Kapcsolatfelvételi lista státusszal és következő lépéssel.',fields:[list('Érdeklődők','Oszlopok: Név; Elérhetőség; Státusz (új, folyamatban, lezárt); Következő kapcsolat (ÉÉÉÉ-HH-NN); Teendő.'),dateField],sample:{items:'Név;Elérhetőség;Státusz;Következő kapcsolat;Teendő\nKiss Anna;anna@example.com;új;@today;Visszahívás\nNagy Péter;peter@example.com;folyamatban;@next;Ajánlat egyeztetése\nMinta Kft.;iroda@example.com;lezárt;;Archiválás',today:'@today'}},
 {id:'kontakt-tisztito',name:'Kontaktlista-tisztító',category:'Ügyfélkezelés',method:'Rendezés',description:'Kiszűri az ismétlődő e-mail-címeket, és jelzi a hibás elérhetőségeket.',outcome:'Tisztított CSV és külön jelzés az összevont vagy ellenőrizendő sorokról.',fields:[list('Kontaktlista','Oszlopok: Név; Email; Telefon. A telefonszám maradhat üres. Az első előfordulást tartja meg; hiányzó adatot a későbbi sorból pótol.')],sample:{items:'Név;Email;Telefon\nKiss Anna; ANNA@example.com ;+36 30 123 4567\nKiss Anna;anna@example.com;\nNagy Bence;bence.example.com;06 20 123 4567'}},
 {id:'utanakovetes',name:'Ügyfél-utánkövető',category:'Ügyfélkezelés',method:'Sablon',description:'Udvarias emlékeztetőt készít egy korábbi ajánlathoz vagy beszélgetéshez.',outcome:'Szerkeszthető e-mail-vázlat tárggyal és egyértelmű következő lépéssel.',fields:[recipient,f('topic','Korábbi egyeztetés / ajánlat'),f('detail','A felidézendő konkrétum','textarea'),f('request','Mit kérsz a címzettől?'),signature],sample:{recipient:'Anna',topic:'Weboldal-ajánlat',detail:'A múlt héten elküldött ajánlat a bemutatkozó oldal és az időpontkérés kialakítását tartalmazza.',request:'Kérlek, jelezd, melyik csomag illeszkedik az elképzeléseidhez.',sender:'Bence'}},
 {id:'ugyfelvalasz',name:'Ügyfélválasz-készítő',category:'Ügyfélkezelés',method:'Sablon',description:'A saját válaszodat rendezett, udvarias ügyfélszolgálati levélbe foglalja.',outcome:'Válaszlevél a megadott megoldással és vállalt következő lépéssel.',fields:[recipient,f('topic','Megkeresés témája'),f('answer','A pontos válasz vagy megoldás','textarea','Ezt a tartalmat használja; a kérdésre nem keres önálló választ.'),f('next','Következő lépés, vállalt időpont'),signature],sample:{recipient:'Péter',topic:'Időpont módosítása',answer:'A csütörtöki találkozót péntek 14 órára tudjuk áttenni.',next:'Kérlek, erősítsd meg, hogy megfelelő-e az új időpont.',sender:'Anna'}},
 {id:'ajanlatkeszito',name:'Árajánlat-összesítő',category:'Adminisztráció',method:'Számítás',description:'Összeadja az ajánlat tételeit, kedvezményét és az általad megadott adót.',outcome:'Tételes ajánlati kalkuláció és végösszeg. Nem számlázóprogram.',fields:[f('client','Ügyfél / projekt'),list('Ajánlati tételek','Oszlopok: Tétel; Mennyiség; Egységár. Nettó egységárakat adj meg, pénzjel nélkül.'),currency,{...f('discount','Kedvezmény (%)','number'),min:0,max:100,default:'0'},{...f('tax','Alkalmazandó adó (%)','number','Te add meg az erre az ajánlatra érvényes értéket.'),min:0,max:100}],sample:{client:'Minta projekt',items:'Tétel;Mennyiség;Egységár\nTervezés;3;18000\nKivitelezés;1;95000',currency:'HUF',discount:'5',tax:'0'}},
 {id:'hatarido-figyelo',name:'Fizetési határidő-rendező',category:'Adminisztráció',method:'Rendezés',description:'Külön jelzi a lejárt, ma esedékes és későbbi fizetéseket.',outcome:'Esedékességi lista; a kiegyenlített tételeket külön jelöli.',fields:[list('Fizetési lista','Oszlopok: Partner; Azonosító; Összeg; Pénznem (HUF/EUR/USD); Határidő; Állapot (nyitott/fizetve).'),dateField],sample:{items:'Partner;Azonosító;Összeg;Pénznem;Határidő;Állapot\nMinta Stúdió;MS-2026-1;68000;HUF;@yesterday;nyitott\nIroda Kft.;I-12;24000;HUF;@next;nyitott\nDesign Bt.;D-42;150;EUR;@today;fizetve',today:'@today'}},
 {id:'koltsegosszesito',name:'Költségösszesítő',category:'Adminisztráció',method:'Számítás',description:'Kategóriánként összesíti a kiadásaidat, pénznemenként külön.',outcome:'Költségtábla kategóriaösszegekkel és pénznemenkénti végösszeggel.',fields:[list('Kiadások','Oszlopok: Megnevezés; Kategória; Összeg; Pénznem (HUF/EUR/USD). Pozitív kiadásokat adj meg.')],sample:{items:'Megnevezés;Kategória;Összeg;Pénznem\nPapír;Iroda;4500;HUF\nToner;Iroda;18000;HUF\nVonat;Utazás;5200;HUF\nSzoftver;Előfizetés;29;EUR'}},
 {id:'elofizetesek',name:'Előfizetés-áttekintő',category:'Adminisztráció',method:'Számítás',description:'Összehasonlítható havi és éves összegre váltja az előfizetéseidet.',outcome:'Havi és éves egyenérték, külön pénznemenként.',fields:[list('Előfizetések','Oszlopok: Név; Díj; Pénznem (HUF/EUR/USD); Gyakoriság (havi/éves). Változatlan díjjal számol.')],sample:{items:'Név;Díj;Pénznem;Gyakoriság\nTárhely;12000;HUF;éves\nGrafikai szoftver;19;EUR;havi\nTelefonszolgáltatás;6500;HUF;havi'}},
 {id:'ingatlanhirdetes',name:'Ingatlanhirdetés-készítő',category:'Ingatlan',method:'Sablon',description:'Az ellenőrzött ingatlanadatokból áttekinthető hirdetésszöveget készít.',outcome:'Hirdetési cím, adatok, leírás és kapcsolatfelvételi zárás.',fields:[choice('offer','Ügylet',['Eladó','Kiadó']),f('location','Település / városrész'),f('kind','Ingatlan típusa'),{...f('area','Alapterület (m²)','number'),min:1,max:100000},{...f('rooms','Szobák száma','number'),min:0.5,max:100},f('price','Hirdetési ár, pénznem és időszak','text','Pl. 250 000 Ft / hó vagy 59 900 000 Ft.'),f('facts','Ellenőrzött jellemzők','textarea','Egy tényszerű jellemző soronként. Csak megadott jellemzőt használ.'),f('contact','Kapcsolatfelvétel')],sample:{offer:'Eladó',location:'Szeged, Újszeged',kind:'lakás',area:'62',rooms:'3',price:'59 900 000 Ft',facts:'Erkély: 6 m²\nMásodik emelet\nGázcirkó fűtés\nMegtekintés előre egyeztetve',contact:'Időpontért írj az iroda@example.com címre.'}},
 {id:'ingatlan-osszehasonlito',name:'Ingatlan-összehasonlító',category:'Ingatlan',method:'Számítás',description:'Kiszámítja a négyzetméterárat és jelöli, melyik fér a saját keretedbe.',outcome:'Összehasonlító táblázat ár, méret és szobaszám alapján.',fields:[list('Ingatlanok','Oszlopok: Név; Ár; Alapterület; Szobák. Minden árat ugyanabban a pénznemben adj meg.'),currency,{...f('budget','Legmagasabb ár','number'),min:1},{...f('minArea','Legkisebb alapterület (m²)','number'),min:1},{...f('minRooms','Minimum szobaszám','number'),min:0.5}],sample:{items:'Név;Ár;Alapterület;Szobák\nÚjszegedi lakás;59900000;62;3\nBelvárosi lakás;65000000;54;2\nKertvárosi lakás;57000000;70;3',currency:'HUF',budget:'60000000',minArea:'60',minRooms:'3'}},
 {id:'kozossegi-posztok',name:'Közösségi posztcsomag',category:'Kommunikáció',method:'Sablon',description:'Egy ajánlatból három eltérő szerkezetű posztvázlatot állít össze.',outcome:'Rövid, részletes és kérdéssel indító poszt, kitalált ígéretek nélkül.',fields:[f('topic','Ajánlat vagy hír'),f('audience','Kinek szól?'),f('facts','Konkrétumok','textarea','Egy ellenőrzött tény soronként.'),f('cta','Következő lépés / felhívás'),f('url','Kapcsolódó link','url','',false)],sample:{topic:'Nyílt nap a műhelyben',audience:'Kézműveskedés iránt érdeklődőknek',facts:'Szeptember 19., 10–14 óra\nKerámiabemutató\nElőzetes regisztráció szükséges',cta:'Foglalj helyet a regisztrációs oldalon!',url:'https://example.com/nyilt-nap'}},
 {id:'hirlevel',name:'Hírlevél-összeállító',category:'Kommunikáció',method:'Sablon',description:'A híreidet tárggyal, bevezetővel és egy fő felhívással rendezi levélbe.',outcome:'Szerkeszthető, egyszerű szöveges hírlevél.',fields:[f('subject','Tárgy'),f('intro','Rövid bevezető','textarea'),list('Hírek','Oszlopok: Cím; Rövid leírás; Link (opcionális).'),f('cta','Fő felhívás'),signature],sample:{subject:'Szeptemberi újdonságok',intro:'Összegyűjtöttük, mi történt nálunk ebben a hónapban.',items:'Cím;Rövid leírás;Link\nÚj műhely;Elkészült a bemutatóterünk.;https://example.com/muhely\nNyílt nap;Szeptember 19-én várunk.;https://example.com/nyilt-nap',cta:'Válaszolj erre a levélre, ha kérdésed van.',sender:'A Minta csapata'}},
 {id:'kampanylink',name:'Kampánylink-készítő',category:'Kommunikáció',method:'Rendezés',description:'Egységes UTM-linkeket készít több csatornához, a meglévő URL megtartásával.',outcome:'Követhető kampánylinkek, másolható táblázatban.',fields:[f('url','Céloldal','url'),f('campaign','Kampány neve'),list('Csatornák','Oszlopok: Forrás; Médium; Tartalom (opcionális). A meglévő, azonos UTM-paramétereket felülírja.')],sample:{url:'https://example.com/ajanlat?lang=hu',campaign:'oszi-nyilt-nap',items:'Forrás;Médium;Tartalom\nfacebook;social;elso-poszt\nhirlevel;email;szeptember\ninstagram;social;bio'}},
 {id:'ellenorzolista',name:'Folyamat- és ellenőrzőlista',category:'Napi működés',method:'Sablon',description:'Az ismétlődő munkából átadható, kipipálható munkalapot készít.',outcome:'Számozott ellenőrzőlista a lépésenkénti készfeltételekkel.',fields:[f('title','Folyamat neve'),f('trigger','Mikor induljon?'),list('Lépések','Oszlopok: Lépés; Felelős; Akkor kész, ha. A sorrendet megtartja.')],sample:{title:'Új ügyfél indítása',trigger:'Az ügyfél elfogadta az ajánlatot.',items:'Lépés;Felelős;Akkor kész, ha\nAdatok ellenőrzése;Anna;Minden kapcsolati adat megvan\nIndító hívás;Bence;Az időpont visszaigazolva\nMappa létrehozása;Anna;Az ügyfélanyagnak van helye'}},
 {id:'keszletfigyelo',name:'Készlet-utánrendelő',category:'Napi működés',method:'Számítás',description:'A minimum alatti készletekhez csomagméretre kerekített rendelést számol.',outcome:'Beszerzési lista és várható készlet rendelés után.',fields:[list('Készlet','Oszlopok: Termék; Jelenlegi; Minimum; Célkészlet; Csomagméret. Azonos egységben és egész darabszámmal dolgozz.')],sample:{items:'Termék;Jelenlegi;Minimum;Célkészlet;Csomagméret\nNyomtatópapír;2;5;12;5\nBoríték;70;50;100;25\nCsomagolódoboz;0;10;30;20'}},
 {id:'naptar-export',name:'Naptársegéd',category:'Napi működés',method:'Rendezés',description:'A megadott időpontokból Google-, Outlook- és Apple-naptárba importálható fájlt készít.',outcome:'ICS-naptárfájl; az importot a saját naptáradban indítod.',fields:[list('Események','Oszlopok: Cím; Dátum (ÉÉÉÉ-HH-NN); Kezdés (ÓÓ:PP); Perc; Helyszín (opcionális). Az időpontok helyi időként kerülnek a fájlba.')],sample:{items:'Cím;Dátum;Kezdés;Perc;Helyszín\nÜgyféltalálkozó;@next;10:00;45;Iroda\nHeti tervezés;@next;14:00;30;Online'}},
];

export function localDate(date=new Date()):string {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
export function day(value:string):number {
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||value<'1900-01-01'||value>'2100-12-31')throw new Error('A dátum formátuma ÉÉÉÉ-HH-NN legyen (1900–2100).');
 const n=Date.parse(value+'T12:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==value)throw new Error('Nem létező dátum: '+value);return n;
}
const shift=(value:string,n:number)=>new Date(day(value)+n*86400000).toISOString().slice(0,10);
export function initialInput(tool:Tool):ToolInput {return Object.fromEntries(tool.fields.map(x=>[x.key,x.default??(x.type==='date'?localDate():'')]));}
export function sampleInput(tool:Tool,today=localDate()):ToolInput {return Object.fromEntries(Object.entries(tool.sample).map(([k,v])=>[k,v.replaceAll('@today',today).replaceAll('@next',shift(today,1)).replaceAll('@yesterday',shift(today,-1))]));}
export function getTool(id:string):Tool {const t=dailyTools.find(t=>t.id===id);if(!t)throw new Error('Ez a segéd nem található.');return t;}
export function number(value:string,label='Szám',min=0,max=1e12):number {
 const clean=value.replace(/[ \u00a0\u202f]/g,'').replace(',','.');
 if(!/^-?\d+(\.\d+)?$/.test(clean))throw new Error(`${label}: érvényes számot adj meg, ezreselválasztó pont nélkül.`);
 const n=Number(clean);if(!Number.isFinite(n)||n<min||n>max)throw new Error(`${label}: ${min} és ${max} közötti szám szükséges.`);return n;
}
const fmt=(n:number)=>new Intl.NumberFormat('hu-HU',{maximumFractionDigits:2}).format(n);
const round=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
const lines=(value:string)=>value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
const bullets=(value:string)=>lines(value).map(x=>'• '+x).join('\n');
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const url=(value:string)=>{let u:URL;try{u=new URL(value);}catch{throw new Error('Teljes http:// vagy https:// URL-t adj meg.');}if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error('A link csak http/https lehet, beágyazott belépési adat nélkül.');return u;};
const curr=(s:string)=>{const c=s.toUpperCase();if(!['HUF','EUR','USD'].includes(c))throw new Error('A pénznem HUF, EUR vagy USD lehet.');return c;};
const member=(value:string,options:string[],label:string)=>{const index=options.map(normalize).indexOf(normalize(value));if(index<0)throw new Error(`${label}: ${options.join(', ')} valamelyike szükséges.`);return options[index];};

/** RFC-style quoted fields; delimiter is selected outside quotes. Never silently drop malformed rows. */
export function parseTable(raw:string,columns:string[]):string[][] {
 const text=raw.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
 let inQuote=false;const counts:Record<string,number>={';':0,'\t':0,',':0};
 for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(inQuote&&text[i+1]==='"'){i++;continue;}inQuote=!inQuote;}if(!inQuote){if(ch==='\n')break;if(ch in counts)counts[ch]++;}}
 const delimiter=Object.keys(counts).sort((a,b)=>counts[b]-counts[a])[0];
 const result:string[][]=[];let row:string[]=[],cell='',quoted=false,closed=false;
 const addCell=()=>{row.push(cell.trim());cell='';closed=false;};
 const addRow=()=>{addCell();if(row.some(Boolean))result.push(row);row=[];};
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=ch;continue;}
  if(ch===delimiter){addCell();continue;}if(ch==='\n'){addRow();continue;}
  if(ch==='"'){if(cell.trim()||closed)throw new Error('Hibás idézőjel a táblázatban.');cell='';quoted=true;continue;}
  if(closed&&ch.trim())throw new Error('Az idézőjel után csak oszlopelválasztó következhet.');cell+=ch;
 }
 if(quoted)throw new Error('Lezáratlan idézőjel a táblázatban.');addRow();
 if(result[0]&&normalize(result[0][0])===normalize(columns[0]))result.shift();
 if(!result.length)throw new Error('Legalább egy adatsort adj meg a fejléc után.');
 if(result.length>500)throw new Error('Egyszerre legfeljebb 500 sor dolgozható fel.');
 result.forEach((r,i)=>{if(r.length!==columns.length)throw new Error(`${i+1}. adatsor: ${columns.length} oszlop szükséges, ${r.length} érkezett. Üres mezőnél is tartsd meg az elválasztót.`);if(!r[0])throw new Error(`${i+1}. adatsor: az első oszlop nem lehet üres.`);});return result;
}
export function validateInput(tool:Tool,input:ToolInput):ToolInput {
 const out:ToolInput={};for(const field of tool.fields){const rawValue=input[field.key]??'';if(typeof rawValue!=='string')throw new Error('Szöveges mezők szükségesek.');const value=rawValue.trim();if(field.required!==false&&!value)throw new Error(`Töltsd ki ezt a mezőt: ${field.label}.`);if(value.length>20000)throw new Error(`${field.label}: legfeljebb 20 000 karakter.`);if(value){if(field.type==='number')number(value,field.label,field.min??0,field.max??1e12);if(field.type==='date')day(value);if(field.type==='url')url(value);if(field.options&&!field.options.includes(value))throw new Error(`Válassz a listából: ${field.label}.`);}out[field.key]=value;}return out;
}
const result=(title:string,text:string,notes:string[]=[]):ToolResult=>({title,text,notes});
const table=(title:string,columns:string[],rows:string[][],notes:string[]=[]):ToolResult=>({title,columns,rows,notes,text:[title,'',columns.join('\t'),...rows.map(r=>r.join('\t')),...(notes.length?['',...notes]:[])].join('\n')});
export function runTool(id:string,raw:ToolInput):ToolResult {
 const tool=getTool(id),v=validateInput(tool,raw), read=(cols:string[])=>parseTable(v.items,cols);
 switch(id){
  case 'feladatrendezo':{
   const rows=read(['Feladat','Felelős','Határidő','Prioritás']).map(r=>{if(r[2])day(r[2]);const p=number(r[3],'Prioritás',1,3);if(!Number.isInteger(p))throw new Error('A prioritás 1, 2 vagy 3 lehet.');return r;});
   rows.sort((a,b)=>(a[2]||'9999').localeCompare(b[2]||'9999')||Number(a[3])-Number(b[3]));
   return table(tool.name,['Feladat','Felelős','Határidő','Prioritás','Jelzés'],rows.map(r=>[r[0],r[1]||'Nincs felelős',r[2]||'Nincs határidő',r[3],!r[2]?'Határidő szükséges':r[2]<v.today?'Lejárt':r[2]===v.today?'Ma esedékes':'Tervezett']),['Rendezés: előbb a határidő, azon belül a prioritás.']);
  }
  case 'hetitervezo':{
   const tasks=read(['Feladat','Perc']).map(r=>({name:r[0],minutes:number(r[1],'Feladat hossza',1,100000)})),capacity=number(v.capacity,'Napi időkeret',15,720);
   const days:string[]=[];let cursor=v.start;while(days.length<5){const week=new Date(day(cursor)).getUTCDay();if(week!==0&&week!==6)days.push(cursor);cursor=shift(cursor,1);}
   const used=days.map(()=>0);const rows=tasks.map(t=>{const i=used.findIndex(n=>n+t.minutes<=capacity);if(i<0)return ['Nem fér bele',t.name,fmt(t.minutes),'Külön időpont vagy bontás szükséges'];used[i]+=t.minutes;return [days[i],t.name,fmt(t.minutes),'Beosztva'];});
   return table(tool.name,['Nap','Feladat','Perc','Állapot'],rows,[...days.map((d,i)=>`${d}: ${fmt(used[i])} / ${fmt(capacity)} perc`),'A hétvégéket kihagyja. Ünnepnapokat, naptárfoglaltságot és feladatfüggőségeket nem ismer.']);
  }
  case 'megbeszeles':{
   const tasks=read(['Feladat','Felelős','Határidő']);tasks.forEach(r=>{if(r[2])day(r[2]);});
   return result(v.title,`${v.title}\n${v.date} · Résztvevők: ${v.people}\n\nDÖNTÉSEK\n${bullets(v.decisions)}\n\nVÁLLALÁSOK\n${tasks.map((r,i)=>`${i+1}. ${r[0]} — ${r[1]||'Felelős kijelölendő'} — ${r[2]||'Határidő egyeztetendő'}`).join('\n')}`,['A megadott jegyzeteket rendezi; nem készít hangfelvételből átiratot.']);
  }
  case 'heti-jelentes':return result(tool.name,`HETI ÖSSZEFOGLALÓ · ${v.period}\n\nELKÉSZÜLT (${lines(v.done).length})\n${bullets(v.done)}\n\nAKADÁLYOK ÉS DÖNTÉSEK\n${v.blocked?bullets(v.blocked):'Nincs megadott akadály.'}\n\nKÖVETKEZŐ LÉPÉSEK\n${bullets(v.next)}`);
  case 'erdeklodo-rendezo':{
   const rows=read(['Név','Elérhetőség','Státusz','Következő kapcsolat','Teendő']).map(r=>{r[2]=member(r[2],['új','folyamatban','lezárt'],'Státusz');if(r[3])day(r[3]);return [...r,r[2]==='lezárt'?'Lezárt':!r[3]?'Időpontot kell megadni':r[3]<v.today?'Elmaradt kapcsolat':r[3]===v.today?'Ma keresd':'Később'];});
   const rank=['Elmaradt kapcsolat','Ma keresd','Időpontot kell megadni','Később','Lezárt'];rows.sort((a,b)=>rank.indexOf(a[5])-rank.indexOf(b[5])||a[3].localeCompare(b[3]));return table(tool.name,['Név','Elérhetőség','Státusz','Következő kapcsolat','Teendő','Jelzés'],rows,['A megadott dátum és státusz alapján rendez. Nem küld üzenetet.']);
  }
  case 'kontakt-tisztito':{
   const rows=read(['Név','Email','Telefon']),map=new Map<string,string[]>();let duplicates=0,conflicts=0;const out:string[][]=[];
   for(const r of rows){r[1]=r[1].trim().toLowerCase();r[2]=r[2].replace(/[\s()-]/g,'');const key=r[1]||'row-'+out.length;
    const prior=map.get(key);if(prior){duplicates++;if(!prior[2])prior[2]=r[2];else if(r[2]&&prior[2]!==r[2]){prior[3]='Eltérő telefonszám; első megtartva';conflicts++;}if(normalize(prior[0])!==normalize(r[0])){prior[3]='Eltérő név; első megtartva';conflicts++;}continue;}
    const row=[...r,!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r[1])?'E-mail ellenőrzendő':'Formátum rendben'];map.set(key,row);out.push(row);
   }return table(tool.name,['Név','Email','Telefon','Jelzés'],out,[`${duplicates} ismétlődő e-mail-cím összevonva. ${conflicts} adateltérés jelölve.`,'Az e-mail-címek létezését és a telefonszámok érvényességét nem ellenőrzi.']);
  }
  case 'utanakovetes':return result(tool.name,`Tárgy: Egyeztetés – ${v.topic}\n\nKedves ${v.recipient}!\n\nSzeretnék visszatérni a korábbi egyeztetésünkre.\n\n${v.detail}\n\n${v.request}\n\nHa kérdésed merült fel, szívesen pontosítok.\n\nÜdvözlettel:\n${v.sender}`,['Sablonból készült vázlat. Küldés előtt ellenőrizd; az oldal nem küldi el.']);
  case 'ugyfelvalasz':return result(tool.name,`Tárgy: Válasz – ${v.topic}\n\nKedves ${v.recipient}!\n\nKöszönöm a megkeresésedet.\n\n${v.answer}\n\n${v.next}\n\nÜdvözlettel:\n${v.sender}`,['Kizárólag az általad megadott választ foglalja levélbe. Nem küldi el.']);
  case 'ajanlatkeszito':{
   let sum=0;const rows=read(['Tétel','Mennyiség','Egységár']).map(r=>{const quantity=number(r[1],'Mennyiség',0.001,1e6),unit=number(r[2],'Egységár',0,1e9),total=round(quantity*unit);if(total>1e12)throw new Error('A tétel értéke túl nagy.');sum+=total;return [r[0],fmt(quantity),fmt(unit),fmt(total)];});
   sum=round(sum);const discount=round(sum*number(v.discount)/100),net=round(sum-discount),tax=round(net*number(v.tax)/100);
   return table(`Ajánlati kalkuláció · ${v.client}`,['Tétel','Mennyiség',`Egységár (${v.currency})`,`Nettó érték (${v.currency})`],rows,[`Tételek: ${fmt(sum)} ${v.currency}`,`Kedvezmény (${v.discount}%): ${fmt(discount)} ${v.currency}`,`Kedvezményes nettó: ${fmt(net)} ${v.currency}`,`Adó (${v.tax}%): ${fmt(tax)} ${v.currency}`,`Végösszeg: ${fmt(round(net+tax))} ${v.currency}`,'Tételenként, majd a kedvezményt és adót két tizedesre kerekíti. Nem állít ki számlát.']);
  }
  case 'hatarido-figyelo':{
   const rows=read(['Partner','Azonosító','Összeg','Pénznem','Határidő','Állapot']).map(r=>{number(r[2],'Összeg',0.01);r[2]=fmt(number(r[2]));r[3]=curr(r[3]);day(r[4]);r[5]=member(r[5],['nyitott','fizetve'],'Állapot');return [...r,r[5]==='fizetve'?'Kiegyenlítve':r[4]<v.today?`${Math.round((day(v.today)-day(r[4]))/86400000)} nap késés`:r[4]===v.today?'Ma esedékes':'Később esedékes'];});
   rows.sort((a,b)=>Number(a[5]==='fizetve')-Number(b[5]==='fizetve')||a[4].localeCompare(b[4]));return table(tool.name,['Partner','Azonosító','Összeg','Pénznem','Határidő','Állapot','Jelzés'],rows,['A fizetési állapotot te adod meg; nincs banki kapcsolat.']);
  }
  case 'koltsegosszesito':{
   const groups=new Map<string,number>(),totals=new Map<string,number>();for(const r of read(['Megnevezés','Kategória','Összeg','Pénznem'])){if(!r[1])throw new Error('Minden kiadáshoz adj meg kategóriát.');const c=curr(r[3]),n=number(r[2],'Kiadás',0.01),key=JSON.stringify([r[1],c]);groups.set(key,(groups.get(key)||0)+n);totals.set(c,(totals.get(c)||0)+n);}
   return table(tool.name,['Kategória','Pénznem','Összeg'],[...groups].map(([key,n])=>[...JSON.parse(key) as string[],fmt(round(n))]),[...totals].map(([c,n])=>`Összesen: ${fmt(round(n))} ${c}`).concat('Különböző pénznemeket nem vált át és nem ad össze.'));
  }
  case 'elofizetesek':{
   const totals=new Map<string,number>();const rows=read(['Név','Díj','Pénznem','Gyakoriság']).map(r=>{const n=number(r[1],'Díj',0),c=curr(r[2]),frequency=member(r[3],['havi','éves'],'Gyakoriság'),annual=frequency==='havi'?n*12:n;totals.set(c,(totals.get(c)||0)+annual);return [r[0],c,frequency,fmt(n),fmt(annual/12),fmt(annual)];});return table(tool.name,['Név','Pénznem','Gyakoriság','Eredeti díj','Havi egyenérték','Éves egyenérték'],rows,[...[...totals].map(([c,n])=>`${c}: ${fmt(n/12)} / hó · ${fmt(n)} / év`),'Az egyenérték nem számlázási dátum vagy tényleges havi pénzmozgás.']);
  }
  case 'ingatlanhirdetes':return result(tool.name,`${v.offer} ${v.rooms} szobás ${v.kind} – ${v.location}\n\n${v.area} m² · ${v.rooms} szoba · ${v.price}\n\n${v.location} területén ${v.offer.toLowerCase()} egy ${v.area} m² alapterületű ${v.kind}.\n\nAZ INGATLAN JELLEMZŐI\n${bullets(v.facts)}\n\n${v.contact}`,['Csak a megadott jellemzőket használja. A hirdetési adatokat közzététel előtt ellenőrizd.']);
  case 'ingatlan-osszehasonlito':{
   const rows=read(['Név','Ár','Alapterület','Szobák']).map(r=>{const price=number(r[1],'Ár',1),area=number(r[2],'Alapterület',0.1,1e6),rooms=number(r[3],'Szobák',0.5,100);return {price,area,rooms,name:r[0]};}).sort((a,b)=>a.price/a.area-b.price/b.area);
   return table(tool.name,['Ingatlan',`Ár (${v.currency})`,'m²','Szobák',`${v.currency} / m²`,'Saját feltételek'],rows.map(r=>[r.name,fmt(r.price),fmt(r.area),fmt(r.rooms),fmt(r.price/r.area),r.price<=number(v.budget)&&r.area>=number(v.minArea)&&r.rooms>=number(v.minRooms)?'Megfelel':'Nem felel meg']),['Négyzetméterár szerint rendez. Az állapotot és a környéket nem értékeli; ez nem értékbecslés.']);
  }
  case 'kozossegi-posztok':return result(tool.name,`1. RÖVID VÁLTOZAT\n${v.topic}\n${v.audience}\n${lines(v.facts).join(' · ')}\n${v.cta}${v.url?'\n'+v.url:''}\n\n2. RÉSZLETES VÁLTOZAT\n${v.topic}\n\nKinek szól? ${v.audience}\n\nAmit érdemes tudni:\n${bullets(v.facts)}\n\n${v.cta}${v.url?'\n'+v.url:''}\n\n3. KÉRDÉSSEL INDÍTÓ VÁLTOZAT\nÉrdekel: ${v.topic}?\n\n${bullets(v.facts)}\n\n${v.cta}${v.url?'\n'+v.url:''}`,['Három szerkezeti sablon; nem generál új állításokat vagy platformeredmény-ígéreteket.']);
  case 'hirlevel':{
   const news=read(['Cím','Rövid leírás','Link']);news.forEach(r=>{if(r[2])url(r[2]);});return result(tool.name,`Tárgy: ${v.subject}\n\n${v.intro}\n\n${news.map(r=>`${r[0]}\n${r[1]}${r[2]?'\n'+r[2]:''}`).join('\n\n')}\n\n${v.cta}\n\n${v.sender}`,['A levél szövegét készíti elő. A címzetteket és a kiküldést a saját levelezőrendszered kezeli.']);
  }
  case 'kampanylink':{
   const slug=(s:string)=>normalize(s).replace(/\s+/g,'-');const rows=read(['Forrás','Médium','Tartalom']).map(r=>{if(!r[1])throw new Error('Minden csatornához adj meg médiumot.');const u=url(v.url);u.searchParams.set('utm_source',slug(r[0]));u.searchParams.set('utm_medium',slug(r[1]));u.searchParams.set('utm_campaign',slug(v.campaign));if(r[2])u.searchParams.set('utm_content',slug(r[2]));else u.searchParams.delete('utm_content');return [r[0],r[1],r[2],u.toString()];});return table(tool.name,['Forrás','Médium','Tartalom','Kampánylink'],rows,['A linkeket hozza létre; a forgalom méréséhez a céloldalon működő analitika szükséges.']);
  }
  case 'ellenorzolista':{
   const steps=read(['Lépés','Felelős','Akkor kész, ha']);return result(v.title,`${v.title}\n\nINDÍTÁS\n${v.trigger}\n\nELLENŐRZŐLISTA\n${steps.map((r,i)=>`☐ ${i+1}. ${r[0]}\n   Felelős: ${r[1]||'Kijelölendő'}\n   Akkor kész, ha: ${r[2]||'Pontosítandó'}`).join('\n\n')}`);
  }
  case 'keszletfigyelo':{
   const rows=read(['Termék','Jelenlegi','Minimum','Célkészlet','Csomagméret']).map(r=>{const current=number(r[1],'Készlet',0,1e9),min=number(r[2],'Minimum',0,1e9),target=number(r[3],'Célkészlet',0,1e9),pack=number(r[4],'Csomagméret',1,1e9);if(![current,min,target,pack].every(Number.isInteger))throw new Error('Egész darabszámok szükségesek.');if(target<min)throw new Error(`${r[0]}: a célkészlet nem lehet kisebb a minimumnál.`);const packs=current<min?Math.ceil((target-current)/pack):0;return [r[0],fmt(current),fmt(min),fmt(target),fmt(pack),fmt(packs),fmt(packs*pack),fmt(current+packs*pack)];});return table(tool.name,['Termék','Jelenlegi','Minimum','Cél','Csomagméret','Rendelendő csomag','Rendelendő darab','Várható készlet'],rows,['Csak a minimum alá csökkent készlethez számol rendelést. Nem rendel meg terméket.']);
  }
  case 'naptar-export':{
   const events=read(['Cím','Dátum','Kezdés','Perc','Helyszín']);const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
   const compact=(d:Date)=>d.toISOString().replace(/[-:]/g,'').slice(0,15);
   const hash=(s:string)=>{let h=2166136261;for(const ch of s)h=Math.imul(h^ch.charCodeAt(0),16777619);return (h>>>0).toString(16);};
   const body=events.map((r,i)=>{day(r[1]);if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(r[2]))throw new Error(`${i+1}. sor: a kezdés ÓÓ:PP formátumú legyen.`);const duration=number(r[3],'Időtartam',1,10080);if(!Number.isInteger(duration))throw new Error('Egész percet adj meg.');const start=new Date(`${r[1]}T${r[2]}:00Z`),end=new Date(start.getTime()+duration*60000);return ['BEGIN:VEVENT',`UID:${hash(r.join('|'))}-${i}@agentakademia.local`,'DTSTAMP:20260101T000000Z',`DTSTART:${compact(start)}`,`DTEND:${compact(end)}`,`SUMMARY:${escape(r[0])}`,`LOCATION:${escape(r[4])}`,'END:VEVENT'];}).flat();
   // Fold by UTF-8 byte length, preserving code points and the RFC 5545 75-octet limit.
   const fold=(s:string)=>{let out='',line='',bytes=0;for(const char of s){const count=new TextEncoder().encode(char).length;if(bytes+count>75){out+=line+'\r\n';line=' ';bytes=1;}line+=char;bytes+=count;}return out+line;};
   const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Agent Akademia//Daily tools 1.0//HU','CALSCALE:GREGORIAN',...body,'END:VCALENDAR'].map(fold).join('\r\n')+'\r\n';
   return {...table(tool.name,['Cím','Dátum','Kezdés','Perc','Helyszín'],events,['Időzóna nélküli helyi időpontok: importáláskor a naptárad időzónája érvényes.','A fájl nem küld meghívót. Ismételt importnál ellenőrizd az esetleges duplikációkat.']),file:{name:'agent-akademia-idopontok.ics',mime:'text/calendar;charset=utf-8',content}};
  }
  default:throw new Error('A segéd feldolgozója nem található.');
 }
}
export function resultCSV(r:ToolResult):string {
 const cell=(v:string)=>'"'+(/^[\s]*[=+@\-\t\r]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
 if(!r.columns||!r.rows)throw new Error('Ehhez az eredményhez nincs táblázat.');
 return '\uFEFF'+[r.columns,...r.rows].map(row=>row.map(cell).join(';')).join('\r\n');
}
