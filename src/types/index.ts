import { z } from 'zod';

// Problem Statement Schema (7-section structure)
export const ProblemStatementSchema = z.object({
  problem_statement: z.string().min(50, 'Problem statement must be at least 50 characters'),
  what_qualifies: z.array(z.string()).min(1, 'At least one qualification is required'),
  exclusions: z.array(z.string()),
  record_review_priority: z.array(z.string()),
  response_rules: z.object({
    yes: z.string().min(10, 'Yes rule must be defined'),
    maybe: z.string().min(10, 'Maybe rule must be defined'),
    no: z.string().min(10, 'No rule must be defined'),
  }),
  keywords: z.object({
    include: z.array(z.string()),
    exclude: z.array(z.string()),
  }),
  global_rules: z.array(z.string()),
});

export type ProblemStatement = z.infer<typeof ProblemStatementSchema>;

// Issue Types (multi-select options)
export const ISSUE_TYPES = [
  'Missed extraction (valid documentation not captured)',
  'Over-extraction / hallucinated info',
  'Misinterpretation of the medical record',
  'Overly rigid phrasing (misses synonyms/abbreviations)',
  'Overly permissive phrasing (false positives)',
  'Violates "no inference" rule',
  'Poor handling of distributed documentation',
  'Response Rules unclear/incomplete',
  'Exclusions incomplete/contradictory',
  'Keywords too narrow or too broad',
  'Structure non-compliant (7 sections)',
  'Clinical accuracy concern',
  'Needs optional context capture (e.g., acuity/cause flagging)',
] as const;

export type IssueType = typeof ISSUE_TYPES[number];

// Issue Status
export type IssueStatus = 'Open' | 'Resolved' | 'Dismissed';

// Criterion Status
export type CriterionStatus = 'Draft' | 'Published' | 'Deprecated';

// Regeneration Mode
export type RegenerationMode = 'Targeted Edit' | 'Full Rewrite';

// Lint Result
export interface LintResult {
  passed: boolean;
  failures: LintFailure[];
  warnings: LintWarning[];
}

export interface LintFailure {
  rule: string;
  message: string;
  section?: string;
}

export interface LintWarning {
  rule: string;
  message: string;
  section?: string;
}

// AI Regeneration Request
export interface RegenerateRequest {
  criterion_id: string;
  current_problem_statement_json: ProblemStatement;
  issues: Array<{
    type: string;
    notes?: string;
    proposed_fix?: string;
  }>;
  developer_notes: string;
  mode: RegenerationMode;
}

// AI Regeneration Response
export interface RegenerateResponse {
  problem_statement_json: ProblemStatement;
  edit_rationale: string;
}

// Export Configuration
export interface ExportConfig {
  includeJson: boolean;
  includeMarkdown: boolean;
  includeSchema: boolean;
}

// Webhook Event
export interface WebhookEvent {
  event_type: 'published' | 'updated' | 'deprecated';
  criterion_id: string;
  version_number: number;
  timestamp: string;
  problem_statement_json: ProblemStatement;
}
