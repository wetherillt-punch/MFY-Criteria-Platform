import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { criterion } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateMarkdown, generateJsonSchema } from '@/lib/export/generators';

interface RouteContext {
  params: { id: string };
}

// GET /api/criteria/:id/export - Export criterion in JSON, Markdown, and JSON Schema
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const criterionId = params.id;
    const format = request.nextUrl.searchParams.get('format') || 'all';

    // Fetch criterion
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

    const crit = result[0];
    const ps = crit.problemStatementJson as any;

    const metadata = {
      criterion_id: crit.criterionId,
      title: crit.title,
      version_number: crit.versionNumber,
      status: crit.status,
      date_updated: crit.dateUpdated,
      linked_policy_id: crit.linkedPolicyId,
    };

    // Generate exports based on format
    const exports: any = {};

    if (format === 'json' || format === 'all') {
      exports.json = {
        metadata,
        problem_statement: ps,
      };
    }

    if (format === 'markdown' || format === 'all') {
      exports.markdown = generateMarkdown(ps, metadata);
    }

    if (format === 'schema' || format === 'all') {
      exports.schema = generateJsonSchema();
    }

    // If single format requested, return appropriate content-type
    if (format === 'json') {
      return NextResponse.json(exports.json);
    }

    if (format === 'markdown') {
      return new NextResponse(exports.markdown, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': `attachment; filename="${criterionId}.md"`,
        },
      });
    }

    if (format === 'schema') {
      return NextResponse.json(exports.schema);
    }

    // Return all formats
    return NextResponse.json(exports);
  } catch (error: any) {
    console.error('Error exporting criterion:', error);
    return NextResponse.json(
      { error: 'Failed to export criterion', details: error.message },
      { status: 500 }
    );
  }
}
