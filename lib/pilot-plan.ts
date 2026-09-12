/** The persisted plan is the source of truth for both the cards and execution. */
export const pilotModules = [
 {id:'search',name:'Utánanéz',detail:'Internetes forrásokat keres a témádhoz.',kind:'research'},
 {id:'write',name:'Megírja',detail:'Új, használható szöveget készít a kérésedből.',kind:'text'},
 {id:'summarize',name:'Összefoglalja',detail:'A már elkészült szövegből rövid változatot ír.',kind:'text'},
 {id:'tasks',name:'Teendőket készít',detail:'Konkrét lépésekre bontja a feladatot.',kind:'text'},
 {id:'translate',name:'Lefordítja',detail:'A szöveget a kérésedben megadott nyelvre fordítja.',kind:'text'},
 {id:'review',name:'Átnézi',detail:'Javítja a megfogalmazást és ellenőrzi a kért részeket.',kind:'text'},
 {id:'image',name:'Képet készít',detail:'Az elkészült szöveghez új illusztrációt alkot.',kind:'image'},
] as const;
export type PilotStep=typeof pilotModules[number]['id'];
export type PilotPlan={version:1;name:string;brief:string;steps:PilotStep[]};
export const pilotRecipes=[
 {name:'Cikk és illusztráció',brief:'Írj egy rövid, kezdőknek szóló cikket az erkélyen nevelhető fűszernövényekről, és készíts hozzá képet.',steps:['search','write','review','image']},
 {name:'Ötletből megvalósítás',brief:'Dolgozz ki egy hétvégi, kezdőknek szóló közösségi workshopot az AI mindennapi használatáról, majd készíts teendőlistát.',steps:['write','tasks','review']},
 {name:'Magyarból angol változat',brief:'Írj rövid bemutatkozást egy kezdőknek szóló AI-oktatási szolgáltatásról, majd fordítsd angolra. Árat és eredményígéretet ne találj ki.',steps:['write','review','translate']},
] satisfies {name:string;brief:string;steps:PilotStep[]}[];
export function planProblem(plan:PilotPlan):string|null{
 if(plan.version!==1||typeof plan.name!=='string'||!plan.name.trim()||plan.name.length>100||typeof plan.brief!=='string'||plan.brief.trim().length<3||plan.brief.length>6000)return 'Írd le, mit készítsen el a segítőd.';
 if(!Array.isArray(plan.steps)||!plan.steps.length||plan.steps.length>7||new Set(plan.steps).size!==plan.steps.length||plan.steps.some(id=>!pilotModules.some(m=>m.id===id)))return 'Válassz legalább egy lépést; minden lépés egyszer szerepelhet.';
 let text=false;
 for(let i=0;i<plan.steps.length;i++){
  const id=plan.steps[i];
  if(id==='search'&&i!==0)return 'Az Utánanéz lépést tedd a sor elejére.';
  if(['summarize','translate','review','image'].includes(id)&&!text)return 'Előbb válaszd a Megírja vagy a Teendőket készít lépést, hogy legyen szöveg.';
  if(id==='image'&&i!==plan.steps.length-1)return 'A Képet készít lépést tedd a sor végére.';
  if(id==='write'||id==='tasks')text=true;
 }
 return text?null:'A keresés mellé válaszd a Megírja vagy a Teendőket készít lépést is.';
}
export function validatePilotPlan(value:unknown):PilotPlan{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('A feladatsor nem olvasható.');
 const p=value as PilotPlan;const problem=planProblem(p);if(problem)throw Error(problem);
 return {version:1,name:p.name.trim(),brief:p.brief.trim(),steps:[...p.steps]};
}
export function builderToPilot(draft:{title:string;request?:string;pieces:{block:string;children?:unknown[]}[]}):PilotPlan{
 const ids:string[]=[];
 const walk=(pieces:typeof draft.pieces)=>{for(const p of pieces){if(p.children?.length)walk(p.children as typeof pieces);else ids.push(p.block);}};walk(draft.pieces);
 const unsupported=ids.filter(id=>!['request','document',...pilotModules.map(m=>m.id)].includes(id));
 if(unsupported.length)throw Error('Ebben a tervben még nem futtatható lépés is van. A privát próbában a hét elkészült képességből állíthatsz össze segítőt.');
 const steps=ids.filter(id=>id!=='request'&&id!=='document') as PilotStep[];
 return validatePilotPlan({version:1,name:draft.title,brief:draft.request||'',steps});
}
