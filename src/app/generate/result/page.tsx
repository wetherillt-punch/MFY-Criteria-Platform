'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Home, Copy, Save, Trash2, RefreshCw, Download, Check } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ProblemStatementData {
  id: string;
  criterionId: string;
  problemStatementJson: any;
  originalInput: string;
  selectedIssues: string[];
  additionalContext: string;
}

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copying, setCopying] = useState(false);
  const [data, setData] = useState<ProblemStatementData | null>(null);
  
  const [problemStatement, setProblemStatement] = useState('');
  const [whatQualifies, setWhatQualifies] = useState<string[]>([]);
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [recordReviewPriority, setRecordReviewPriority] = useState<string[]>([]);
  const [responseRules, setResponseRules] = useState({ yes: '', maybe: '', no: '' });
  const [keywords, setKeywords] = useState({ include: [] as string[], exclude: [] as string[] });
  const [globalRules, setGlobalRules] = useState<string[]>([]);

  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (id) {
      loadProblemStatement(id);
    }
  }, [id]);

  const loadProblemStatement = async (psId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/problem-statements/${psId}`);
      const result = await response.json();

      if (response.ok) {
        const ps = result.problemStatement;
        setData(ps);
        
        const json = ps.problemStatementJson;
        setProblemStatement(json.problem_statement || '');
        setWhatQualifies(json.what_qualifies || []);
        setExclusions(json.exclusions || []);
        setRecordReviewPriority(json.record_review_priority || []);
        setResponseRules(json.response_rules || { yes: '', maybe: '', no: '' });
        setKeywords(json.keywords || { include: [], exclude: [] });
        setGlobalRules(json.global_rules || []);
      } else {
        alert('Failed to load problem statement');
        router.push('/generate');
      }
    } catch (error) {
      console.error('Error loading:', error);
      alert('Failed to load problem statement');
      router.push('/generate');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const formatted = `## Problem Statement

${problemStatement}

## What Qualifies

${whatQualifies.map(item => `- ${item}`).join('\n')}

## Exclusions

${exclusions.map(item => `- ${item}`).join('\n')}

## Record Review Priority

${recordReviewPriority.map(item => `- ${item}`).join('\n')}

## Response Rules

**Yes:** ${responseRules.yes}

**Maybe:** ${responseRules.maybe}

**No:** ${responseRules.no}

## Keywords

**Include:** ${keywords.include.join(', ')}

**Exclude:** ${keywords.exclude.join(', ')}

## Global Rules

${globalRules.map(item => `- ${item}`).join('\n')}`;

    try {
      await navigator.clipboard.writeText(formatted);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const handleSave = async () => {
    if (!data?.criterionId) {
      alert('Criterion ID is required to save');
      return;
    }

    setSaving(true);
    try {
      const updatedJson = {
        problem_statement: problemStatement,
        what_qualifies: whatQualifies,
        exclusions: exclusions,
        record_review_priority: recordReviewPriority,
        response_rules: responseRules,
        keywords: keywords,
        global_rules: globalRules,
      };

      const response = await fetch(`/api/problem-statements/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem_statement_json: updatedJson,
        }),
      });

      if (response.ok) {
        alert('✓ Saved successfully!');
      } else {
        const errorData = await response.json();
        alert(`Save failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this generated problem statement and return to input page?')) {
      return;
    }

    try {
      await fetch(`/api/problem-statements/${id}`, {
        method: 'DELETE',
      });
      
      router.push('/generate');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete');
    }
  };

  const handleRegenerateClick = () => {
    setShowRegenerateDialog(true);
  };

  const handleRegenerateWithSameInput = async () => {
    setShowRegenerateDialog(false);
    setRegenerating(true);

    try {
      const response = await fetch('/api/problem-statements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criterion_id: data?.criterionId,
          input_text: data?.originalInput,
          selected_issues: data?.selectedIssues,
          additional_context: data?.additionalContext,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        router.push(`/generate/result?id=${result.id}`);
      } else {
        alert(`Regeneration failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Regenerate error:', error);
      alert('Failed to regenerate');
    } finally {
      setRegenerating(false);
    }
  };

  const handleModifyInput = () => {
    setShowRegenerateDialog(false);
    router.push(`/generate?load=${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading problem statement...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Problem statement not found</p>
          <Link href="/generate" className="mt-4 text-blue-600 underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Previous
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Generated Problem Statement
        </h1>
        <p className="text-gray-600">
          Criterion ID: <span className="font-semibold">{data.criterionId}</span>
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          disabled={copying}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition"
        >
          {copying ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copying ? 'Copied!' : 'Copy to Clipboard'}
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save'}
        </button>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 transition"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>

        <button
          onClick={handleRegenerateClick}
          disabled={regenerating}
          className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition"
        >
          <RefreshCw className="h-4 w-4" />
          {regenerating ? 'Regenerating...' : 'Regenerate'}
        </button>

        <button
          disabled
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 font-medium rounded-lg cursor-not-allowed"
        >
          <Download className="h-4 w-4" />
          Export (Coming Soon)
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Problem Statement</h2>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            rows={5}
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">What Qualifies</h2>
          {whatQualifies.map((item, idx) => (
            <div key={idx} className="mb-2">
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={item}
                onChange={(e) => {
                  const updated = [...whatQualifies];
                  updated[idx] = e.target.value;
                  setWhatQualifies(updated);
                }}
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Exclusions</h2>
          {exclusions.map((item, idx) => (
            <div key={idx} className="mb-2">
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={item}
                onChange={(e) => {
                  const updated = [...exclusions];
                  updated[idx] = e.target.value;
                  setExclusions(updated);
                }}
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Record Review Priority</h2>
          {recordReviewPriority.map((item, idx) => (
            <div key={idx} className="mb-2">
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={item}
                onChange={(e) => {
                  const updated = [...recordReviewPriority];
                  updated[idx] = e.target.value;
                  setRecordReviewPriority(updated);
                }}
              />
            </div>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Response Rules</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Yes</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={responseRules.yes}
                onChange={(e) => setResponseRules({ ...responseRules, yes: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Maybe</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={responseRules.maybe}
                onChange={(e) => setResponseRules({ ...responseRules, maybe: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">No</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={responseRules.no}
                onChange={(e) => setResponseRules({ ...responseRules, no: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Keywords</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Include</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={keywords.include.join(', ')}
                onChange={(e) => setKeywords({ ...keywords, include: e.target.value.split(',').map(s => s.trim()) })}
                placeholder="Comma-separated keywords"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Exclude</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                value={keywords.exclude.join(', ')}
                onChange={(e) => setKeywords({ ...keywords, exclude: e.target.value.split(',').map(s => s.trim()) })}
                placeholder="Comma-separated keywords"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Global Rules</h2>
          {globalRules.map((item, idx) => (
            <div key={idx} className="mb-2">
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={item}
                onChange={(e) => {
                  const updated = [...globalRules];
                  updated[idx] = e.target.value;
                  setGlobalRules(updated);
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {showRegenerateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Regenerate Problem Statement</h3>
            <p className="text-gray-600 mb-6">
              Do you want to regenerate with the same input, or modify the input first?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRegenerateDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleModifyInput}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200"
              >
                Modify Input
              </button>
              <button
                onClick={handleRegenerateWithSameInput}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
              >
                Same Input
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}