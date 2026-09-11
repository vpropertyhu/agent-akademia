import { env } from 'cloudflare:workers';
import { AI_MODEL, type AIConfig } from './ai-agent';
export function getAIConfig():AIConfig {
 const e=env as unknown as Record<string,string|undefined>;
 return {apiKey:e.OPENAI_API_KEY,model:e.OPENAI_MODEL||AI_MODEL};
}
