import React, { useState, useEffect } from 'react';
import { Profile, Question, UserProgress, UserRole } from '../types';
import { db } from '../lib/db';
import { X, Save, Trash2, RotateCcw, UserMinus, ShieldAlert, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

interface UserStudioModalProps {
  userProfile: Profile | null; // null = Add Mode, non-null = Edit Mode
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeleteSuccess: () => void;
}

export const UserStudioModal: React.FC<UserStudioModalProps> = ({
  userProfile,
  onClose,
  onSaveSuccess,
  onDeleteSuccess,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const isEditMode = !!userProfile;

  // Form Fields
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('user');

  // Stats Breakdown for existing user
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);

  // Loading & confirmation thresholds
  const [saving, setSaving] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  useEffect(() => {
    if (userProfile) {
      setFirstName(userProfile.first_name);
      setLastName(userProfile.last_name);
      setEmail(userProfile.email);
      setRole(userProfile.role);
      setPassword(userProfile.plain_password || '••••••••');

      // Fetch stats for this user
      const loadUserStats = async () => {
        try {
          const qList = await db.getQuestions(false);
          const uProg = await db.getUserProgress(userProfile.id);

          setTotalQuestions(qList.length);
          setSolvedCount(uProg.filter(p => p.status === 'solved').length);
          setRetryCount(uProg.filter(p => p.status === 'retry').length);
        } catch {
          // ignore
        }
      };
      loadUserStats();
    } else {
      // Add mode defaults
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('user123'); // Default preloaded password for ease of admin deployment
      setRole('user');
    }
  }, [userProfile]);

  const handleResetUserStats = async () => {
    if (!userProfile) return;
    try {
      await db.resetUserStats(userProfile.id);
      setSolvedCount(0);
      setRetryCount(0);
      setShowConfirmReset(false);
      toast.success(`${userProfile.first_name}'s practicing history has been cleared.`);
      onSaveSuccess();
    } catch (err: any) {
      toast.error('Failed to reset user metrics.');
    }
  };

  const handleDeleteUser = async () => {
    if (!userProfile) return;
    try {
      await db.deleteProfile(userProfile.id);
      toast.success('User profile removed.');
      setShowConfirmDelete(false);
      onDeleteSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Failed to prune user.');
    }
  };

  const handleSave = async () => {
    const fName = firstName.trim();
    const lName = lastName.trim();
    const mail = email.trim().toLowerCase();

    if (!fName || !lName) {
      toast.error('First and Last name are required.');
      return;
    }
    if (!mail || !mail.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }

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

    setSaving(true);
    try {
      if (isEditMode && userProfile) {
        const updatePromise = db.updateProfile(userProfile.id, {
          first_name: fName,
          last_name: lName,
          email: mail,
          role,
        });
        await withTimeout(
          updatePromise,
          10000,
          'There is some login/creating issue. Please try again later.'
        );
        toast.success('User updated successfully!');
      } else {
        const addPromise = db.addProfile({
          first_name: fName,
          last_name: lName,
          email: mail,
          role,
          plain_password: password, // For easy offline mock login testing
        });
        await withTimeout(
          addPromise,
          10000,
          'There is some login/creating issue. Please try again later.'
        );
        toast.success(`User Account for ${fName} created!`);
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'There is some login/creating issue. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/65 backdrop-blur-md animate-fadeIn">
      <div className={`relative w-full max-w-3xl overflow-hidden rounded-2xl shadow-2xl flex flex-col max-h-[90vh] border transition-all duration-300 ${isLight ? 'bg-white text-zinc-800 border-zinc-200' : 'bg-[#171717] text-zinc-300 border-zinc-800'
        }`}>

        {/* Header bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 ${isLight ? 'border-zinc-200' : 'border-zinc-800/80 bg-bg-card'}`}>
          <span className={`font-serif italic text-lg transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>
            {isEditMode ? 'Edit User Credentials' : 'Provision New User'}
          </span>
          <button
            onClick={onClose}
            className={`transition-colors cursor-pointer ${isLight ? 'text-zinc-400 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Two column profile setup */}
        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT COLUMN: Input credentials */}
          <div className="flex flex-col gap-4">

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider font-mono">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Juliet"
                  className={`w-full p-2.5 border rounded-xl outline-none text-sm font-mono transition-colors ${isLight
                    ? 'bg-zinc-50 border-zinc-250 text-zinc-800 focus:bg-white focus:border-zinc-500'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-350 focus:border-zinc-550'
                    }`}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider font-mono">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Capulet"
                  className={`w-full p-2.5 border rounded-xl outline-none text-sm font-mono transition-colors ${isLight
                    ? 'bg-zinc-50 border-zinc-250 text-zinc-800 focus:bg-white focus:border-zinc-500'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-350 focus:border-zinc-550'
                    }`}
                />
              </div>
            </div>

            <div className="font-mono">
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider font-mono">Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. partner@firm.com"
                className={`w-full p-2.5 border rounded-xl outline-none text-sm font-mono transition-colors ${isLight
                  ? 'bg-zinc-50 border-zinc-250 text-zinc-800 focus:bg-white focus:border-zinc-500'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-350 focus:border-zinc-550'
                  }`}
              />
            </div>

            <div className="font-mono">
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider font-mono">
                Password {isEditMode ? '(Read-Only)' : '(Plain Text Visible)'} *
              </label>
              <input
                type="text"
                required
                disabled={isEditMode}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. custom123"
                className={`w-full p-2.5 border rounded-xl outline-none text-sm font-mono transition-colors ${isLight
                  ? 'bg-zinc-50 border-zinc-250 text-zinc-800 focus:bg-white focus:border-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:border-zinc-200'
                  : 'bg-zinc-950 border border-zinc-800 text-zinc-300 focus:border-zinc-550 disabled:bg-[#121212] disabled:text-zinc-550 disabled:border-zinc-850'
                  }`}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider font-mono">Authorized Platform Role</label>
              <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border font-mono transition-all ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-950 border-zinc-850'
                }`}>
                {(['user', 'admin'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer capitalize ${role === r
                      ? isLight
                        ? 'bg-zinc-900 text-white font-bold shadow-xs'
                        : 'bg-zinc-800 text-white font-bold border border-zinc-700 shadow-xs'
                      : isLight
                        ? 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/40'
                        : 'text-zinc-500 hover:text-white'
                      }`}
                  >
                    {r === 'admin' ? 'Platform Admin' : 'User'}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Statistics review (Draft for editing) */}
          <div className={`flex flex-col gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6 justify-between transition-colors duration-300 ${isLight ? 'border-zinc-200' : 'border-zinc-850'}`}>

            {/* Live stats preview */}
            <div className={`rounded-xl p-5 border flex-grow flex flex-col justify-between transition-colors ${isLight ? 'bg-zinc-50 border-zinc-200 text-zinc-805' : 'bg-zinc-950 border border-zinc-850 text-zinc-300'
              }`}>
              <div>
                <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-zinc-550 uppercase font-mono tracking-wider">
                  <Award size={15} />
                  <span>Practice Records</span>
                </div>

                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-center font-mono">
                      <div className={`p-3 rounded-xl border transition-all ${isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-[#121212] p-3 rounded-xl border border-zinc-805'
                        }`}>
                        <span className="text-[12px] text-zinc-550 font-bold uppercase block tracking-wider">Solved</span>
                        <span className={`font-serif italic text-3xl block mt-1 ${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'}`}>{solvedCount}</span>
                      </div>
                      <div className={`p-3 rounded-xl border transition-all ${isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-[#121212] p-3 rounded-xl border border-zinc-805'
                        }`}>
                        <span className="text-[12px] text-zinc-550 font-bold uppercase block tracking-wider">Retries</span>
                        <span className={`font-serif italic text-3xl block mt-1 ${isLight ? 'text-amber-700 font-bold' : 'text-amber-400'}`}>{retryCount}</span>
                      </div>
                    </div>

                    <div className={`text-center p-3 rounded-xl border font-mono transition-colors ${isLight ? 'bg-white border-zinc-200 shadow-xs' : 'bg-[#121212] border border-zinc-805'
                      }`}>
                      <span className="text-[12px] text-zinc-550 font-bold uppercase block tracking-wider">Completion</span>
                      <span className={`font-serif italic text-lg block mt-1 ${isLight ? 'text-zinc-800 font-bold' : 'text-zinc-200'}`}>
                        {totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0}%
                      </span>
                      <span className="text-[12px] text-zinc-500 block mt-1">
                        Solved {solvedCount} of {totalQuestions} published.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-zinc-505 leading-relaxed font-mono">
                      Practising coordinates will populate here once this profile starts logging estimations on active sandboxes.
                    </p>
                  </div>
                )}
              </div>

              {/* Reset stats buttons */}
              {isEditMode && (
                <div className={`mt-4 pt-4 border-t ${isLight ? 'border-zinc-200' : 'border-zinc-850'}`}>
                  {!showConfirmReset ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(true)}
                      className={`w-full text-xs py-2 border rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono ${isLight
                        ? 'text-amber-700 bg-amber-500/10 hover:bg-amber-500/20 border-amber-200/50'
                        : 'text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/10'
                        }`}
                    >
                      <RotateCcw size={12} />
                      <span>Clear Practice History</span>
                    </button>
                  ) : (
                    <div className={`p-3 border rounded-lg text-xs leading-normal font-mono transition-colors ${isLight ? 'bg-white border-amber-205 border-amber-200 text-zinc-800' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                      }`}>
                      <span className="font-bold text-amber-500 block mb-1">RESET USER RECORDS?</span>
                      <p className="text-zinc-500 mb-2">This clears all solved/retry markers and notebook logs for this specific user.</p>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleResetUserStats}
                          className="bg-amber-600 text-white text-[10px] font-bold py-1 px-3 rounded-md cursor-pointer hover:bg-amber-700"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowConfirmReset(false)}
                          className={`text-[10px] font-semibold py-1 px-2 rounded-md cursor-pointer transition-colors ${isLight ? 'bg-zinc-150 text-zinc-700 hover:bg-zinc-200 border border-zinc-200' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer actions */}
        <div className={`px-6 py-4 rounded-b-2xl border-t flex items-center justify-between transition-colors duration-300 ${isLight ? 'bg-[#F4F6FA] border-[#E5E7EB]' : 'bg-[#0F0F0F] border-zinc-800'
          }`}>
          <div>
            {isEditMode && (
              !showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className={`text-xs font-bold border px-4 py-2.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-mono ${isLight
                    ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700'
                    : 'text-xs text-red-500 font-bold border border-red-500/15 bg-red-500/5 hover:bg-red-500/10'
                    }`}
                >
                  <Trash2 size={13} />
                  <span>Delete User Profile</span>
                </button>
              ) : (
                <div className={`flex items-center gap-2 p-2 rounded-lg border font-mono transition-all ${isLight ? 'bg-red-50 border-red-250 text-red-800' : 'bg-red-500/5 border border-red-500/20 text-zinc-300'
                  }`}>
                  <ShieldAlert className="text-red-400" size={15} />
                  <span className={`text-[11px] font-bold leading-none ${isLight ? 'text-red-700 font-bold' : 'text-red-400'}`}>PRUNE USER PROFILE?</span>
                  <button
                    type="button"
                    onClick={handleDeleteUser}
                    className="bg-[#DC2626] text-white text-[10px] font-bold px-2.5 py-1 rounded-md cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className={`text-[10px] px-2 py-1 rounded-md font-semibold cursor-pointer ${isLight ? 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300' : 'bg-zinc-805 text-zinc-300'
                      }`}
                  >
                    Cancel
                  </button>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-2 font-mono">
            <button
              type="button"
              onClick={onClose}
              className={`border font-bold py-2 px-5 rounded-lg text-sm transition-all cursor-pointer ${isLight
                ? 'bg-white border-zinc-250 text-zinc-700 hover:bg-zinc-100'
                : 'bg-zinc-900 border border-zinc-850 text-zinc-300 hover:bg-zinc-800'
                }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`font-bold py-2 px-6 rounded-lg text-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${isLight
                ? 'bg-zinc-900 hover:bg-zinc-850 text-white'
                : 'bg-white hover:bg-zinc-200 text-black'
                }`}
            >
              <Save size={14} />
              <span>{isEditMode ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
