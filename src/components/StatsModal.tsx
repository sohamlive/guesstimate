import React, { useState, useEffect } from 'react';
import { Profile, Category, Question, UserProgress } from '../types';
import { db } from '../lib/db';
import { X, Award, BarChart3, RotateCcw, ShieldAlert, Award as MedalIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

interface StatsModalProps {
  profile: Profile;
  onClose: () => void;
  onResetSuccess: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  profile,
  onClose,
  onResetSuccess,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    const fetchStatsData = async () => {
      try {
        const cats = await db.getCategories();
        // Fetch only published questions for user statistics checking
        const qList = await db.getQuestions(false);
        const uProg = await db.getUserProgress(profile.id);

        setCategories(cats);
        setQuestions(qList);
        setProgress(uProg);
      } catch (err) {
        console.error('Failed to load stats details', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatsData();
  }, [profile.id]);

  const { theme } = useTheme();
  const isLight = theme === 'light';

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <div className={`rounded-2xl p-8 max-w-sm w-full text-center shadow-xl border ${isLight ? 'bg-white border-zinc-200 text-zinc-850' : 'bg-[#121212] border-zinc-800 text-zinc-300'}`}>
          <div className={`w-8 h-8 rounded-full border-4 border-t-transparent animate-spin mx-auto mb-3 ${isLight ? 'border-[#1A2E6C]' : 'border-white'}`}></div>
          <span className="text-sm font-medium">COMPILING STATISTICS...</span>
        </div>
      </div>
    );
  }

  // Calculate stats metrics
  const totalQuestionsList = questions;
  const totalQuestionsCount = totalQuestionsList.length;

  const solvedProgress = progress.filter(p => p.status === 'solved');
  const retryProgress = progress.filter(p => p.status === 'retry');

  const solvedCount = solvedProgress.length;
  const retryCount = retryProgress.length;

  // Percentage overall
  const overallPercentage = totalQuestionsCount > 0
    ? Math.round((solvedCount / totalQuestionsCount) * 100)
    : 0;

  // Helper to compute progress bar colors based on value
  const getProgressColor = (percent: number) => {
    if (percent < 30) return 'bg-[#DC2626]';
    if (percent < 70) return 'bg-[#D97706]';
    return 'bg-[#16A34A]';
  };

  const handleResetStats = async () => {
    try {
      await db.resetUserStats(profile.id);
      toast.success('Your statistics have been cleared.');
      setShowConfirmReset(false);
      onResetSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Failed to clear progress data.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className={`w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh] transition-colors border ${isLight ? 'bg-white border-zinc-200' : 'bg-[#121212] border-zinc-800 text-zinc-350'}`}>

        {/* Header bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'border-[#E5E7EB]' : 'border-zinc-800/80'}`}>
          <div className="flex items-center gap-2">
            <Award className={`${isLight ? 'text-[#1A2E6C]' : 'text-zinc-400'}`} size={18} />
            <span className={`font-serif italic font-bold text-lg ${isLight ? 'text-[#1A2E6C]' : 'text-zinc-150'}`}>Your Analytics</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scroll area */}
        <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6 font-sans">

          {/* User Bio header */}
          <div className={`text-center pb-4 border-b ${isLight ? 'border-gray-100' : 'border-zinc-800/80'}`}>
            <div className={`w-14 h-14 text-white flex items-center justify-center rounded-full text-xl font-bold mx-auto mb-2 shadow-sm font-display ${isLight ? 'bg-[#1A2E6C]' : 'bg-zinc-805 bg-zinc-800 border border-zinc-700'}`}>
              {profile.first_name[0]?.toUpperCase()}{profile.second_name?.[0]?.toUpperCase() || profile.last_name[0]?.toUpperCase() || ''}
            </div>
            <h3 className={`font-display font-semibold text-lg ${isLight ? 'text-[#111827]' : 'text-zinc-200'}`}>
              {profile.first_name} {profile.last_name}
            </h3>
            <span className="text-xs text-gray-400 font-semibold tracking-wider font-mono uppercase">
              {profile.email}
            </span>
          </div>

          {/* Overall score banner card */}
          <div className={`rounded-xl p-5 flex items-center justify-between shadow-md relative overflow-hidden transition-colors ${isLight ? 'bg-[#1A2E6C] text-white' : 'bg-[#09090A] border border-zinc-800 text-zinc-300'}`}>
            <div className="relative z-10">
              <span className={`text-xs block uppercase tracking-wider font-semibold ${isLight ? 'text-white/70' : 'text-zinc-500'}`}>OVERALL COMPLETION</span>
              <span className={`text-3xl font-display font-extrabold block mt-1 ${isLight ? 'text-white' : 'text-zinc-100'}`}>{overallPercentage}%</span>
              <span className={`text-[11px] block mt-1.5 font-sans ${isLight ? 'text-white/80' : 'text-zinc-400'}`}>
                Logged {solvedCount} of {totalQuestionsCount} questions solved.
              </span>
            </div>

            {/* Round radial or stylized progress visually on the right */}
            <div className={`relative z-10 w-20 h-20 rounded-full border-4 flex items-center justify-center ${isLight ? 'border-white/20' : 'border-zinc-805 bg-zinc-900 border-zinc-800'}`}>
              <MedalIcon size={32} className={`${isLight ? 'text-[#EEF0F5]/90' : 'text-zinc-400'}`} />
              <div className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin-slow ${isLight ? 'border-[#2C4EDB]' : 'border-zinc-500'}`}></div>
            </div>
          </div>

          {/* Macro Metrics Split */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border text-center transition-colors ${isLight ? 'bg-[#F4F6FA] border-gray-100' : 'bg-[#09090A] border-zinc-805 border-zinc-800'}`}>
              <span className="text-[12px] text-gray-500 block font-semibold uppercase font-sans">SOLVED CHALLENGES</span>
              <span className="text-3xl font-display font-medium text-[#16A34A] block mt-1">{solvedCount}</span>
            </div>
            <div className={`p-4 rounded-xl border text-center transition-colors ${isLight ? 'bg-[#F4F6FA] border-gray-100' : 'bg-[#09090A] border-zinc-805 border-zinc-800'}`}>
              <span className="text-[12px] text-gray-500 block font-semibold uppercase font-sans">RETRY BACKLOG</span>
              <span className="text-3xl font-display font-medium text-[#D97706] block mt-1">{retryCount}</span>
            </div>
          </div>

          {/* Category breakout bars */}
          <div>
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold block mb-3 font-sans">CATEGORY BREAKOUTS</span>
            <div className="flex flex-col gap-4">
              {categories.map(cat => {
                // Questions in this category
                const catQuestions = totalQuestionsList.filter(q => q.category_id === cat.id);
                // Solved in this category
                const catSolved = solvedProgress.filter(p =>
                  catQuestions.some(q => q.id === p.question_id)
                ).length;

                const ratio = catQuestions.length > 0 ? Math.round((catSolved / catQuestions.length) * 100) : 0;

                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-sans">
                      <span className={`font-semibold ${isLight ? 'text-gray-700' : 'text-zinc-200'}`}>{cat.name}</span>
                      <span className="text-gray-500 font-bold font-mono">{catSolved}/{catQuestions.length} ({ratio}%)</span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className={`w-full h-2 rounded-full overflow-hidden transition-colors ${isLight ? 'bg-gray-200' : 'bg-zinc-700 border border-zinc-800/30'}`}>
                      <div
                        className={`h-full transition-all duration-500 ${getProgressColor(ratio)}`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Difficulty levels breakout bars */}
          <div className={`pt-2 border-t ${isLight ? 'border-gray-100' : 'border-zinc-800'}`}>
            <span className="text-xs uppercase tracking-widest text-[#9CA3AF] font-bold block mb-3 font-sans">DIFFICULTY SPLIT</span>
            <div className="flex flex-col gap-4">
              {['Easy', 'Medium', 'Hard'].map(diff => {
                const diffQuestions = totalQuestionsList.filter(q => q.difficulty === diff);
                const diffSolved = solvedProgress.filter(p =>
                  diffQuestions.some(q => q.id === p.question_id)
                ).length;

                const ratio = diffQuestions.length > 0 ? Math.round((diffSolved / diffQuestions.length) * 100) : 0;

                const getDiffTheme = (d: string) => {
                  if (d === 'Easy') return { text: 'text-[#16A34A]', fill: 'bg-[#16A34A]' };
                  if (d === 'Medium') return { text: 'text-[#D97706]', fill: 'bg-[#D97706]' };
                  return { text: 'text-[#DC2626]', fill: 'bg-[#DC2626]' };
                };

                const themeColors = getDiffTheme(diff);

                return (
                  <div key={diff}>
                    <div className="flex items-center justify-between text-xs mb-1.5 font-sans">
                      <span className={`font-semibold ${themeColors.text}`}>{diff} List</span>
                      <span className="text-gray-500 font-bold font-mono">{diffSolved}/{diffQuestions.length} ({ratio}%)</span>
                    </div>

                    {/* Progress slider bar */}
                    <div className={`w-full h-2 rounded-full overflow-hidden transition-colors ${isLight ? 'bg-gray-200' : ' bg-zinc-700 border border-zinc-800/20'}`}>
                      <div
                        className={`h-full transition-all duration-500 ${themeColors.fill}`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset Statistics warning prompt */}
          <div className={`border-t pt-4 mt-2 ${isLight ? 'border-gray-100' : 'border-zinc-800'}`}>
            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className={`w-full text-xs font-semibold border transition-all cursor-pointer py-2.5 rounded-xl flex items-center justify-center gap-1.5 ${isLight ? 'text-[#DC2626] border-[#DC2626]/20 bg-[#FEE2E2]/50 hover:bg-[#FEE2E2]/80' : 'text-red-400 border-red-950/40 bg-red-950/40 hover:bg-red-950/60'}`}
              >
                <RotateCcw size={13} />
                <span>Reset My Statistics</span>
              </button>
            ) : (
              <div className={`p-4 border rounded-xl relative overflow-hidden transition-colors ${isLight ? 'bg-[#FEE2E2] border-[#DC2626]/20' : 'bg-red-950/40 border-red-900/30'}`}>
                <div className="flex items-start gap-3">
                  <ShieldAlert className="text-[#DC2626] mt-0.5 shrink-0" size={18} />
                  <div>
                    <h5 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Are you absolutely sure?</h5>
                    <p className={`text-xs mt-1 font-sans ${isLight ? 'text-[#DC2626]/90' : 'text-red-400'}`}>
                      This will permanently clear all of your history, notes, and solved progress tags. This action is irreversible.
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleResetStats}
                        className="bg-[#DC2626] text-white text-xs font-bold py-1.5 px-4 rounded-lg cursor-pointer hover:bg-red-800 transition-colors"
                      >
                        Yes, Clear Everything
                      </button>
                      <button
                        onClick={() => setShowConfirmReset(false)}
                        className={`text-xs font-semibold py-1.5 px-3 rounded-lg cursor-pointer transition-colors ${isLight ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Footer actions */}
        <div className={`px-6 py-4 rounded-b-2xl border-t flex justify-end transition-colors ${isLight ? 'bg-[#F4F6FA] border-[#E5E7EB]' : 'bg-[#0F0F0F] border-zinc-800'}`}>
          <button
            onClick={onClose}
            className={`font-semibold py-2 px-6 rounded-xl text-sm transition-all cursor-pointer ${isLight ? 'bg-[#1A2E6C] hover:bg-[#152459] text-white' : 'bg-white hover:bg-zinc-200 text-zinc-950 font-bold'}`}
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
