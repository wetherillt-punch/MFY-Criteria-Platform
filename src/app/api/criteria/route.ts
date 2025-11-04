import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { criterion } from '@/lib/db/schema';
import { like, or, desc } from 'drizzle-orm';
import { ProblemStatementSchema } from '@/types';

// GET /api/criteria - List/search criteria
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    let query = db.select().from(criterion);

    // Apply filters
    if (search) {
      query = query.where(
        or(
          like(criterion.criterionId, `%${search}%`),
          like(criterion.title, `%${search}%`)
        )
      ) as any;
    }

    if (status) {
      query = query.where({ status } as any) as any;
    }

    const results = await query.orderBy(desc(criterion.dateUpdated));

    return NextResponse.json({ criteria: results });
  } catch (error: any) {
    console.error('Error fetching criteria:', error);
    return NextResponse.json(
      { error: 'Failed to fetch criteria', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/criteria - Create new criterion
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { criterion_id, title, author, problem_statement_json, linked_policy_id } = body;

    if (!criterion_id || !title || !author || !problem_statement_json) {
      return NextResponse.json(
        { error: 'Missing required fields: criterion_id, title, author, problem_statement_json' },
        { status: 400 }
      );
    }

    // Validate problem statement structure
    try {
      ProblemStatementSchema.parse(problem_statement_json);
    } catch (validationError: any) {
      return NextResponse.json(
        { error: 'Invalid problem statement structure', details: validationError.errors },
        { status: 400 }
      );
    }

    const newCriterion = await db.insert(criterion).values({
      criterionId: criterion_id,
      title,
      author,
      problemStatementJson: problem_statement_json,
      linkedPolicyId: linked_policy_id || null,
      status: 'Draft',
      versionNumber: 1,
    }).returning();

    return NextResponse.json({ criterion: newCriterion[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating criterion:', error);
    return NextResponse.json(
      { error: 'Failed to create criterion', details: error.message },
      { status: 500 }
    );
  }
}
