import type { ToolInput, ToolResult } from './daily-tools';
export type SavedTool = { id:string; toolId:string; kind:'preset'|'result'; title:string; input:ToolInput; result:ToolResult|null; createdAt:string };
