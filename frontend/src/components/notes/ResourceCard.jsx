import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Bookmark,
  Star,
  Calendar,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { useResources } from '../../context/ResourceContext';
import Badge from '../common/Badge';

// Helper: resolve the correct resource ID (MongoDB _id or mock id)
const getResId = (resource) => resource._id || resource.id;

// Helper: resolve uploader avatar
const getAuthorAvatar = (resource) =>
  resource.uploadedBy?.profileImage ||
  resource.uploadedBy?.avatar ||
  resource.author?.avatar ||
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    resource.uploadedBy?.name || resource.author?.name || 'U'
  )}&background=4f46e5&color=fff&size=64`;

// Helper: resolve uploader name
const getAuthorName = (resource) =>
  resource.uploadedBy?.name || resource.author?.name || 'Academic Contributor';

// Helper: resolve download count
const getDownloads = (resource) =>
  resource.downloads || resource.downloadsCount || 0;

// Helper: resolve average rating
const getRating = (resource) => {
  const r = resource.averageRating || resource.rating;
  if (!r || r === 0) return 'New';
  return Number(r).toFixed(1);
};

// Helper: format upload date
const formatDate = (dateString) => {
  if (!dateString) return 'Recent';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'Recent';
  }
};

const ResourceCard = ({ resource, viewMode = 'grid' }) => {
  const { bookmarks, toggleBookmark, recordDownload } = useResources();

  const resId = getResId(resource);
  const isBookmarked = bookmarks.includes(resId);
  const ratingVal = getRating(resource);

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-subtle hover:shadow-card hover:border-brand-200 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="p-3 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/60 border border-brand-200/80 text-brand-600 shrink-0">
            <FileText className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={resource.fileType?.toLowerCase() === 'pdf' ? 'pdf' : 'docx'} size="xs">
                {(resource.fileType || 'PDF').toUpperCase()}
              </Badge>
              <Badge variant="brand" size="xs">
                {resource.subject}
              </Badge>
              <Badge variant="accent" size="xs">
                {resource.category || 'Class Notes'}
              </Badge>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">{resource.department}</span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 font-medium">{resource.semester}</span>
            </div>

            <Link
              to={`/resources/${resId}`}
              className="block text-sm sm:text-base font-bold text-navy-900 hover:text-brand-600 transition-colors line-clamp-1"
            >
              {resource.title}
            </Link>

            <p className="text-xs text-slate-500 line-clamp-1">{resource.description}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1.5 font-medium text-navy-700">
                <img
                  src={getAuthorAvatar(resource)}
                  alt={getAuthorName(resource)}
                  className="w-4 h-4 rounded-full object-cover"
                />
                {getAuthorName(resource)}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {formatDate(resource.createdAt)}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Download className="w-3.5 h-3.5 text-slate-400" />
                {getDownloads(resource)}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-semibold text-navy-800">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {ratingVal}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => toggleBookmark(resId)}
            className={`p-2.5 rounded-xl border transition-all ${
              isBookmarked
                ? 'bg-accent-50 border-accent-300 text-accent-700'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-accent-600' : ''}`} />
          </button>

          <button
            onClick={() => recordDownload(resId)}
            className="px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all"
            title="Download document"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>
    );
  }

  // Grid view card
  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-subtle hover:shadow-card hover:border-brand-200 transition-all duration-200 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top metadata tags */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant={resource.fileType?.toLowerCase() === 'pdf' ? 'pdf' : 'docx'} size="xs">
              {(resource.fileType || 'PDF').toUpperCase()}
            </Badge>
            <Badge variant="brand" size="xs">
              {resource.subject}
            </Badge>
            <Badge variant="accent" size="xs">
              {resource.category || 'Class Notes'}
            </Badge>
          </div>
          <button
            onClick={() => toggleBookmark(resId)}
            className={`p-1.5 rounded-lg border transition-all ${
              isBookmarked
                ? 'bg-accent-50 border-accent-300 text-accent-600'
                : 'bg-slate-50 border-transparent text-slate-400 hover:text-navy-900 hover:bg-slate-100'
            }`}
            title={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-accent-600' : ''}`} />
          </button>
        </div>

        {/* Title */}
        <Link
          to={`/resources/${resId}`}
          className="block text-base font-bold text-navy-900 group-hover:text-brand-600 transition-colors line-clamp-2 leading-snug"
        >
          {resource.title}
        </Link>

        {/* Short description */}
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {resource.description}
        </p>

        {/* Course, Semester, & Date info pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
            {resource.department}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px]">
            {resource.semester}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
            <Calendar className="w-3 h-3 text-slate-400" />
            {formatDate(resource.createdAt)}
          </span>
        </div>
      </div>

      {/* Card Footer: Uploader, Downloads, Rating, Download Action */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={getAuthorAvatar(resource)}
            alt={getAuthorName(resource)}
            className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
          />
          <span className="text-xs font-semibold text-navy-800 truncate max-w-[90px]">
            {getAuthorName(resource)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Average Rating */}
          <div className="flex items-center gap-1 text-xs font-semibold text-navy-800" title="Average student rating">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{ratingVal}</span>
          </div>

          {/* Download count & trigger */}
          <button
            onClick={() => recordDownload(resId)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium shadow-sm transition-all"
            title={`Download file (${getDownloads(resource)} downloads)`}
          >
            <Download className="w-3.5 h-3.5" />
            <span className="font-semibold">{getDownloads(resource)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
