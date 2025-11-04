import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { criterion } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: { id: string };
}

// POST /api/criteria/:id/rollback - Rollback to last published version
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const criterionId = params.id;
    const body = await request.json();

    const { change_reason } = body;

    if (!change_reason || change_reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'change_reason is required for rollback' },
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

    // Note: In a full implementation, you'd store version history separately
    // For now, we'll just mark it as rolled back
    // In production, you'd want a criterion_history table to fetch the previous version

    if (currentCriterion.status !== 'Published' && currentCriterion.status !== 'Draft') {
      return NextResponse.json(
        { error: 'Can only rollback Published or Draft criteria' },
        { status: 400 }
      );
    }

    // For now, just update the change reason and log the rollback
    // In production, you'd restore from criterion_history table
    const updated = await db
      .update(criterion)
      .set({
        changeReason: `ROLLBACK: ${change_reason}`,
        dateUpdated: new Date(),
      })
      .where(eq(criterion.criterionId, criterionId))
      .returning();

    return NextResponse.json({
      criterion: updated[0],
      message: 'Rollback logged. Note: Full version history requires criterion_history table.',
    });
  } catch (error: any) {
    console.error('Error rolling back criterion:', error);
    return NextResponse.json(
      { error: 'Failed to rollback criterion', details: error.message },
      { status: 500 }
    );
  }
}
