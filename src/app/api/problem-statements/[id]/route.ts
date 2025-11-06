// src/app/api/problem-statements/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { problemStatement } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: { id: string };
}

// GET - Retrieve single problem statement
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;

    const [ps] = await db
      .select()
      .from(problemStatement)
      .where(eq(problemStatement.id, id))
      .limit(1);

    if (!ps) {
      return NextResponse.json(
        { error: 'Problem statement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      problemStatement: ps,
    });

  } catch (error: any) {
    console.error('Get error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve problem statement', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update problem statement
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { problem_statement_json } = body;

    if (!problem_statement_json) {
      return NextResponse.json(
        { error: 'problem_statement_json is required' },
        { status: 400 }
      );
    }

    // Get existing to preserve criterion_id for tags
    const [existing] = await db
      .select()
      .from(problemStatement)
      .where(eq(problemStatement.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: 'Problem statement not found' },
        { status: 404 }
      );
    }

    // Regenerate tags with new content
    const tags = extractTagsFromJson(problem_statement_json, existing.criterionId);

    const [updated] = await db
      .update(problemStatement)
      .set({
        problemStatementJson: problem_statement_json,
        tags: tags,
        updatedAt: new Date(),
      })
      .where(eq(problemStatement.id, id))
      .returning();

    return NextResponse.json({
      problemStatement: updated,
      message: 'Updated successfully',
    });

  } catch (error: any) {
    console.error('Update error:', error);
    return NextResponse.json(
      { error: 'Failed to update problem statement', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove problem statement
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = params;

    const deleted = await db
      .delete(problemStatement)
      .where(eq(problemStatement.id, id))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Problem statement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Deleted successfully',
    });

  } catch (error: any) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete problem statement', details: error.message },
      { status: 500 }
    );
  }
}

function extractTagsFromJson(json: any, criterionId: string): string[] {
  const tags = new Set<string>();
  
  tags.add(criterionId.toLowerCase());
  
  if (json.problem_statement) {
    const words = json.problem_statement
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 3 && !/^\d+$/.test(w));
    words.slice(0, 15).forEach((w: string) => tags.add(w));
  }
  
  if (json.keywords?.include) {
    json.keywords.include.forEach((k: string) => tags.add(k.toLowerCase()));
  }
  
  return Array.from(tags);
}