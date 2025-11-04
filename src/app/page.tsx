'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search } from 'lucide-react';

interface Criterion {
  criterionId: string;
  title: string;
  status: string;
  versionNumber: number;
  dateUpdated: string;
}

export default function HomePage() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCriteria();
  }, []);

  const fetchCriteria = async () => {
    try {
      const response = await fetch('/api/criteria');
      const data = await response.json();
      setCriteria(data.criteria || []);
    } catch (error) {
      console.error('Error fetching criteria:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCriteria = criteria.filter(
    (c) =>
      c.criterionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const classes = {
      Draft: 'badge-draft',
      Published: 'badge-published',
      Deprecated: 'badge-deprecated',
    };
    return `badge ${classes[status as keyof typeof classes] || 'badge-draft'}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Criteria Library</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage and refine problem statements for healthcare auditing
            </p>
          </div>
          <Link href="/criteria/new" className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Criterion
          </Link>
        </div>

        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="input pl-10"
            placeholder="Search by ID or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-gray-500">Loading criteria...</p>
        </div>
      ) : filteredCriteria.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No criteria found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new criterion.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredCriteria.map((criterion) => (
              <li key={criterion.criterionId}>
                <Link
                  href={`/criteria/${criterion.criterionId}`}
                  className="block hover:bg-gray-50 transition"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-primary truncate">
                          {criterion.criterionId}
                        </p>
                        <p className="mt-1 text-sm text-gray-900">{criterion.title}</p>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex flex-col items-end gap-2">
                        <span className={getStatusBadge(criterion.status)}>
                          {criterion.status}
                        </span>
                        <p className="text-xs text-gray-500">
                          v{criterion.versionNumber}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(criterion.dateUpdated).toLocaleDateString()}
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
  );
}
