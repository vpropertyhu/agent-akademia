import {getChatGPTUser} from '../chatgpt-auth';
import ResearchWorkshop from '../research-workshop';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <ResearchWorkshop user={!!user}/>;}
