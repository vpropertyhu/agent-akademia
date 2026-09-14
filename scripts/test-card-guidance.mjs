// Real composition rules; no network, credentials or mock AI responses needed.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const asModule = text => 'data:text/javascript;base64,' + Buffer.from(stripTypeScriptTypes(text)).toString('base64');
const source = file => readFileSync(new URL('../lib/' + file, import.meta.url), 'utf8');
const pilotURL = asModule(source('pilot-plan.ts'));
const builderURL = asModule(source('module-builder.ts'));
const guideURL = asModule(source('card-guidance.ts').replace("'./pilot-plan'", JSON.stringify(pilotURL)).replace("'./module-builder'", JSON.stringify(builderURL)));
const {pilotModules, planProblem, builderToPilot} = await import(pilotURL);
const {blocks, makePieces, initialDraft, groupPieces, issues} = await import(builderURL);
const {pilotSelection, addPilotCard, orderedCards, builderSelection, builderCardHelp, builderRepairCards} = await import(guideURL);
const valid = steps => planProblem({version:1,name:'Teszt',brief:'Írj egy szöveget.',steps});

assert.equal(pilotSelection([]).missingBase, true);
assert.equal(valid(['write']), null);
assert.equal(valid(['tasks']), null);
assert.ok(pilotSelection(['image']).problem);
assert.deepEqual(addPilotCard(['image'], 'write'), ['write', 'image']);
assert.deepEqual(addPilotCard(['write','image'], 'search'), ['search','write','image']);
assert.deepEqual(addPilotCard(['write','image'], 'review'), ['write','review','image']);
assert.deepEqual(addPilotCard(['write'], 'write'), ['write']);
assert.equal(pilotSelection(['write','search']).orderWrong, true);
assert.equal(pilotSelection(['write','image','review']).orderWrong, true);
assert.equal(valid(orderedCards(['translate','search','image','write','review'])), null);

// Every selection becomes valid by adding an offered base, regardless of click order.
// Removing a base exposes the dependency again, instead of freezing the editor.
let cases = 0;
for(let mask=0;mask<128;mask++) {
 const selection = pilotModules.filter((_,i)=>mask&(1<<i)).map(m=>m.id).reverse();
 let steps=[];
 for(const id of selection) steps=addPilotCard(steps,id);
 if(!steps.some(id=>id==='write'||id==='tasks')) steps=addPilotCard(steps,'write');
 assert.equal(valid(steps),null,steps.join(','));
 assert.equal(pilotSelection(steps).problem,null);
 const removed=steps.filter(id=>id!=='write'&&id!=='tasks');
 assert.equal(pilotSelection(removed).missingBase,true);
 assert.equal(valid(addPilotCard(removed,'tasks')),null);
 cases++;
}

const draft = ids => ({...initialDraft(),request:'Készíts használható anyagot.',pieces:makePieces(ids)});
for(const ids of [[],['request'],['request','image'],['file','summarize'],['audio','transcribe','tasks'],['request','write','write'],['request','write','image','review']]) {
 const d=draft(ids);
 assert.ok(builderSelection(d.pieces).problems.length,ids.join(','));
 assert.throws(()=>builderToPilot(d),undefined,ids.join(','));
}
for(const ids of [['request','write'],['request','tasks'],['request','write','review','document'],['request','write','image']]) {
 const d=draft(ids);
 assert.deepEqual(builderSelection(d.pieces).problems,[]);
 assert.doesNotThrow(()=>builderToPilot(d));
}
const d=draft(['request','write','review','document']);
const grouped=groupPieces(d,d.pieces.slice(1).map(p=>p.uid),'Író');
assert.equal(grouped.pieces.length,2);
assert.equal(builderSelection(grouped.pieces).steps.length,2);
assert.deepEqual(builderSelection(grouped.pieces).problems,[]);
assert.doesNotThrow(()=>builderToPilot(grouped));
const summaryDraft=draft(['request','write','summarize','review']);
const summaryGroup=groupPieces(summaryDraft,summaryDraft.pieces.slice(2).map(p=>p.uid),'Rövid változat');
const orphanGroup=summaryGroup.pieces.slice(2);
const repairIds=builderRepairCards(orphanGroup,0);
assert.deepEqual(repairIds,['request','write']);
const repairedGroup=[...makePieces(repairIds),...orphanGroup];
assert.deepEqual(issues(repairedGroup),[]);
assert.deepEqual(builderSelection(repairedGroup).problems,[]);

for(const block of blocks) {
 const help=builderCardHelp(block);
 assert.ok(help.requirement.length>0);
 assert.ok(help.minimum>=1);
}
for(const id of ['summarize','translate','review','image','document']) assert.equal(builderCardHelp(blocks.find(b=>b.id===id)).minimum,3);
assert.equal(builderCardHelp(blocks.find(b=>b.id==='write')).minimum,2);
assert.equal(builderCardHelp(blocks.find(b=>b.id==='schedule')).supported,false);
assert.deepEqual(issues(makePieces(['request','write','image'])),[]);
console.log(`Passed ${cases} card selections and removal/repair cases, ordering, duplicates, grouped counts and legacy trial-readiness checks.`);
