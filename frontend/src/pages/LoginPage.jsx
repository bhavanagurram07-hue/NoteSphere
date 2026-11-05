import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Mail,
  Lock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath =
    location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage('');

    const res = await login(email, password);

    setIsLoading(false);

    if (res?.success) {
      if (res.user?.role === 'faculty') {
        navigate('/faculty', { replace: true });
      } else {
        const target =
          redirectPath === '/faculty' ||
          redirectPath === '/admin'
            ? '/dashboard'
            : redirectPath;

        navigate(target, { replace: true });
      }
    } else {
      setErrorMessage(
        res?.error || 'Invalid email or password'
      );
    }
  };

  const handleFillStudentDemo = () => {
    setEmail('alex.johnson@campus.edu');
    setPassword('password123');
    setErrorMessage('');
  };

  const handleFillFacultyDemo = () => {
    setEmail('faculty@notesphere.com');
    setPassword('Faculty@123');
    setErrorMessage('');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center p-4 sm:p-6 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">

      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-elevated p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-brand-50 border border-brand-100 text-brand-600 mb-1">
            <BookOpen className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-extrabold text-navy-900 tracking-tight">
            Welcome Back
          </h2>

          <p className="text-xs text-slate-500">
            Sign in to access your saved notes, upload guides, and dashboard.
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">

          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              Demo Credentials
            </span>

            <span className="text-[10px] text-slate-400 font-normal">
              Click to fill
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">

            {/* Student Demo */}
            <button
              type="button"
              onClick={handleFillStudentDemo}
              title="Click to fill Student credentials"
              className="py-1.5 px-3 rounded-xl bg-white border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-50 hover:border-brand-300 transition-all text-center shadow-subtle flex flex-col items-center justify-center"
            >
              <span>Student Demo</span>

              <span className="text-[10px] font-normal text-slate-400">
                alex.johnson@campus.edu
              </span>
            </button>

            {/* Faculty Demo */}
            <button
              type="button"
              onClick={handleFillFacultyDemo}
              title="Click to fill Faculty credentials"
              className="py-1.5 px-3 rounded-xl bg-white border border-purple-200 text-purple-700 text-xs font-semibold hover:bg-purple-50 hover:border-purple-300 transition-all text-center shadow-subtle flex flex-col items-center justify-center"
            >
              <span>Faculty Demo</span>

              <span className="text-[10px] font-normal text-slate-400">
                faculty@notesphere.com
              </span>
            </button>

          </div>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">

            <AlertCircle className="w-4 h-4 shrink-0" />

            <span>{errorMessage}</span>

          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />

          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Sign In with credentials
          </span>

          <div className="border-t border-slate-200 w-full" />
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <Input
            label="Academic or Faculty Email"
            type="email"
            required
            icon={Mail}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage('');
            }}
            placeholder="you@campus.edu or faculty@notesphere.com"
          />

          <Input
            label="Password"
            type="password"
            required
            icon={Lock}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage('');
            }}
            placeholder="••••••••"
          />

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between text-xs">

            <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">

              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) =>
                  setRememberMe(e.target.checked)
                }
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />

              Remember me

            </label>

            <a
              href="#forgot"
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              Forgot password?
            </a>

          </div>

          {/* Login Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Sign In to NoteSphere
          </Button>

        </form>

        {/* Create Account */}
        <div className="pt-2 space-y-3">

          <p className="text-center text-xs text-slate-500">
            Don't have an account yet?
          </p>

          <div className="grid grid-cols-2 gap-3">

            {/* Student Registration */}
            <Link
              to="/register?role=student"
              className="text-center py-2.5 px-3 rounded-xl border border-brand-200 bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 transition-all"
            >
              Create Student Account →
            </Link>

            {/* Faculty Registration */}
            <Link
              to="/register?role=faculty"
              className="text-center py-2.5 px-3 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-xs font-bold hover:bg-purple-100 transition-all"
            >
              Create Faculty Account →
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
};

export default LoginPage;