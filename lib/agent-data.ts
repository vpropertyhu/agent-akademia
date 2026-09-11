export const samples = [
 { id: 'iroda', supplier: 'Minta Irodaszer Kft.', invoice: 'DEMO-2026-001', amount: 12700, currency: 'HUF', due: '2026-09-30', label: 'Irodaszer számla', detail: 'Teljes, ellenőrizhető adatok', filename: 'minta-irodaszer.pdf', net: '10 000 Ft', tax: '2 700 Ft' },
 { id: 'hianyos', supplier: 'Minta Stúdió Kft.', invoice: 'DEMO-2026-002', amount: 63500, currency: 'HUF', due: null, label: 'Hiányos számla', detail: 'Hiányzó fizetési határidő', filename: 'minta-studio.pdf', net: '50 000 Ft', tax: '13 500 Ft' },
 { id: 'euro', supplier: 'Example Software Ltd.', invoice: 'DEMO-2026-003', amount: 49, currency: 'EUR', due: '2026-10-05', label: 'Devizás számla', detail: 'Az eredeti pénznem megőrzése', filename: 'minta-szoftver.pdf', net: '49 EUR', tax: '0 EUR' },
] as const;
export type Agent = { id: string; name: string; source_label: string; target_name: string; schedule: 'hourly'|'daily'; review_required: number; setup_step: number; revision: number; status: 'draft'|'ready'|'paused'; updated_at: string };
export type Run = { id: string; sample_id: string; supplier: string; invoice_number: string; amount: number; currency: string; due_date: string|null; status: 'review'|'approved'; created_at: string; updated_at: string };
export type HelpRequest = { id: string; message: string; status: string; created_at: string };
export type WorkspaceData = { agent: Agent|null; runs: Run[]; requests: HelpRequest[] };
export const money = (amount:number,currency:string) => new Intl.NumberFormat('hu-HU',{style:'currency',currency,maximumFractionDigits:2}).format(amount);
export const dateLabel = (value:string|null) => value ? new Intl.DateTimeFormat('hu-HU').format(new Date(value)) : 'Hiányzik';
