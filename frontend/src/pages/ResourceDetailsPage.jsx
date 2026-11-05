import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  ThumbsUp,
  Bookmark,
  Share2,
  Calendar,
  Layers,
  Star,
  ArrowLeft,
  MessageSquare,
  Send,
  Eye,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ShieldCheck,
  Edit2,
  Trash2,
  CheckCircle,
  AlertCircle,
  Flag,
  X,
} from 'lucide-react';
import { useResources } from '../context/ResourceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import resourceService from '../services/resourceService';
import reviewService from '../services/reviewService';
import reportService from '../services/reportService';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

const ResourceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { resources, bookmarks, upvotes, toggleBookmark, toggleUpvote, recordDownload } =
    useResources();
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [activePage, setActivePage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [remoteResource, setRemoteResource] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // Reviews & Rating states
  const [reviews, setReviews] = useState([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Edit review state
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState('');

  // Report Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Inappropriate Content');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Search local match first
  const localMatch = resources.find((r) => (r._id || r.id) === id);

  useEffect(() => {
    if (!localMatch && id) {
      setIsFetching(true);
      resourceService
        .getResourceById(id)
        .then((data) => {
          if (data?.success && data?.resource) {
            setRemoteResource(data.resource);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch resource by ID:', err.message);
        })
        .finally(() => setIsFetching(false));
    }
  }, [id, localMatch]);

  const resource = localMatch || remoteResource;
  const resourceId = resource?._id || resource?.id;

  // Fetch live reviews for this resource
  const fetchReviews = useCallback(async () => {
    if (!resourceId) return;
    setIsReviewsLoading(true);
    try {
      const data = await reviewService.getResourceReviews(resourceId);
      if (data?.success) {
        setReviews(data.reviews || []);
        if (remoteResource) {
          setRemoteResource((prev) => ({
            ...prev,
            averageRating: data.averageRating,
            totalRatings: data.totalRatings,
          }));
        }
      }
    } catch (err) {
      console.warn('Could not fetch reviews:', err.message);
    } finally {
      setIsReviewsLoading(false);
    }
  }, [resourceId, remoteResource]);

  useEffect(() => {
    if (resourceId) {
      fetchReviews();
    }
  }, [resourceId, fetchReviews]);

  if (isFetching) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner text="Retrieving academic resource details..." />
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-navy-900">Resource Not Found</h2>
        <p className="text-xs text-slate-500">
          The requested resource could not be found or has been removed from the repository.
        </p>
        <Link to="/explore">
          <Button variant="primary">Return to Library</Button>
        </Link>
      </div>
    );
  }

  const isBookmarked = bookmarks.includes(resourceId);
  const isUpvoted = upvotes.includes(resourceId);

  const author = resource.uploadedBy || resource.author || {
    name: 'Academic Scholar',
    role: 'Verified Contributor',
    department: resource.department,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };

  const formattedSize =
    typeof resource.fileSize === 'number'
      ? `${(resource.fileSize / (1024 * 1024)).toFixed(1)} MB`
      : resource.fileSize || '3.5 MB';

  const tags = resource.tags || [resource.subject, resource.category, resource.department].filter(Boolean);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    addToast('Resource link copied to clipboard!', 'info');
  };

  // Find if current logged-in user already wrote a review
  const myExistingReview = reviews.find(
    (r) =>
      r.user?._id === user?._id ||
      r.user?.id === user?._id ||
      r.user?.email === user?.email
  );

  // Submit review handler
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      addToast('Please log in to submit a rating and review', 'info');
      return;
    }
    if (!newComment.trim()) {
      addToast('Please write a comment describing how this document helped you', 'error');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const data = await reviewService.addReview(resourceId, {
        rating: newRating,
        comment: newComment.trim(),
      });
      if (data?.success) {
        addToast('Your review and rating were published!', 'success');
        if (data.review) {
          setReviews((prev) => [data.review, ...prev.filter((r) => r._id !== data.review._id)]);
        }
        setNewComment('');
        setNewRating(5);
        fetchReviews();
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review';
      addToast(msg, 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Start editing review
  const handleStartEdit = (rev) => {
    setEditingReviewId(rev._id);
    setEditRating(rev.rating);
    setEditComment(rev.comment);
  };

  // Submit edited review
  const handleSaveEdit = async (reviewId) => {
    if (!editComment.trim()) {
      addToast('Review comment cannot be empty', 'error');
      return;
    }
    try {
      const data = await reviewService.updateReview(reviewId, {
        rating: editRating,
        comment: editComment.trim(),
      });
      if (data?.success) {
        addToast('Review updated successfully!', 'success');
        if (data.review) {
          setReviews((prev) =>
            prev.map((r) => (r._id === reviewId ? data.review : r))
          );
        }
        setEditingReviewId(null);
        fetchReviews();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to update review', 'error');
    }
  };

  // Delete review handler
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      const data = await reviewService.deleteReview(reviewId);
      if (data?.success) {
        addToast('Review deleted successfully.', 'info');
        setReviews((prev) => prev.filter((r) => r._id !== reviewId));
        fetchReviews();
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to delete review', 'error');
    }
  };

  // Submit Report Handler
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingReport(true);
    try {
      const data = await reportService.submitReport(resourceId, {
        reason: reportReason,
        description: reportDescription,
      });
      if (data?.success) {
        addToast('Report submitted for campus moderation review. Thank you!', 'success');
        setIsReportModalOpen(false);
        setReportDescription('');
      }
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit report', 'error');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Related recommendations
  const relatedNotes = resources
    .filter((r) => (r._id || r.id) !== resourceId && r.department === resource.department)
    .slice(0, 3);

  const avgRatingNum = Number(resource.averageRating || resource.rating || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-navy-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to library
        </button>
      </div>

      {/* Hero Resource Information Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={resource.fileType?.toUpperCase() === 'PDF' ? 'pdf' : 'docx'}>
                {resource.fileType?.toUpperCase() || 'PDF'} Document
              </Badge>
              <Badge variant="brand">{resource.category || 'Class Notes'}</Badge>
              <Badge variant="default">{resource.department}</Badge>
              <Badge variant="accent">{resource.semester}</Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight leading-snug">
              {resource.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {resource.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2">
              <span className="flex items-center gap-1.5 font-medium text-navy-800">
                <img
                  src={
                    author.profileImage ||
                    author.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      author.name || 'U'
                    )}&background=4f46e5&color=fff&size=64`
                  }
                  alt={author.name}
                  className="w-5 h-5 rounded-full object-cover border border-slate-200"
                />
                {author.name}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Published {resource.createdAt ? new Date(resource.createdAt).toLocaleDateString() : 'Recent'}
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5 text-slate-400" />
                {resource.downloads || resource.downloadsCount || 0} downloads
              </span>
              <span>&bull;</span>
              <span className="flex items-center gap-1 font-semibold text-navy-900">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                {avgRatingNum > 0 ? avgRatingNum.toFixed(1) : 'New'} ({reviews.length} reviews)
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
            <Button
              variant="primary"
              size="md"
              onClick={() => recordDownload(resourceId)}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-1.5" /> Download ({formattedSize})
            </Button>

            <div className="flex items-center gap-2 w-full">
              <button
                onClick={() => toggleBookmark(resourceId)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  isBookmarked
                    ? 'bg-accent-50 border-accent-300 text-accent-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
                title={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-accent-600' : ''}`} />
                <span>{isBookmarked ? 'Saved' : 'Bookmark'}</span>
              </button>

              <button
                onClick={handleShare}
                className="py-2 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                title="Share link"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    addToast('Please log in to report inappropriate content', 'info');
                    return;
                  }
                  setIsReportModalOpen(true);
                }}
                className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-300 text-slate-500 hover:text-rose-600 transition-colors"
                title="Report inappropriate content or copyright violation"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 mr-1">Tags:</span>
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Main Grid: Document Reader / Preview + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Document Viewer & Reviews Module */}
        <div className="lg:col-span-2 space-y-8">
          {/* Document Viewer Frame */}
          <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-subtle flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                <span className="font-semibold truncate max-w-[200px] sm:max-w-xs">
                  {resource.title}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                  className="p-1 hover:text-brand-300"
                  title="Zoom out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px]">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                  className="p-1 hover:text-brand-300"
                  title="Zoom in"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Embedded document preview viewport */}
            <div className="bg-slate-100/80 p-6 sm:p-10 flex items-center justify-center min-h-[380px] overflow-auto">
              <div
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className="w-full max-w-xl bg-white p-8 sm:p-12 shadow-elevated rounded-2xl border border-slate-200/90 text-navy-900 space-y-6 transition-transform"
              >
                <div className="border-b pb-4 space-y-2">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-brand-600">
                    {resource.department} &bull; {resource.semester}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold">{resource.title}</h3>
                  <p className="text-xs text-slate-500">{resource.subject} &bull; Verified Syllabus</p>
                </div>

                <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <p>{resource.description}</p>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px] text-brand-800 space-y-1">
                    <p>// NoteSphere Academic Resource Document</p>
                    <p>Department: {resource.department} | Semester: {resource.semester}</p>
                    <p>Format: {resource.fileType?.toUpperCase()} | File Size: {formattedSize}</p>
                  </div>
                  <p>
                    Click the download button above to access the full uncompressed document.
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Author: {author.name}</span>
                  <div className="flex items-center gap-1 text-emerald-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Academic Note
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rating Summary & Community Reviews Module */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <h3 className="text-lg font-bold text-navy-900">Student Reviews &amp; Ratings</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Read feedback from peers who studied this material for midterm and end-term exams.
                </p>
              </div>

              {/* Big Score Card */}
              <div className="flex items-center gap-3 bg-amber-50/80 border border-amber-200/80 px-4 py-2.5 rounded-2xl shrink-0">
                <div className="text-2xl font-black text-amber-600">
                  {avgRatingNum > 0 ? avgRatingNum.toFixed(1) : '—'}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(avgRatingNum) ? 'fill-amber-500' : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-semibold text-slate-500">
                    {reviews.length} total {reviews.length === 1 ? 'review' : 'reviews'}
                  </p>
                </div>
              </div>
            </div>

            {/* Review Submission Form / Status */}
            {myExistingReview ? (
              <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 text-xs text-brand-900 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>You have already submitted a review for this resource. You can edit it below.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4 p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy-900">
                  Rate &amp; Review This Resource
                </h4>

                {/* Interactive Star Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 font-medium">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewRating(s)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            s <= newRating ? 'fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-navy-800 ml-1">
                    {newRating} of 5 Stars
                  </span>
                </div>

                {/* Comment Text Area */}
                <textarea
                  rows="3"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="How clear were these lecture notes? Did the formulas and diagrams align with the exam syllabus?"
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    size="sm"
                    variant="primary"
                    disabled={isSubmittingReview}
                  >
                    <Send className="w-3.5 h-3.5 mr-1" />
                    {isSubmittingReview ? 'Posting…' : 'Submit Review'}
                  </Button>
                </div>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-navy-900">
                Community Feedback ({reviews.length})
              </h4>

              {isReviewsLoading ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading reviews…</div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <p className="text-xs text-slate-400">
                    No student reviews yet. Be the first to share your thoughts on this study guide!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviews.map((rev) => {
                    const revUser = rev.user || {};
                    const isMyReview =
                      revUser._id === user?._id ||
                      revUser.id === user?._id ||
                      revUser.email === user?.email;
                    const isEditingThis = editingReviewId === rev._id;

                    return (
                      <div key={rev._id} className="py-4 space-y-2">
                        {isEditingThis ? (
                          /* Edit Review Form */
                          <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-600">Update Rating:</span>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <button
                                    key={s}
                                    type="button"
                                    onClick={() => setEditRating(s)}
                                    className="p-1 text-amber-500"
                                  >
                                    <Star
                                      className={`w-4 h-4 ${
                                        s <= editRating ? 'fill-amber-500' : 'text-slate-300'
                                      }`}
                                    />
                                  </button>
                                ))}
                              </div>
                            </div>
                            <textarea
                              rows="2"
                              value={editComment}
                              onChange={(e) => setEditComment(e.target.value)}
                              className="w-full p-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-brand-500"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="xs"
                                variant="secondary"
                                onClick={() => setEditingReviewId(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="xs"
                                variant="primary"
                                onClick={() => handleSaveEdit(rev._id)}
                              >
                                Save Changes
                              </Button>
                            </div>
                          </div>
                        ) : (
                          /* Normal Review Display */
                          <div>
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-center gap-2.5">
                                <img
                                  src={
                                    revUser.profileImage ||
                                    revUser.avatar ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      revUser.name || 'S'
                                    )}&background=4f46e5&color=fff&size=64`
                                  }
                                  alt={revUser.name || 'Student'}
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200"
                                />
                                <div>
                                  <span className="text-xs font-bold text-navy-900 block leading-tight">
                                    {revUser.name || 'Anonymous Student'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {revUser.department || 'Student'} &bull;{' '}
                                    {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Stars */}
                                <div className="flex items-center text-amber-500">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3.5 h-3.5 ${
                                        s <= rev.rating ? 'fill-amber-500' : 'text-slate-300'
                                      }`}
                                    />
                                  ))}
                                </div>

                                {/* Edit / Delete Actions for Author */}
                                {isMyReview && (
                                  <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
                                    <button
                                      onClick={() => handleStartEdit(rev)}
                                      className="p-1 text-slate-400 hover:text-brand-600 transition-colors"
                                      title="Edit review"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteReview(rev._id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                      title="Delete review"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed mt-2 pl-9">
                              {rev.comment}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Contributor Card & Related Notes */}
        <div className="space-y-6">
          {/* Author Card */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-subtle space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Uploaded By
            </h4>
            <div className="flex items-center gap-3">
              <img
                src={
                  author.profileImage ||
                  author.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    author.name || 'U'
                  )}&background=4f46e5&color=fff&size=64`
                }
                alt={author.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-brand-100 shadow-subtle"
              />
              <div>
                <h5 className="text-sm font-bold text-navy-900">{author.name}</h5>
                <p className="text-xs text-slate-500">{author.role || 'Campus Contributor'}</p>
                <p className="text-[11px] text-brand-600 font-medium">
                  {author.department || resource.department}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Contributor Status</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Campus Verified
              </span>
            </div>
          </div>

          {/* Related Resources */}
          {relatedNotes.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-navy-900">More in {resource.department}</h4>
              <div className="space-y-3">
                {relatedNotes.map((r) => {
                  const rId = r._id || r.id;
                  return (
                    <Link
                      key={rId}
                      to={`/resources/${rId}`}
                      className="block p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-brand-300 shadow-subtle transition-all"
                    >
                      <span className="text-[11px] font-semibold text-brand-600">{r.subject}</span>
                      <h5 className="text-xs font-bold text-navy-900 line-clamp-1 mt-0.5">{r.title}</h5>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                        <span>{r.downloads || r.downloadsCount || 0} downloads</span>
                        <span>{r.semester}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Resource Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-elevated border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-navy-900">Report Academic Document</h3>
                  <p className="text-xs text-slate-400">Flag policy or syllabus violations</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-navy-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Reporting Reason</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 text-navy-800 focus:outline-none focus:border-brand-500"
                >
                  <option value="Inappropriate Content">Inappropriate Content</option>
                  <option value="Copyright Infringement">Copyright Infringement</option>
                  <option value="Incorrect Syllabus / Wrong Subject">Incorrect Syllabus / Wrong Subject</option>
                  <option value="Spam / Duplicate">Spam / Duplicate</option>
                  <option value="Malicious or Corrupted File">Malicious or Corrupted File</option>
                  <option value="Other">Other Violation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Detailed Description (Optional)</label>
                <textarea
                  rows="3"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Provide context for moderation faculty (e.g. page numbers, missing credits, corrupted sections)..."
                  className="w-full text-xs rounded-xl border border-slate-200 p-3 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={isSubmittingReport}
                >
                  {isSubmittingReport ? 'Submitting…' : 'Submit Report'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceDetailsPage;
