import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { issue } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: { id: string };
}

// GET /api/criteria/:id/issues - List issues for criterion
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const criterionId = params.id;

    const issues = await db
      .select()
      .from(issue)
      .where(eq(issue.criterionId, criterionId))
      .orderBy(issue.createdAt);

    return NextResponse.json({ issues });
  } catch (error: any) {
    console.error('Error fetching issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/criteria/:id/issues - Add new issue(s)
export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const criterionId = params.id;
    const body = await request.json();

    const { type, notes, proposed_fix, created_by = 'system', status = 'Open' } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Issue type is required' },
        { status: 400 }
      );
    }

    const newIssue = await db.insert(issue).values({
      criterionId,
      type,
      status,
      notes: notes || null,
      proposedFix: proposed_fix || null,
      createdBy: created_by,
    }).returning();

    return NextResponse.json({ issue: newIssue[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating issue:', error);
    return NextResponse.json(
      { error: 'Failed to create issue', details: error.message },
      { status: 500 }
    );
  }
}
