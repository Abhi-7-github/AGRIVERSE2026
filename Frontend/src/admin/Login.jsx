import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowLeft, Eye, EyeOff, RefreshCw, Sprout } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = location.state?.from?.pathname || '/admin/dashboard';

  // If already authenticated, redirect
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setError('Please fill in both email/username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(emailOrUsername, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden text-slate-800">
      <div className="w-full max-w-md relative z-10">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-[#6B9080] mb-6 font-bold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Public AgriVerse Portal
        </Link>

        {/* Login Box */}
        <div className="p-6 sm:p-9 rounded-3xl bg-white border border-slate-200/90 shadow-2xl text-slate-900">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-black border border-slate-200 overflow-hidden flex items-center justify-center mx-auto mb-4 p-1 shadow-lg shadow-black/10">
              <img
                src="/assets/kare-tech-logo.png"
                alt="KARE Tech AgriVerse"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-fraunces">
              AgriVerse <span className="text-[#6B9080]">Admin</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Authorized access for Course coordinators
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full px-4 py-3 pl-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6B9080] focus:ring-4 focus:ring-[#6B9080]/20 text-sm font-medium transition-all"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password / Master Passkey
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-10 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#6B9080] focus:ring-4 focus:ring-[#6B9080]/20 text-sm font-medium transition-all"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-slate-400 hover:text-slate-700 absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#6B9080] hover:bg-[#587B6C] disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-md shadow-[#6B9080]/20 border border-[#6B9080] transition-all mt-3 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Admin Portal</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
