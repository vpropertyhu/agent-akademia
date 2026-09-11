import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {dailyTools,getTool,sampleInput,runTool,parseTable,resultCSV,day} from '../public/letoltes/agent-engine.mjs';
import {createRunner} from '../.sites-runtime/agent-kit/run-agent.mjs';
const example=id=>sampleInput(getTool(id),'2026-09-11');
assert.equal(dailyTools.length,20);assert.equal(new Set(dailyTools.map(t=>t.id)).size,20);
for(const tool of dailyTools){const r=runTool(tool.id,example(tool.id));assert.ok(r.text.length>20,tool.id);assert.ok(!r.text.includes('NaN'),tool.id);if(r.columns)assert.ok(r.rows.every(row=>row.length===r.columns.length),tool.id);}
assert.deepEqual(parseTable('Név;Email;Telefon\r\n"Kiss; Anna";anna@example.com;"+36 30"',['Név','Email','Telefon']),[['Kiss; Anna','anna@example.com','+36 30']]);
assert.deepEqual(parseTable('Name,Value\n"Line\none","a""b"',['Name','Value']),[['Line\none','a"b']]);
assert.deepEqual(parseTable('Név\tEmail\tTelefon\nAnna\ta@b.hu\t',['Név','Email','Telefon']),[['Anna','a@b.hu','']]);
assert.throws(()=>parseTable('Név;Email;Telefon\nAnna;"unclosed;',['Név','Email','Telefon']));
assert.throws(()=>parseTable('Név;Email;Telefon\nAnna;a@b.hu',['Név','Email','Telefon']));
assert.throws(()=>runTool('kontakt-tisztito',{items:9}),/Szöveges/);
assert.throws(()=>day('2026-02-29'));assert.doesNotThrow(()=>day('2028-02-29'));
assert.throws(()=>runTool('feladatrendezo',{...example('feladatrendezo'),items:'Hibás;Anna;2026-02-30;1'}));
assert.throws(()=>runTool('feladatrendezo',{...example('feladatrendezo'),items:'Hibás;Anna;2026-09-11;1.5'}));
const tasks=runTool('feladatrendezo',{items:'Későbbi;A;2026-09-12;1\nSürgős;B;2026-09-11;1\nMa;C;2026-09-11;3\nElmaradt;D;2026-09-10;3\nNyitott;E;;2',today:'2026-09-11'});assert.deepEqual(tasks.rows.map(r=>r[0]),['Elmaradt','Sürgős','Ma','Későbbi','Nyitott']);
const week=runTool('hetitervezo',{items:'A;240\nB;240\nNagy;800',capacity:'240',start:'2026-09-12'});assert.equal(week.rows[0][0],'2026-09-14');assert.equal(week.rows[1][0],'2026-09-15');assert.equal(week.rows[2][0],'Nem fér bele');
const quote=runTool('ajanlatkeszito',{...example('ajanlatkeszito'),items:'Terv;2;100,50',discount:'10',tax:'20'});assert.ok(quote.notes.includes('Végösszeg: 217,08 HUF'));assert.ok(quote.rows[0].includes('201'));
const expenses=runTool('koltsegosszesito',{items:'A;Iroda;100;HUF\nB;Iroda;10;EUR\nC;Iroda;50;HUF'});assert.equal(expenses.rows.length,2);assert.equal(expenses.rows[0][2],'150');
const stock=runTool('keszletfigyelo',{items:'A;2;5;12;5\nB;5;5;12;5'});assert.equal(stock.rows[0][5],'2');assert.equal(stock.rows[0][7],'12');assert.equal(stock.rows[1][5],'0');assert.throws(()=>runTool('keszletfigyelo',{items:'A;1;10;5;1'}));
const contacts=runTool('kontakt-tisztito',{items:'Anna; A@B.HU ;\nAnna;a@b.hu;+36 30\nHibás;rossz;'});assert.equal(contacts.rows.length,2);assert.equal(contacts.rows[0][2],'+3630');assert.equal(contacts.rows[1][3],'E-mail ellenőrzendő');
const lead=runTool('erdeklodo-rendezo',{items:'A;a@b.hu;lezárt;2026-01-01;Kész\nB;b@b.hu;új;2026-09-10;Hívás',today:'2026-09-11'});assert.equal(lead.rows[0][0],'B');
assert.throws(()=>runTool('hatarido-figyelo',{items:'A;S1;100;GBP;2026-09-11;nyitott',today:'2026-09-11'}));
const link=runTool('kampanylink',{url:'https://example.com/page?x=1&utm_content=old#section',campaign:'Őszi Nyílt Nap',items:'Hírlevél;email;'});const u=new URL(link.rows[0][3]);assert.equal(u.searchParams.get('x'),'1');assert.equal(u.searchParams.get('utm_campaign'),'oszi-nyilt-nap');assert.equal(u.searchParams.get('utm_content'),null);assert.equal(u.hash,'#section');
assert.throws(()=>runTool('kampanylink',{url:'javascript:alert(1)',campaign:'x',items:'A;B;'}));
const injection=resultCSV({columns:['A'],rows:[['=1+1'],['  @SUM(A1)'],['Normal "value"']],notes:[],title:'x',text:'x'});assert.ok(injection.includes('"\'=1+1"'));assert.ok(injection.includes('"\'  @'));assert.ok(injection.includes('"Normal ""value"""'));
const cal=runTool('naptar-export',{items:`${'Árvíztűrő '.repeat(15)}, esemény;2026-12-31;23:30;90;Iroda`});assert.ok(cal.file.content.includes('DTEND:20270101T010000'));assert.ok(cal.file.content.includes('\\,'));assert.ok(cal.file.content.split('\r\n').every(l=>Buffer.byteLength(l)<=75));assert.throws(()=>runTool('naptar-export',{items:'A;2026-09-11;24:00;30;'}));
console.log('PASS: all 20 real processors, CSV quoting/delimiters, dates, input boundaries, task priorities, weekday capacity, discounts/tax, currency separation, contact duplicates, stock rounding, UTM preservation, ICS folding/rollover, spreadsheet injection.');

const temp=await fs.mkdtemp(path.join(os.tmpdir(),'agent-akademia-'));
try{
 const inputFile=path.join(temp,'input.csv'),configFile=path.join(temp,'config.json'),outputDirectory=path.join(temp,'output');
 const config={version:1,toolId:'keszletfigyelo',inputFile,outputDirectory,trigger:{mode:'change',pollSeconds:60},input:{}};
 await fs.writeFile(configFile,JSON.stringify(config));await fs.writeFile(inputFile,'Termék;Jelenlegi;Minimum;Célkészlet;Csomagméret\nPapír;2;5;12;5');
 let runner=await createRunner(configFile,{logger:()=>{}});const now=new Date(2026,8,11,9);let r=await runner.tick({now});assert.equal(r.status,'completed');const initialDir=r.directory;
 assert.equal((await runner.tick({now})).status,'unchanged');
 runner=await createRunner(configFile,{logger:()=>{}});assert.equal((await runner.tick({now})).status,'unchanged','dedupe survives restart');
 const before=await fs.readFile(path.join(outputDirectory,'legutobbi.json'),'utf8');await fs.writeFile(inputFile,'hibás');assert.equal((await runner.tick({now})).status,'error');assert.equal(await fs.readFile(path.join(outputDirectory,'legutobbi.json'),'utf8'),before);assert.ok((await fs.readFile(path.join(initialDir,'eredmeny.txt'),'utf8')).includes('Papír'));
 await fs.writeFile(inputFile,'Papír;1;5;12;5');assert.equal((await runner.tick({now})).status,'completed');assert.equal((await runner.tick({now:new Date(2026,8,12,9)})).status,'completed','date refresh without input change');
 const daily={...config,outputDirectory:path.join(temp,'daily'),trigger:{mode:'daily',time:'08:00',pollSeconds:60}};await fs.writeFile(configFile,JSON.stringify(daily));runner=await createRunner(configFile,{logger:()=>{}});assert.equal((await runner.tick({now:new Date(2026,8,11,7)})).status,'not-due');assert.equal((await runner.tick({now})).status,'completed');assert.equal((await runner.tick({now})).status,'not-due');
 await fs.writeFile(path.join(temp,'engine.mjs'),'');
 execFileSync(process.execPath,[path.resolve('.sites-runtime/agent-kit/run-agent.mjs'),configFile,'--once'],{stdio:'pipe'});await assert.rejects(fs.access(configFile+'.lock'));
 console.log('PASS: actual file automation, persisted retry deduplication, day rollover, daily schedule/catch-up, malformed-input preservation/recovery, CLI one-shot execution and lock cleanup.');
}finally{await fs.rm(temp,{recursive:true,force:true});}
