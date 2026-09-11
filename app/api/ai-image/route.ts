import {getChatGPTUser} from '@/app/chatgpt-auth';
import {getDB} from '@/lib/workspace-db';
import {imageBucket} from '@/lib/work-images';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 const user=await getChatGPTUser();if(!user)return new Response('A képhez jelentkezz be.',{status:401});
 const id=new URL(request.url).searchParams.get('id');if(!id||!/^[0-9a-f-]{36}$/i.test(id))return new Response('Nem található.',{status:404});
 try{const row=await getDB().prepare('SELECT result_json FROM ai_works WHERE id=? AND user_id=?').bind(id,user.userId).first<{result_json:string|null}>();const saved=row?.result_json?JSON.parse(row.result_json):null;if(!saved?.imagePath)return new Response('A kép még nem készült el.',{status:404});const image=await imageBucket().get(saved.imagePath);if(!image)return new Response('A kép nem érhető el.',{status:404});return new Response(image.body,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="illusztracio.jpg"'}});}catch{return new Response('A kép most nem tölthető be.',{status:503});}
}
