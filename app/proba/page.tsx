import {getChatGPTUser} from '../chatgpt-auth';
import PilotWorkshop from '../pilot-workshop';
export const dynamic='force-dynamic';
export default async function Page(){const user=await getChatGPTUser();return <PilotWorkshop user={!!user}/>;}
