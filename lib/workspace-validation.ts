import { z } from 'zod';
export const realDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v => {
 const d=new Date(v+'T00:00:00Z'); return !isNaN(d.valueOf()) && d.toISOString().slice(0,10)===v;
},'Érvénytelen dátum.');
export const actionSchema = z.discriminatedUnion('action', [
 z.object({action:z.literal('save_config'), name:z.string().trim().min(2).max(80), sourceLabel:z.string().trim().min(1).max(80), targetName:z.string().trim().min(1).max(100), schedule:z.enum(['hourly','daily']),reviewRequired:z.boolean(),setupStep:z.number().int().min(0).max(2),expectedRevision:z.number().int().positive().nullable()}),
 z.object({action:z.literal('save_progress'),setupStep:z.number().int().min(0).max(3),expectedRevision:z.number().int().positive()}),
 z.object({action:z.literal('run_sample'),sampleId:z.enum(['iroda','hianyos','euro'])}),
 z.object({action:z.literal('approve'),id:z.string().uuid(),supplier:z.string().trim().min(2).max(120),invoiceNumber:z.string().trim().min(1).max(80),amount:z.number().finite().positive().max(1000000000),currency:z.enum(['HUF','EUR']),dueDate:realDate}),
 z.object({action:z.literal('set_status'),status:z.enum(['ready','paused']),expectedRevision:z.number().int().positive()}),
 z.object({action:z.literal('help'),message:z.string().trim().min(15).max(2000)}),
]);
export function csvCell(value: unknown) {
 let text=String(value??'');
 if (/^[\s]*[=+@\-\t\r]/.test(text)) text="'"+text;
 return '"'+text.replaceAll('"','""')+'"';
}
