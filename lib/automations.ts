export const automations=[
 {toolId:'hatarido-figyelo',name:'Fizetési határidő-figyelő',decision:'Lejárt, ma esedékes és későbbi tételek különválasztása.'},
 {toolId:'erdeklodo-rendezo',name:'Érdeklődő-utánkövető',decision:'Az elmaradt és ma esedékes kapcsolatfelvételek előresorolása.'},
 {toolId:'keszletfigyelo',name:'Készlet-utánrendelő',decision:'Minimum alatti termékek és csomagméretre kerekített rendelési mennyiségek.'},
 {toolId:'feladatrendezo',name:'Napi feladatrendező',decision:'Határidő és prioritás alapján rendezett napi feladatlista.'},
 {toolId:'koltsegosszesito',name:'Költségjelentő',decision:'Kiadások összesítése kategóriánként, pénznemenként külön.'},
 {toolId:'kontakt-tisztito',name:'Kontaktlista-karbantartó',decision:'Ismétlődő e-mail-címek összevonása és hibás címek megjelölése.'},
 {toolId:'elofizetesek',name:'Előfizetés-jelentő',decision:'Havi és éves előfizetési összegek kiszámítása.'},
 {toolId:'naptar-export',name:'Naptárfájl-frissítő',decision:'Az időpontlista átalakítása importálható ICS-naptárfájllá.'},
];
export function automationConfig(toolId:string,mode:'change'|'daily'='change',time='08:00'){
 return {version:1,toolId,inputFile:`bemenet/${toolId}.csv`,outputDirectory:`eredmenyek/${toolId}`,trigger:{mode,time,pollSeconds:60},input:toolId==='feladatrendezo'||toolId==='hatarido-figyelo'||toolId==='erdeklodo-rendezo'?{today:'@today'}:{}};
}
