import { pgTable, text, timestamp, integer, jsonb, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Criterion table - main entity
export const criterion = pgTable('criterion', {
  criterionId: text('criterion_id').primaryKey(),
  versionNumber: integer('version_number').notNull().default(1),
  title: text('title').notNull(),
  linkedPolicyId: text('linked_policy_id'),
  linkedCriteriaIds: text('linked_criteria_ids').array(),
  author: text('author').notNull(),
  dateCreated: timestamp('date_created').notNull().defaultNow(),
  dateUpdated: timestamp('date_updated').notNull().defaultNow(),
  changeReason: text('change_reason'),
  status: text('status').notNull().default('Draft'), // Draft | Published | Deprecated
  problemStatementJson: jsonb('problem_statement_json').notNull(),
});

// Issue table - tracks problems with criteria
export const issue = pgTable('issue', {
  issueId: uuid('issue_id').primaryKey().defaultRandom(),
  criterionId: text('criterion_id')
    .notNull()
    .references(() => criterion.criterionId, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  status: text('status').notNull().default('Open'), // Open | Resolved | Dismissed
  notes: text('notes'),
  proposedFix: text('proposed_fix'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: text('resolved_by'),
});

// AI Run table - tracks all regeneration attempts
export const aiRun = pgTable('ai_run', {
  runId: uuid('run_id').primaryKey().defaultRandom(),
  criterionId: text('criterion_id')
    .notNull()
    .references(() => criterion.criterionId, { onDelete: 'cascade' }),
  mode: text('mode').notNull(), // 'Targeted Edit' | 'Full Rewrite'
  inputContext: jsonb('input_context').notNull(),
  agentOutput: jsonb('agent_output').notNull(),
  lintResult: jsonb('lint_result').notNull(),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Webhook Log table - for future integration
export const webhookLog = pgTable('webhook_log', {
  logId: uuid('log_id').primaryKey().defaultRandom(),
  criterionId: text('criterion_id').notNull(),
  eventType: text('event_type').notNull(), // 'published' | 'updated' | 'deprecated'
  payload: jsonb('payload').notNull(),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Types for TypeScript
export type Criterion = typeof criterion.$inferSelect;
export type NewCriterion = typeof criterion.$inferInsert;
export type Issue = typeof issue.$inferSelect;
export type NewIssue = typeof issue.$inferInsert;
export type AiRun = typeof aiRun.$inferSelect;
export type NewAiRun = typeof aiRun.$inferInsert;
export type WebhookLog = typeof webhookLog.$inferSelect;
export type NewWebhookLog = typeof webhookLog.$inferInsert;
export { problemStatement } from './schema-problem-statements';