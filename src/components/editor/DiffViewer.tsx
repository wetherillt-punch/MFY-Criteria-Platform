'use client';

import { ProblemStatement } from '@/types';
import { X, Check, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Props {
  oldPS: ProblemStatement;
  newPS: ProblemStatement;
  rationale: string;
  lintResult: any;
  onAccept: () => void;
  onDiscard: () => void;
}

export default function DiffViewer({ oldPS, newPS, rationale, lintResult, onAccept, onDiscard }: Props) {
  const [activeTab, setActiveTab] = useState<'all' | 'changes'>('changes');

  const sections = [
    { key: 'problem_statement', label: 'Problem Statement', type: 'text' },
    { key: 'what_qualifies', label: 'What Qualifies', type: 'array' },
    { key: 'exclusions', label: 'Exclusions', type: 'array' },
    { key: 'record_review_priority', label: 'Record Review Priority', type: 'array' },
    { key: 'response_rules', label: 'Response Rules', type: 'object' },
    { key: 'keywords', label: 'Keywords', type: 'object' },
    { key: 'global_rules', label: 'Global Rules', type: 'array' },
  ];

  const hasChanged = (key: string) => {
    return JSON.stringify(oldPS[key as keyof ProblemStatement]) !== JSON.stringify(newPS[key as keyof ProblemStatement]);
  };

  const changedSections = sections.filter(s => hasChanged(s.key));

  const renderTextDiff = (oldText: string, newText: string) => {
    if (oldText === newText) {
      return (
        <div className="p-4 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">{oldText}</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">OLD</div>
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{oldText}</p>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">NEW</div>
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{newText}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderArrayDiff = (oldArr: string[], newArr: string[]) => {
    if (JSON.stringify(oldArr) === JSON.stringify(newArr)) {
      return (
        <div className="p-4 bg-gray-50 rounded">
          <ol className="list-decimal list-inside space-y-1">
            {oldArr.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-600">{item}</li>
            ))}
          </ol>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">OLD</div>
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <ol className="list-decimal list-inside space-y-1">
              {oldArr.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-900">{item}</li>
              ))}
            </ol>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 mb-2">NEW</div>
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <ol className="list-decimal list-inside space-y-1">
              {newArr.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-900">{item}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  };

  const renderObjectDiff = (oldObj: any, newObj: any, label: string) => {
    const keys = Array.from(new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]));
    
    return (
      <div className="space-y-4">
        {keys.map(key => {
          const oldVal = oldObj?.[key];
          const newVal = newObj?.[key];
          const changed = JSON.stringify(oldVal) !== JSON.stringify(newVal);

          if (!changed && activeTab === 'changes') return null;

          return (
            <div key={key}>
              <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize">{key}</h4>
              {Array.isArray(oldVal) || Array.isArray(newVal) ? (
                renderArrayDiff(oldVal || [], newVal || [])
              ) : (
                renderTextDiff(String(oldVal || ''), String(newVal || ''))
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const displaySections = activeTab === 'changes' ? changedSections : sections;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-hidden flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Review AI Changes</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">AI Rationale:</span> {rationale}
              </p>
            </div>
            
            {/* Lint Result */}
            {lintResult && !lintResult.passed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Lint Warnings</p>
                  <p className="text-xs text-yellow-700">
                    {lintResult.failures.length} error(s), {lintResult.warnings.length} warning(s)
                  </p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onDiscard}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('changes')}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'changes'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Changes Only ({changedSections.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`py-3 px-4 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              All Sections (7)
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {displaySections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No changes detected</p>
            </div>
          ) : (
            <div className="space-y-8">
              {displaySections.map((section) => {
                const oldVal = oldPS[section.key as keyof ProblemStatement];
                const newVal = newPS[section.key as keyof ProblemStatement];
                const changed = hasChanged(section.key);

                return (
                  <div key={section.key} className={`${changed ? 'border-l-4 border-blue-400 pl-4' : ''}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{section.label}</h3>
                      {changed && (
                        <span className="badge bg-blue-100 text-blue-800">Modified</span>
                      )}
                    </div>
                    
                    {section.type === 'text' && renderTextDiff(String(oldVal || ''), String(newVal || ''))}
                    {section.type === 'array' && renderArrayDiff(oldVal as string[] || [], newVal as string[] || [])}
                    {section.type === 'object' && renderObjectDiff(oldVal, newVal, section.label)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex gap-4 justify-end">
          <button
            onClick={onDiscard}
            className="btn-secondary flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Discard Changes
          </button>
          <button
            onClick={onAccept}
            className="btn-primary flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Accept Changes
          </button>
        </div>
      </div>
    </div>
  );
}
