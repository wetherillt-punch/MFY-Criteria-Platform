// src/app/api/problem-statements/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { problemStatement } from '@/lib/db/schema';
import { ilike, or, sql } from 'drizzle-orm';

// GET - Search/List problem statements
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('search');

    let problemStatements: any[];

    if (searchQuery) {
      // Search by criterion ID or tags
      problemStatements = await db
        .select()
        .from(problemStatement)
        .where(
          or(
            ilike(problemStatement.criterionId, `%${searchQuery}%`),
            sql`${problemStatement.tags} && ARRAY[${searchQuery.toLowerCase()}]::text[]`
          )
        )
        .orderBy(sql`${problemStatement.createdAt} DESC`)
        .limit(50);
    } else {
      // Return empty array (no default list as per requirements)
      problemStatements = [];
    }

    return NextResponse.json({
      problemStatements,
      count: problemStatements.length,
    });

  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to search problem statements', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new problem statement (manual creation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      criterion_id,
      problem_statement_json,
      original_input,
      selected_issues,
      additional_context,
    } = body;

    if (!criterion_id || !problem_statement_json) {
      return NextResponse.json(
        { error: 'criterion_id and problem_statement_json are required' },
        { status: 400 }
      );
    }

    const tags = extractTagsFromJson(problem_statement_json, criterion_id);

    const [newPs] = await db.insert(problemStatement).values({
      criterionId: criterion_id,
      problemStatementJson: problem_statement_json,
      originalInput: original_input || '',
      selectedIssues: selected_issues || [],
      additionalContext: additional_context || null,
      tags: tags,
    }).returning();

    return NextResponse.json({
      problemStatement: newPs,
      message: 'Created successfully',
    });

  } catch (error: any) {
    console.error('Create error:', error);
    return NextResponse.json(
      { error: 'Failed to create problem statement', details: error.message },
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