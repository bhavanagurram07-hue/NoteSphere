import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  User,
  Mail,
  Lock,
  Building2,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  // Read role from URL:
  // /register?role=student
  // /register?role=faculty
  const searchParams = new URLSearchParams(location.search);
  const urlRole = searchParams.get('role');

  const initialRole = urlRole === 'faculty' ? 'faculty' : 'student';

  const [role, setRole] = useState(initialRole);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    university: 'Stanford University',
    department: 'Computer Science',
    semester: 'Semester 5',
    registrationNumber: '',
    password: '',
    confirmPassword: '',
    authorizationCode: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError('');
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError('');

    // Update URL also
    navigate(`/register?role=${selectedRole}`, {
      replace: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (!formData.email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (
      role === 'faculty' &&
      !formData.authorizationCode.trim()
    ) {
      setError('Faculty authorization code is required');
      return;
    }

    setIsLoading(true);
    setError('');

    const registrationData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      department: formData.department,
      semester:
        role === 'faculty'
          ? 'Faculty Member'
          : formData.semester,
      registrationNumber:
        role === 'faculty'
          ? `FAC-${Date.now().toString().slice(-6)}`
          : formData.registrationNumber.trim(),
      password: formData.password,
      role,
    };

    // Only send authorization code for faculty
    if (role === 'faculty') {
      registrationData.authorizationCode =
        formData.authorizationCode.trim();
    }

    const res = await register(registrationData);

    setIsLoading(false);

    if (res?.success) {
      // Faculty → Faculty dashboard
      if (res.user?.role === 'faculty') {
        navigate('/faculty', { replace: true });
      }

      // Student → Student dashboard
      else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(
        res?.error || 'Registration failed. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-blue-50/50 via-white to-slate-50 py-12">

      <div className="w-full max-w-xl bg-white rounded-3xl border border-slate-200/80 shadow-elevated p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">

          <div className="inline-flex p-3 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 mb-1">
            <BookOpen className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Create an Account
          </h2>

          <p className="text-xs text-slate-500">
            Join NoteSphere to share, search, and download academic resources.
          </p>

        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3">

          {/* Student */}
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              role === 'student'
                ? 'border-brand-500 bg-brand-50 text-brand-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-200'
            }`}
          >
            <div className="flex flex-col items-center gap-1">

              <GraduationCap className="w-6 h-6" />

              <span className="font-bold text-sm">
                Student
              </span>

              <span className="text-[10px]">
                Create student account
              </span>

            </div>
          </button>

          {/* Faculty */}
          <button
            type="button"
            onClick={() => handleRoleChange('faculty')}
            className={`p-4 rounded-2xl border-2 transition-all ${
              role === 'faculty'
                ? 'border-purple-500 bg-purple-50 text-purple-700'
                : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200'
            }`}
          >
            <div className="flex flex-col items-center gap-1">

              <ShieldCheck className="w-6 h-6" />

              <span className="font-bold text-sm">
                Faculty
              </span>

              <span className="text-[10px]">
                Authorized faculty account
              </span>

            </div>
          </button>

        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name + Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Input
              label="Full Name"
              name="name"
              required
              icon={User}
              value={formData.name}
              onChange={handleChange}
              placeholder={
                role === 'faculty'
                  ? 'e.g. Prof. Sarah Jenkins'
                  : 'e.g. Alex Johnson'
              }
            />

            <Input
              label={
                role === 'faculty'
                  ? 'Faculty Email'
                  : 'Academic Email'
              }
              name="email"
              type="email"
              required
              icon={Mail}
              value={formData.email}
              onChange={handleChange}
              placeholder={
                role === 'faculty'
                  ? 'faculty@university.edu'
                  : 'student@university.edu'
              }
            />

          </div>

          {/* University + Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Input
              label="University / College"
              name="university"
              required
              icon={Building2}
              value={formData.university}
              onChange={handleChange}
              placeholder="e.g. Stanford University"
            />

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

          </div>

          {/* Student Fields */}
          {role === 'student' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="flex flex-col gap-1.5">

                <label className="text-xs font-semibold text-navy-800 tracking-wide">
                  Current Semester
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

              <Input
                label="Student Roll / Registration No"
                name="registrationNumber"
                icon={GraduationCap}
                value={formData.registrationNumber}
                onChange={handleChange}
                placeholder="e.g. 2024-CS-108"
              />

            </div>
          )}

          {/* Faculty Authorization */}
          {role === 'faculty' && (
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">

              <div className="flex items-center gap-2 mb-2">

                <ShieldCheck className="w-5 h-5 text-purple-600" />

                <span className="text-sm font-bold text-purple-800">
                  Faculty Authorization
                </span>

              </div>

              <p className="text-xs text-purple-700 mb-3">
                Enter the authorization code provided by the NoteSphere administrator.
              </p>

              <Input
                label="Faculty Authorization Code"
                name="authorizationCode"
                type="password"
                required
                icon={Lock}
                value={formData.authorizationCode}
                onChange={handleChange}
                placeholder="Enter authorization code"
              />

            </div>
          )}

          {/* Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            <Input
              label="Password"
              name="password"
              type="password"
              required
              icon={Lock}
              value={formData.password}
              onChange={handleChange}
              placeholder="Min. 6 characters"
            />

            <Input
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              required
              icon={Lock}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
            />

          </div>

          {/* Guidelines */}
          <div className="text-xs text-slate-500 leading-relaxed pt-1">
            By creating an account, you agree to NoteSphere's Academic Sharing
            Guidelines and Honor Code.
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Create {role === 'faculty' ? 'Faculty' : 'Student'} Account
          </Button>

        </form>

        {/* Login Link */}
        <p className="text-center text-xs text-slate-500 pt-2">

          Already registered?{' '}

          <Link
            to="/login"
            className="font-bold text-brand-600 hover:text-brand-700"
          >
            Sign In &rarr;
          </Link>

        </p>

      </div>
    </div>
  );
};

export default RegisterPage;