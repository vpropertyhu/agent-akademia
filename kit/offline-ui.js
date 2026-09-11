// One task at a time. The processing engine is shared with the Site and local agents.
const $=id=>document.getElementById(id);
const el=(tag,text,className)=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;if(className)e.className=className;return e;};
let kitTool=null,kitValues={},kitOutput=null,kitText='',kitSample=false,kitPhase='input';
const kitDrafts=new Map();
function notice(text,error=false){const target=error?$('message'):$('status');target.textContent=text;target.hidden=!text;}
function clearMessages(){notice('');notice('',true);}
function kitRemember(){if(kitTool)kitDrafts.set(kitTool.id,{values:{...kitValues},output:kitOutput,text:kitText,sample:kitSample});}
function kitSetPhase(phase){kitPhase=phase;$('home').hidden=true;$('work').hidden=false;$('input-panel').hidden=phase!=='input';$('output-panel').hidden=phase!=='result';$('step-input').removeAttribute('aria-current');$('step-result').removeAttribute('aria-current');$(phase==='input'?'step-input':'step-result').setAttribute('aria-current','step');$('description').textContent=phase==='input'?kitTool.description:'Ellenőrizd, és már használhatod is.';clearMessages();if(phase==='result')$('result-title').focus();}
function kitChanged(){// Keep entered text, but require an explicit new run after input edits.
 kitOutput=null;
}
function kitInputControl(field,value,callback,id){
 const node=el(field.options?'select':field.type==='textarea'?'textarea':'input');node.id=id;node.required=field.optional!==true&&field.required!==false;
 if(field.options){for(const option of field.options){const opt=el('option',option.label??option);opt.value=option.value??option;node.append(opt);}}
 else if(field.type==='textarea'){node.rows=4;node.maxLength=20000;}
 else{node.type=field.type==='number'?'text':field.type||'text';if(field.type==='number')node.inputMode='decimal';node.maxLength=20000;if(field.type==='date'){node.min='1900-01-01';node.max='2100-12-31';}}
 node.value=value||'';node.addEventListener('input',()=>callback(node.value));return node;
}
function kitRenderRows(){
 const box=$('row-editor');if(!box)return;box.replaceChildren();const {rows,error}=readRows(kitTool.id,kitValues.items||'');
 if(error){box.append(el('p','A feltöltött listát javítani kell. Az eredeti adatokat a „Lista betöltése vagy beillesztése” részben találod.','simple-error'));$('list-import').open=true;notice(error,true);return;}
 const specs=rowFields(kitTool.id);
 rows.forEach((row,i)=>{const card=el('fieldset',null,'simple-row');card.append(el('legend',(i+1)+'. tétel'));const grid=el('div',null,'simple-row-grid');
  specs.forEach((field,j)=>{const cell=el('div',null,'simple-cell'),label=el('label',field.label),id=`row-${i}-${j}`;label.htmlFor=id;if(field.optional)label.append(el('span',' · kihagyható','optional-label'));cell.append(label);
   const options=field.options?.map(value=>({value,label:simpleChoice(kitTool.id,j,value)}));
   const control=kitInputControl({...field,options},row[j],value=>{rows[i][j]=value;kitValues.items=writeRows(kitTool.id,rows);$('raw-items').value=kitValues.items;kitChanged();},id);cell.append(control);grid.append(cell);
  });card.append(grid);const remove=el('button','Törlés','remove-row');remove.type='button';remove.setAttribute('aria-label',(i+1)+'. tétel törlése');remove.onclick=()=>{kitValues.items=writeRows(kitTool.id,rows.length===1?[blankRow(kitTool.id)]:rows.filter((_,j)=>i!==j));$('raw-items').value=kitValues.items;kitChanged();kitRenderRows();};card.append(remove);box.append(card);
 });
 const add=el('button','+ '+addRowLabel(kitTool.id),'secondary');add.type='button';add.disabled=rows.length>=500;add.onclick=()=>{kitValues.items=writeRows(kitTool.id,[...rows,blankRow(kitTool.id)]);$('raw-items').value=kitValues.items;kitChanged();kitRenderRows();const input=box.querySelector(`#row-${rows.length}-0`);input?.focus();};box.append(add);
}
function kitRenderFields(){
 $('fields').replaceChildren();$('settings').replaceChildren();let settingsCount=0;const hasItems=kitTool.fields.some(f=>f.key==='items');$('list-import').hidden=!hasItems;$('raw-items').value=kitValues.items||'';$('list-import').open=false;
 $('import-hint').textContent=kitTool.fields.find(f=>f.key==='items')?.hint||'';$('sample-notice').hidden=!kitSample;
 for(const field of kitTool.fields){
  if(field.key==='items'){const box=el('div',null,'simple-rows');box.id='row-editor';$('fields').append(box);kitRenderRows();continue;}
  const optional=field.key==='today'||field.required===false,group=el('div',null,'field'),id='field-'+field.key;const label=el('label',field.key==='today'?'Melyik naphoz viszonyítsunk?':field.label);label.htmlFor=id;group.append(label);if(field.hint)group.append(el('p',field.hint,'hint'));
  const control=kitInputControl(field,kitValues[field.key],value=>{kitValues[field.key]=value;kitChanged();},id);group.append(control);$(optional?'settings':'fields').append(group);if(optional)settingsCount++;
 }
 $('settings-wrap').hidden=!settingsCount;$('settings-wrap').open=false;$('settings-summary').textContent='További beállítások'+(kitValues.today?' · '+kitValues.today:'');
 $('tool-help').textContent=kitTool.outcome+' '+(kitTool.method==='Sablon'?'A saját szövegedből és tényeidből készít vázlatot. A válasz tartalmát nem találja ki.':'A megadott értékekkel számol és rendez. Próbáld ki egy példával, majd írd át a saját adataidra.');
}
function kitOpen(id){
 kitRemember();kitTool=getTool(id);const draft=kitDrafts.get(id);kitValues=draft?{...draft.values}:prepareSimpleInput(id,initialInput(kitTool));kitOutput=draft?.output||null;kitText=draft?.text||'';kitSample=draft?.sample||false;
 $('title').textContent=kitTool.name;$('input-explanation').textContent=inputExplanation(id);kitSetPhase('input');kitRenderFields();$('work').scrollIntoView({block:'start',behavior:'smooth'});
}
function kitResultView(){
 $('result').value=kitText;$('notes').replaceChildren(...kitOutput.notes.map(n=>el('li',n)));$('table').replaceChildren();const textBox=$('text-result');
 if(kitOutput.columns){const table=el('table'),thead=el('thead'),tr=el('tr');kitOutput.columns.forEach(c=>tr.append(el('th',c)));thead.append(tr);table.append(thead);const body=el('tbody');kitOutput.rows.forEach(row=>{const r=el('tr');row.forEach(c=>r.append(el('td',c)));body.append(r);});table.append(body);$('table').append(table);$('table-text-wrap').append(textBox);}
 else $('output-panel').insertBefore(textBox,$('notes'));
 $('more-output').open=false;$('csv').hidden=!kitOutput.columns;$('ics').hidden=!kitOutput.file;
 $('main-result').textContent=kitOutput.file?'Naptárfájl letöltése':kitOutput.columns?'Táblázat letöltése':'Szöveg másolása';
 kitSetPhase('result');
}
$('runner').addEventListener('submit',event=>{event.preventDefault();try{kitOutput=runTool(kitTool.id,kitValues);kitText=kitOutput.text;kitResultView();}catch(e){notice(e.message,true);$('message').scrollIntoView({block:'center',behavior:'smooth'});}});
$('sample').onclick=()=>{kitValues=sampleInput(kitTool);kitOutput=null;kitText='';kitSample=true;clearMessages();kitRenderFields();};
$('back-home').onclick=()=>{kitRemember();$('home').hidden=false;$('work').hidden=true;$('home').scrollIntoView({block:'start',behavior:'smooth'});};
$('edit-input').onclick=()=>{kitSetPhase('input');kitRenderFields();$('title').scrollIntoView({block:'start',behavior:'smooth'});};
$('result').addEventListener('input',e=>{kitText=e.target.value;});
function kitDownload(name,content,type='text/plain;charset=utf-8'){const href=URL.createObjectURL(new Blob([content],{type}));const a=el('a');a.href=href;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),1000);}
async function kitCopy(){try{await navigator.clipboard.writeText(kitText);notice('A szöveg a vágólapra került.');}catch{$('more-output').open=true;$('result').focus();$('result').select();notice('A szöveget kijelöltük. Másold Ctrl+C vagy Cmd+C billentyűvel.');}}
$('main-result').onclick=()=>{if(!kitOutput)return;if(kitOutput.file)kitDownload(kitOutput.file.name,kitOutput.file.content,kitOutput.file.mime);else if(kitOutput.columns)kitDownload(kitTool.id+'.csv',resultCSV(kitOutput),'text/csv;charset=utf-8');else void kitCopy();};
$('copy').onclick=()=>void kitCopy();$('txt').onclick=()=>kitDownload(kitTool.id+'.txt',kitText);$('csv').onclick=()=>kitDownload(kitTool.id+'.csv',resultCSV(kitOutput),'text/csv;charset=utf-8');$('ics').onclick=()=>kitDownload(kitOutput.file.name,kitOutput.file.content,kitOutput.file.mime);
$('json').onclick=()=>kitDownload(kitTool.id+'.json',JSON.stringify({toolId:kitTool.id,engineVersion:1,input:kitValues,result:{...kitOutput,text:kitText}},null,2),'application/json');
$('preset').onclick=()=>{try{runTool(kitTool.id,kitValues);kitDownload(kitTool.id+'-beallitas.json',JSON.stringify({toolId:kitTool.id,input:kitValues},null,2),'application/json');notice('A kitöltést letölthető fájlba mentettük.');}catch(e){notice(e.message,true);}};
$('restore').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>100000)throw new Error('Legfeljebb 100 kB-os adatfájl tölthető be.');const saved=JSON.parse(await file.text()),tool=getTool(saved.toolId),input=validateInput(tool,saved.input);kitOpen(tool.id);kitValues=input;kitSample=false;kitOutput=null;kitRenderFields();notice('A korábbi kitöltést megnyitottuk. Készíts belőle új eredményt.');}catch(e){notice(e.message,true);}event.target.value='';});
$('raw-items').addEventListener('input',e=>{kitValues.items=e.target.value;kitSample=false;kitChanged();kitRenderRows();});
$('csv-file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>80000)throw new Error('Legfeljebb 80 kB-os fájl tölthető be.');const raw=await file.text();if(raw.length>20000||raw.includes('\0')||raw.includes('\uFFFD'))throw new Error('UTF-8 szöveget válassz, legfeljebb 20 000 karakterrel.');kitValues.items=raw;kitSample=false;kitChanged();$('raw-items').value=raw;kitRenderRows();if(!readRows(kitTool.id,raw).error)notice('A listát betöltöttük a mezőkbe. Ellenőrizd az adatokat.');}catch(e){notice(e.message,true);}event.target.value='';});
startTasks.forEach(task=>{const button=el('button',null,'task-choice');button.type='button';const copy=el('div');copy.append(el('h2',task.title),el('p',task.description));button.append(copy,el('span','→','choice-arrow'));button.onclick=()=>kitOpen(task.id);$('start-tasks').append(button);});
function kitSearch(){const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),q=normalize($('search').value),items=dailyTools.filter(t=>normalize(t.name+' '+t.description+' '+t.category).includes(q));$('task-list').replaceChildren();items.forEach(t=>{const button=el('button');button.type='button';const text=el('div');text.append(el('strong',t.name),el('p',t.description));button.append(text,el('span','→'));button.onclick=()=>kitOpen(t.id);$('task-list').append(button);});$('no-match').hidden=!!items.length;}
$('show-all').onclick=()=>{const open=$('all-tasks').hidden;$('all-tasks').hidden=!open;$('show-all').textContent=open?'Kevesebb feladat':'Más feladatot keresek';$('show-all').setAttribute('aria-expanded',String(open));if(open){kitSearch();$('search').focus();}};$('search').addEventListener('input',kitSearch);
$('help-button').onclick=()=>{const guide=$('education');guide.open=true;guide.scrollIntoView({behavior:'smooth',block:'start'});};
document.querySelectorAll('[data-learn-tool]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();kitOpen(link.dataset.learnTool);}));
const requested=location.hash.slice(1);if(dailyTools.some(t=>t.id===requested))kitOpen(requested);
