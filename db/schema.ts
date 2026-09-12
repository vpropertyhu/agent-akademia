import { integer, real, sqliteTable, text, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const agents = sqliteTable('agents', {
 id: text('id').primaryKey(), userId: text('user_id').notNull(),
 name: text('name').notNull(), sourceLabel: text('source_label').notNull(),
 targetName: text('target_name').notNull(), schedule: text('schedule').notNull(),
 reviewRequired: integer('review_required').notNull().default(1),
 setupStep: integer('setup_step').notNull().default(0),
 revision: integer('revision').notNull().default(1),
 status: text('status').notNull().default('draft'), updatedAt: text('updated_at').notNull(),
}, t => [uniqueIndex('idx_agents_user').on(t.userId)]);
export const runs = sqliteTable('runs', {
 id: text('id').primaryKey(), userId: text('user_id').notNull(), sampleId: text('sample_id').notNull(),
 supplier: text('supplier').notNull(), invoiceNumber: text('invoice_number').notNull(),
 amount: real('amount').notNull(), currency: text('currency').notNull(),
 dueDate: text('due_date'), status: text('status').notNull(),
 createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, t => [uniqueIndex('idx_runs_user_sample').on(t.userId,t.sampleId)]);
export const requests = sqliteTable('help_requests', {
 id: text('id').primaryKey(), userId: text('user_id').notNull(),
 message: text('message').notNull(), status: text('status').notNull().default('recorded'),
 createdAt: text('created_at').notNull(),
}, t => [index('idx_help_user_created').on(t.userId,t.createdAt)]);

export const toolSaves = sqliteTable('tool_saves', {
 id: text('id').primaryKey(), userId: text('user_id').notNull(),
 toolId: text('tool_id').notNull(), kind: text('kind').notNull(), title: text('title').notNull(),
 inputJson: text('input_json').notNull(), resultJson: text('result_json'),
 engineVersion: integer('engine_version').notNull().default(1), createdAt: text('created_at').notNull(),
}, t => [index('idx_tool_saves_user_created').on(t.userId,t.createdAt)]);

export const aiProfiles = sqliteTable('ai_profiles', {
 userId:text('user_id').primaryKey(), content:text('content').notNull(),
 revision:integer('revision').notNull().default(1), updatedAt:text('updated_at').notNull(),
});
export const aiWorks = sqliteTable('ai_works', {
 id:text('id').primaryKey(), userId:text('user_id').notNull(), parentId:text('parent_id'),
 job:text('job').notNull(), brief:text('brief').notNull(), profile:text('profile').notNull(),
 historyJson:text('history_json').notNull(), requestHash:text('request_hash').notNull(),
 status:text('status').notNull(), resultJson:text('result_json'), error:text('error'),
 model:text('model').notNull(), tokens:integer('tokens').notNull().default(0),
 createdAt:text('created_at').notNull(), updatedAt:text('updated_at').notNull(),
}, t=>[index('idx_ai_user_created').on(t.userId,t.createdAt),index('idx_ai_created').on(t.createdAt)]);

export const pilotRuns=sqliteTable('pilot_runs',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),stateJson:text('state_json').notNull(),
 status:text('status').notNull(),revision:integer('revision').notNull().default(1),leaseUntil:text('lease_until'),
 createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[index('idx_pilot_user_created').on(t.userId,t.createdAt),index('idx_pilot_created').on(t.createdAt)]);
export const pilotAdmissions=sqliteTable('pilot_admissions',{
 id:text('id').primaryKey(),userId:text('user_id').notNull(),createdAt:text('created_at').notNull(),
},t=>[index('idx_pilot_admission_user_created').on(t.userId,t.createdAt),index('idx_pilot_admission_created').on(t.createdAt)]);
