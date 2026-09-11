import readline from 'node:readline/promises';
import {spawn} from 'node:child_process';
import {automations} from './automations.mjs';
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
console.log('\nAgent Akadémia · Fájlfigyelő agentek\n');
automations.forEach((a,i)=>console.log(`${i+1}. ${a.name}`));
console.log('9. Saját beállítás (sajat-agent.json)');
const answer=await rl.question('\nMelyiket indítod? (1–9): '),choice=Number(answer);
rl.close();
if(!Number.isInteger(choice)||choice<1||choice>9){console.error('1 és 9 közötti számot adj meg.');process.exitCode=1;}
else{
 const file=choice===9?'sajat-agent.json':automations[choice-1].toolId+'.json';
 const child=spawn(process.execPath,['run-agent.mjs',file],{stdio:'inherit',shell:false});
 child.on('error',e=>{console.error(e.message);process.exitCode=1;});
 process.on('SIGINT',()=>{if(!child.killed)child.kill('SIGINT');});
 child.on('exit',code=>{process.exitCode=code||0;});
}
