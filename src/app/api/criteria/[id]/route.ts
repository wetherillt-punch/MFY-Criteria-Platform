import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { criterion } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { ProblemStatementSchema } from '@/types';

interface RouteContext {
  params: { id: string };
}

// GET /api/criteria/:id - Fetch single criterion
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const criterionId = params.id;

    const result = await db
      .select()
      .from(criterion)
      .where(eq(criterion.criterionId, criterionId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Criterion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ criterion: result[0] });
  } catch (error: any) {
    console.error('Error fetching criterion:', error);
    return NextResponse.json(
      { error: 'Failed to fetch criterion', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/criteria/:id - Update criterion (save draft)
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const criterionId = params.id;
    const body = await request.json();

    const { title, problem_statement_json, linked_policy_id, linked_criteria_ids, author } = body;

    // Validate problem statement if provided
    if (problem_statement_json) {
      try {
        ProblemStatementSchema.parse(problem_statement_json);
      } catch (validationError: any) {
        return NextResponse.json(
          { error: 'Invalid problem statement structure', details: validationError.errors },
          { status: 400 }
        );
      }
    }

    const updateData: any = {
      dateUpdated: new Date(),
    };

    if (title) updateData.title = title;
    if (problem_statement_json) updateData.problemStatementJson = problem_statement_json;
    if (linked_policy_id !== undefined) updateData.linkedPolicyId = linked_policy_id;
    if (linked_criteria_ids !== undefined) updateData.linkedCriteriaIds = linked_criteria_ids;
    if (author) updateData.author = author;

    const updated = await db
      .update(criterion)
      .set(updateData)
      .where(eq(criterion.criterionId, criterionId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Criterion not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ criterion: updated[0] });
  } catch (error: any) {
    console.error('Error updating criterion:', error);
    return NextResponse.json(
      { error: 'Failed to update criterion', details: error.message },
      { status: 500 }
    );
  }
}
