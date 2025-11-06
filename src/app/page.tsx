'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';

interface ProblemStatement {
  id: string;
  criterionId: string;
  createdAt: string;
  problemStatementJson: any;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProblemStatement[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/problem-statements?search=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (response.ok) {
        setSearchResults(data.problemStatements || []);
      } else {
        console.error('Search failed:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Problem Statement Generator
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Generate and refine healthcare audit problem statements with AI assistance
        </p>

        {/* Create Button */}
        <Link 
          href="/generate" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="h-5 w-5" />
          Create New Problem Statement
        </Link>
      </div>

      {/* Search Section */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Search Existing Problem Statements
          </h2>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by Criterion ID or keywords..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          <p className="mt-2 text-sm text-gray-500">
            Enter a Criterion ID (e.g., SEPSIS-2024-001) or keywords to find existing problem statements
          </p>
        </div>
      </div>

      {/* Search Results */}
      {searching && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Searching...</p>
        </div>
      )}

      {!searching && hasSearched && (
        <div className="max-w-4xl mx-auto">
          {searchResults.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Search className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try a different search term or create a new problem statement
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700">
                  Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                </h3>
              </div>
              <ul className="divide-y divide-gray-200">
                {searchResults.map((ps) => (
                  <li key={ps.id}>
                    <Link
                      href={`/generate?load=${ps.id}`}
                      className="block hover:bg-gray-50 transition px-4 py-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-600">
                            {ps.criterionId}
                          </p>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {ps.problemStatementJson?.problem_statement?.substring(0, 150) || 'No description'}
                            {ps.problemStatementJson?.problem_statement?.length > 150 ? '...' : ''}
                          </p>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <p className="text-xs text-gray-500">
                            {new Date(ps.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Quick Start Guide */}
      {!hasSearched && (
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">🚀 How It Works</h2>
            <ol className="space-y-3 text-sm text-blue-800">
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">1.</span>
                <span>Click "Create New Problem Statement" to start</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">2.</span>
                <span>Enter your Criterion ID and paste existing content or describe what you need</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">3.</span>
                <span>Check boxes for sections that need improvement</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">4.</span>
                <span>Click "Generate" and let AI create a refined version</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">5.</span>
                <span>Review and edit the 7 sections as needed</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">6.</span>
                <span>Save with your Criterion ID to find it later</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">7.</span>
                <span>Copy the formatted output to use in your documentation</span>
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Legacy System Link */}
      <div className="max-w-4xl mx-auto mt-8 text-center">
        <Link 
          href="/criteria" 
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Access legacy criteria editor →
        </Link>
      </div>
    </div>
  );
}