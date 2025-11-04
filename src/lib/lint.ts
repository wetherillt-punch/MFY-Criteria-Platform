import { ProblemStatement, LintResult, LintFailure, LintWarning } from '@/types';

export function lintProblemStatement(ps: ProblemStatement): LintResult {
  const failures: LintFailure[] = [];
  const warnings: LintWarning[] = [];

  // FAIL: Missing sections (all 7 required)
  if (!ps.problem_statement || ps.problem_statement.trim().length === 0) {
    failures.push({
      rule: 'REQUIRED_SECTION',
      message: 'Problem Statement section is required',
      section: 'problem_statement',
    });
  }

  if (!ps.what_qualifies || ps.what_qualifies.length === 0) {
    failures.push({
      rule: 'REQUIRED_SECTION',
      message: 'What Qualifies section is required',
      section: 'what_qualifies',
    });
  }

  if (!ps.response_rules || !ps.response_rules.yes || !ps.response_rules.maybe || !ps.response_rules.no) {
    failures.push({
      rule: 'REQUIRED_SECTION',
      message: 'Response Rules must include Yes, Maybe, and No',
      section: 'response_rules',
    });
  }

  if (!ps.keywords || (!ps.keywords.include && !ps.keywords.exclude)) {
    failures.push({
      rule: 'REQUIRED_SECTION',
      message: 'Keywords section is required',
      section: 'keywords',
    });
  }

  // FAIL: Must mention "current encounter" and "clinician-authored"
  const fullText = JSON.stringify(ps).toLowerCase();
  
  if (!fullText.includes('current encounter') && !fullText.includes('current-encounter')) {
    failures.push({
      rule: 'CURRENT_ENCOUNTER',
      message: 'Must mention "current encounter" somewhere in the problem statement',
      section: 'problem_statement',
    });
  }

  if (!fullText.includes('clinician-authored') && !fullText.includes('clinician authored')) {
    failures.push({
      rule: 'CLINICIAN_AUTHORED',
      message: 'Must mention "clinician-authored" documentation',
      section: 'problem_statement',
    });
  }

  // FAIL: Must include "no inference" rule
  const hasNoInferenceRule = 
    fullText.includes('no inference') ||
    fullText.includes('do not infer') ||
    fullText.includes('without inference') ||
    (ps.global_rules && ps.global_rules.some(rule => 
      rule.toLowerCase().includes('no inference') || 
      rule.toLowerCase().includes('do not infer')
    ));

  if (!hasNoInferenceRule) {
    failures.push({
      rule: 'NO_INFERENCE',
      message: 'Must include a "no inference from raw data" rule in Problem Statement or Global Rules',
      section: 'global_rules',
    });
  }

  // FAIL: Response Rules must include Maybe
  if (ps.response_rules && (!ps.response_rules.maybe || ps.response_rules.maybe.trim().length < 5)) {
    failures.push({
      rule: 'MAYBE_REQUIRED',
      message: 'Response Rules must include a meaningful Maybe definition',
      section: 'response_rules',
    });
  }

  // WARN: Keywords too few
  if (ps.keywords.include && ps.keywords.include.length < 3) {
    warnings.push({
      rule: 'KEYWORDS_SPARSE',
      message: 'Include keywords list has fewer than 3 items',
      section: 'keywords',
    });
  }

  if (ps.keywords.exclude && ps.keywords.exclude.length < 2) {
    warnings.push({
      rule: 'EXCLUDE_KEYWORDS_SPARSE',
      message: 'Exclude keywords list has fewer than 2 items',
      section: 'keywords',
    });
  }

  // WARN: Exclusions empty
  if (!ps.exclusions || ps.exclusions.length === 0) {
    warnings.push({
      rule: 'EXCLUSIONS_EMPTY',
      message: 'Exclusions list is empty - consider adding common exclusions',
      section: 'exclusions',
    });
  }

  // WARN: Record Review Priority empty
  if (!ps.record_review_priority || ps.record_review_priority.length === 0) {
    warnings.push({
      rule: 'PRIORITY_EMPTY',
      message: 'Record Review Priority is empty - consider prioritizing documentation types',
      section: 'record_review_priority',
    });
  }

  // WARN: Forbids distributed documentation
  const forbidsDistributed = 
    fullText.includes('must be in one note') ||
    fullText.includes('single note') ||
    fullText.includes('same note') ||
    fullText.includes('in the same documentation');

  if (forbidsDistributed) {
    warnings.push({
      rule: 'DISTRIBUTED_DOCS',
      message: 'Language appears to forbid distributed documentation across multiple notes',
      section: 'problem_statement',
    });
  }

  // WARN: Over-specificity
  const overSpecific = 
    fullText.includes('must say') ||
    fullText.includes('must state exactly') ||
    fullText.includes('exact wording') ||
    fullText.includes('must use the phrase');

  if (overSpecific) {
    warnings.push({
      rule: 'OVER_SPECIFIC',
      message: 'Language appears overly specific - may miss synonyms and abbreviations',
      section: 'problem_statement',
    });
  }

  return {
    passed: failures.length === 0,
    failures,
    warnings,
  };
}
