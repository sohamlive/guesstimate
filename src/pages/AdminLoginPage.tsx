import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, Eye, EyeOff, Shield, LogIn, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (!password) {
      toast.error('Please enter your password.');
      return;
    }

    setLoading(true);
    const { success, session: authSession, error } = await login(email, password);
    setLoading(false);

    if (success) {
      // Authenticated. Check if profile contains administrative role
      if (authSession?.profile?.role === 'admin') {
        toast.success('Admin validation confirmed.');
        navigate('/admin/dashboard');
      } else {
        toast.error('Access Denied: You do not have administrative permissions.');
      }
    } else {
      toast.error(error?.message || 'Administrative authentication failed.');
    }
  };

  const handleApplyAdminPreset = () => {
    setEmail('admin@guesstimate.com');
    setPassword('admin');
    toast.success('Loaded admin coordinates.');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative select-none transition-colors duration-300 ${isLight ? 'bg-[#FAFAFA] text-zinc-800' : 'bg-[#0A0A0A] text-zinc-300'}`}>

      {/* Back button */}
      <Link
        to="/"
        className={`absolute top-6 left-6 flex items-center gap-1.5 text-xs font-semibold font-mono transition-colors ${isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}
      >
        ← BACK TO HOME
      </Link>

      <div className="w-full max-w-md flex flex-col items-center">

        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-black font-serif italic font-black text-2xl shadow-md">
            G.
          </div>
          <span className={`font-serif italic font-black text-2xl tracking-tight transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>Guesstimate Tracker.</span>
        </div>

        {/* Login Card */}
        <div className={`rounded-xl border p-8 w-full relative overflow-hidden transition-all duration-300 shadow-2xl ${isLight ? 'bg-white border-zinc-200 shadow-zinc-200/50' : 'bg-[#121212] border-zinc-800/80'}`}>

          {/* Admin Tag Badge */}
          <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-[9px] uppercase font-bold tracking-widest flex items-center gap-1 font-mono transition-colors ${isLight ? 'bg-zinc-150 text-zinc-850' : 'bg-white text-black'}`}>
            <Shield size={9} />
            <span>Admin Access</span>
          </div>

          <div className="text-center mb-6 mt-2">
            <h2 className={`font-serif italic text-2xl leading-none transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>
              Control Panel
            </h2>
            <p className="text-xs text-zinc-500 mt-2 font-sans">
              Enter administrative credentials to log in
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email Field */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@guesstimate.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm transition-all duration-300 font-medium ${isLight
                    ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-350'
                    : 'bg-zinc-950 border border-zinc-850 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-805'
                    }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl outline-none text-sm transition-all duration-300 font-medium font-mono ${isLight
                    ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-350'
                    : 'bg-zinc-950 border border-zinc-850 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-805'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer font-mono transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-650' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-6 font-mono uppercase tracking-wider ${isLight
                ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-200/50'
                : 'bg-white hover:bg-zinc-200 text-black'
                }`}
            >
              <LogIn size={14} />
              <span>{loading ? 'VALIDATING SECURITY...' : 'Admin Sign In'}</span>
            </button>

          </form>

        </div>

        {/* Diagnostic Panel */}
        {/* <div className={`mt-6 rounded-xl border p-4 w-full transition-all duration-300 ${isLight ? 'bg-white border-zinc-205 shadow-lg shadow-zinc-100/50' : 'bg-[#121212] border-zinc-800/80'}`}>
          <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-widest mb-2 font-mono flex items-center gap-1">
            <Key size={11} className={isLight ? 'text-zinc-700' : 'text-zinc-300'} />
            TESTING ADMIN ENTRY
          </span>
          <button
            onClick={handleApplyAdminPreset}
            className={`w-full text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors font-mono border ${isLight
              ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100'
              : 'bg-zinc-900 border-zinc-850 text-zinc-300 hover:bg-zinc-800'
              }`}
          >
            <span>🛡 Apply Admin Credentials ( admin@ / admin )</span>
          </button>
        </div> */}

      </div>
    </div>
  );
};
