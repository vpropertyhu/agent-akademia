import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {dailyTools,sampleInput,runTool} from '../.sites-runtime/agent-kit/agent-engine.mjs';
import {rowHeaders,rowFields,readRows,writeRows,blankRow,startTasks} from '../.sites-runtime/agent-kit/simple-input.mjs';
let count=0;
for(const tool of dailyTools){if(!tool.sample.items)continue;count++;const input=sampleInput(tool,'2026-09-11'),parsed=readRows(tool.id,input.items);assert.equal(parsed.error,null,tool.id);assert.equal(rowHeaders(tool.id).length,rowFields(tool.id).length);assert.deepEqual(runTool(tool.id,{...input,items:writeRows(tool.id,parsed.rows)}),runTool(tool.id,input),tool.id+' round trip');assert.equal(blankRow(tool.id).length,rowHeaders(tool.id).length);}
const special=[['Papír; "A"\ncsomag','2','5','12','5']];assert.deepEqual(readRows('keszletfigyelo',writeRows('keszletfigyelo',special)).rows,special);
assert.ok(readRows('keszletfigyelo','rossz;lista').error);assert.deepEqual(readRows('elofizetesek','A;10;eur;HAVI').rows[0],['A','10','EUR','havi']);
assert.equal(startTasks.length,6);assert.ok(startTasks.every(t=>dailyTools.some(d=>d.id===t.id)));
const html=fs.readFileSync('public/letoltes/agent-akademia-offline.html','utf8'),script=html.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);assert.ok(!/^import\s/m.test(script));assert.ok(html.includes('id="output-panel" class="panel simple-result-panel" hidden'));assert.ok(html.includes('id="work" class="simple-workbench" hidden'));
console.log(`PASS: ${count} row editors round-trip to identical processor results, quoted multiline input, invalid import preservation, enum normalization, six valid starters and standalone script syntax.`);
