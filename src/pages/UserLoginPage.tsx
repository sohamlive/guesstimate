import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Mail, Lock, Eye, EyeOff, LogIn, Key, User, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import HCaptcha from '@hcaptcha/react-hcaptcha';

// Official hCaptcha development/sandbox verification sitekey fallback
const hcaptchaSiteKey = ((import.meta as any).env?.VITE_HCAPTCHA_SITEKEY as string) || '10000000-ffff-ffff-ffff-ffffffffffff';

export const UserLoginPage: React.FC = () => {
  const { login, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Toggle state between 'login', 'signup', and 'forgot'
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Anti-bot security verification states
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha | null>(null);

  // Promise racer to enforce 10-second authentication timeout constraint
  const withTimeout = async (promise: Promise<any>, timeoutMs: number, errorMessage: string): Promise<any> => {
    let timeoutId: any;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(errorMessage));
      }, timeoutMs);
    });
    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
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
    try {
      const authPromise = login(email, password);
      const res = await withTimeout(
        authPromise,
        10000,
        'There is some login/creating issue. Please try again later.'
      );

      if (res?.success) {
        toast.success('Sign in successful. Welcome back!');
        if (res?.session?.profile?.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/app/dashboard');
        }
      } else {
        toast.error(res?.error?.message || 'Authentication failed. Please verify credentials.');
      }
    } catch (err: any) {
      toast.error(err.message || 'There is some login/creating issue. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('Please enter your first and last name.');
      return;
    }
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (!captchaToken) {
      toast.error('Please solve the hCaptcha security verification to continue.');
      return;
    }

    setLoading(true);
    try {
      const authPromise = signUp(email, password, firstName.trim(), lastName.trim());
      const { success, error } = await withTimeout(
        authPromise,
        10000,
        'There is some login/creating issue. Please try again later.'
      );

      if (success) {
        toast.success('Registration successful! Welcome to Guesstimate Tracker.');
        navigate('/app/dashboard');
      } else {
        toast.error(error?.message || 'Failed to complete registration.');
        captchaRef.current?.resetCaptcha();
        setCaptchaToken(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'There is some login/creating issue. Please try again later.');
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const resetPromise = resetPassword(email);
      const { success, error } = await withTimeout(
        resetPromise,
        10000,
        'There is some login/creating issue. Please try again later.'
      );

      if (success) {
        toast.success('Password reset link successfully dispatched! Check your email.');
        setMode('login');
      } else {
        toast.error(error?.message || 'Failed to request password reset.');
      }
    } catch (err: any) {
      toast.error(err.message || 'There is some login/creating issue. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (type: 'user' | 'admin' | 'owner') => {
    setMode('login');
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

  const validatePassword = (password) => {
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasMinLength = password.length >= 8;

    return hasLetter && hasNumber && hasMinLength;
  };

  const isPasswordValid = validatePassword(password);

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 relative select-none transition-colors duration-300 ${isLight ? 'bg-[#FAFAFA] text-zinc-800' : 'bg-bg-base text-zinc-300'}`}>

      {/* Back to landing link */}
      <Link
        to="/"
        className={`absolute top-6 left-6 flex items-center gap-1.5 text-xs font-semibold font-mono transition-colors ${isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}
      >
        ← BACK TO HOME
      </Link>

      <div className="w-full max-w-md flex flex-col items-center">

        {/* App Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-950 dark:bg-white flex items-center justify-center text-white dark:text-black font-serif italic font-black text-2xl shadow-md">
            G.
          </div>
          <span className={`font-serif italic font-black text-2xl tracking-tight transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>Guesstimate Tracker.</span>
        </div>

        {/* Dynamic State Card */}
        <div className={`rounded-xl border p-8 w-full transition-all duration-300 ${isLight ? 'bg-white border-zinc-200 shadow-xl shadow-zinc-200/50' : 'bg-bg-card border-zinc-800/80 shadow-2xl'}`}>

          {/* MODE: LOGIN */}
          {mode === 'login' && (
            <>
              <div className="text-center mb-6">
                <h2 className={`font-serif italic text-2xl leading-none transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  Welcome back
                </h2>
                <p className="text-xs text-zinc-500 mt-2 font-sans">
                  Sign in to continue your Guesstimates practice
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                    Email Address
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
                      placeholder="name@company.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm transition-all duration-300 font-medium ${isLight
                        ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:ring-1 focus:ring-zinc-350'
                        : 'bg-zinc-950 border border-zinc-850 text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-805'
                        }`}
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
                      onClick={() => setMode('forgot')}
                      className={`text-[10px] font-semibold font-mono transition-colors ${isLight ? 'text-zinc-500 hover:text-zinc-800' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Forgot?
                    </button>
                  </div>
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
                      className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-600' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                  <span>{loading ? 'AUTHENTICATING...' : 'Sign In'}</span>
                </button>
              </form>

              {/* Prompt regarding Signups */}
              <div className={`mt-6 pt-5 border-t text-center text-xs text-zinc-500 font-sans ${isLight ? 'border-zinc-200' : 'border-zinc-850'}`}>
                <span>Don't have an account? </span>
                <button
                  onClick={() => {
                    setFirstName('');
                    setLastName('');
                    setPassword('');
                    setConfirmPassword('');
                    setCaptchaToken(null);
                    setMode('signup');
                  }}
                  className={`hover:underline font-bold cursor-pointer transition-colors ${isLight ? 'text-zinc-800 font-black' : 'text-zinc-100 font-black'}`}
                >
                  Create Profile
                </button>
              </div>
            </>
          )}

          {/* MODE: SIGNUP */}
          {mode === 'signup' && (
            <>
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  onClick={() => {
                    setCaptchaToken(null);
                    setMode('login');
                  }}
                  className={`flex items-center gap-1 text-xs font-semibold font-mono transition-all ${isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}
                >
                  <ArrowLeft size={13} /> BACK
                </button>
              </div>

              <div className="text-center mb-5">
                <h2 className={`font-serif italic text-2xl leading-none transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  Create Profile
                </h2>
                <p className="text-xs text-zinc-500 mt-2 font-sans">
                  Register to track your Guesstimates practice
                </p>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                {/* First and Last Name */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                      First Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                        <User size={13} />
                      </div>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Jack"
                        className={`w-full pl-9 pr-3 py-2.5 rounded-xl outline-none text-sm transition-all duration-300 font-medium ${isLight
                          ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400'
                          : 'bg-zinc-950 border border-zinc-850 text-white placeholder:text-zinc-650 focus:border-zinc-500'
                          }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Sparrow"
                      className={`w-full px-3 py-2.5 rounded-xl outline-none text-sm transition-all duration-300 font-medium ${isLight
                        ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400'
                        : 'bg-zinc-950 border border-zinc-850 text-white placeholder:text-zinc-650 focus:border-zinc-500'
                        }`}
                    />
                  </div>
                </div>

                {/* Email address */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Mail size={14} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jack@email.com"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl outline-none text-sm transition-all duration-300 font-medium ${isLight
                        ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400'
                        : 'bg-zinc-950 border border-zinc-850 text-white placeholder:text-zinc-650 focus:border-zinc-500'
                        }`}
                    />
                  </div>
                </div>

                {/* Password input */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                    Password *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Lock size={14} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-10 py-2.5 rounded-xl outline-none text-sm transition-all duration-300 font-medium font-mono ${isLight
                        ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400'
                        : 'bg-zinc-950 border border-zinc-850 text-white placeholder:text-zinc-650 focus:border-zinc-500'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-600' : 'text-zinc-500 hover:text-zinc-350'}`}
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>

                  {/* Character Based Validation Live Indicator */}
                  <div className="mt-1.5 flex items-center gap-1 text-xs">
                    {isPasswordValid ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold font-mono text-[10px]">
                        <Check size={11} strokeWidth={3} /> Strong password criteria met
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 font-mono text-[10px]">
                        <AlertCircle size={11} /> Requires 8+ characters, letters & digits
                      </span>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                      <Lock size={14} />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-10 py-2.5 rounded-xl outline-none text-sm transition-all duration-300 font-medium font-mono ${isLight
                        ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400'
                        : 'bg-zinc-950 border border-zinc-850 text-white placeholder:text-zinc-650 focus:border-zinc-500'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-600' : 'text-zinc-500 hover:text-zinc-350'}`}
                    >
                      {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg items-center flex justify-center">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={hcaptchaSiteKey}
                    theme={isLight ? 'light' : 'dark'}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => {
                      setCaptchaToken(null);
                      toast('Security token expired. Please verify again.', { icon: '⚠️' });
                    }}
                    onError={() => {
                      setCaptchaToken(null);
                      toast.error('Security challenge failed. Please reload or retry.');
                    }}
                  />
                </div>

                {/* Submit action: labels 'Create Profile' */}
                <button
                  type="submit"
                  disabled={loading || password.length < 8 || !captchaToken}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mt-5 font-mono uppercase tracking-wider ${isLight
                    ? 'bg-zinc-900 hover:bg-zinc-805 text-white shadow-zinc-200/50'
                    : 'bg-white hover:bg-zinc-200 text-black'
                    }`}
                >
                  <Sparkles size={14} />
                  <span>{loading ? 'CREATING PROFILE...' : 'Create Profile'}</span>
                </button>
              </form>

              <div className={`mt-5 pt-4 border-t text-center text-xs text-zinc-500 font-sans ${isLight ? 'border-zinc-200' : 'border-zinc-850'}`}>
                <span>Already have a profile? </span>
                <button
                  onClick={() => {
                    setCaptchaToken(null);
                    setMode('login');
                  }}
                  className={`hover:underline font-bold cursor-pointer transition-colors ${isLight ? 'text-zinc-800 font-black' : 'text-zinc-200 font-black'}`}
                >
                  Sign In
                </button>
              </div>
            </>
          )}

          {/* MODE: FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <>
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  onClick={() => setMode('login')}
                  className={`flex items-center gap-1 text-xs font-semibold font-mono transition-all ${isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}
                >
                  <ArrowLeft size={13} /> BACK
                </button>
              </div>

              <div className="text-center mb-6">
                <h2 className={`font-serif italic text-2xl leading-none transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                  Reset Password
                </h2>
                <p className="text-xs text-zinc-500 mt-2 font-sans">
                  Recover your estimation practicing session coordinates
                </p>
              </div>

              <form onSubmit={handleResetSubmit} className="space-y-4">
                {/* Email Address */}
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 block mb-1 font-mono">
                    Email Address
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
                      placeholder="name@company.com"
                      className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none text-sm transition-all duration-300 font-medium ${isLight
                        ? 'bg-zinc-50 border border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400'
                        : 'bg-zinc-950 border border-zinc-850 text-white placeholder:text-zinc-650 focus:border-zinc-500'
                        }`}
                    />
                  </div>
                </div>

                {/* Reset CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50 mt-5 font-mono uppercase tracking-wider ${isLight
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-white shadow-zinc-200/50'
                    : 'bg-white hover:bg-zinc-200 text-black'
                    }`}
                >
                  <Key size={14} />
                  <span>{loading ? 'SENDING INSTRUCTIONS...' : 'Send Reset Link'}</span>
                </button>
              </form>

              <div className={`mt-5 pt-4 border-t text-center text-xs text-zinc-500 font-sans ${isLight ? 'border-zinc-200' : 'border-zinc-850'}`}>
                <span>Return to </span>
                <button
                  onClick={() => setMode('login')}
                  className={`hover:underline font-bold cursor-pointer transition-colors ${isLight ? 'text-zinc-800 font-black' : 'text-zinc-200 font-black'}`}
                >
                  Sign In Screen
                </button>
              </div>
            </>
          )}

        </div>

        {/* Diagnostic controls */}
        {/* <div className={`mt-6 rounded-xl border p-4 w-full transition-all duration-300 ${isLight ? 'bg-white border-zinc-200 shadow-lg shadow-zinc-100/50' : 'bg-bg-card border-zinc-800/80'}`}>
          <span className="text-[10px] font-bold text-zinc-500 block uppercase tracking-widest mb-2 font-mono flex items-center gap-1">
            <Key size={11} className={isLight ? 'text-zinc-700' : 'text-zinc-300'} />
            TESTING CREDENTIALS ( friction-free )
          </span>
          <div className="flex flex-wrap gap-1.5 justify-between">
            <button
              onClick={() => handleApplyPreset('user')}
              className={`text-[10px] border font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors font-mono ${isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 focus:outline-none'
                : 'bg-zinc-900 border-zinc-850 text-zinc-300 hover:bg-zinc-800'
                }`}
            >
              <span>👤 User Preset</span>
            </button>
            <button
              onClick={() => handleApplyPreset('admin')}
              className={`text-[10px] border font-semibold py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-colors font-mono ${isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-700 hover:bg-zinc-100 focus:outline-none'
                : 'bg-zinc-900 border-zinc-850 text-zinc-300 hover:bg-zinc-800'
                }`}
            >
              <span>🔑 Admin Preset</span>
            </button>
            <button
              onClick={() => handleApplyPreset('owner')}
              className={`text-[10px] font-semibold border py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer transition-all animate-pulse font-mono ${isLight
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/80 focus:outline-none'
                : 'bg-zinc-900 border-zinc-850 text-amber-500 hover:bg-zinc-805'
                }`}
            >
              <span>💼 Soham's Email</span>
            </button>
          </div>
        </div> */}

      </div>
    </div>
  );
};
