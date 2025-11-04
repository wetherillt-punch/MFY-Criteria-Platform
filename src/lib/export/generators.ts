import { ProblemStatement } from '@/types';

export function generateMarkdown(ps: ProblemStatement, metadata: any): string {
  const md: string[] = [];

  md.push(`# Problem Statement: ${metadata.title || 'Untitled'}`);
  md.push('');
  md.push(`**Criterion ID:** ${metadata.criterion_id}`);
  md.push(`**Version:** ${metadata.version_number}`);
  md.push(`**Status:** ${metadata.status}`);
  md.push(`**Last Updated:** ${metadata.date_updated}`);
  if (metadata.linked_policy_id) {
    md.push(`**Linked Policy:** ${metadata.linked_policy_id}`);
  }
  md.push('');
  md.push('---');
  md.push('');

  md.push('## Problem Statement');
  md.push('');
  md.push(ps.problem_statement);
  md.push('');

  md.push('## What Qualifies');
  md.push('');
  ps.what_qualifies.forEach((item, idx) => {
    md.push(`${idx + 1}. ${item}`);
  });
  md.push('');

  if (ps.exclusions && ps.exclusions.length > 0) {
    md.push('## Exclusions');
    md.push('');
    ps.exclusions.forEach((item, idx) => {
      md.push(`${idx + 1}. ${item}`);
    });
    md.push('');
  }

  if (ps.record_review_priority && ps.record_review_priority.length > 0) {
    md.push('## Record Review Priority');
    md.push('');
    ps.record_review_priority.forEach((item, idx) => {
      md.push(`${idx + 1}. ${item}`);
    });
    md.push('');
  }

  md.push('## Response Rules');
  md.push('');
  md.push('### Yes');
  md.push(ps.response_rules.yes);
  md.push('');
  md.push('### Maybe');
  md.push(ps.response_rules.maybe);
  md.push('');
  md.push('### No');
  md.push(ps.response_rules.no);
  md.push('');

  md.push('## Keywords');
  md.push('');
  if (ps.keywords.include && ps.keywords.include.length > 0) {
    md.push('**Include:**');
    md.push(ps.keywords.include.map(k => `- ${k}`).join('\n'));
    md.push('');
  }
  if (ps.keywords.exclude && ps.keywords.exclude.length > 0) {
    md.push('**Exclude:**');
    md.push(ps.keywords.exclude.map(k => `- ${k}`).join('\n'));
    md.push('');
  }

  if (ps.global_rules && ps.global_rules.length > 0) {
    md.push('## Global Rules');
    md.push('');
    ps.global_rules.forEach((rule, idx) => {
      md.push(`${idx + 1}. ${rule}`);
    });
    md.push('');
  }

  return md.join('\n');
}

export function generateJsonSchema(): object {
  return {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "Problem Statement",
    "type": "object",
    "required": [
      "problem_statement",
      "what_qualifies",
      "response_rules",
      "keywords"
    ],
    "properties": {
      "problem_statement": {
        "type": "string",
        "description": "Main problem statement describing the audit criterion",
        "minLength": 50
      },
      "what_qualifies": {
        "type": "array",
        "description": "List of conditions that must be met",
        "items": { "type": "string" },
        "minItems": 1
      },
      "exclusions": {
        "type": "array",
        "description": "List of exclusion criteria",
        "items": { "type": "string" }
      },
      "record_review_priority": {
        "type": "array",
        "description": "Ordered list of documentation types to review",
        "items": { "type": "string" }
      },
      "response_rules": {
        "type": "object",
        "required": ["yes", "maybe", "no"],
        "properties": {
          "yes": {
            "type": "string",
            "description": "Conditions for a definitive positive match"
          },
          "maybe": {
            "type": "string",
            "description": "Conditions requiring manual review"
          },
          "no": {
            "type": "string",
            "description": "Conditions for a definitive negative match"
          }
        }
      },
      "keywords": {
        "type": "object",
        "properties": {
          "include": {
            "type": "array",
            "description": "Keywords that indicate relevance",
            "items": { "type": "string" }
          },
          "exclude": {
            "type": "array",
            "description": "Keywords that indicate non-relevance",
            "items": { "type": "string" }
          }
        }
      },
      "global_rules": {
        "type": "array",
        "description": "Universal rules that apply across all sections",
        "items": { "type": "string" }
      }
    }
  };
}
