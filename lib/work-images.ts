import {env} from 'cloudflare:workers';
import {AIError,type AIResult} from './ai-agent';
export function imageBucket(){const bucket=(env as unknown as {BUCKET?:R2Bucket}).BUCKET;if(!bucket)throw new AIError('IMAGE_STORE','A kép mentési helye még nem érhető el. A szöveg megmaradt.',503);return bucket;}
export async function storeWorkImage(owner:string,id:string,result:AIResult){
 if(!result.image)return result;
 const ownerHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(owner))),b=>b.toString(16).padStart(2,'0')).join('');
 const imagePath='research/'+ownerHash+'/'+id+'.jpg';
 const bytes=Uint8Array.from(atob(result.image.data),c=>c.charCodeAt(0));
 await imageBucket().put(imagePath,bytes,{httpMetadata:{contentType:'image/jpeg'},onlyIf:{etagDoesNotMatch:'*'}});
 const {image,...plain}=result;return {...plain,imagePath};
}
