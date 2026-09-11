// Regression checks for deleting a step and continuing to edit the same plan.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';

const source=readFileSync(new URL('../lib/module-builder.ts',import.meta.url),'utf8');
const moduleUrl='data:text/javascript;base64,'+Buffer.from(stripTypeScriptTypes(source)).toString('base64');
const {blocks,clonePieces,editingIndex,groupPieces,initialDraft,issues,makePieces,parseDraft,placementIndex,recipes,suggestedBlocks}=await import(moduleUrl);

// Removing a converter must not hide its replacement in the recommended palette.
const broken=makePieces(['request','review','document']);
assert.equal(editingIndex(broken),1);
assert.ok(suggestedBlocks(broken).some(b=>b.id==='write'));

// The text-producing final step used to accept write at the end, leaving the hole.
const textTail=makePieces(['request','review','send']);
const writer=makePieces(['write'])[0];
const insertion=placementIndex(textTail,writer);
assert.equal(insertion,1);
const repaired=[...textTail.slice(0,insertion),writer,...textTail.slice(insertion)];
assert.deepEqual(repaired.map(p=>p.block),['request','write','review','send']);
assert.deepEqual(issues(repaired),[]);

// Every position in each shipped recipe remains editable after deletion.
let checked=0;
for(const recipe of recipes){
 const original=makePieces(recipe.blocks);
 for(let removed=0;removed<original.length;removed++){
  const remaining=original.filter((_,index)=>index!==removed);
  const slot=editingIndex(remaining,removed),replacement=clonePieces([original[removed]])[0];
  assert.ok(suggestedBlocks(remaining,slot).some(b=>b.id===replacement.block),`${recipe.id}: replacement missing at ${removed}`);
  const index=placementIndex(remaining,replacement,slot);
  const pieces=[...remaining.slice(0,index),replacement,...remaining.slice(index)];
  assert.deepEqual(pieces.map(p=>p.block),recipe.blocks);
  assert.deepEqual(issues(pieces),[]);
  assert.doesNotThrow(()=>parseDraft(JSON.stringify({...initialDraft(),pieces})));
  checked++;
 }
}

// A removed saved module is independent of its palette copy and can be reinserted.
const original={...initialDraft(),pieces:makePieces(['request','write','review','document'])};
const grouped=groupPieces(original,original.pieces.slice(1).map(p=>p.uid),'Saját modul');
const remaining=grouped.pieces.slice(0,1),saved=grouped.modules[0];
const replacement={uid:'replacement',block:saved.id,name:saved.name,children:clonePieces(saved.children)};
const index=placementIndex(remaining,replacement,editingIndex(remaining,1));
const restored={...grouped,pieces:[...remaining.slice(0,index),replacement,...remaining.slice(index)]};
assert.deepEqual(issues(restored.pieces),[]);
assert.doesNotThrow(()=>parseDraft(JSON.stringify(restored)));
assert.notEqual(replacement.children[0].uid,saved.children[0].uid);

// Incomplete plans remain valid editable drafts; taking out the last item works too.
assert.doesNotThrow(()=>parseDraft(JSON.stringify({...initialDraft(),pieces:broken})));
assert.equal(editingIndex([],9),0);
assert.equal(editingIndex(broken,-4),0);
assert.equal(placementIndex([],makePieces(['write'])[0]),0);
assert.ok(blocks.length>0);
console.log(`Passed ${checked} recipe deletion/reinsertion cases, middle-gap suggestions, text-tail placement, saved-module reinsertion and editable incomplete plans.`);
