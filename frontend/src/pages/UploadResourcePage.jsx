import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import { useResources } from '../context/ResourceContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const UploadResourcePage = () => {
  const { addResource } = useResources();
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    department: user?.department || 'Computer Science',
    semester: user?.semester || 'Semester 5',
    category: 'Class Notes',
    description: '',
  });

  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.subject) {
      addToast('Please provide a title and subject', 'error');
      return;
    }

    if (!file) {
      addToast('Please select a file to upload (PDF, DOCX, etc.)', 'error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const submitData = new FormData();
    submitData.append('title', formData.title.trim());
    submitData.append(
      'description',
      formData.description.trim() ||
        `Comprehensive academic guide and study material for ${formData.subject} (${formData.department}).`
    );
    submitData.append('subject', formData.subject.trim());
    submitData.append('department', formData.department);
    submitData.append('semester', formData.semester);
    submitData.append('category', formData.category);
    submitData.append('file', file);

    const result = await addResource(submitData, (percent) => {
      setUploadProgress(Math.max(10, percent));
    });

    setIsUploading(false);

    if (result?.success) {
      navigate('/my-uploads');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-600">
          Academic Contributor
        </span>
        <h1 className="text-3xl font-extrabold text-navy-900 tracking-tight">
          Upload Academic Resource
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Contribute lecture notes, solved past papers, formula sheets, or lab manuals to the NoteSphere repository.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
            file
              ? 'border-emerald-400 bg-emerald-50/30'
              : 'border-slate-300 hover:border-brand-400 bg-white'
          }`}
        >
          {file ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700">
                <FileCheck className="w-8 h-8" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-navy-900">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB &bull; Selected for upload
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-rose-600 hover:underline inline-flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-2xl bg-brand-50 text-brand-600">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-navy-900">
                  Drag and drop your PDF or DOCX file here
                </p>
                <p className="text-xs text-slate-400">
                  Supported formats: PDF, DOCX, DOC, PPT, PPTX, EPUB, TXT (Max 25MB)
                </p>
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-navy-800 text-xs font-semibold transition-colors">
                  Browse Device
                </span>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.ppt,.pptx,.epub,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="bg-white p-4 rounded-2xl border border-brand-200 shadow-subtle space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-brand-700">
              <span>Uploading and indexing on Cloudinary CDN...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Resource Metadata Card */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle space-y-5">
          <h3 className="text-sm font-bold text-navy-900 uppercase tracking-wider text-slate-400">
            Document Information
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Resource Title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Operating Systems Solved Midterms & Formula Guide"
            />

            <Input
              label="Subject / Course Name"
              name="subject"
              required
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Operating Systems (CS401)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-800 tracking-wide">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white text-navy-900 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-800 tracking-wide">
                Target Semester
              </label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white text-navy-900 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-800 tracking-wide">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white text-navy-900 text-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-navy-800 tracking-wide">
              Detailed Description & Syllabus Highlights
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Outline what modules, topics, or question solutions are included in this document..."
              className="w-full rounded-xl border border-slate-200 bg-white text-navy-900 text-sm p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/dashboard')}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isUploading}>
              <UploadCloud className="w-4 h-4 mr-1.5" /> Publish Resource
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UploadResourcePage;
