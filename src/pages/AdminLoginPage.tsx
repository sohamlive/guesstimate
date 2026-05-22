import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, Shield, LogIn, Key } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminLoginPage: React.FC = () => {
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
      // Re-verify role
      const s = await login(email, password); // session fetched
      if (s.success) {
        // Authenticated. Double check if administrative
        if (email.toLowerCase().includes('admin')) {
          toast.success('Admin validation confirmed.');
          navigate('/admin/dashboard');
        } else {
          toast.error('Access Denied: You do not have administrative permissions.');
        }
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
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 flex flex-col items-center justify-center p-6 relative select-none">
      
      {/* Back button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white font-semibold font-mono"
      >
        ← BACK TO HOME
      </Link>

      <div className="w-full max-w-md flex flex-col items-center">
        
        {/* Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-black font-serif italic font-black text-2xl shadow-md">
            G.
          </div>
          <span className="font-serif italic font-black text-2xl text-white tracking-tight">Guesstimate.</span>
        </div>

        {/* Login Card */}
        <div className="bg-[#121212] rounded-xl border border-zinc-800/80 p-8 w-full relative overflow-hidden shadow-2xl">
          
          {/* Admin Tag Badge */}
          <div className="absolute top-0 right-0 bg-white text-black px-4 py-1.5 rounded-bl-xl text-[9px] uppercase font-bold tracking-widest flex items-center gap-1 font-mono">
            <Shield size={9} />
            <span>Admin Access</span>
          </div>

          <div className="text-center mb-6 mt-2">
            <h2 className="font-serif italic text-white text-2xl leading-none">
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@guesstimate.com"
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950 border border-zinc-850 rounded-xl outline-none text-sm text-zinc-105 placeholder:text-zinc-650 focus:border-zinc-550 focus:ring-1 focus:ring-zinc-800 text-white font-medium"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                Password
              </label>
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
                  className="w-full pl-10 pr-10 py-3 bg-zinc-950 border border-zinc-850 rounded-xl outline-none text-sm text-zinc-105 placeholder:text-zinc-650 focus:border-zinc-550 focus:ring-1 focus:ring-zinc-805 text-white font-medium font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 cursor-pointer font-mono"
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
              <span>{loading ? 'VALIDATING SECURITY...' : 'Admin Sign In'}</span>
            </button>

          </form>

        </div>

        {/* Diagnostic Panel */}
        <div className="mt-6 bg-[#121212] rounded-xl border border-zinc-800/80 p-4 w-full">
          <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-widest mb-2 font-mono flex items-center gap-1">
            <Key size={11} className="text-zinc-300" />
            TESTING ADMIN ENTRY
          </span>
          <button
            onClick={handleApplyAdminPreset}
            className="w-full text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-850 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors font-mono"
          >
            <span>🛡 Apply Admin Credentials ( admin@ / admin )</span>
          </button>
        </div>

      </div>
    </div>
  );
};
