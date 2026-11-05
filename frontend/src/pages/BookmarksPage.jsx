import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Compass, Search, Trash2, ArrowRight } from 'lucide-react';
import { useResources } from '../context/ResourceContext';
import ResourceCard from '../components/notes/ResourceCard';
import Button from '../components/common/Button';

const BookmarksPage = () => {
  const { bookmarkedResources, bookmarks, toggleBookmark, fetchMyBookmarks } = useResources();
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (fetchMyBookmarks) {
      fetchMyBookmarks();
    }
  }, [fetchMyBookmarks]);

  const filteredBookmarks = bookmarkedResources.filter((res) =>
    res.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    res.subject.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-6xl w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-violet-600">
            Personal Shelf
          </span>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">Saved Bookmarks</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Fast access to notes and past papers you've pinned for midterm and final exam revision.
          </p>
        </div>

        <Link to="/explore">
          <Button variant="secondary">
            <Compass className="w-4 h-4 mr-1.5 text-brand-600" /> Explore More
          </Button>
        </Link>
      </div>

      {/* Bookmarks Search Filter */}
      {bookmarkedResources.length > 0 && (
        <div className="max-w-md">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter within your bookmarks..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-navy-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>
      )}

      {/* Bookmarks Grid */}
      {bookmarkedResources.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="p-4 w-fit mx-auto rounded-full bg-violet-50 text-violet-600">
            <Bookmark className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy-900">No bookmarked resources yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Save key formulas, lecture notes, or previous question papers to study offline later.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="primary" size="sm">
              Discover Resources &rarr;
            </Button>
          </Link>
        </div>
      ) : filteredBookmarks.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
          No bookmarks match "{searchFilter}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBookmarks.map((note) => (
            <ResourceCard key={note._id || note.id} resource={note} />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarksPage;
