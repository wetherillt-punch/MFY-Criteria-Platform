import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { criterion } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { lintProblemStatement } from '@/lib/lint';

interface RouteContext {
  params: { id: string };
}

// POST /api/criteria/:id/publish - Publish criterion
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const criterionId = params.id;
    const body = await request.json();

    const { change_reason, override_lint = false } = body;

    if (!change_reason || change_reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'change_reason is required for publishing' },
        { status: 400 }
      );
    }

    // Fetch current criterion
    const current = await db
      .select()
      .from(criterion)
      .where(eq(criterion.criterionId, criterionId))
      .limit(1);

    if (current.length === 0) {
      return NextResponse.json(
        { error: 'Criterion not found' },
        { status: 404 }
      );
    }

    const currentCriterion = current[0];

    // Run lint checks
    const lintResult = lintProblemStatement(
      currentCriterion.problemStatementJson as any
    );

    // If lint fails and no override, reject
    if (!lintResult.passed && !override_lint) {
      return NextResponse.json(
        {
          error: 'Lint validation failed. Set override_lint=true with justification to publish anyway.',
          lint_result: lintResult,
        },
        { status: 400 }
      );
    }

    // Update to Published status and increment version
    const updated = await db
      .update(criterion)
      .set({
        status: 'Published',
        versionNumber: currentCriterion.versionNumber + 1,
        changeReason: change_reason,
        dateUpdated: new Date(),
      })
      .where(eq(criterion.criterionId, criterionId))
      .returning();

    // TODO: Trigger webhook if enabled
    // TODO: Export JSON/Markdown files

    return NextResponse.json({
      criterion: updated[0],
      message: 'Criterion published successfully',
      lint_result: lintResult,
    });
  } catch (error: any) {
    console.error('Error publishing criterion:', error);
    return NextResponse.json(
      { error: 'Failed to publish criterion', details: error.message },
      { status: 500 }
    );
  }
}
