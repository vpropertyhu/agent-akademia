export type DataKind = 'brief' | 'text' | 'audio' | 'image' | 'table' | 'document';
export type Family = 'inditas' | 'ertes' | 'alkotas' | 'ellenorzes' | 'atadas' | 'sajat';
export type Block = { id: string; name: string; verb: string; description: string; family: Family; inputs: DataKind[]; output: DataKind; icon: string; sample: string; needs?: string };
export type Piece = { uid: string; block: string; name?: string; children?: Piece[] };
export type SavedModule = { id: string; name: string; children: Piece[] };
export type Draft = { version: 1; title: string; pieces: Piece[]; modules: SavedModule[] };
export const kinds: Record<DataKind, string> = { brief: 'Kérés', text: 'Szöveg', audio: 'Hang', image: 'Kép', table: 'Adatok', document: 'Dokumentum' };
export const families: { id: Family; label: string; number: string }[] = [
 { id:'inditas',label:'Elindít',number:'01' },{ id:'ertes',label:'Megért',number:'02' },{ id:'alkotas',label:'Alkot',number:'03' },{ id:'ellenorzes',label:'Ellenőriz',number:'04' },{ id:'atadas',label:'Átad',number:'05' },{ id:'sajat',label:'Saját kockák',number:'06' }
];
export const blocks: Block[] = [
 {id:'request',name:'Kérést kap',verb:'A te ötleted',description:'Egy mondatban megadod, mi készüljön. Ez indítja el az összeállítást.',family:'inditas',inputs:[],output:'brief',icon:'spark',sample:'Készíts egy rövid útmutatót az új kollégák első napjához.'},
 {id:'audio',name:'Hangot kap',verb:'Egy felvételből indul',description:'Egy általad kiválasztott hangfelvétellel indít.',family:'inditas',inputs:[],output:'audio',icon:'audio',sample:'heti-egyeztetes.m4a · szemléltető hangfájl'},
 {id:'file',name:'Szöveget kap',verb:'Egy fájlból indul',description:'Egy kiválasztott szöveg tartalmát adja tovább.',family:'inditas',inputs:[],output:'text',icon:'file',sample:'A találkozón megbeszéltük az új oldal indulását. Júlia írja a szöveget péntekig.'},
 {id:'schedule',name:'Időre indul',verb:'Ismétlődő kérés',description:'Egy előre beállított kérést indítana el rendszeresen.',family:'inditas',inputs:[],output:'brief',icon:'clock',sample:'Hétfő, 9:00 · heti összefoglaló kérése',needs:'Ütemező bekötése'},
 {id:'transcribe',name:'Hangot átír',verb:'Hallgat → leír',description:'A hangfelvételből olvasható szöveget készít.',family:'ertes',inputs:['audio'],output:'text',icon:'audio',sample:'Júlia: Péntekig megírom az új oldal szövegét. Márk: Hétfőn átnézem a képeket.'},
 {id:'ocr',name:'Képet elolvas',verb:'Kép → szöveg',description:'A képen szereplő írást szöveggé alakítja.',family:'ertes',inputs:['image'],output:'text',icon:'scan',sample:'Nyitvatartás: hétfő–péntek, 9:00–17:00.'},
 {id:'summarize',name:'Összefoglal',verb:'Kiemeli a lényeget',description:'A hosszabb szövegből rövid, áttekinthető összefoglalót ír.',family:'ertes',inputs:['text'],output:'text',icon:'align',sample:'A csapat az indulás előkészítéséről döntött. A szöveg péntekre, a képek ellenőrzése hétfőre készül el.'},
 {id:'extract',name:'Adatokat kiemel',verb:'Szöveg → táblázat',description:'Neveket, dátumokat és feladatokat emel ki rendezett adatokként.',family:'ertes',inputs:['text'],output:'table',icon:'table',sample:'Júlia | Oldalszöveg | Péntek\nMárk | Képek ellenőrzése | Hétfő'},
 {id:'read-document',name:'Dokumentumot olvas',verb:'Dokumentum → szöveg',description:'Egy dokumentumból kinyeri a feldolgozható szöveget.',family:'ertes',inputs:['document'],output:'text',icon:'scan',sample:'Üdv a csapatban! Az első napon ismerkedj meg a munkatársaiddal és a közös eszközökkel.'},
 {id:'write',name:'Szöveget ír',verb:'Ötletből tartalom',description:'A kérésből új szöveget hoz létre, vagy egy beérkező szöveg alapján tovább dolgozik.',family:'alkotas',inputs:['brief','text'],output:'text',icon:'pen',sample:'Üdv a csapatban!\nAz első napod a megismerkedésről szól. Kezdd egy közös kávéval, majd nézd át velünk a hét legfontosabb feladatait.'},
 {id:'tasks',name:'Feladatlistát ír',verb:'Gondolatból teendő',description:'Az elhangzottak vagy a kérés alapján konkrét teendőket fogalmaz meg.',family:'alkotas',inputs:['brief','text'],output:'text',icon:'list',sample:'1. Júlia: az oldalszöveg elkészítése péntekig.\n2. Márk: a képek ellenőrzése hétfőn.\n3. Közös egyeztetés az indulás előtt.'},
 {id:'translate',name:'Lefordít',verb:'Más nyelven folytatja',description:'A szöveget a választott nyelvre fordítja.',family:'alkotas',inputs:['text'],output:'text',icon:'languages',sample:'Welcome to the team! Your first day is about getting to know each other.'},
 {id:'image',name:'Képet alkot',verb:'Ötletből kép',description:'A szöveges leírásból új képet generálna.',family:'alkotas',inputs:['brief','text'],output:'image',icon:'image',sample:'Kép helye · a látványpróba nem generál képet',needs:'Képgeneráló szolgáltatás'},
 {id:'speak',name:'Felolvassa',verb:'Szöveg → hang',description:'Az elkészült szövegből beszédet hozna létre.',family:'alkotas',inputs:['text'],output:'audio',icon:'volume',sample:'Felolvasás helye · a látványpróba nem generál hangot',needs:'Beszédgeneráló szolgáltatás'},
 {id:'table-text',name:'Adatokból ír',verb:'Táblázat → történet',description:'A rendezett adatokból érthető jelentést készít.',family:'alkotas',inputs:['table'],output:'text',icon:'pen',sample:'Két feladat került kiosztásra. Júlia péntekig készíti el az oldalszöveget, Márk hétfőn ellenőrzi a képeket.'},
 {id:'review',name:'Szöveget ellenőriz',verb:'Egy második szem',description:'Átnézi a szöveg érthetőségét és a megadott szempontokat. Tényellenőrzést forrás nélkül nem ígér.',family:'ellenorzes',inputs:['text'],output:'text',icon:'shield',sample:'Átnézett mintaszöveg: Üdv a csapatban! Az első napod a megismerkedésről szól.'},
 {id:'table-check',name:'Adatokat ellenőriz',verb:'Megkeresi a hiányt',description:'A táblázatból hiányzó mezőket keresi meg.',family:'ellenorzes',inputs:['table'],output:'table',icon:'shield',sample:'Név | Feladat | Határidő\nJúlia | Oldalszöveg | Péntek\nMárk | Képek ellenőrzése | Hétfő'},
 {id:'approve',name:'Jóváhagyást kér',verb:'Itt te döntesz',description:'Megállítaná a valódi futást, hogy az eredményt átnézhesd és elfogadhasd.',family:'ellenorzes',inputs:['text'],output:'text',icon:'hand',sample:'Jóváhagyásra váró mintaszöveg. A szemléltetésben nem történik valódi jóváhagyás.'},
 {id:'document',name:'Dokumentumba tesz',verb:'Kész anyaggá rendezi',description:'A szöveget címmel, bekezdésekkel és egységes elrendezéssel dokumentummá alakítja.',family:'atadas',inputs:['text'],output:'document',icon:'file',sample:'Elkészült dokumentum helye · ez egy előre megírt minta'},
 {id:'report',name:'Riportba rendezi',verb:'Adatokból dokumentum',description:'A táblázatos adatokat áttekinthető dokumentumba rendezi.',family:'atadas',inputs:['table'],output:'document',icon:'chart',sample:'Heti feladatriport · 2 felelős · 2 teendő · szemléltető minta'},
 {id:'graphic',name:'Grafikába rendezi',verb:'Képből kész felület',description:'A képet egy grafikai sablonba helyezné.',family:'atadas',inputs:['image'],output:'document',icon:'layout',sample:'Grafikai terv helye · nincs elkészített grafika',needs:'Grafikai szerkesztő bekötése'},
 {id:'save',name:'Fájlba ment',verb:'A kijelölt helyre kerül',description:'A dokumentumot a felhasználó által engedélyezett helyre mentené.',family:'atadas',inputs:['document'],output:'document',icon:'folder',sample:'Mentési hely: az általad engedélyezett mappa',needs:'Fájlrendszer-kapcsolat'},
 {id:'send',name:'Elküldésre előkészít',verb:'Átadás előtt megáll',description:'A szöveget üzenetként előkészítené. Küldéshez külön kapcsolat és engedély szükséges.',family:'atadas',inputs:['text'],output:'text',icon:'send',sample:'Üzenetvázlat helye · nem történt elküldés',needs:'Üzenetküldő kapcsolat'}
];
export const recipes = [
 {id:'writer',name:'Ötletből kész anyag',caption:'Kérés → írás → ellenőrzés → dokumentum',blocks:['request','write','review','document']},
 {id:'meeting',name:'Hangból teendők',caption:'Hang → átirat → feladatlista → dokumentum',blocks:['audio','transcribe','tasks','document']},
 {id:'report',name:'Szövegből riport',caption:'Szöveg → adatkinyerés → ellenőrzés → riport',blocks:['file','extract','table-check','report']},
 {id:'picture',name:'Ötletből grafika',caption:'Kérés → képalkotás → grafikai terv',blocks:['request','image','graphic']}
];
export const uid = () => globalThis.crypto?.randomUUID?.() || `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const makePieces = (ids: string[]): Piece[] => ids.map(block=>({uid:uid(),block}));
export const initialDraft = (): Draft => ({version:1,title:'Ötletből kész anyag',pieces:recipes[0].blocks.map((block,i)=>({uid:`first-${i}`,block})),modules:[]});
export function definition(piece: Piece): Block {
 if (piece.children?.length) {
  const first=definition(piece.children[0]), last=definition(piece.children[piece.children.length-1]);
  return {id:piece.block,name:piece.name||'Saját modul',verb:`${flatten(piece.children).length} képesség egy kockában`,description:'Saját összeállítás. Belenézhetsz, szétnyithatod, és másik agentbe is beillesztheted.',family:'sajat',inputs:first.inputs,output:last.output,icon:'box',sample:last.sample,needs:[...new Set(flatten(piece.children).map(p=>definition(p).needs).filter(Boolean))].join(', ')||undefined};
 }
 const found=blocks.find(b=>b.id===piece.block);
 if(!found) throw new Error('Ismeretlen kocka.');
 return found;
}
export function flatten(pieces: Piece[]): Piece[] { return pieces.flatMap(p=>p.children?.length?flatten(p.children):[p]); }
export function clonePieces(pieces: Piece[]): Piece[] { return pieces.map(p=>({...p,uid:uid(),...(p.children?{children:clonePieces(p.children)}:{})})); }
export function connection(previous: Piece|undefined, next: Piece): {ok:boolean;message:string;suggestion?:string} {
 const to=definition(next), from=previous?definition(previous):undefined;
 if(!from) return to.inputs.length?{ok:false,message:`Indító kocka kell: ${to.inputs.map(k=>kinds[k].toLowerCase()).join(' vagy ')} szükséges.`}:{ok:true,message:'Innen indul'};
 if(!to.inputs.length) return {ok:false,message:'Az indító kocka az összeállítás elejére kerülhet.'};
 if(to.inputs.includes(from.output)) return {ok:true,message:kinds[from.output]};
 const bridge=blocks.find(b=>b.inputs.includes(from.output)&&to.inputs.includes(b.output)&&b.output!==from.output);
 return {ok:false,message:`${kinds[from.output]} érkezik, ${to.inputs.map(k=>kinds[k].toLowerCase()).join(' vagy ')} kell.`,suggestion:bridge?.id};
}
export function issues(pieces: Piece[]): string[] {
 return pieces.flatMap((p,i)=>{const link=connection(pieces[i-1],p);return [...(link.ok?[]:[link.message]),...(p.children?internalIssues(p.children):[])];});
}
function internalIssues(pieces: Piece[]): string[] { return pieces.flatMap((p,i)=>[...(i>0&&!connection(pieces[i-1],p).ok?[connection(pieces[i-1],p).message]:[]),...(p.children?internalIssues(p.children):[])]); }
export function groupPieces(draft: Draft, selected: string[], name: string): Draft {
 const indices=draft.pieces.map((p,i)=>selected.includes(p.uid)?i:-1).filter(i=>i>=0);
 if(indices.length<2||indices.some((n,i)=>i>0&&n!==indices[i-1]+1)) throw new Error('Legalább két, egymás melletti kockát válassz.');
 const children=draft.pieces.slice(indices[0],indices[indices.length-1]+1);
 if(internalIssues(children).length) throw new Error('Előbb illeszd össze a kijelölt kockákat.');
 const id=`custom-${uid()}`, module={id,name:name.trim().slice(0,60)||'Saját modul',children:clonePieces(children)};
 return parseDraft(JSON.stringify({...draft,modules:[...draft.modules,module],pieces:[...draft.pieces.slice(0,indices[0]),{uid:uid(),block:id,name:module.name,children:clonePieces(children)},...draft.pieces.slice(indices[indices.length-1]+1)]}));
}
export function parseDraft(raw: string): Draft {
 if(raw.length>500_000) throw new Error('Ez a terv túl nagy. A határ 500 kB.');
 let d;try{d=JSON.parse(raw);}catch{throw new Error('A fájl nem érvényes JSON-terv.');}let count=0;const ids=new Set<string>();
 function validPieces(value: unknown,depth=0): value is Piece[] {
  if(depth>8||!Array.isArray(value)||value.length>60)return false;
  return value.every(p=>{if(++count>500||!p||typeof p.uid!=='string'||p.uid.length>100||ids.has(p.uid)||typeof p.block!=='string'||p.block.length>100)return false;ids.add(p.uid);
   if(p.children!==undefined)return p.block.startsWith('custom-')&&typeof p.name==='string'&&p.name.length<=60&&Array.isArray(p.children)&&p.children.length>0&&validPieces(p.children,depth+1);
   return blocks.some(b=>b.id===p.block);
  });
 }
 if(d?.version!==1||typeof d.title!=='string'||d.title.length>100||!validPieces(d.pieces)||!Array.isArray(d.modules)||d.modules.length>30) throw new Error('A terv hibás vagy túl nagy. Legfeljebb 30 saját modul, 8 beágyazás és 500 tárolt kocka használható.');
 const moduleIds=new Set<string>();
 for(const m of d.modules){ids.clear();if(!m||typeof m.id!=='string'||!m.id.startsWith('custom-')||moduleIds.has(m.id)||m.id.length>100||typeof m.name!=='string'||m.name.length>60||!validPieces(m.children)||!m.children.length)throw new Error('Hibás vagy ismétlődő saját modul.');moduleIds.add(m.id);}
 return {version:1,title:d.title,pieces:d.pieces,modules:d.modules};
}
