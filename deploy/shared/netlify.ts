import {getStore,getDeployStore} from '@netlify/blobs';
import type {Context} from '@netlify/functions';
import {AIError} from '../../lib/ai-agent';
export function appStore(context:Context){return context.deploy.context==='production'?getStore({name:'agent-akademia-ai-v1',consistency:'strong'}):getDeployStore({name:'agent-akademia-ai-v1',consistency:'strong'});}
export const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function boundedBody(request:Request,max=80000){const reader=request.body?.getReader();if(!reader)throw new AIError('BODY','Hiányzik a kérés.');const decoder=new TextDecoder();let text='',size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new AIError('SIZE','Túl hosszú a kérés.',413);}text+=decoder.decode(value,{stream:true});}return text+decoder.decode();}
export function backendURL(raw:string|undefined){if(!raw)return null;try{const url=new URL(raw);if(url.protocol!=='https:'||url.username||url.password||url.pathname!=='/'||url.search||url.hash)return null;return url.origin;}catch{return null;}}
