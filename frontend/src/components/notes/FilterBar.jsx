import React from 'react';
import { Filter, RotateCcw, LayoutGrid, List, Star } from 'lucide-react';

const FilterBar = ({
  department,
  setDepartment,
  semester,
  setSemester,
  category,
  setCategory,
  fileType,
  setFileType,
  rating,
  setRating,
  sortBy,
  setSortBy,
  viewMode,
  setViewMode,
  onReset,
  totalResults,
}) => {
  const departments = [
    'All Departments',
    'Computer Science',
    'Electronics & Comm.',
    'Mechanical Eng.',
    'Applied Mathematics',
    'Business & Mgmt',
    'Basic Sciences',
  ];

  const semesters = [
    'All Semesters',
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8',
  ];

  const categories = [
    'All Categories',
    'Class Notes',
    'Previous Question Papers',
    'Lab Manuals',
    'Assignments',
    'E-books',
    'Study Materials',
    'Other',
  ];

  const fileTypes = [
    { label: 'All Formats', value: 'all' },
    { label: 'PDF Document', value: 'pdf' },
    { label: 'Word Document', value: 'docx' },
    { label: 'Presentation', value: 'pptx' },
    { label: 'Text File', value: 'txt' },
  ];

  const ratingOptions = [
    { label: 'All Ratings', value: '0' },
    { label: '4★ & Above', value: '4' },
    { label: '3★ & Above', value: '3' },
  ];

  const sortOptions = [
    { label: 'Latest Uploads', value: 'newest' },
    { label: 'Most Downloaded', value: 'downloads' },
    { label: 'Highest Rated', value: 'rating' },
  ];

  const hasActiveFilters =
    (department && department !== 'All Departments') ||
    (semester && semester !== 'All Semesters') ||
    (category && category !== 'All Categories') ||
    (fileType && fileType !== 'all') ||
    (rating && rating !== '0') ||
    (sortBy && sortBy !== 'newest');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-subtle space-y-3">
      {/* Top Filter Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mr-1">
          <Filter className="w-3.5 h-3.5 text-brand-600" />
          <span>Filters:</span>
        </div>

        {/* Department select */}
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-navy-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-all cursor-pointer"
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Semester select */}
        <select
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-navy-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-all cursor-pointer"
        >
          {semesters.map((sem) => (
            <option key={sem} value={sem}>
              {sem}
            </option>
          ))}
        </select>

        {/* Category select */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-navy-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-all cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* File format select */}
        <select
          value={fileType}
          onChange={(e) => setFileType(e.target.value)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-navy-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-all cursor-pointer"
        >
          {fileTypes.map((ft) => (
            <option key={ft.value} value={ft.value}>
              Format: {ft.label}
            </option>
          ))}
        </select>

        {/* Minimum rating select */}
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-navy-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-all cursor-pointer"
        >
          {ratingOptions.map((ro) => (
            <option key={ro.value} value={ro.value}>
              Rating: {ro.label}
            </option>
          ))}
        </select>

        {/* Sort select */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-navy-800 focus:outline-none focus:border-brand-500 focus:bg-white transition-all cursor-pointer ml-auto sm:ml-0"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors ml-auto sm:ml-0"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Filters
          </button>
        )}
      </div>

      {/* Results Count & View Toggle Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <span className="text-xs text-slate-500 font-medium">
          Showing <span className="font-bold text-navy-900">{totalResults}</span> academic resources
        </span>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-brand-600 shadow-subtle'
                : 'text-slate-400 hover:text-navy-900'
            }`}
            title="Grid view"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white text-brand-600 shadow-subtle'
                : 'text-slate-400 hover:text-navy-900'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
