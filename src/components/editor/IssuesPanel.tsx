'use client';

import { useState } from 'react';
import { ISSUE_TYPES } from '@/types';
import { AlertTriangle, Plus, Trash2, CheckCircle } from 'lucide-react';

interface Props {
  criterionId: string;
  issues: any[];
  onIssuesChange: () => void;
}

export default function IssuesPanel({ criterionId, issues, onIssuesChange }: Props) {
  const [selectedType, setSelectedType] = useState('');
  const [newIssueNotes, setNewIssueNotes] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddIssue = async () => {
    if (!selectedType) return;

    setAdding(true);
    try {
      const response = await fetch(`/api/criteria/${criterionId}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedType,
          notes: newIssueNotes,
          status: 'Open',
          created_by: 'beta-user',
        }),
      });

      if (response.ok) {
        setSelectedType('');
        setNewIssueNotes('');
        onIssuesChange();
      }
    } catch (error) {
      console.error('Error adding issue:', error);
    } finally {
      setAdding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open':
        return 'text-orange-600 bg-orange-50';
      case 'Resolved':
        return 'text-green-600 bg-green-50';
      case 'Dismissed':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const openIssues = issues.filter(i => i.status === 'Open');
  const closedIssues = issues.filter(i => i.status !== 'Open');

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <h3 className="font-medium">Issues</h3>
        <span className="badge badge-draft ml-auto">{openIssues.length} Open</span>
      </div>

      {/* Add New Issue */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <label className="block text-sm font-medium mb-2">Add Issue</label>
        <select
          className="input w-full mb-2 text-sm"
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          <option value="">Select issue type...</option>
          {ISSUE_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <textarea
          className="textarea w-full text-sm"
          rows={2}
          placeholder="Notes (optional)..."
          value={newIssueNotes}
          onChange={(e) => setNewIssueNotes(e.target.value)}
        />
        <button
          onClick={handleAddIssue}
          disabled={!selectedType || adding}
          className="btn-primary mt-2 w-full text-sm flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {adding ? 'Adding...' : 'Add Issue'}
        </button>
      </div>

      {/* Open Issues */}
      {openIssues.length > 0 && (
        <div className="space-y-2 mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Open</h4>
          {openIssues.map((issue) => (
            <div key={issue.issueId} className="border border-orange-200 rounded-lg p-3 bg-orange-50">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{issue.type}</p>
                  {issue.notes && (
                    <p className="text-xs text-gray-600 mt-1">{issue.notes}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(issue.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Closed Issues */}
      {closedIssues.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Resolved/Dismissed</h4>
          {closedIssues.map((issue) => (
            <div key={issue.issueId} className="border rounded-lg p-3 bg-gray-50 opacity-60">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <p className="text-sm font-medium text-gray-700">{issue.type}</p>
                  </div>
                  {issue.notes && (
                    <p className="text-xs text-gray-600 mt-1">{issue.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {issues.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No issues reported</p>
        </div>
      )}
    </div>
  );
}
