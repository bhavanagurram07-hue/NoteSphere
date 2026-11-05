import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Building2,
  GraduationCap,
  Award,
  BookOpen,
  Download,
  Bookmark,
  ShieldCheck,
  Save,
  Image as ImageIcon,
  Hash,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useResources } from '../context/ResourceContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const { userUploads, bookmarks } = useResources();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || 'Computer Science',
    semester: user?.semester || 'Semester 5',
    registrationNumber: user?.registrationNumber || '',
    profileImage:
      user?.profileImage ||
      user?.avatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Sync state if user updates in background
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        department: user.department || 'Computer Science',
        semester: user.semester || 'Semester 5',
        registrationNumber: user.registrationNumber || '',
        profileImage:
          user.profileImage ||
          user.avatar ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      });
    }
  }, [user]);

  const totalDownloads = userUploads.reduce(
    (acc, curr) => acc + (curr.downloads || curr.downloadsCount || 0),
    0
  );
  const totalUpvotes = userUploads.reduce(
    (acc, curr) => acc + (curr.upvotesCount || curr.upvotes || 0),
    0
  );

  const departments = [
    'Computer Science',
    'Electronics & Comm.',
    'Mechanical Eng.',
    'Applied Mathematics',
    'Business & Mgmt',
    'Basic Sciences',
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

  const presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await updateProfile({
      name: formData.name,
      department: formData.department,
      semester: formData.semester,
      registrationNumber: formData.registrationNumber,
      profileImage: formData.profileImage,
    });
    setIsSaving(false);
  };

  return (
    <div className="space-y-8 max-w-5xl w-full">
      {/* Header Profile Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={formData.profileImage}
          alt={formData.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-brand-100 shadow-elevated shrink-0"
        />

        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">{user?.name}</h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                user?.role === 'faculty'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-brand-50 text-brand-700 border-brand-200'
              }`}
            >
              {user?.role === 'faculty' ? 'Faculty Member' : 'Student'}
            </span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" /> {user?.role === 'faculty' ? 'Authorized Faculty' : 'Verified Contributor'}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            {user?.department} &bull; {user?.semester} &bull; {user?.email}
          </p>

          {user?.registrationNumber && (
            <p className="text-xs text-slate-400">
              Registration No: <span className="font-mono text-navy-800">{user.registrationNumber}</span>
            </p>
          )}

          {/* Contribution Statistics Banner */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 pt-3 text-xs text-slate-500 border-t border-slate-100">
            <div>
              <span className="font-bold text-navy-900">{userUploads.length}</span> Uploaded Resources
            </div>
            <div>
              <span className="font-bold text-navy-900">{totalDownloads}</span> Total Downloads
            </div>
            <div>
              <span className="font-bold text-navy-900">{bookmarks.length}</span> Saved Bookmarks
            </div>
            <div>
              <span className="font-bold text-amber-600">{totalUpvotes * 10 + 120}</span> Reputation Pts
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-navy-900">Personal & Academic Details</h2>
          <p className="text-xs text-slate-500">
            Keep your academic profile information current. Role permissions are securely managed by the university.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              icon={User}
              value={formData.name}
              onChange={handleChange}
              required
            />

            <Input
              label="Email Address (Locked)"
              name="email"
              type="email"
              icon={Mail}
              value={formData.email}
              disabled
              helperText="Email is bound to your university account"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-800">Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white text-navy-900 text-sm py-2.5 px-3.5 focus:outline-none focus:border-brand-500"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-navy-800">Current Semester</label>
              <select
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white text-navy-900 text-sm py-2.5 px-3.5 focus:outline-none focus:border-brand-500"
              >
                {semesters.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Student Registration No. (Optional)"
              name="registrationNumber"
              icon={Hash}
              value={formData.registrationNumber}
              onChange={handleChange}
              placeholder="e.g. 2024-CS-042"
            />
          </div>

          {/* Update Profile Image */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-navy-800">Profile Image Avatar</label>
            <div className="flex items-center gap-3">
              <Input
                name="profileImage"
                icon={ImageIcon}
                value={formData.profileImage}
                onChange={handleChange}
                placeholder="Paste avatar URL or select preset below"
                wrapperClassName="flex-1"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400">Choose preset avatar:</span>
              <div className="flex items-center gap-2">
                {presetAvatars.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({ ...formData, profileImage: url })}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${
                      formData.profileImage === url
                        ? 'border-brand-600 scale-110 shadow-subtle'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button type="submit" variant="primary" isLoading={isSaving}>
              <Save className="w-4 h-4 mr-1.5" /> Save Profile Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Contributor Achievements */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-subtle space-y-4">
        <h3 className="text-base font-bold text-navy-900">Academic Achievements & Badges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900">Top Contributor</h4>
              <p className="text-[11px] text-slate-500">Over 1,000+ total downloads</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-brand-50/70 border border-brand-200/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-100 text-brand-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900">Knowledge Pioneer</h4>
              <p className="text-[11px] text-slate-500">Shared verified semester notes</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-navy-900">Honor Roll Contributor</h4>
              <p className="text-[11px] text-slate-500">Zero flagged materials</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
