# Phase 2 Implementation Guide - UI Components

This guide helps you complete the PEC Beta Platform by building the missing UI components. The backend is fully functional and tested.

## ✅ What's Already Done

- ✅ Full backend API (criteria CRUD, regenerate, publish, rollback, issues, export)
- ✅ Database schema and migrations
- ✅ AI model router with GPT-5/GPT-4o fallback
- ✅ Lint validation engine
- ✅ TypeScript types and schemas
- ✅ Basic homepage with criteria list

## 🎯 What You Need to Build

### 1. Criterion Editor Page (`src/app/criteria/[id]/page.tsx`)

**Location**: Create this file

**Purpose**: Main editing interface for problem statements

**Required Components**:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function CriterionEditorPage() {
  const params = useParams();
  const criterionId = params.id as string;
  
  // State
  const [criterion, setCriterion] = useState(null);
  const [problemStatement, setProblemStatement] = useState({});
  const [issues, setIssues] = useState([]);
  const [developerNotes, setDeveloperNotes] = useState('');
  const [lintResult, setLintResult] = useState(null);
  const [showDiff, setShowDiff] = useState(false);
  const [draftPS, setDraftPS] = useState(null);
  
  // Fetch criterion on mount
  useEffect(() => {
    fetch(`/api/criteria/${criterionId}`)
      .then(res => res.json())
      .then(data => {
        setCriterion(data.criterion);
        setProblemStatement(data.criterion.problemStatementJson);
      });
  }, [criterionId]);
  
  // Implement handlers...
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header with title, status, version */}
      {/* 7-section form */}
      {/* Issues panel */}
      {/* Developer notes */}
      {/* Action buttons */}
      {/* Diff drawer (conditional) */}
    </div>
  );
}
```

#### 7-Section Form

Create form fields for each section:

```tsx
<div className="space-y-6">
  {/* Problem Statement */}
  <div>
    <label className="block text-sm font-medium mb-2">
      Problem Statement *
    </label>
    <textarea
      className="textarea w-full"
      rows={6}
      value={problemStatement.problem_statement || ''}
      onChange={(e) => updateSection('problem_statement', e.target.value)}
    />
  </div>

  {/* What Qualifies (array of strings) */}
  <div>
    <label className="block text-sm font-medium mb-2">
      What Qualifies *
    </label>
    {problemStatement.what_qualifies?.map((item, idx) => (
      <div key={idx} className="flex gap-2 mb-2">
        <input
          className="input flex-1"
          value={item}
          onChange={(e) => updateArrayItem('what_qualifies', idx, e.target.value)}
        />
        <button onClick={() => removeArrayItem('what_qualifies', idx)}>
          Remove
        </button>
      </div>
    ))}
    <button onClick={() => addArrayItem('what_qualifies')}>
      + Add Qualification
    </button>
  </div>

  {/* Repeat for: exclusions, record_review_priority */}

  {/* Response Rules (object with yes/maybe/no) */}
  <div className="grid grid-cols-3 gap-4">
    <div>
      <label className="block text-sm font-medium mb-2">Yes *</label>
      <textarea
        className="textarea"
        rows={3}
        value={problemStatement.response_rules?.yes || ''}
        onChange={(e) => updateResponseRule('yes', e.target.value)}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">Maybe *</label>
      <textarea
        className="textarea"
        rows={3}
        value={problemStatement.response_rules?.maybe || ''}
        onChange={(e) => updateResponseRule('maybe', e.target.value)}
      />
    </div>
    <div>
      <label className="block text-sm font-medium mb-2">No *</label>
      <textarea
        className="textarea"
        rows={3}
        value={problemStatement.response_rules?.no || ''}
        onChange={(e) => updateResponseRule('no', e.target.value)}
      />
    </div>
  </div>

  {/* Keywords (object with include/exclude arrays) */}
  {/* Global Rules (array) */}
</div>
```

#### Issues Panel

Multi-select dropdown for issue types:

```tsx
import { ISSUE_TYPES } from '@/types';

<div className="card p-4">
  <h3 className="font-medium mb-4">Issues</h3>
  
  <select
    className="input mb-4"
    onChange={(e) => addIssue(e.target.value)}
  >
    <option value="">Select issue type...</option>
    {ISSUE_TYPES.map(type => (
      <option key={type} value={type}>{type}</option>
    ))}
  </select>

  <div className="space-y-2">
    {issues.map((issue, idx) => (
      <div key={idx} className="border rounded p-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <p className="text-sm font-medium">{issue.type}</p>
            <textarea
              className="textarea mt-2 text-xs"
              placeholder="Notes..."
              rows={2}
              value={issue.notes || ''}
              onChange={(e) => updateIssue(idx, 'notes', e.target.value)}
            />
          </div>
          <button onClick={() => removeIssue(idx)}>×</button>
        </div>
      </div>
    ))}
  </div>
</div>
```

#### Lint Display

Live validation results:

```tsx
const runLint = async () => {
  const response = await fetch('/api/lint', {
    method: 'POST',
    body: JSON.stringify({ problem_statement: problemStatement })
  });
  const result = await response.json();
  setLintResult(result);
};

// Display
<div className="card p-4">
  <h3 className="font-medium mb-2">Validation</h3>
  
  {lintResult?.passed ? (
    <div className="text-green-600">✓ All checks passed</div>
  ) : (
    <>
      {lintResult?.failures?.map((f, idx) => (
        <div key={idx} className="text-red-600 text-sm">
          ❌ {f.rule}: {f.message}
        </div>
      ))}
    </>
  )}
  
  {lintResult?.warnings?.length > 0 && (
    <>
      <h4 className="text-sm font-medium mt-3">Warnings</h4>
      {lintResult.warnings.map((w, idx) => (
        <div key={idx} className="text-yellow-600 text-sm">
          ⚠️ {w.rule}: {w.message}
        </div>
      ))}
    </>
  )}
</div>
```

### 2. Regenerate Function

```tsx
const handleRegenerate = async (mode: 'Targeted Edit' | 'Full Rewrite') => {
  try {
    setLoading(true);
    
    const response = await fetch(`/api/criteria/${criterionId}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_problem_statement_json: problemStatement,
        issues: issues.map(i => ({
          type: i.type,
          notes: i.notes,
          proposed_fix: i.proposedFix
        })),
        developer_notes: developerNotes,
        mode,
        author: 'beta-user'
      })
    });

    const data = await response.json();
    
    setDraftPS(data.problem_statement_json);
    setEditRationale(data.edit_rationale);
    setLintResult(data.lint_result);
    setShowDiff(true);
    
  } catch (error) {
    console.error('Regeneration failed:', error);
    alert('Failed to regenerate. Check console.');
  } finally {
    setLoading(false);
  }
};
```

### 3. Diff Viewer Component

Install dependency:
```bash
npm install react-diff-viewer-continued
```

Create component:

```tsx
import ReactDiffViewer from 'react-diff-viewer-continued';

function DiffDrawer({ oldPS, newPS, rationale, onAccept, onDiscard }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="absolute right-0 top-0 bottom-0 w-3/4 bg-white shadow-xl overflow-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">Review Changes</h2>
              <p className="text-sm text-gray-600 mt-2">
                {rationale}
              </p>
            </div>
            <button onClick={onDiscard}>×</button>
          </div>

          {/* Diff for each section */}
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Problem Statement</h3>
              <ReactDiffViewer
                oldValue={oldPS.problem_statement}
                newValue={newPS.problem_statement}
                splitView={true}
                useDarkTheme={false}
              />
            </div>

            {/* Repeat for other sections */}
          </div>

          <div className="flex gap-4 mt-8 sticky bottom-0 bg-white py-4 border-t">
            <button className="btn-primary" onClick={onAccept}>
              Accept Draft
            </button>
            <button className="btn-secondary" onClick={onDiscard}>
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4. Publish Workflow

```tsx
const handlePublish = async () => {
  const changeReason = prompt('Enter reason for publishing:');
  if (!changeReason) return;

  try {
    const response = await fetch(`/api/criteria/${criterionId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        change_reason: changeReason,
        override_lint: confirm('Override lint failures?')
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      alert('Published successfully!');
      window.location.reload();
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    console.error('Publish failed:', error);
  }
};
```

### 5. Auto-Save Draft

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (criterion && problemStatement) {
      saveDraft();
    }
  }, 2000);

  return () => clearTimeout(timer);
}, [problemStatement]);

const saveDraft = async () => {
  try {
    await fetch(`/api/criteria/${criterionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problem_statement_json: problemStatement,
        author: 'beta-user'
      })
    });
    console.log('Draft saved');
  } catch (error) {
    console.error('Auto-save failed:', error);
  }
};
```

## 🎨 Styling Tips

Use the pre-defined Tailwind classes from `globals.css`:
- `.btn-primary`, `.btn-secondary`, `.btn-destructive`
- `.input`, `.textarea`
- `.card`
- `.badge`, `.badge-draft`, `.badge-published`

## 🧪 Testing Your Work

1. Start dev server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click on a criterion from seed data
4. Test editing each section
5. Add issues and notes
6. Click "Regenerate" (Targeted Edit)
7. Review diff, accept changes
8. Click "Publish" with reason
9. Check version incremented

## 🐛 Common Issues

**Issue**: Criterion not loading
- Check API response in Network tab
- Verify DATABASE_URL is set
- Run `npm run db:push` again

**Issue**: Regenerate fails
- Check OPENAI_API_KEY is valid
- Check console for API errors
- Try GPT-4o instead of GPT-5

**Issue**: Lint not running
- Import `lintProblemStatement` from `@/lib/lint`
- Call it manually or via API endpoint

## 📦 Additional Components You Might Need

Create these in `src/components/`:

1. **SectionEditor.tsx** - Reusable section form field
2. **IssueCard.tsx** - Individual issue display
3. **LintBadge.tsx** - Visual lint status indicator
4. **LoadingSpinner.tsx** - Loading state
5. **Toast.tsx** - Success/error notifications

## 🚀 When You're Done

1. Test all CRUD operations
2. Test regenerate with both modes
3. Test publish/rollback
4. Test export in all formats
5. Check responsive design
6. Deploy to Vercel
7. Update README with screenshots

## 📞 Need Help?

- Backend API is fully documented in README
- Check `/api` routes for endpoint details
- Review seed data for example structures
- Test endpoints with curl before building UI

Good luck! 🎉
