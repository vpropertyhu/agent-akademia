import { notFound } from 'next/navigation';
import Workspace from '@/app/workspace';
import { dailyTools } from '@/lib/daily-tools';
export const dynamic='force-dynamic';
export default async function ToolPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;if(!dailyTools.some(t=>t.id===id))notFound();
 return <Workspace view="tool" toolId={id}/>;
}
