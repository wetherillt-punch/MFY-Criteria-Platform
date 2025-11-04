'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ProblemStatement } from '@/types';

export default function NewCriterionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [criterionId, setCriterionId] = useState('');
  const [title, setTitle] = useState('');
  const [linkedPolicyId, setLinkedPolicyId] = useState('');

  const handleCreate = async () => {
    if (!criterionId || !title) {
      alert('Criterion ID and Title are required');
      return;
    }

    setLoading(true);
    try {
      // Create initial problem statement with empty structure
      const initialPS: ProblemStatement = {
        problem_statement: '',
        what_qualifies: [''],
        exclusions: [''],
        record_review_priority: [''],
        response_rules: {
          yes: '',
          maybe: '',
          no: '',
        },
        keywords: {
          include: [''],
          exclude: [''],
        },
        global_rules: [''],
      };

      const response = await fetch('/api/criteria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          criterion_id: criterionId,
          title,
          linked_policy_id: linkedPolicyId || null,
          author: 'beta-user',
          problem_statement_json: initialPS,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Criterion created successfully!');
        router.push(`/criteria/${criterionId}`);
      } else {
        alert(`Failed to create criterion: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating criterion:', error);
      alert('Failed to create criterion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Criteria
      </button>

      <div className="card p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Criterion</h1>
        <p className="text-gray-600 mb-8">
          Start by providing basic information. You'll be able to edit the full problem statement next.
        </p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Criterion ID *
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g., SEPSIS-2024-001"
              value={criterionId}
              onChange={(e) => setCriterionId(e.target.value.toUpperCase())}
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier for this criterion (uppercase recommended)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g., Severe Sepsis Documentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Human-readable name for this criterion
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Linked Policy ID (Optional)
            </label>
            <input
              type="text"
              className="input w-full"
              placeholder="e.g., POL-SEPSIS-001"
              value={linkedPolicyId}
              onChange={(e) => setLinkedPolicyId(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Reference to related policy document
            </p>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              onClick={() => router.push('/')}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !criterionId || !title}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Criterion'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Start Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">📝 What happens next?</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex gap-2">
            <span>1.</span>
            <span>Your criterion will be created with empty problem statement sections</span>
          </li>
          <li className="flex gap-2">
            <span>2.</span>
            <span>You'll be taken to the editor to fill in the 7 required sections</span>
          </li>
          <li className="flex gap-2">
            <span>3.</span>
            <span>Use the AI regeneration feature to refine your statement</span>
          </li>
          <li className="flex gap-2">
            <span>4.</span>
            <span>Publish when you're satisfied with the result</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
