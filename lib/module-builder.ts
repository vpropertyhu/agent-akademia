export type DataKind = 'brief' | 'text' | 'audio' | 'image' | 'table' | 'document';
export type Family = 'inditas' | 'ertes' | 'alkotas' | 'ellenorzes' | 'atadas' | 'sajat';
export type Block = { id: string; name: string; verb: string; description: string; family: Family; inputs: DataKind[]; output: DataKind; icon: string; sample: string; needs?: string };
export type Piece = { uid: string; block: string; name?: string; children?: Piece[] };
export type SavedModule = { id: string; name: string; children: Piece[] };
export type Draft = { version: 1; title: string; pieces: Piece[]; modules: SavedModule[]; request?: string };
export const kinds: Record<DataKind, string> = { brief: 'A leírt feladat', text: 'Szöveg', audio: 'Hangfelvétel', image: 'Kép', table: 'Táblázat', document: 'Dokumentum' };
export const families: { id: Family; label: string; number: string }[] = [
 { id:'inditas',label:'Amiből dolgozzon',number:'01' },{ id:'ertes',label:'Olvasás és összefoglalás',number:'02' },{ id:'alkotas',label:'Írás, kép és hang',number:'03' },{ id:'ellenorzes',label:'Átnézés',number:'04' },{ id:'atadas',label:'Az eredmény formája',number:'05' },{ id:'sajat',label:'Elmentett lépések',number:'06' }
];
export const blocks: Block[] = [
 {id:'request',name:'Írd le, mit szeretnél',verb:'Pl. „Írj egy bemutatkozást.”',description:'Leírod, mit készítsen az AI, és kinek szóljon. Nem kell előre megírnod a kész szöveget.',family:'inditas',inputs:[],output:'brief',icon:'spark',sample:'Készíts egy rövid útmutatót az új kollégák első napjához.'},
 {id:'audio',name:'Hangfelvétel használata',verb:'Pl. egy megbeszélés felvétele',description:'Egy saját hangfelvételből dolgozna. A hangfájlt majd külön csatolod a választott AI-ban.',family:'inditas',inputs:[],output:'audio',icon:'audio',sample:'heti-egyeztetes.m4a · szemléltető hangfájl'},
 {id:'file',name:'Meglévő szöveg használata',verb:'Pl. egy jegyzet vagy hosszú levél',description:'A saját szövegedből dolgozik tovább. Ezt majd bemásolod a választott AI beszélgetésébe.',family:'inditas',inputs:[],output:'text',icon:'file',sample:'A találkozón megbeszéltük az új oldal indulását. Júlia írja a szöveget péntekig.'},
 {id:'schedule',name:'Ismétlés megadott időben',verb:'Pl. minden hétfőn reggel',description:'Ugyanazt a feladatot rendszeresen indítaná. Ezt itt még nem tudjuk beállítani.',family:'inditas',inputs:[],output:'brief',icon:'clock',sample:'Hétfő, 9:00 · heti összefoglaló kérése',needs:'Ismétlés beállítása egy erre alkalmas programban'},
 {id:'transcribe',name:'Hangfelvétel leírása',verb:'A beszélgetésből írott szöveg',description:'Leírja, mi hangzott el a felvételen. Ehhez a választott AI-nak tudnia kell hangot feldolgozni.',family:'ertes',inputs:['audio'],output:'text',icon:'audio',sample:'Júlia: Péntekig megírom az új oldal szövegét. Márk: Hétfőn átnézem a képeket.'},
 {id:'ocr',name:'Szöveg kiolvasása képről',verb:'Pl. egy lefotózott oldalról',description:'A képen látható betűket másolható szöveggé alakítja.',family:'ertes',inputs:['image'],output:'text',icon:'scan',sample:'Nyitvatartás: hétfő–péntek, 9:00–17:00.'},
 {id:'summarize',name:'Rövid összefoglaló',verb:'Egy hosszú szöveg lényege',description:'Röviden leírja a hosszabb szöveg legfontosabb pontjait.',family:'ertes',inputs:['text'],output:'text',icon:'align',sample:'A csapat az indulás előkészítéséről döntött. A szöveg péntekre, a képek ellenőrzése hétfőre készül el.'},
 {id:'extract',name:'Adatok kigyűjtése',verb:'Pl. nevek és dátumok táblázatba',description:'Kigyűjti a szövegből a kért neveket, dátumokat vagy teendőket, és táblázatba teszi őket.',family:'ertes',inputs:['text'],output:'table',icon:'table',sample:'Júlia | Oldalszöveg | Péntek\nMárk | Képek ellenőrzése | Hétfő'},
 {id:'read-document',name:'Dokumentum elolvasása',verb:'Pl. egy útmutató szövege',description:'Elolvassa a dokumentum szövegét, hogy utána összefoglalhassa vagy tovább dolgozhasson vele.',family:'ertes',inputs:['document'],output:'text',icon:'scan',sample:'Üdv a csapatban! Az első napon ismerkedj meg a munkatársaiddal és a közös eszközökkel.'},
 {id:'write',name:'Szövegírás',verb:'Pl. levél, bemutatkozás, bejegyzés',description:'Új szöveget ír arról, amit megadsz. Meglévő szöveg folytatására is használhatod.',family:'alkotas',inputs:['brief','text'],output:'text',icon:'pen',sample:'Üdv a csapatban!\nAz első napod a megismerkedésről szól. Kezdd egy közös kávéval, majd nézd át velünk a hét legfontosabb feladatait.'},
 {id:'tasks',name:'Teendőlista készítése',verb:'Mit kell elvégezni, és kinek?',description:'A leírásból vagy jegyzetből sorba szedi a teendőket. Csak megadott felelőst és határidőt használ.',family:'alkotas',inputs:['brief','text'],output:'text',icon:'list',sample:'1. Júlia: az oldalszöveg elkészítése péntekig.\n2. Márk: a képek ellenőrzése hétfőn.\n3. Közös egyeztetés az indulás előtt.'},
 {id:'translate',name:'Fordítás',verb:'Pl. magyar szöveg angolul',description:'Lefordítja a szöveget arra a nyelvre, amelyet megadsz.',family:'alkotas',inputs:['text'],output:'text',icon:'languages',sample:'Welcome to the team! Your first day is about getting to know each other.'},
 {id:'image',name:'Képkészítés',verb:'Leírod, mit lássunk a képen',description:'A leírásod alapján képet készítene. Ehhez képkészítésre képes AI vagy másik képkészítő program szükséges.',family:'alkotas',inputs:['brief','text'],output:'image',icon:'image',sample:'Kép helye · a látványpróba nem generál képet',needs:'Képkészítésre képes AI'},
 {id:'speak',name:'Szöveg felolvasása',verb:'Az írott szöveget hallgathatod',description:'Felolvasná a szöveget. Ehhez beszédet készítő program szükséges.',family:'alkotas',inputs:['text'],output:'audio',icon:'volume',sample:'Felolvasás helye · a látványpróba nem generál hangot',needs:'Beszédet készítő program'},
 {id:'table-text',name:'Táblázat elmagyarázása',verb:'Közérthető szöveg a számokról',description:'Szövegesen elmagyarázza a táblázat tartalmát és a megadott adatokat.',family:'alkotas',inputs:['table'],output:'text',icon:'pen',sample:'Két feladat került kiosztásra. Júlia péntekig készíti el az oldalszöveget, Márk hétfőn ellenőrzi a képeket.'},
 {id:'review',name:'Szöveg átnézése',verb:'Hibák és nehézkes mondatok',description:'Átnézi a megfogalmazást és a megadott elvárásokat. Az állítások igazságát forrás nélkül nem tudja igazolni.',family:'ellenorzes',inputs:['text'],output:'text',icon:'shield',sample:'Átnézett mintaszöveg: Üdv a csapatban! Az első napod a megismerkedésről szól.'},
 {id:'table-check',name:'Táblázat átnézése',verb:'Pl. hiányzik egy név vagy dátum?',description:'Megkeresi a táblázatból hiányzó adatokat, és jelzi, mit érdemes még ellenőrizni.',family:'ellenorzes',inputs:['table'],output:'table',icon:'shield',sample:'Név | Feladat | Határidő\nJúlia | Oldalszöveg | Péntek\nMárk | Képek ellenőrzése | Hétfő'},
 {id:'approve',name:'Mutassa meg, mielőtt folytatja',verb:'Átnézed, és te mondod rá az igent',description:'Azt kéri az AI-tól, hogy mutassa meg az eredményt, és várja meg a válaszodat. A beszélgetésben te követed, hogy megállt-e.',family:'ellenorzes',inputs:['text'],output:'text',icon:'hand',sample:'Jóváhagyásra váró mintaszöveg. A szemléltetésben nem történik valódi jóváhagyás.'},
 {id:'document',name:'Dokumentum készítése',verb:'Címekkel és bekezdésekkel',description:'Rendezett dokumentumot készítene a szövegből. Letölthető fájlhoz a választott AI-nak fájlt is kell tudnia készíteni.',family:'atadas',inputs:['text'],output:'document',icon:'file',sample:'Elkészült dokumentum helye · ez egy előre megírt minta'},
 {id:'report',name:'Beszámoló a táblázatból',verb:'Pl. heti feladatok összesítése',description:'A táblázatból áttekinthető beszámolót készítene. Letölthető fájlhoz fájlkészítésre képes AI szükséges.',family:'atadas',inputs:['table'],output:'document',icon:'chart',sample:'Heti feladatriport · 2 felelős · 2 teendő · szemléltető minta'},
 {id:'graphic',name:'Kép elrendezése',verb:'Pl. a kép egy szórólapon',description:'A képet egy megadott elrendezésbe helyezné. Ehhez külön képszerkesztő programot kell csatlakoztatni.',family:'atadas',inputs:['image'],output:'document',icon:'layout',sample:'Grafikai terv helye · nincs elkészített grafika',needs:'Csatlakoztatott képszerkesztő program'},
 {id:'save',name:'Mentés egy mappába',verb:'Pl. a Dokumentumok mappába',description:'A kész fájlt a kiválasztott mappába mentené. Az oldal még nem fér hozzá a géped mappáihoz.',family:'atadas',inputs:['document'],output:'document',icon:'folder',sample:'Mentési hely: az általad engedélyezett mappa',needs:'Hozzáférés a kiválasztott mappához'},
 {id:'send',name:'Üzenet megírása',verb:'Elkészíti, te döntesz a küldésről',description:'Előkészít egy elküldhető üzenetet. A valódi küldés külön beállítást és engedélyt igényel.',family:'atadas',inputs:['text'],output:'text',icon:'send',sample:'Üzenetvázlat helye · nem történt elküldés'}
];
export const recipes = [
 {id:'writer',name:'Írjon nekem egy szöveget',caption:'Megadod a témát, az AI megírja és átnézi.',blocks:['request','write','review','document']},
 {id:'meeting',name:'Készítsen teendőlistát a felvételből',caption:'A megbeszélésből leírt feladatok készülnek.',blocks:['audio','transcribe','tasks','document']},
 {id:'report',name:'Rendezze táblázatba a jegyzetem',caption:'Kigyűjti az adatokat, majd beszámolót készít.',blocks:['file','extract','table-check','report']},
 {id:'picture',name:'Készítsen képet az ötletemből',caption:'Ehhez képkészítő és képszerkesztő is kell.',blocks:['request','image','graphic']}
];
export const uid = () => globalThis.crypto?.randomUUID?.() || `p-${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const makePieces = (ids: string[]): Piece[] => ids.map(block=>({uid:uid(),block}));
export const initialDraft = (): Draft => ({version:1,title:'Az én segítőm',pieces:[],modules:[]});
export function definition(piece: Piece): Block {
 if (piece.children?.length) {
  const first=definition(piece.children[0]), last=definition(piece.children[piece.children.length-1]);
  return {id:piece.block,name:piece.name||'Elmentett lépések',verb:`${flatten(piece.children).length} lépés együtt`,description:'Több elmentett lépés egy kártyán. Külön is megnézheted őket, vagy másik segítő összeállításához használhatod.',family:'sajat',inputs:first.inputs,output:last.output,icon:'box',sample:last.sample,needs:[...new Set(flatten(piece.children).map(p=>definition(p).needs).filter(Boolean))].join(', ')||undefined};
 }
 const found=blocks.find(b=>b.id===piece.block);
 if(!found) throw new Error('Ismeretlen elem.');
 return found;
}
export function flatten(pieces: Piece[]): Piece[] { return pieces.flatMap(p=>p.children?.length?flatten(p.children):[p]); }
export function clonePieces(pieces: Piece[]): Piece[] { return pieces.map(p=>({...p,uid:uid(),...(p.children?{children:clonePieces(p.children)}:{})})); }
export function connection(previous: Piece|undefined, next: Piece): {ok:boolean;message:string;suggestion?:string} {
 const to=definition(next), from=previous?definition(previous):undefined;
 if(!from) return to.inputs.length?{ok:false,message:`Előbb meg kell adni, miből dolgozzon. Ehhez a lépéshez ${to.inputs.map(k=>kinds[k].toLocaleLowerCase('hu')).join(' vagy ')} kell.`}:{ok:true,message:'Ezzel kezdünk'};
 if(!to.inputs.length) return {ok:false,message:'Ez egy kezdő lépés. Tedd a sor elejére, vagy válassz másik feladatot.'};
 if(to.inputs.includes(from.output)) return {ok:true,message:kinds[from.output]};
 const bridge=blocks.find(b=>b.inputs.includes(from.output)&&to.inputs.includes(b.output)&&b.output!==from.output);
 return {ok:false,message:`Az előző lépés eredménye: ${kinds[from.output].toLocaleLowerCase('hu')}. A folytatáshoz ${to.inputs.map(k=>kinds[k].toLocaleLowerCase('hu')).join(' vagy ')} szükséges.`,suggestion:bridge?.id};
}
export function issues(pieces: Piece[]): string[] {
 return pieces.flatMap((p,i)=>{const link=connection(pieces[i-1],p);return [...(link.ok?[]:[link.message]),...(p.children?internalIssues(p.children):[])];});
}
function internalIssues(pieces: Piece[]): string[] { return pieces.flatMap((p,i)=>[...(i>0&&!connection(pieces[i-1],p).ok?[connection(pieces[i-1],p).message]:[]),...(p.children?internalIssues(p.children):[])]); }
export function groupPieces(draft: Draft, selected: string[], name: string): Draft {
 const indices=draft.pieces.map((p,i)=>selected.includes(p.uid)?i:-1).filter(i=>i>=0);
 if(indices.length<2||indices.some((n,i)=>i>0&&n!==indices[i-1]+1)) throw new Error('Válassz legalább két, egymás után következő lépést.');
 const children=draft.pieces.slice(indices[0],indices[indices.length-1]+1);
 if(internalIssues(children).length) throw new Error('Előbb javítsd a kijelölt lépések közötti hiányt.');
 const id=`custom-${uid()}`, module={id,name:name.trim().slice(0,60)||'Elmentett lépések',children:clonePieces(children)};
 return parseDraft(JSON.stringify({...draft,modules:[...draft.modules,module],pieces:[...draft.pieces.slice(0,indices[0]),{uid:uid(),block:id,name:module.name,children:clonePieces(children)},...draft.pieces.slice(indices[indices.length-1]+1)]}));
}
export function parseDraft(raw: string): Draft {
 if(raw.length>500_000) throw new Error('Ez a terv túl nagy. A határ 500 kB.');
 let d;try{d=JSON.parse(raw);}catch{throw new Error('Ezt a fájlt nem tudjuk megnyitni. Válassz egy itt letöltött összeállítást.');}let count=0;const ids=new Set<string>();
 function validPieces(value: unknown,depth=0): value is Piece[] {
  if(depth>8||!Array.isArray(value)||value.length>60)return false;
  return value.every(p=>{if(++count>500||!p||typeof p.uid!=='string'||p.uid.length>100||ids.has(p.uid)||typeof p.block!=='string'||p.block.length>100)return false;ids.add(p.uid);
   if(p.children!==undefined)return p.block.startsWith('custom-')&&typeof p.name==='string'&&p.name.length<=60&&Array.isArray(p.children)&&p.children.length>0&&validPieces(p.children,depth+1);
   return blocks.some(b=>b.id===p.block);
  });
 }
 if(d?.version!==1||typeof d.title!=='string'||d.title.length>100||!validPieces(d.pieces)||!Array.isArray(d.modules)||d.modules.length>30) throw new Error('Ezt a mentést nem tudjuk megnyitni. Hibás, vagy túl sok egymásba mentett lépést tartalmaz.');
 const moduleIds=new Set<string>();
 for(const m of d.modules){ids.clear();if(!m||typeof m.id!=='string'||!m.id.startsWith('custom-')||moduleIds.has(m.id)||m.id.length>100||typeof m.name!=='string'||m.name.length>60||!validPieces(m.children)||!m.children.length)throw new Error('Egy együtt mentett lépéssor hibás vagy kétszer szerepel a fájlban.');moduleIds.add(m.id);}
 if(d.request!==undefined&&(typeof d.request!=='string'||d.request.length>4000))throw new Error('A feladat leírása legfeljebb 4000 karakter lehet.');
 return {version:1,title:d.title,pieces:d.pieces,modules:d.modules,...(typeof d.request==='string'?{request:d.request}:{})};
}

/** Check both sides of an insertion, including the inside of a saved module. */
export function insertionConnection(pieces: Piece[], index: number, candidate: Piece) {
 if(index<0||index>pieces.length) return {ok:false,message:'Válassz egy helyet a lépések között.'};
 const inside=candidate.children?internalIssues(candidate.children):[];
 if(inside.length) return {ok:false,message:`Az együtt mentett lépések között javítás kell: ${inside[0]}`};
 const incoming=connection(pieces[index-1],candidate);
 if(!incoming.ok) return incoming;
 if(pieces[index]) {
  const outgoing=connection(candidate,pieces[index]);
  if(!outgoing.ok) return {ok:false,message:`Utána a(z) „${definition(pieces[index]).name}” következik. ${outgoing.message}`};
 }
 return {ok:true,message:'Ide kapcsolható'};
}

const nextOrder: Record<string,string[]> = {
 request:['write','tasks','image'],audio:['transcribe'],file:['summarize','extract','tasks'],
 write:['review','document','translate'],review:['document','approve','translate'],
 transcribe:['tasks','summarize','extract'],tasks:['document','review','extract'],
 extract:['table-check','report','table-text'],'table-check':['report','table-text'],
 image:['graphic','ocr'],graphic:['save','read-document'],document:['save','read-document'],
 summarize:['document','tasks','translate'],translate:['review','document','speak'],
 report:['save','read-document'],save:['read-document'],approve:['document','send']
};
/** A removed step leaves an editable slot; otherwise repair the first broken link. */
export function editingIndex(pieces:Piece[],preferred:number|null=null):number {
 if(preferred!==null&&Number.isFinite(preferred))return Math.max(0,Math.min(Math.trunc(preferred),pieces.length));
 const broken=pieces.findIndex((piece,index)=>!connection(pieces[index-1],piece).ok);
 return broken<0?pieces.length:broken;
}

export function suggestedBlocks(pieces: Piece[], index=editingIndex(pieces)): Block[] {
 const previous=pieces[index-1];
 const last=previous?flatten([previous]).at(-1)?.block:undefined;
 const order=last?nextOrder[last]||[]:['request','audio','file','schedule'];
 return blocks.filter(b=>b.id!==last&&insertionConnection(pieces,index,{uid:'candidate',block:b.id}).ok)
  .sort((a,b)=>{
   const score=(b:Block)=>{const rank=order.indexOf(b.id);return rank>=0?rank:(b.id===last?100:20);};
   return score(a)-score(b);
  });
}

export const stepLabels: Record<string,string> = {
 request:'Leírod, mit szeretnél',audio:'Csatolod a hangfelvételt',file:'Bemásolod a saját szöveged',schedule:'A megadott időben indulna',
 transcribe:'Leírja a felvételen elhangzottakat',ocr:'Kiolvassa a képen látható írást',summarize:'Leírja a szöveg lényegét',extract:'Kigyűjti a kért adatokat',
 'read-document':'Elolvassa a dokumentumot',write:'Megírja a kért szöveget',tasks:'Összeírja a teendőket',translate:'Lefordítja a szöveget',
 image:'Képet készítene a leírásodból',speak:'Felolvasná a szöveget','table-text':'Elmagyarázza a táblázatot',review:'Átnézi a szöveget',
 'table-check':'Átnézi a táblázatot',approve:'Megkérdezi, folytathatja-e',document:'Dokumentumot készítene',report:'Beszámolót készítene',
 graphic:'Elrendezné a képet',save:'A kiválasztott mappába mentené',send:'Megírja az üzenetet, amit elküldhetsz'
};

/** Offer a short, explicit conversion sequence for an imported broken link. */
export function repairSteps(pieces: Piece[], index:number):string[] {
 const next=pieces[index];if(!next||connection(pieces[index-1],next).ok)return [];
 const target=definition(next);if(!target.inputs.length)return [];
 const previous=pieces[index-1];
 const queue:{kind:DataKind|undefined;path:string[]}[]=[{kind:previous?definition(previous).output:undefined,path:[]}];
 const visited=new Set<DataKind|undefined>();
 while(queue.length){
  const state=queue.shift()!;if(visited.has(state.kind)||state.path.length>=3)continue;visited.add(state.kind);
  for(const b of blocks){
   if(state.kind?(!b.inputs.includes(state.kind)||b.output===state.kind):b.inputs.length>0)continue;
   const path=[...state.path,b.id];if(target.inputs.includes(b.output))return path;
   queue.push({kind:b.output,path});
  }
 }
 return [];
}

/** Repair a missing connection before appending; unfinished selections stay editable. */
export function placementIndex(pieces:Piece[],candidate:Piece,preferred=pieces.length):number {
 const bounded=Math.max(0,Math.min(preferred,pieces.length));
 const positions=[bounded,...pieces.map((_,index)=>index).filter(index=>index!==bounded)];
 for(const index of positions){
  if(pieces[index]&&!connection(pieces[index-1],pieces[index]).ok&&insertionConnection(pieces,index,candidate).ok)return index;
 }
 if(insertionConnection(pieces,bounded,candidate).ok)return bounded;
 for(let i=0;i<=pieces.length;i++)if(insertionConnection(pieces,i,candidate).ok)return i;
 return bounded;
}
