import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search by subject, title, topic, or department...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-4 text-slate-400 pointer-events-none">
        <Search className="w-5 h-5 text-brand-600" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-12 pr-10 py-3.5 bg-white rounded-2xl border border-slate-200 shadow-subtle text-sm text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-navy-900 hover:bg-slate-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
