'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Home, Sparkles } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const ISSUE_SECTIONS = [
  'Problem Statement',
  'What Qualifies',
  'Exclusions',
  'Record Review Priority',
  'Response Rules',
  'Keywords',
  'Global Rules',
];

export default function GeneratePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loadId = searchParams.get('load');

  const [criterionId, setCriterionId] = useState('');
  const [inputText, setInputText] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [additionalContext, setAdditionalContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (loadId) {
      loadExistingProblemStatement(loadId);
    }
  }, [loadId]);

  const loadExistingProblemStatement = async (id: string) => {
    setLoadingExisting(true);
    try {
      const response = await fetch(`/api/problem-statements/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setCriterionId(data.problemStatement.criterionId);
        setInputText(data.problemStatement.originalInput);
        setSelectedIssues(data.problemStatement.selectedIssues || []);
        setAdditionalContext(data.problemStatement.additionalContext || '');
      } else {
        alert('Failed to load problem statement');
      }
    } catch (error) {
      console.error('Error loading:', error);
      alert('Failed to load problem statement');
    } finally {
      setLoadingExisting(false);
    }
  };

  const toggleIssue = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  const handleGenerate = async () => {
    if (!criterionId.trim()) {
      alert('Criterion ID is required');
      return;
    }

    if (!inputText.trim()) {
      alert('Please describe the issue or paste existing problem statement');
      return;
    }

    setGenerating(true);

    try {
      const response = await fetch('/api/problem-statements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criterion_id: criterionId,
          input_text: inputText,
          selected_issues: selectedIssues,
          additional_context: additionalContext,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push(`/generate/result?id=${data.id}`);
      } else {
        alert(`Generation failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate problem statement');
    } finally {
      setGenerating(false);
    }
  };

  if (loadingExisting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading problem statement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Navigation */}
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

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Generate Problem Statement
        </h1>
        <p className="text-gray-600">
          Describe the issue or paste existing content, then let AI create a refined version
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Criterion ID */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Criterion ID <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., SEPSIS-2024-001"
            value={criterionId}
            onChange={(e) => setCriterionId(e.target.value.toUpperCase())}
          />
          <p className="mt-1 text-xs text-gray-500">
            Required for tracking and saving this problem statement
          </p>
        </div>

        {/* Input Text */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Describe the Issue or Paste Existing Problem Statement <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
            rows={12}
            placeholder="Paste your existing problem statement here, or describe what you need...

Example: 
'The current problem statement for sepsis is too vague and doesn't clearly specify which documentation qualifies. We need clearer criteria for what constitutes proper sepsis documentation...'

Or paste your entire existing problem statement to have it refined."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <p className="mt-1 text-xs text-gray-500">
            The AI will use this to understand what you need and generate all 7 sections
          </p>
        </div>

        {/* Issue Checkboxes */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Which Sections Have Issues? (Optional)
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Check the sections that need improvement. This helps the AI focus on specific areas.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ISSUE_SECTIONS.map((section) => (
              <label
                key={section}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  checked={selectedIssues.includes(section)}
                  onChange={() => toggleIssue(section)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{section}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Context */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Additional Context (Optional)
          </label>
          <textarea
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Add any additional notes or requirements for the AI...

Example:
'Make sure to emphasize documentation timing requirements. Focus on clinical judgment criteria rather than just labs.'"
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
          />
        </div>

        {/* Generate Button */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/')}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating || !criterionId.trim() || !inputText.trim()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Problem Statement
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">💡 Tips for Best Results</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Be specific about what's wrong with the current statement</li>
          <li>• Check the issue boxes to help AI focus on specific sections</li>
          <li>• Paste your full existing statement if you have one</li>
          <li>• Use additional context to add special requirements</li>
        </ul>
      </div>
    </div>
  );
}