import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import resourceService from '../services/resourceService';
import { useResources } from '../context/ResourceContext';
import ResourceCard from '../components/notes/ResourceCard';
import FilterBar from '../components/notes/FilterBar';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ExploreResourcesPage = () => {
  const { resources: allResources, fetchResources } = useResources();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [department, setDepartment] = useState(
    searchParams.get('dept') || 'All Departments'
  );
  const [semester, setSemester] = useState(
    searchParams.get('sem') || 'All Semesters'
  );
  const [category, setCategory] = useState(
    searchParams.get('cat') || 'All Categories'
  );
  const [fileType, setFileType] = useState(
    searchParams.get('format') || 'all'
  );
  const [rating, setRating] = useState(
    searchParams.get('rating') || '0'
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get('sort') || 'newest'
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1', 10)
  );
  const [viewMode, setViewMode] = useState('grid');

  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  const ITEMS_PER_PAGE = 12;

  // Fetch real backend resources into ResourceContext
  useEffect(() => {
    const loadBackendResources = async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        await fetchResources();
      } catch (err) {
        console.warn(
          'Backend fetch failed, continuing with local resources:',
          err.message
        );
        setFetchError(
          'Backend connection failed. Showing available local resources.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadBackendResources();
  }, [fetchResources]);

  // Filter and sort BOTH mock + backend resources
  const filteredResources = useMemo(() => {
    let filtered = [...allResources];

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      filtered = filtered.filter((res) => {
        return (
          res.title?.toLowerCase().includes(query) ||
          res.subject?.toLowerCase().includes(query) ||
          res.description?.toLowerCase().includes(query) ||
          res.department?.toLowerCase().includes(query) ||
          res.category?.toLowerCase().includes(query)
        );
      });
    }

    if (department !== 'All Departments') {
      filtered = filtered.filter(
        (res) => res.department === department
      );
    }

    if (semester !== 'All Semesters') {
      filtered = filtered.filter(
        (res) => res.semester === semester
      );
    }

    if (category !== 'All Categories') {
      filtered = filtered.filter(
        (res) => res.category === category
      );
    }

    if (fileType !== 'all') {
      filtered = filtered.filter(
        (res) =>
          res.fileType?.toLowerCase() === fileType.toLowerCase()
      );
    }

    if (rating !== '0') {
      const minimumRating = Number(rating);

      filtered = filtered.filter(
        (res) => Number(res.averageRating || res.rating || 0) >= minimumRating
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return (
            new Date(a.createdAt || 0) -
            new Date(b.createdAt || 0)
          );

        case 'rating':
          return (
            Number(b.averageRating || b.rating || 0) -
            Number(a.averageRating || a.rating || 0)
          );

        case 'downloads':
          return (
            Number(b.downloads || 0) -
            Number(a.downloads || 0)
          );

        case 'popular':
          return (
            Number(b.downloads || 0) -
            Number(a.downloads || 0)
          );

        case 'newest':
        default:
          return (
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
          );
      }
    });

    return filtered;
  }, [
    allResources,
    searchQuery,
    department,
    semester,
    category,
    fileType,
    rating,
    sortBy,
  ]);

  // Pagination
  const totalCount = filteredResources.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalCount / ITEMS_PER_PAGE)
  );

  const resources = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredResources.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [filteredResources, currentPage]);

  // If filtering makes current page invalid, go back to page 1
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  // Update URL parameters
  useEffect(() => {
    const nextParams = {};

    if (searchQuery.trim()) {
      nextParams.q = searchQuery.trim();
    }

    if (department !== 'All Departments') {
      nextParams.dept = department;
    }

    if (semester !== 'All Semesters') {
      nextParams.sem = semester;
    }

    if (category !== 'All Categories') {
      nextParams.cat = category;
    }

    if (fileType !== 'all') {
      nextParams.format = fileType;
    }

    if (rating !== '0') {
      nextParams.rating = rating;
    }

    if (sortBy !== 'newest') {
      nextParams.sort = sortBy;
    }

    if (currentPage > 1) {
      nextParams.page = currentPage.toString();
    }

    setSearchParams(nextParams, { replace: true });
  }, [
    searchQuery,
    department,
    semester,
    category,
    fileType,
    rating,
    sortBy,
    currentPage,
    setSearchParams,
  ]);

  // Search suggestions
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const data = await resourceService.getSuggestions(
          searchQuery.trim()
        );

        if (data?.success) {
          setSuggestions(data.suggestions || []);
        }
      } catch (e) {
        // Suggestions are optional
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );
    };
  }, []);

  const handleResetFilters = () => {
    setSearchQuery('');
    setDepartment('All Departments');
    setSemester('All Semesters');
    setCategory('All Categories');
    setFileType('all');
    setRating('0');
    setSortBy('newest');
    setCurrentPage(1);
    setSearchParams({});
  };

  const handleSelectSuggestion = (suggestion) => {
    setShowSuggestions(false);
    navigate(`/resources/${suggestion.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Academic Repository
        </span>

        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Explore Academic Resources
        </h1>

        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
          Search across lecture notes, verified syllabus guides,
          previous question papers, and lab manuals from all
          university departments.
        </p>
      </div>

      {/* Search */}
      <div
        ref={searchContainerRef}
        className="relative w-full"
      >
        <div className="relative flex items-center w-full">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Search className="w-5 h-5 text-brand-600" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
              setShowSuggestions(true);
            }}
            placeholder="Search by topic, formula, subject (e.g. Data Structures, Thermodynamics, Calculus)..."
            className="w-full pl-12 pr-12 py-3.5 bg-white rounded-2xl border border-slate-200 shadow-subtle text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
          />

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
              className="absolute right-4 text-xs font-semibold text-slate-400 hover:text-navy-900 transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200/90 shadow-elevated z-30 overflow-hidden divide-y divide-slate-100">
            <div className="px-4 py-2 bg-slate-50/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Suggested Documents &amp; Topics
            </div>

            {suggestions.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSuggestion(s)}
                className="w-full px-4 py-3 text-left hover:bg-brand-50/60 transition-colors flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-navy-900 truncate">
                    {s.title}
                  </p>

                  <p className="text-[11px] text-slate-500">
                    {s.subject} &bull; {s.department}
                  </p>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase shrink-0">
                  {s.fileType || 'PDF'}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <FilterBar
        department={department}
        setDepartment={(val) => {
          setDepartment(val);
          setCurrentPage(1);
        }}
        semester={semester}
        setSemester={(val) => {
          setSemester(val);
          setCurrentPage(1);
        }}
        category={category}
        setCategory={(val) => {
          setCategory(val);
          setCurrentPage(1);
        }}
        fileType={fileType}
        setFileType={(val) => {
          setFileType(val);
          setCurrentPage(1);
        }}
        rating={rating}
        setRating={(val) => {
          setRating(val);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        setSortBy={(val) => {
          setSortBy(val);
          setCurrentPage(1);
        }}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onReset={handleResetFilters}
        totalResults={totalCount}
      />

      {/* Backend warning */}
      {fetchError && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-3">
          <p className="text-xs font-semibold text-rose-700">
            {fetchError}
          </p>

          <Button
            size="xs"
            variant="secondary"
            onClick={() => fetchResources()}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Retry Connection
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center space-y-3">
          <LoadingSpinner
            size="lg"
            text="Loading academic resources..."
          />
        </div>
      ) : resources.length === 0 ? (
        /* Empty state */
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="p-4 w-fit mx-auto rounded-full bg-slate-100 text-slate-400">
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy-900">
              No resources found
            </h3>

            <p className="text-xs text-slate-500 max-w-md mx-auto">
              We couldn't find any resources matching your
              search criteria or active filters. Try broadening
              your terms or reset the filters.
            </p>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleResetFilters}
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            Clear All Filters
          </Button>
        </div>
      ) : (
        /* Resources */
        <div className="space-y-8">
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {resources.map((res) => (
              <ResourceCard
                key={res._id || res.id}
                resource={res}
                viewMode={viewMode}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-slate-200">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.max(1, p - 1))
                }
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>

              <div className="flex items-center gap-1 px-3">
                {Array.from(
                  { length: totalPages },
                  (_, i) => i + 1
                ).map((num) => (
                  <button
                    key={num}
                    onClick={() => setCurrentPage(num)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      currentPage === num
                        ? 'bg-brand-600 text-white shadow-subtle'
                        : 'bg-white text-navy-800 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(totalPages, p + 1)
                  )
                }
                disabled={currentPage >= totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExploreResourcesPage;