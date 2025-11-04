'use client';

import { ProblemStatement } from '@/types';
import { Plus, X } from 'lucide-react';

interface Props {
  problemStatement: ProblemStatement;
  onChange: (ps: ProblemStatement) => void;
}

export default function ProblemStatementForm({ problemStatement, onChange }: Props) {
  const updateField = (field: keyof ProblemStatement, value: any) => {
    onChange({ ...problemStatement, [field]: value });
  };

  const updateArrayItem = (field: 'what_qualifies' | 'exclusions' | 'record_review_priority' | 'global_rules', index: number, value: string) => {
    const arr = [...(problemStatement[field] || [])];
    arr[index] = value;
    updateField(field, arr);
  };

  const addArrayItem = (field: 'what_qualifies' | 'exclusions' | 'record_review_priority' | 'global_rules') => {
    const arr = [...(problemStatement[field] || []), ''];
    updateField(field, arr);
  };

  const removeArrayItem = (field: 'what_qualifies' | 'exclusions' | 'record_review_priority' | 'global_rules', index: number) => {
    const arr = [...(problemStatement[field] || [])];
    arr.splice(index, 1);
    updateField(field, arr);
  };

  const updateResponseRule = (rule: 'yes' | 'maybe' | 'no', value: string) => {
    updateField('response_rules', {
      ...problemStatement.response_rules,
      [rule]: value,
    });
  };

  const updateKeywords = (type: 'include' | 'exclude', index: number, value: string) => {
    const keywords = { ...problemStatement.keywords };
    const arr = [...(keywords[type] || [])];
    arr[index] = value;
    keywords[type] = arr;
    updateField('keywords', keywords);
  };

  const addKeyword = (type: 'include' | 'exclude') => {
    const keywords = { ...problemStatement.keywords };
    keywords[type] = [...(keywords[type] || []), ''];
    updateField('keywords', keywords);
  };

  const removeKeyword = (type: 'include' | 'exclude', index: number) => {
    const keywords = { ...problemStatement.keywords };
    const arr = [...(keywords[type] || [])];
    arr.splice(index, 1);
    keywords[type] = arr;
    updateField('keywords', keywords);
  };

  return (
    <div className="space-y-6">
      {/* Problem Statement */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">1. Problem Statement</h2>
          <span className="text-xs text-red-500">* Required</span>
        </div>
        <textarea
          className="textarea w-full"
          rows={8}
          placeholder="Main criterion description explaining what is being audited..."
          value={problemStatement.problem_statement || ''}
          onChange={(e) => updateField('problem_statement', e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-2">
          Must mention "current encounter" and "clinician-authored"
        </p>
      </div>

      {/* What Qualifies */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">2. What Qualifies</h2>
          <span className="text-xs text-red-500">* Required</span>
        </div>
        <div className="space-y-2">
          {(problemStatement.what_qualifies || []).map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-gray-500 mt-3">{idx + 1}.</span>
              <textarea
                className="textarea flex-1"
                rows={2}
                placeholder="Condition that must be met..."
                value={item}
                onChange={(e) => updateArrayItem('what_qualifies', idx, e.target.value)}
              />
              <button
                onClick={() => removeArrayItem('what_qualifies', idx)}
                className="text-red-500 hover:text-red-700 mt-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => addArrayItem('what_qualifies')}
          className="btn-secondary mt-3 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Qualification
        </button>
      </div>

      {/* Exclusions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Exclusions</h2>
        <div className="space-y-2">
          {(problemStatement.exclusions || []).map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-gray-500 mt-3">{idx + 1}.</span>
              <textarea
                className="textarea flex-1"
                rows={2}
                placeholder="What should be excluded..."
                value={item}
                onChange={(e) => updateArrayItem('exclusions', idx, e.target.value)}
              />
              <button
                onClick={() => removeArrayItem('exclusions', idx)}
                className="text-red-500 hover:text-red-700 mt-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => addArrayItem('exclusions')}
          className="btn-secondary mt-3 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Exclusion
        </button>
      </div>

      {/* Record Review Priority */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Record Review Priority</h2>
        <p className="text-sm text-gray-600 mb-3">Order matters - list most important document types first</p>
        <div className="space-y-2">
          {(problemStatement.record_review_priority || []).map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-gray-500 mt-3">{idx + 1}.</span>
              <input
                type="text"
                className="input flex-1"
                placeholder="Document type (e.g., Progress notes)"
                value={item}
                onChange={(e) => updateArrayItem('record_review_priority', idx, e.target.value)}
              />
              <button
                onClick={() => removeArrayItem('record_review_priority', idx)}
                className="text-red-500 hover:text-red-700 mt-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => addArrayItem('record_review_priority')}
          className="btn-secondary mt-3 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Document Type
        </button>
      </div>

      {/* Response Rules */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">5. Response Rules</h2>
          <span className="text-xs text-red-500">* All Required</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yes (Definitive Match)
            </label>
            <textarea
              className="textarea w-full"
              rows={5}
              placeholder="Conditions for definitive positive..."
              value={problemStatement.response_rules?.yes || ''}
              onChange={(e) => updateResponseRule('yes', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maybe (Manual Review)
            </label>
            <textarea
              className="textarea w-full"
              rows={5}
              placeholder="Conditions requiring review..."
              value={problemStatement.response_rules?.maybe || ''}
              onChange={(e) => updateResponseRule('maybe', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              No (Definitive Non-Match)
            </label>
            <textarea
              className="textarea w-full"
              rows={5}
              placeholder="Conditions for definitive negative..."
              value={problemStatement.response_rules?.no || ''}
              onChange={(e) => updateResponseRule('no', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Keywords */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">6. Keywords</h2>
          <span className="text-xs text-red-500">* Required</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Include Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Include (Positive Indicators)
            </label>
            <div className="space-y-2">
              {(problemStatement.keywords?.include || []).map((keyword, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Keyword..."
                    value={keyword}
                    onChange={(e) => updateKeywords('include', idx, e.target.value)}
                  />
                  <button
                    onClick={() => removeKeyword('include', idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addKeyword('include')}
              className="btn-secondary mt-2 text-sm flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Keyword
            </button>
          </div>

          {/* Exclude Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exclude (Negative Indicators)
            </label>
            <div className="space-y-2">
              {(problemStatement.keywords?.exclude || []).map((keyword, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    className="input flex-1"
                    placeholder="Keyword..."
                    value={keyword}
                    onChange={(e) => updateKeywords('exclude', idx, e.target.value)}
                  />
                  <button
                    onClick={() => removeKeyword('exclude', idx)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addKeyword('exclude')}
              className="btn-secondary mt-2 text-sm flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add Keyword
            </button>
          </div>
        </div>
      </div>

      {/* Global Rules */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Global Rules</h2>
        <p className="text-sm text-gray-600 mb-3">
          Universal rules that apply across all sections (e.g., "current encounter only", "no inference")
        </p>
        <div className="space-y-2">
          {(problemStatement.global_rules || []).map((rule, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="text-gray-500 mt-3">{idx + 1}.</span>
              <textarea
                className="textarea flex-1"
                rows={2}
                placeholder="Global rule..."
                value={rule}
                onChange={(e) => updateArrayItem('global_rules', idx, e.target.value)}
              />
              <button
                onClick={() => removeArrayItem('global_rules', idx)}
                className="text-red-500 hover:text-red-700 mt-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
        <button
          onClick={() => addArrayItem('global_rules')}
          className="btn-secondary mt-3 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Rule
        </button>
      </div>
    </div>
  );
}
