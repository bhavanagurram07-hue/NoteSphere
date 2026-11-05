import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  UploadCloud,
  Download,
  ThumbsUp,
  Eye,
  Trash2,
  Edit3,
  Calendar,
  AlertCircle,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { useResources } from '../context/ResourceContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import ConfirmModal from '../components/common/ConfirmModal';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Badge from '../components/common/Badge';

const MyUploadsPage = () => {
  const { userUploads, fetchMyUploads, deleteResource, updateResource, recordDownload } =
    useResources();
  const { addToast } = useToast();

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    title: '',
    subject: '',
    category: 'Class Notes',
    department: 'Computer Science',
    semester: 'Semester 5',
    description: '',
  });

  useEffect(() => {
    fetchMyUploads();
  }, [fetchMyUploads]);

  const totalDownloads = userUploads.reduce(
    (acc, curr) => acc + (curr.downloads || curr.downloadsCount || 0),
    0
  );
  const totalUpvotes = userUploads.reduce(
    (acc, curr) => acc + (curr.upvotesCount || curr.averageRating || 0),
    0
  );

  const confirmDelete = async () => {
    if (deleteTargetId) {
      await deleteResource(deleteTargetId);
      setDeleteTargetId(null);
    }
  };

  const handleOpenEdit = (item) => {
    setEditTarget(item);
    setEditForm({
      title: item.title || '',
      subject: item.subject || '',
      category: item.category || 'Class Notes',
      department: item.department || 'Computer Science',
      semester: item.semester || 'Semester 5',
      description: item.description || '',
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTarget) return;

    const id = editTarget._id || editTarget.id;
    await updateResource(id, editForm);
    setEditTarget(null);
  };

  const categories = [
    'Class Notes',
    'Previous Question Papers',
    'Lab Manuals',
    'Assignments',
    'E-books',
    'Study Materials',
    'Other',
  ];

  const departments = [
    'Computer Science',
    'Electronics & Comm.',
    'Mechanical Eng.',
    'Applied Mathematics',
    'Business & Mgmt',
    'Basic Sciences',
    'Other',
  ];

  const semesters = [
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8',
  ];

  return (
    <div className="space-y-8 max-w-6xl w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
            Author Repository
          </span>
          <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
            My Uploaded Resources
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Manage your shared study guides, track download analytics, and edit resource descriptions.
          </p>
        </div>

        <Link to="/upload">
          <Button variant="primary">
            <PlusCircle className="w-4 h-4 mr-1.5" /> Upload New File
          </Button>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Uploads</span>
          <div className="text-2xl font-black text-navy-900">{userUploads.length}</div>
          <p className="text-[11px] text-emerald-600 font-medium">&bull; 100% Verified status</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-slate-400">Total Downloads</span>
          <div className="text-2xl font-black text-brand-600">{totalDownloads}</div>
          <p className="text-[11px] text-slate-400">Direct student downloads</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-subtle space-y-1">
          <span className="text-xs font-semibold text-slate-400">Community Engagement</span>
          <div className="text-2xl font-black text-amber-600">{totalUpvotes}</div>
          <p className="text-[11px] text-slate-400">Helpful ratings from peers</p>
        </div>
      </div>

      {/* Uploads List Table / Cards */}
      {userUploads.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-subtle space-y-4">
          <div className="p-4 w-fit mx-auto rounded-full bg-slate-100 text-slate-400">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-navy-900">No resources uploaded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Share your lecture notes, previous question papers, or summaries with your peers.
            </p>
          </div>
          <Link to="/upload">
            <Button variant="primary" size="sm">
              <UploadCloud className="w-4 h-4 mr-1.5" /> Upload Now
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy-900">Your Uploaded Files</h3>
            <span className="text-xs text-slate-400">{userUploads.length} documents total</span>
          </div>

          <div className="divide-y divide-slate-100">
            {userUploads.map((item) => {
              const id = item._id || item.id;
              const formattedSize =
                typeof item.fileSize === 'number'
                  ? `${(item.fileSize / (1024 * 1024)).toFixed(1)} MB`
                  : item.fileSize || '3.5 MB';

              return (
                <div
                  key={id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={item.fileType?.toUpperCase() === 'PDF' ? 'pdf' : 'docx'} size="xs">
                        {item.fileType?.toUpperCase() || 'PDF'}
                      </Badge>
                      <Badge variant="brand" size="xs">
                        {item.category || item.subject}
                      </Badge>
                      <span className="text-xs text-slate-400">&bull;</span>
                      <span className="text-xs text-slate-500">{item.department}</span>
                      <span className="text-xs text-slate-400">&bull;</span>
                      <span className="text-xs text-slate-500">{item.semester}</span>
                      <span className="text-xs text-slate-400">&bull;</span>
                      <span className="text-xs text-slate-400">{formattedSize}</span>
                    </div>

                    <Link
                      to={`/resources/${id}`}
                      className="text-base font-bold text-navy-900 hover:text-brand-600 transition-colors block truncate"
                    >
                      {item.title}
                    </Link>

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Download className="w-3.5 h-3.5 text-slate-400" />
                        {item.downloads || item.downloadsCount || 0} downloads
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {item.status || 'approved'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Link to={`/resources/${id}`}>
                      <Button variant="secondary" size="xs">
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                    </Link>

                    <Button
                      variant="secondary"
                      size="xs"
                      onClick={() => handleOpenEdit(item)}
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>

                    <button
                      onClick={() => setDeleteTargetId(id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete resource"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDelete}
        title="Delete Resource"
        message="Are you sure you want to permanently delete this resource from NoteSphere? The file will be removed from Cloudinary and database records erased."
        confirmText="Confirm Delete"
      />

      {/* Edit Resource Modal */}
      {editTarget && (
        <Modal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          title="Edit Resource Details"
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <Input
              label="Resource Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Subject Name"
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-navy-800">Category</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 text-xs p-2.5 focus:outline-none focus:border-brand-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-navy-800">Department</label>
                <select
                  value={editForm.department}
                  onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 text-xs p-2.5 focus:outline-none focus:border-brand-500"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-navy-800">Semester</label>
                <select
                  value={editForm.semester}
                  onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 text-xs p-2.5 focus:outline-none focus:border-brand-500"
                >
                  {semesters.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-800">Description</label>
              <textarea
                rows="3"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full rounded-xl border border-slate-200 text-xs p-3 focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="secondary" size="sm" type="button" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default MyUploadsPage;
