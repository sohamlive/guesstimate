import React, { useState, useEffect } from 'react';
import { Profile, Question, UserProgress, UserRole } from '../types';
import { db } from '../lib/db';
import { X, Save, Trash2, RotateCcw, UserMinus, ShieldAlert, Award } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

    setSaving(true);
    try {
      if (isEditMode && userProfile) {
        await db.updateProfile(userProfile.id, {
          first_name: fName,
          last_name: lName,
          email: mail,
          role,
        });
        toast.success('User updated successfully!');
      } else {
        await db.addProfile({
          first_name: fName,
          last_name: lName,
          email: mail,
          role,
          plain_password: password, // For easy offline mock login testing
        });
        toast.success(`User Account for ${fName} created!`);
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit user coordinates.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="relative bg-[#0c0c0c] border border-zinc-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850">
          <span className="font-serif italic text-lg text-white">
            {isEditMode ? 'Edit User Credentials' : 'Provision New Practitioner'}
          </span>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
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
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider">First Name *</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="e.g. Juliet"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl outline-none text-sm text-zinc-350 focus:border-zinc-550"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider">Last Name *</label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Capulet"
                  className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl outline-none text-sm text-zinc-350 focus:border-zinc-550"
                />
              </div>
            </div>

            <div className="font-mono">
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider">Email Coordinates *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. partner@firm.com"
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl outline-none text-sm text-zinc-350 focus:border-zinc-550"
              />
            </div>

            <div className="font-mono">
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider">
                Password {isEditMode ? '(Read-Only)' : '(Plain Text Visible)'} *
              </label>
              <input
                type="text"
                required
                disabled={isEditMode}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. custom123"
                className="w-full p-2.5 bg-zinc-950 border border-zinc-800 rounded-xl outline-none text-sm text-zinc-300 focus:border-zinc-550 disabled:bg-[#121212] disabled:text-zinc-550 disabled:border-zinc-850"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 tracking-wider font-mono">Authorized Platform Role</label>
              <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-850 font-mono">
                {(['user', 'admin'] as UserRole[]).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer capitalize ${
                      role === r
                        ? 'bg-zinc-850 text-white font-bold border border-zinc-800 shadow-xs'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {r === 'admin' ? 'Platform Admin' : 'Practitioner'}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Statistics review (Draft for editing) */}
          <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l border-zinc-850 pt-4 md:pt-0 md:pl-6 justify-between">
            
            {/* Live stats preview */}
            <div className="bg-zinc-950 rounded-xl p-5 border border-zinc-850 flex-grow flex flex-col justify-between text-zinc-300">
              <div>
                <div className="flex items-center gap-1.5 mb-3 text-xs font-bold text-zinc-450 uppercase font-mono tracking-wider">
                  <Award size={15} />
                  <span>Interactive Practice Records</span>
                </div>

                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-center font-mono">
                      <div className="bg-[#121212] p-3 rounded-xl border border-zinc-805">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">Challenges Solved</span>
                        <span className="font-serif italic text-emerald-400 text-2xl block mt-1">{solvedCount}</span>
                      </div>
                      <div className="bg-[#121212] p-3 rounded-xl border border-zinc-805">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">Retry Queued</span>
                        <span className="font-serif italic text-amber-400 text-2xl block mt-1">{retryCount}</span>
                      </div>
                    </div>

                    <div className="text-center bg-[#121212] p-3 rounded-xl border border-zinc-805 font-mono">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase block tracking-wider">Completion Factor</span>
                      <span className="font-serif italic text-lg text-zinc-200 block mt-1">
                        {totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0}%
                      </span>
                      <span className="text-[10px] text-zinc-550 block mt-1">
                        Cleared {solvedCount} of {totalQuestions} published.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-xs text-zinc-550 leading-relaxed font-mono">
                      Practising coordinates will populate here once this profile starts logging estimations on active sandboxes.
                    </p>
                  </div>
                )}
              </div>

              {/* Reset stats buttons */}
              {isEditMode && (
                <div className="mt-4 pt-4 border-t border-zinc-850">
                  {!showConfirmReset ? (
                    <button
                      type="button"
                      onClick={() => setShowConfirmReset(true)}
                      className="w-full text-xs text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/10 py-2 rounded-lg font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 font-mono"
                    >
                      <RotateCcw size={12} />
                      <span>Clear Practice History</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs leading-normal font-mono text-zinc-300">
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
                          className="bg-zinc-800 text-zinc-300 text-[10px] font-semibold py-1 px-2 rounded-md cursor-pointer hover:bg-zinc-700"
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
        <div className="bg-[#050505] px-6 py-4 rounded-b-2xl border-t border-zinc-850 flex items-center justify-between">
          <div>
            {isEditMode && (
              !showConfirmDelete ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-xs text-red-500 font-bold border border-red-500/15 bg-red-500/5 hover:bg-red-500/10 px-4 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer font-mono"
                >
                  <Trash2 size={13} />
                  <span>Delete User Profile</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 p-2 rounded-lg font-mono text-zinc-300">
                  <ShieldAlert className="text-red-400" size={15} />
                  <span className="text-[11px] text-red-400 font-bold leading-none">PRUNE USER PROFILE?</span>
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
                    className="bg-zinc-805 text-zinc-300 text-[10px] px-2 py-1 rounded-md font-semibold cursor-pointer"
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
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold py-2 px-5 rounded-lg text-sm transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-white hover:bg-zinc-200 text-black font-bold py-2 px-6 rounded-lg text-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save size={14} />
              <span>{isEditMode ? 'Save Changes' : 'Provision User'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
