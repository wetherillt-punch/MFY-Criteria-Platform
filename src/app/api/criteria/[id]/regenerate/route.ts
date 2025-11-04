import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { criterion, aiRun } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { regenerateProblemStatement } from '@/lib/ai/model-router';
import { RegenerateRequest } from '@/types';

interface RouteContext {
  params: { id: string };
}

// POST /api/criteria/:id/regenerate - Generate new problem statement via AI
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const criterionId = params.id;
    const body = await request.json();

    const { 
      current_problem_statement_json, 
      issues = [], 
      developer_notes = '', 
      mode = 'Targeted Edit',
      author = 'system'
    } = body;

    if (!current_problem_statement_json) {
      return NextResponse.json(
        { error: 'Missing current_problem_statement_json' },
        { status: 400 }
      );
    }

    // Build request for AI
    const regenerateRequest: RegenerateRequest = {
      criterion_id: criterionId,
      current_problem_statement_json,
      issues,
      developer_notes,
      mode,
    };

    // Call AI model
    const { response, lintResult } = await regenerateProblemStatement(regenerateRequest);

    // Save AI run to database
    const run = await db.insert(aiRun).values({
      criterionId,
      mode,
      inputContext: {
        current_problem_statement: current_problem_statement_json,
        issues,
        developer_notes,
      },
      agentOutput: {
        problem_statement_json: response.problem_statement_json,
        edit_rationale: response.edit_rationale,
      },
      lintResult,
      createdBy: author,
    }).returning();

    return NextResponse.json({
      run_id: run[0].runId,
      problem_statement_json: response.problem_statement_json,
      edit_rationale: response.edit_rationale,
      lint_result: lintResult,
    });
  } catch (error: any) {
    console.error('Error regenerating problem statement:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate problem statement', details: error.message },
      { status: 500 }
    );
  }
}
