// src/lib/db/schema-problem-statements.ts
import { pgTable, text, jsonb, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const problemStatement = pgTable('problem_statements', {
  id: uuid('id').defaultRandom().primaryKey(),
  criterionId: text('criterion_id').notNull(),
  
  // Generated output (all 7 sections)
  problemStatementJson: jsonb('problem_statement_json').notNull(),
  
  // Original input from user
  originalInput: text('original_input').notNull(),
  
  // Which issue checkboxes were selected
  selectedIssues: text('selected_issues').array().notNull().default([]),
  
  // Additional context notes
  additionalContext: text('additional_context'),
  
  // Auto-generated tags for search
  tags: text('tags').array().notNull().default([]),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    criterionIdIdx: index('criterion_id_idx').on(table.criterionId),
    createdAtIdx: index('created_at_idx').on(table.createdAt),
  };
});

export type ProblemStatement = typeof problemStatement.$inferSelect;
export type NewProblemStatement = typeof problemStatement.$inferInsert;