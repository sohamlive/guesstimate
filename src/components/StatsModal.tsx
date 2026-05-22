import React, { useState, useEffect } from 'react';
import { Profile, Category, Question, UserProgress } from '../types';
import { db } from '../lib/db';
import { X, Award, BarChart3, RotateCcw, ShieldAlert, Award as MedalIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';

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

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-8 h-8 rounded-full border-4 border-[#1A2E6C] border-t-transparent animate-spin mx-auto mb-3"></div>
          <span className="text-sm text-gray-500 font-medium">COMPILING STATISTICS...</span>
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-md">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <Award className="text-[#1A2E6C]" size={18} />
            <span className="font-display font-bold text-lg text-[#1A2E6C]">Your Analytics</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scroll area */}
        <div className="flex-grow overflow-y-auto p-6 flex flex-col gap-6">
          
          {/* User Bio header */}
          <div className="text-center pb-4 border-b border-gray-100">
            <div className="w-14 h-14 bg-[#1A2E6C] text-white flex items-center justify-center rounded-full text-xl font-bold mx-auto mb-2 shadow-sm font-display">
              {profile.first_name[0]?.toUpperCase()}{profile.second_name?.[0]?.toUpperCase() || profile.last_name[0]?.toUpperCase() || ''}
            </div>
            <h3 className="font-display font-semibold text-lg text-[#111827]">
              {profile.first_name} {profile.last_name}
            </h3>
            <span className="text-xs text-gray-500 font-semibold tracking-wider font-mono uppercase">
              {profile.email}
            </span>
          </div>

          {/* Overall score banner card */}
          <div className="bg-[#1A2E6C] text-white rounded-xl p-5 flex items-center justify-between shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-xs text-white/70 block uppercase tracking-wider font-semibold">OVERALL COMPLETION</span>
              <span className="text-3xl font-display font-extrabold block mt-1">{overallPercentage}%</span>
              <span className="text-[11px] text-white/80 block mt-1.5 font-sans">
                Logged {solvedCount} of {totalQuestionsCount} questions solved.
              </span>
            </div>
            
            {/* Round radial or stylized progress visually on the right */}
            <div className="relative z-10 w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center">
              <MedalIcon size={32} className="text-[#EEF0F5]/90" />
              <div className="absolute inset-0 rounded-full border-4 border-[#2C4EDB] border-t-transparent animate-spin-slow"></div>
            </div>
          </div>

          {/* Macro Metrics Split */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#F4F6FA] p-4 rounded-xl border border-gray-100 text-center">
              <span className="text-xs text-gray-500 block font-semibold uppercase font-sans">SOLVED CHALLENGES</span>
              <span className="text-2xl font-display font-medium text-[#16A34A] block mt-1">{solvedCount}</span>
            </div>
            <div className="bg-[#F4F6FA] p-4 rounded-xl border border-gray-100 text-center">
              <span className="text-xs text-gray-500 block font-semibold uppercase font-sans">RETRY BACKLOG</span>
              <span className="text-2xl font-display font-medium text-[#D97706] block mt-1">{retryCount}</span>
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
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-gray-700">{cat.name}</span>
                      <span className="text-gray-500 font-bold font-mono">{catSolved}/{catQuestions.length} ({ratio}%)</span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
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
          <div className="pt-2 border-t border-gray-100">
            <span className="text-xs uppercase tracking-widest text-gray-400 font-bold block mb-3 font-sans">DIFFICULTY SPLIT</span>
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

                const theme = getDiffTheme(diff);

                return (
                  <div key={diff}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className={`font-semibold ${theme.text}`}>{diff} List</span>
                      <span className="text-gray-500 font-bold font-mono">{diffSolved}/{diffQuestions.length} ({ratio}%)</span>
                    </div>
                    
                    {/* Progress slider bar */}
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${theme.fill}`}
                        style={{ width: `${ratio}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset Statistics warning prompt */}
          <div className="border-t border-gray-100 pt-4 mt-2">
            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="w-full text-xs text-[#DC2626] font-semibold border border-[#DC2626]/20 bg-[#FEE2E2]/30 hover:bg-[#FEE2E2]/80 transition-all cursor-pointer py-2.5 rounded-xl flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>Reset My Statistics</span>
              </button>
            ) : (
              <div className="p-4 bg-[#FEE2E2] border border-[#DC2626]/20 rounded-xl relative overflow-hidden">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="text-[#DC2626] mt-0.5 shrink-0" size={18} />
                  <div>
                    <h5 className="text-xs font-bold text-[#DC2626] uppercase tracking-wider">Are you absolutely sure?</h5>
                    <p className="text-xs text-[#DC2626]/90 mt-1 font-sans">
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
                        className="bg-gray-200 text-gray-700 text-xs font-semibold py-1.5 px-3 rounded-lg cursor-pointer hover:bg-gray-300 transition-colors"
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
        <div className="bg-[#F4F6FA] px-6 py-4 rounded-b-2xl border-t border-[#E5E7EB] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#1A2E6C] hover:bg-[#152459] text-white font-semibold py-2 px-6 rounded-xl text-sm transition-all cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};
