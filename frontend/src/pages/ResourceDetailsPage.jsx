import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Bookmark,
  Star,
  Calendar,
  Layers,
  GraduationCap,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useResources } from '../context/ResourceContext';
import Button from '../components/common/Button';

const ResourceDetailsPage = () => {
  const { id } = useParams();
  const { resources, toggleBookmark } = useResources();

  const [resource, setResource] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    const found = resources.find(
      (item) => String(item._id || item.id) === String(id)
    );

    setResource(found || null);
  }, [id, resources]);

  if (!resource) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <FileText className="mx-auto mb-4 text-slate-400" size={48} />

          <h2 className="text-xl font-semibold text-slate-800">
            Resource not found
          </h2>

          <Link
            to="/resources"
            className="inline-block mt-4 text-blue-600 hover:underline"
          >
            Back to Resources
          </Link>
        </div>
      </div>
    );
  }

  const fileUrl = resource.fileUrl || '';

  // Backend URL used for PDF preview
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const previewUrl = resource._id
    ? `${apiBaseUrl}/resources/${resource._id}/download?action=file`
    : fileUrl;

  const fileType = String(resource.fileType || '').toLowerCase();

  const isPdf =
    fileType === 'pdf' ||
    fileUrl.toLowerCase().includes('.pdf');

  const handleBookmark = async () => {
    try {
      await toggleBookmark(resource._id || resource.id);
    } catch (error) {
      console.error('Bookmark error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Resources
        </Link>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">

            <div className="flex gap-4">

              <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center">
                <FileText className="text-blue-600" size={28} />
              </div>

              <div>

                <h1 className="text-2xl font-bold text-slate-900">
                  {resource.title}
                </h1>

                <p className="text-slate-500 mt-1">
                  {resource.description || 'Academic resource'}
                </p>

                <div className="flex flex-wrap gap-3 mt-4">

                  {resource.subject && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {resource.subject}
                    </span>
                  )}

                  {resource.category && (
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm">
                      {resource.category}
                    </span>
                  )}

                  {resource.fileType && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm uppercase">
                      {resource.fileType}
                    </span>
                  )}

                </div>

              </div>

            </div>

            <div className="flex gap-3">

              <Button
                variant="outline"
                onClick={handleBookmark}
              >
                <Bookmark size={18} />

                {resource.isBookmarked
                  ? 'Bookmarked'
                  : 'Bookmark'}
              </Button>

              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                >
                  <ExternalLink size={18} />
                  Open File
                </a>
              )}

            </div>

          </div>
        </div>

        {/* Information */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

          {/* Department */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">

              <GraduationCap className="text-blue-600" />

              <div>
                <p className="text-xs text-slate-500">
                  Department
                </p>

                <p className="font-medium text-slate-800">
                  {resource.department || 'Computer Science'}
                </p>
              </div>

            </div>
          </div>

          {/* Semester */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">

              <Layers className="text-purple-600" />

              <div>
                <p className="text-xs text-slate-500">
                  Semester
                </p>

                <p className="font-medium text-slate-800">
                  {resource.semester || 'N/A'}
                </p>
              </div>

            </div>
          </div>

          {/* Uploaded */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">

              <Calendar className="text-green-600" />

              <div>
                <p className="text-xs text-slate-500">
                  Uploaded
                </p>

                <p className="font-medium text-slate-800">
                  {resource.createdAt
                    ? new Date(
                        resource.createdAt
                      ).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>

            </div>
          </div>

          {/* Rating */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-3">

              <Star className="text-yellow-500" />

              <div>
                <p className="text-xs text-slate-500">
                  Rating
                </p>

                <p className="font-medium text-slate-800">
                  {resource.rating || 'Not rated'}
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          {/* Preview Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-slate-200">

            <div>
              <h2 className="font-semibold text-slate-900">
                Document Preview
              </h2>

              <p className="text-sm text-slate-500">
                {isPdf
                  ? 'PDF document'
                  : 'Preview is available only for PDF files'}
              </p>
            </div>

            {/* Zoom Controls */}
            {isPdf && (
              <div className="flex items-center gap-2">

                <button
                  onClick={() =>
                    setZoomLevel((prev) =>
                      Math.max(50, prev - 10)
                    )
                  }
                  className="px-3 py-1 border rounded-lg hover:bg-slate-50"
                >
                  −
                </button>

                <span className="text-sm font-medium min-w-[50px] text-center">
                  {zoomLevel}%
                </span>

                <button
                  onClick={() =>
                    setZoomLevel((prev) =>
                      Math.min(150, prev + 10)
                    )
                  }
                  className="px-3 py-1 border rounded-lg hover:bg-slate-50"
                >
                  +
                </button>

              </div>
            )}

          </div>

          {/* PDF Preview */}
          {isPdf && fileUrl ? (

            <div className="bg-slate-100 p-4 sm:p-6">

              <div
                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                style={{
                  width: `${100 / (zoomLevel / 100)}%`,
                }}
              >

                <iframe
                  src={previewUrl}
                  title={resource.title}
                  className="w-full border-0"
                  style={{
                    height: '700px',
                  }}
                />

              </div>

              {/* Open PDF */}
              <div className="mt-4 text-center">

                <p className="text-sm text-slate-500 mb-3">
                  If the PDF does not appear above, open it directly.
                </p>

                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <ExternalLink size={18} />
                  Open PDF
                </a>

              </div>

            </div>

          ) : (

            /* No Preview */
            <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">

              <FileText
                size={56}
                className="text-slate-300 mb-4"
              />

              <h3 className="text-lg font-semibold text-slate-800">
                No preview available
              </h3>

              <p className="text-slate-500 mt-2 mb-5">
                This file type cannot be previewed in the browser.
              </p>

              {fileUrl && (
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download size={18} />
                  Open / Download File
                </a>
              )}

            </div>

          )}

        </div>

      </div>
    </div>
  );
};

export default ResourceDetailsPage;