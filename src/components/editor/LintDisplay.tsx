'use client';

import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  lintResult: any;
}

export default function LintDisplay({ lintResult }: Props) {
  if (!lintResult) {
    return (
      <div className="card p-4">
        <h3 className="font-medium mb-2">Validation</h3>
        <p className="text-sm text-gray-500">Checking...</p>
      </div>
    );
  }

  const { passed, failures = [], warnings = [] } = lintResult;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Validation</h3>
        {passed ? (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            Passed
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-600 text-sm">
            <XCircle className="h-4 w-4" />
            {failures.length} Error{failures.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Failures */}
      {failures.length > 0 && (
        <div className="space-y-2 mb-3">
          {failures.map((failure: any, idx: number) => (
            <div key={idx} className="flex gap-2 p-2 bg-red-50 border border-red-200 rounded">
              <XCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-900">{failure.rule}</p>
                <p className="text-xs text-red-700">{failure.message}</p>
                {failure.section && (
                  <p className="text-xs text-red-600 mt-1">Section: {failure.section}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Warnings</h4>
          {warnings.map((warning: any, idx: number) => (
            <div key={idx} className="flex gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">{warning.rule}</p>
                <p className="text-xs text-yellow-700">{warning.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {passed && warnings.length === 0 && (
        <div className="text-center py-4">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">All validation checks passed!</p>
        </div>
      )}
    </div>
  );
}
