import { getChatGPTUser } from './chatgpt-auth';
import AgentApp, { type View } from './agent-app';
export default async function Workspace({ view, toolId }: { view: View; toolId?:string }) {
 const user = await getChatGPTUser();
 return <AgentApp view={view} toolId={toolId} user={user ? {name: user.fullName || 'Saját munkaterület', email: user.email} : null} />;
}
