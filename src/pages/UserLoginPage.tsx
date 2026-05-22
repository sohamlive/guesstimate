import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const UserLoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

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
    const { success, error } = await login(email, password);
    setLoading(false);

    if (success) {
      toast.success('Sign in successful. Welcome back!');
      if (email.toLowerCase().includes('admin')) {
        navigate('/admin/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } else {
      toast.error(error?.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const handleApplyPreset = (type: 'user' | 'admin' | 'owner') => {
    if (type === 'user') {
      setEmail('user@guesstimate.com');
      setPassword('user123');
    } else if (type === 'admin') {
      setEmail('admin@guesstimate.com');
      setPassword('admin');
    } else {
      setEmail('sohamlive@gmail.com');
      setPassword('user123');
    }
    toast.success('Loaded credential coordinates.');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 flex flex-col items-center justify-center p-6 relative select-none">
      
      {/* Back to landing link */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white font-semibold font-mono"
      >
        ← BACK TO HOME
      </Link>

      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* App Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-serif italic font-black text-2xl shadow-md">
            G.
          </div>
          <span className="font-serif italic font-black text-2xl text-white tracking-tight">Guesstimate.</span>
        </div>

        {/* Login Card */}
        <div className="bg-[#121212] rounded-xl border border-zinc-800/80 p-8 w-full shadow-2xl">
          
          <div className="text-center mb-6">
            <h2 className="font-serif italic text-white text-2xl leading-none">
              Welcome back
            </h2>
            <p className="text-xs text-zinc-500 mt-2 font-sans">
              Sign in to continue your estimation practice
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl outline-none text-sm text-zinc-105 placeholder:text-zinc-650 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-800 text-white font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block font-mono">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => toast('Forgot password? Reset links can be requested from the administration.')}
                  className="text-[10px] text-zinc-400 hover:text-white font-semibold font-mono"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-zinc-950 border border-zinc-850 rounded-xl outline-none text-sm text-zinc-105 placeholder:text-zinc-650 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-800 text-white font-medium font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-zinc-200 text-black py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-6 font-mono uppercase tracking-wider"
            >
              <LogIn size={14} />
              <span>{loading ? 'AUTHENTICATING...' : 'Sign In'}</span>
            </button>

          </form>

          {/* Prompt regarding Signups */}
          <div className="mt-6 pt-5 border-t border-zinc-850 text-center text-xs text-zinc-500 font-sans">
            <span>Don't have an account? </span>
            <button
              onClick={() => toast('Self-registration is deactivated. Please contact the administrator to receive practice credentials.')}
              className="text-zinc-300 hover:underline font-bold cursor-pointer"
            >
              Contact the admin
            </button>
          </div>

        </div>

        {/* Diagnostic controls */}
        <div className="mt-6 bg-[#121212] rounded-xl border border-zinc-800/80 p-4 w-full">
          <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-widest mb-2 font-mono flex items-center gap-1">
            <Key size={11} className="text-zinc-300" />
            TESTING CREDENTIALS ( friction-free )
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleApplyPreset('user')}
              className="text-[10px] bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors font-mono"
            >
              <span>👤 User Preset</span>
            </button>
            <button
              onClick={() => handleApplyPreset('admin')}
              className="text-[10px] bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors font-mono"
            >
              <span>🔑 Admin Preset</span>
            </button>
            <button
              onClick={() => handleApplyPreset('owner')}
              className="text-[10px] bg-zinc-900 border border-zinc-850 hover:bg-zinc-805 text-amber-500 font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors animate-pulse font-mono"
            >
              <span>💼 Soham's Email</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
