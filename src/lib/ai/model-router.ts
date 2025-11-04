import OpenAI from 'openai';
import { RegenerateRequest, RegenerateResponse, ProblemStatementSchema } from '@/types';
import { lintProblemStatement } from '../lint';

// Lazy initialization - only create client when needed at runtime
function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const SYSTEM_PROMPT = `You generate healthcare audit Problem Statements in a strict 7-section JSON schema.

Hard rules:
- Use ONLY current-encounter, clinician-authored documentation. Do not infer from raw labs/imaging/vitals/orders unless a clinician explicitly interprets or references them.
- Allow distributed documentation across multiple notes if consistent and not contradicted.
- Include Response Rules with clear Yes / Maybe / No.
- Preserve the 7 sections exactly: problem_statement, what_qualifies, exclusions, record_review_priority, response_rules, keywords{include/exclude}, global_rules.
- No PHI. No clinical inference beyond documented statements. Keep language precise and operational.

Your response must be a single JSON object with:
{
  "problem_statement_json": {
    "problem_statement": "string",
    "what_qualifies": ["string"],
    "exclusions": ["string"],
    "record_review_priority": ["string"],
    "response_rules": {
      "yes": "string",
      "maybe": "string",
      "no": "string"
    },
    "keywords": {
      "include": ["string"],
      "exclude": ["string"]
    },
    "global_rules": ["string"]
  },
  "edit_rationale": "string (max 150 words explaining changes)"
}`;

export async function regenerateProblemStatement(
  request: RegenerateRequest
): Promise<{ response: RegenerateResponse; lintResult: any }> {
  const userPrompt = buildUserPrompt(request);

  try {
    // Try GPT-5 first, fallback to GPT-4o
    let modelName = process.env.MODEL_NAME || 'gpt-5-turbo-preview';
    
    const openai = getOpenAIClient();
    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
    } catch (error: any) {
      // If GPT-5 fails, try GPT-4o
      if (error?.error?.code === 'model_not_found' || error?.status === 404) {
        console.log('GPT-5 not available, falling back to GPT-4o');
        modelName = 'gpt-4o';
        completion = await openai.chat.completions.create({
          model: modelName,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        });
      } else {
        throw error;
      }
    }

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No content received from AI model');
    }

    const parsed = JSON.parse(content);
    
    // Validate response structure
    if (!parsed.problem_statement_json || !parsed.edit_rationale) {
      throw new Error('Invalid response structure from AI model');
    }

    // Validate problem statement schema
    const validatedPS = ProblemStatementSchema.parse(parsed.problem_statement_json);

    // Run lint checks
    const lintResult = lintProblemStatement(validatedPS);

    const response: RegenerateResponse = {
      problem_statement_json: validatedPS,
      edit_rationale: parsed.edit_rationale.substring(0, 500), // Enforce max length
    };

    return { response, lintResult };
  } catch (error: any) {
    console.error('AI regeneration error:', error);
    throw new Error(`Failed to regenerate problem statement: ${error.message}`);
  }
}

function buildUserPrompt(request: RegenerateRequest): string {
  let prompt = `Mode: ${request.mode}\n\n`;
  
  prompt += `Current Problem Statement:\n${JSON.stringify(request.current_problem_statement_json, null, 2)}\n\n`;
  
  if (request.issues && request.issues.length > 0) {
    prompt += `Issues to Address:\n`;
    request.issues.forEach((issue, idx) => {
      prompt += `${idx + 1}. ${issue.type}\n`;
      if (issue.notes) prompt += `   Notes: ${issue.notes}\n`;
      if (issue.proposed_fix) prompt += `   Proposed Fix: ${issue.proposed_fix}\n`;
    });
    prompt += `\n`;
  }
  
  if (request.developer_notes && request.developer_notes.trim().length > 0) {
    prompt += `Developer Notes:\n${request.developer_notes}\n\n`;
  }
  
  prompt += `Tasks:\n`;
  if (request.mode === 'Targeted Edit') {
    prompt += `1. Address the specific issues listed above while preserving unchanged sections\n`;
  } else {
    prompt += `1. Perform a comprehensive rewrite addressing all issues and improving overall quality\n`;
  }
  prompt += `2. Ensure all 7 sections are present and valid\n`;
  prompt += `3. Follow all hard rules (current encounter, clinician-authored, no inference, distributed docs OK)\n`;
  prompt += `4. Include clear Yes/Maybe/No response rules\n`;
  prompt += `5. Write a concise edit_rationale (max 150 words) explaining changes\n\n`;
  prompt += `Return ONLY a JSON object with problem_statement_json and edit_rationale.`;
  
  return prompt;
}
