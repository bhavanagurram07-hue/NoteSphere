import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Bookmark,
  Star,
  FileText,
  Calendar,
  User,
  Building2,
  GraduationCap,
  AlertCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

import { useResources } from '../context/ResourceContext';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const ResourceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    resources,
    recordDownload,
    toggleBookmark,
    isBookmarked,
  } = useResources();

  const { user } = useAuth();

  const [resource, setResource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const loadResource = async () => {
      setIsLoading(true);

      try {
        const localMatch = resources.find(
          (r) => (r._id || r.id) === id
        );

        if (localMatch) {
          setResource(localMatch);
          setIsLoading(false);
          return;
        }

        setResource(null);
      } catch (error) {
        console.error('Error loading resource:', error);
        setResource(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadResource();
  }, [id, resources]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm text-slate-500">
            Loading resource...
          </p>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />

          <h2 className="text-xl font-bold text-navy-900">
            Resource Not Found
          </h2>

          <p className="text-sm text-slate-500 mt-2">
            The requested resource could not be found.
          </p>

          <Button
            variant="primary"
            className="mt-5"
            onClick={() => navigate('/resources')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Resources
          </Button>
        </div>
      </div>
    );
  }

  const resourceId = resource._id || resource.id;

  const bookmarked = isBookmarked
    ? isBookmarked(resourceId)
    : false;

  const fileType = resource.fileType?.toLowerCase();

  const formattedSize = resource.fileSize
    ? `${(resource.fileSize / 1024 / 1024).toFixed(2)} MB`
    : 'Unknown size';

  const handleDownload = async () => {
    try {
      await recordDownload(resourceId);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      await toggleBookmark(resourceId);
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 10, 150));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 10, 70));
  };

  /*
   * Google Docs Viewer needs a PUBLIC URL.
   * Cloudinary gives us the public fileUrl.
   */
  const googleViewerUrl = resource.fileUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
        resource.fileUrl
      )}`
    : '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Resource Information */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <Badge variant="primary">
                    {resource.category || 'Academic Resource'}
                  </Badge>

                  {resource.fileType && (
                    <Badge variant="secondary">
                      {resource.fileType.toUpperCase()}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
                  {resource.title}
                </h1>

                {resource.description && (
                  <p className="text-sm text-slate-600 mt-3 max-w-3xl">
                    {resource.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 mt-5 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" />
                    {resource.department || 'Department'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    {resource.semester || 'Semester'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {resource.createdAt
                      ? new Date(resource.createdAt).toLocaleDateString()
                      : 'Date unavailable'}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {resource.uploadedBy?.name || 'Unknown user'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleBookmark}
                >
                  <Bookmark
                    className={`w-4 h-4 mr-1.5 ${
                      bookmarked ? 'fill-current' : ''
                    }`}
                  />
                  {bookmarked ? 'Bookmarked' : 'Bookmark'}
                </Button>

                <Button
                  variant="primary"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download ({formattedSize})
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Controls */}
        <div className="bg-white border border-slate-200 rounded-t-2xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand-600" />

            <span className="text-sm font-semibold text-slate-700">
              Document Preview
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={zoomOut}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="text-xs font-semibold text-slate-500 min-w-[45px] text-center">
              {zoomLevel}%
            </span>

            <button
              type="button"
              onClick={zoomIn}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document Preview */}
        <div className="bg-slate-100/80 p-4 sm:p-6 min-h-[500px] overflow-auto rounded-b-2xl border-x border-b border-slate-200">
          {resource.fileUrl ? (
            fileType === 'pdf' ? (
              <div className="w-full bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <iframe
                  src={googleViewerUrl}
                  title={resource.title}
                  className="w-full border-0"
                  style={{
                    height: '700px',
                    minHeight: '700px',
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top left',
                    width: `${100 / (zoomLevel / 100)}%`,
                  }}
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="min-h-[380px] flex flex-col items-center justify-center text-center space-y-4">
                <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200">
                  <FileText className="w-10 h-10 text-brand-600" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-navy-900">
                    {resource.title}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1">
                    {resource.fileType?.toUpperCase()} document
                  </p>
                </div>

                <Button
                  variant="primary"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  Download Document
                </Button>
              </div>
            )
          ) : (
            <div className="min-h-[380px] flex items-center justify-center text-center">
              <div className="space-y-2">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />

                <p className="text-sm font-semibold text-slate-700">
                  Document preview unavailable
                </p>

                <p className="text-xs text-slate-500">
                  The file URL is not available for this resource.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500">Downloads</p>
            <p className="text-2xl font-bold text-navy-900 mt-1">
              {resource.downloads || 0}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500">Rating</p>

            <div className="flex items-center gap-1 mt-1">
              <Star className="w-5 h-5 text-amber-400 fill-current" />

              <p className="text-2xl font-bold text-navy-900">
                {resource.averageRating
                  ? Number(resource.averageRating).toFixed(1)
                  : '0.0'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs text-slate-500">File Size</p>

            <p className="text-2xl font-bold text-navy-900 mt-1">
              {formattedSize}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResourceDetailsPage;