'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, RefreshCw, Upload, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
import { ProblemStatement, ISSUE_TYPES, IssueType, RegenerationMode } from '@/types';
import DiffViewer from '@/components/editor/DiffViewer';
import IssuesPanel from '@/components/editor/IssuesPanel';
import LintDisplay from '@/components/editor/LintDisplay';
import ProblemStatementForm from '@/components/editor/ProblemStatementForm';

export default function CriterionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const criterionId = params.id as string;

  // State
  const [criterion, setCriterion] = useState<any>(null);
  const [problemStatement, setProblemStatement] = useState<ProblemStatement | null>(null);
  const [issues, setIssues] = useState<any[]>([]);
  const [developerNotes, setDeveloperNotes] = useState('');
  const [lintResult, setLintResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  
  // Diff state
  const [showDiff, setShowDiff] = useState(false);
  const [draftPS, setDraftPS] = useState<ProblemStatement | null>(null);
  const [editRationale, setEditRationale] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Load criterion and issues
  useEffect(() => {
    fetchCriterion();
    fetchIssues();
  }, [criterionId]);

  // Auto-save with debounce
  useEffect(() => {
    if (!problemStatement || !criterion) return;
    
    const timer = setTimeout(() => {
      saveDraft();
    }, 2000);

    return () => clearTimeout(timer);
  }, [problemStatement]);

  // Run lint when PS changes
  useEffect(() => {
    if (problemStatement) {
      runLint();
    }
  }, [problemStatement]);

  const fetchCriterion = async () => {
    try {
      const response = await fetch(`/api/criteria/${criterionId}`);
      const data = await response.json();
      
      if (response.ok) {
        setCriterion(data.criterion);
        setProblemStatement(data.criterion.problemStatementJson);
      } else {
        alert('Criterion not found');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching criterion:', error);
      alert('Failed to load criterion');
    } finally {
      setLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const response = await fetch(`/api/criteria/${criterionId}/issues`);
      const data = await response.json();
      if (response.ok) {
        setIssues(data.issues || []);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    }
  };

  const saveDraft = async () => {
    if (saving || !problemStatement) return;
    
    setSaving(true);
    try {
      const response = await fetch(`/api/criteria/${criterionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_statement_json: problemStatement,
          author: 'beta-user',
        }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const runLint = () => {
    // Client-side basic validation
    const failures: any[] = [];
    const warnings: any[] = [];

    if (!problemStatement) return;

    // Basic checks
    if (!problemStatement.problem_statement || problemStatement.problem_statement.length < 50) {
      failures.push({ rule: 'MIN_LENGTH', message: 'Problem statement must be at least 50 characters' });
    }

    if (!problemStatement.response_rules?.maybe) {
      failures.push({ rule: 'MAYBE_REQUIRED', message: 'Maybe response rule is required' });
    }

    if (problemStatement.keywords?.include?.length < 3) {
      warnings.push({ rule: 'KEYWORDS_SPARSE', message: 'Consider adding more include keywords' });
    }

    setLintResult({
      passed: failures.length === 0,
      failures,
      warnings,
    });
  };

  const handleRegenerate = async (mode: RegenerationMode) => {
    if (!problemStatement) return;

    setRegenerating(true);
    try {
      const response = await fetch(`/api/criteria/${criterionId}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_problem_statement_json: problemStatement,
          issues: issues
            .filter(i => i.status === 'Open')
            .map(i => ({
              type: i.type,
              notes: i.notes,
              proposed_fix: i.proposedFix,
            })),
          developer_notes: developerNotes,
          mode,
          author: 'beta-user',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setDraftPS(data.problem_statement_json);
        setEditRationale(data.edit_rationale);
        setLintResult(data.lint_result);
        setShowDiff(true);
      } else {
        alert(`Regeneration failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      alert('Failed to regenerate. Check console for details.');
    } finally {
      setRegenerating(false);
    }
  };

  const handleAcceptDraft = () => {
    if (draftPS) {
      setProblemStatement(draftPS);
      setShowDiff(false);
      setDraftPS(null);
      setEditRationale('');
      alert('Changes accepted! Auto-saving...');
    }
  };

  const handleDiscardDraft = () => {
    setShowDiff(false);
    setDraftPS(null);
    setEditRationale('');
  };

  const handlePublish = async () => {
    const changeReason = prompt('Enter reason for publishing:');
    if (!changeReason) return;

    const overrideLint = lintResult && !lintResult.passed 
      ? confirm('Lint validation failed. Override and publish anyway?')
      : false;

    try {
      const response = await fetch(`/api/criteria/${criterionId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          change_reason: changeReason,
          override_lint: overrideLint,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Published successfully!');
        fetchCriterion(); // Reload to get updated version
      } else {
        alert(`Publish failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Publish error:', error);
      alert('Failed to publish');
    }
  };

  const handleRollback = async () => {
    const changeReason = prompt('Enter reason for rollback:');
    if (!changeReason) return;

    if (!confirm('Are you sure you want to rollback to the last published version?')) return;

    try {
      const response = await fetch(`/api/criteria/${criterionId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_reason: changeReason }),
      });

      if (response.ok) {
        alert('Rolled back successfully!');
        fetchCriterion();
      } else {
        const data = await response.json();
        alert(`Rollback failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Rollback error:', error);
      alert('Failed to rollback');
    }
  };

  const handleExport = async (format: 'json' | 'markdown' | 'schema' | 'all') => {
    try {
      const response = await fetch(`/api/criteria/${criterionId}/export?format=${format}`);
      
      if (format === 'markdown') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${criterionId}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${criterionId}_export.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading criterion...</p>
        </div>
      </div>
    );
  }

  if (!criterion || !problemStatement) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600">Criterion not found</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    const classes = {
      Draft: 'badge-draft',
      Published: 'badge-published',
      Deprecated: 'badge-deprecated',
    };
    return `badge ${classes[criterion.status as keyof typeof classes] || 'badge-draft'}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Criteria
        </button>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{criterion.title}</h1>
              <span className={getStatusBadge()}>{criterion.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {criterion.criterionId} • Version {criterion.versionNumber}
            </p>
            {lastSaved && (
              <p className="text-xs text-gray-400 mt-1">
                {saving ? 'Saving...' : `Saved ${lastSaved.toLocaleTimeString()}`}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleExport('markdown')}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={handleRollback}
              className="btn-secondary flex items-center gap-2"
              disabled={criterion.status !== 'Published'}
            >
              <RotateCcw className="h-4 w-4" />
              Rollback
            </button>
            <button
              onClick={handlePublish}
              className="btn-primary flex items-center gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              Publish
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Editor */}
        <div className="lg:col-span-2 space-y-6">
          <ProblemStatementForm
            problemStatement={problemStatement}
            onChange={setProblemStatement}
          />
        </div>

        {/* Right Column - Tools */}
        <div className="space-y-6">
          {/* Lint Display */}
          <LintDisplay lintResult={lintResult} />

          {/* Issues Panel */}
          <IssuesPanel
            criterionId={criterionId}
            issues={issues}
            onIssuesChange={fetchIssues}
          />

          {/* Developer Notes */}
          <div className="card p-4">
            <h3 className="font-medium mb-3">Developer Notes</h3>
            <textarea
              className="textarea w-full"
              rows={6}
              placeholder="Provide guidance to the AI for regeneration..."
              value={developerNotes}
              onChange={(e) => setDeveloperNotes(e.target.value)}
            />
          </div>

          {/* Regenerate Actions */}
          <div className="card p-4 space-y-3">
            <h3 className="font-medium mb-2">Regenerate</h3>
            <button
              onClick={() => handleRegenerate('Targeted Edit')}
              disabled={regenerating}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
              {regenerating ? 'Regenerating...' : 'Targeted Edit'}
            </button>
            <button
              onClick={() => handleRegenerate('Full Rewrite')}
              disabled={regenerating}
              className="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
              Full Rewrite
            </button>
          </div>
        </div>
      </div>

      {/* Diff Viewer Modal */}
      {showDiff && draftPS && (
        <DiffViewer
          oldPS={problemStatement}
          newPS={draftPS}
          rationale={editRationale}
          lintResult={lintResult}
          onAccept={handleAcceptDraft}
          onDiscard={handleDiscardDraft}
        />
      )}
    </div>
  );
}
