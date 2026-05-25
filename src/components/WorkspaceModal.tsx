import React, { useState, useEffect } from 'react';
import { Question, ProgressStatus, VoteType } from '../types';
import { db } from '../lib/db';
import { X, ThumbsUp, ThumbsDown, Link, BookOpen, RefreshCw, Check, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

interface WorkspaceModalProps {
  question: Question;
  userId: string;
  onClose: () => void;
  onProgressChange: () => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  question,
  userId,
  onClose,
  onProgressChange,
}) => {
  const [status, setStatus] = useState<ProgressStatus>('none');
  const [notes, setNotes] = useState<string>('');
  const [savingNotes, setSavingNotes] = useState<boolean>(false);
  const [userVote, setUserVote] = useState<VoteType | null>(null);

  // Real-time aggregate count overrides for local consistency
  const [qUpvotes, setQUpvotes] = useState<number>(question.upvotes || 0);
  const [qDownvotes, setQDownvotes] = useState<number>(question.downvotes || 0);

  // Question global stats based on all progress records
  const [globalSolved, setGlobalSolved] = useState<number>(0);
  const [globalRetry, setGlobalRetry] = useState<number>(0);

  useEffect(() => {
    const fetchUserDataAndStats = async () => {
      try {
        // Get user progress
        const progressList = await db.getUserProgress(userId);
        const match = progressList.find(p => p.question_id === question.id);
        if (match) {
          setStatus(match.status);
          setNotes(match.notes || '');
        }

        // Get user votes
        const voteList = await db.getUserVotes(userId);
        const voteMatch = voteList.find(v => v.question_id === question.id);
        if (voteMatch) {
          setUserVote(voteMatch.vote);
        }

        // Fetch global stats
        const allProgress = await db.getAllProgress();
        const qProgress = allProgress.filter(p => p.question_id === question.id);
        setGlobalSolved(qProgress.filter(p => p.status === 'solved').length);
        setGlobalRetry(qProgress.filter(p => p.status === 'retry').length);

      } catch (err) {
        console.error('Failed to load workspace data', err);
      }
    };

    fetchUserDataAndStats();
  }, [question.id, userId]);

  const handleToggleStatus = async (targetStatus: ProgressStatus) => {
    try {
      // If already active, toggle it to 'none'
      const nextStatus = status === targetStatus ? 'none' : targetStatus;

      await db.toggleProgressStatus(userId, question.id, nextStatus);
      setStatus(nextStatus);

      // Update global counters optimistically
      if (nextStatus === 'solved') {
        setGlobalSolved(prev => prev + 1);
        if (status === 'retry') setGlobalRetry(prev => Math.max(0, prev - 1));
        toast.success('Challenged marked as Solved!');
      } else if (nextStatus === 'retry') {
        setGlobalRetry(prev => prev + 1);
        if (status === 'solved') setGlobalSolved(prev => Math.max(0, prev - 1));
        toast.success('Added to your Retry queue.');
      } else {
        if (status === 'solved') setGlobalSolved(prev => Math.max(0, prev - 1));
        if (status === 'retry') setGlobalRetry(prev => Math.max(0, prev - 1));
        toast.success('Removed from your Retry queue.');
      }

      onProgressChange();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update progress status.');
    }
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await db.saveNotes(userId, question.id, notes);
      toast.success('Working notes saved successfully.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to preserve notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleVote = async (type: VoteType) => {
    try {
      let nextVote: VoteType | null = null;

      if (userVote === type) {
        // Clicking same vote removes it
        nextVote = null;
        if (type === 'up') setQUpvotes(prev => Math.max(0, prev - 1));
        else setQDownvotes(prev => Math.max(0, prev - 1));
      } else {
        nextVote = type;
        // Adjusted counters
        if (type === 'up') {
          setQUpvotes(prev => prev + 1);
          if (userVote === 'down') setQDownvotes(prev => Math.max(0, prev - 1));
        } else {
          setQDownvotes(prev => prev + 1);
          if (userVote === 'up') setQUpvotes(prev => Math.max(0, prev - 1));
        }
      }

      await db.toggleVote(userId, question.id, nextVote);
      setUserVote(nextVote);
      onProgressChange(); // refresh grid votes
    } catch (err: any) {
      toast.error('Failed to register reaction.');
    }
  };

  const { theme } = useTheme();
  const isLight = theme === 'light';

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-[#DCFCE7] text-[#16A34A] border border-[#16A34A]/20';
      case 'Medium':
        return 'bg-[#FEF3C7] text-[#D97706] border border-[#D97706]/20';
      case 'Hard':
        return 'bg-[#FEE2E2] text-[#DC2626] border border-[#DC2626]/20';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className={`relative w-full max-w-4xl overflow-hidden rounded-2xl shadow-xl flex flex-col max-h-[90vh] transition-colors border ${isLight ? 'bg-white text-zinc-800 border-zinc-200' : 'bg-bg-card text-zinc-300 border-zinc-600'}`}>

        {/* Header bar */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isLight ? 'border-[#E5E7EB]' : 'border-zinc-800/80 bg-bg-canvas'}`}>
          <div className="flex items-center gap-2">
            <BookOpen className={`${isLight ? 'text-[#1A2E6C]' : 'text-zinc-400'}`} size={20} />
            <span className={`font-serif italic font-bold text-lg ${isLight ? 'text-[#1A2E6C]' : 'text-zinc-100'}`}>Challenge Sandbox</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal content - Two column layout */}
        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* LEFT COLUMN: Prompt & References */}
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">THE CHALLENGE</span>
              <div className={`mt-2 p-4 rounded-xl border min-h-[140px] flex items-center transition-colors ${isLight ? 'bg-[#F4F6FA] border-[#E5E7EB]' : 'bg-[#0A0A0A] border-zinc-800'}`}>
                <p className={`font-serif italic font-bold text-lg leading-relaxed ${isLight ? 'text-[#111827]' : 'text-white'}`}>
                  {question.question}
                </p>
              </div>
            </div>

            {/* Metadata Badges */}
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">INFORMATION</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty} Difficulty
                </span>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${isLight ? 'bg-[#E8ECF8] text-[#1A2E6C] border-[#1A2E6C]/10' : 'bg-zinc-900 text-zinc-300 border-zinc-800/80'}`}>
                  {question.category_name}
                </span>
              </div>
            </div>

            {/* Keyword tags */}
            {question.tags && question.tags.length > 0 && (
              <div>
                <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">TAGS</span>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {question.tags.map((tag, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-0.5 rounded-md font-mono ${isLight ? 'bg-[#EEF0F5] text-gray-600' : 'bg-zinc-900 border border-zinc-805 text-zinc-400'}`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resource hints links */}
            {(question.url_1 || question.url_2) && (
              <div className={`mt-auto pt-4 border-t ${isLight ? 'border-gray-100' : 'border-zinc-800'}`}>
                <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">HINTS & CITATIONS</span>
                <div className="flex flex-col gap-2 mt-2">
                  {question.url_1 && (
                    <a
                      href={question.url_1}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className={`flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer ${isLight ? 'text-[#2C4EDB] hover:text-[#2342C4]' : 'text-zinc-400 hover:text-white hover:underline'}`}
                    >
                      <Link size={13} />
                      <span>{question.url_1.length > 50 ? `${question.url_1.substring(0, 47)}...` : question.url_1}</span>
                    </a>
                  )}
                  {question.url_2 && (
                    <a
                      href={question.url_2}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      className={`flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer ${isLight ? 'text-[#2C4EDB] hover:text-[#2342C4]' : 'text-zinc-400 hover:text-white hover:underline'}`}
                    >
                      <Link size={13} />
                      <span>{question.url_2.length > 50 ? `${question.url_2.substring(0, 47)}...` : question.url_2}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Interactive Working Pad & Analytics */}
          <div className={`flex flex-col gap-5 border-t md:border-t-0 md:border-l pt-5 md:pt-0 md:pl-6 ${isLight ? 'border-gray-100' : 'border-zinc-800'}`}>

            {/* Feedback & Analytics Row */}
            <div className={`flex items-center justify-between gap-4 p-3 rounded-xl border transition-colors ${isLight ? 'bg-[#F4F6FA] border-gray-100 text-gray-800' : 'bg-[#0B0B0C] border-zinc-800/80 text-zinc-350'}`}>
              <span className="text-xs font-semibold text-gray-500">How would you rate this?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote('up')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${userVote === 'up'
                    ? (isLight ? 'bg-[#1A2E6C] text-white shadow' : 'bg-white text-black font-semibold')
                    : (isLight ? 'bg-white hover:bg-gray-100 text-gray-600 border border-zinc-200' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800')
                    }`}
                >
                  <ThumbsUp size={12} className={userVote === 'up' ? (isLight ? 'fill-white' : 'fill-black') : ''} />
                  <span>{qUpvotes}</span>
                </button>

                <button
                  onClick={() => handleVote('down')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${userVote === 'down'
                    ? 'bg-red-650 bg-red-600 text-white'
                    : (isLight ? 'bg-white hover:bg-gray-100 text-gray-600 border border-zinc-200' : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800')
                    }`}
                >
                  <ThumbsDown size={12} className={userVote === 'down' ? 'fill-white' : ''} />
                  <span>{qDownvotes}</span>
                </button>
              </div>
            </div>

            {/* Global platform statistics summary */}
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold text-right block">GLOBAL STATS</span>
              <div className="grid grid-cols-2 gap-3 mt-1.5 font-mono">
                <div className={`p-3 rounded-lg border text-center transition-colors ${isLight ? 'bg-[#DCFCE7]/75 border-[#16A34A]/20' : 'bg-[#16A34A]/10 border-[#16A34A]/20'}`}>
                  <span className="text-[12px] text-[#16A34A] font-bold block uppercase">Total Solved</span>
                  <span className="text-3xl font-display font-medium text-[#16A34A] block mt-0.5">{globalSolved}</span>
                </div>
                <div className={`p-3 rounded-lg border text-center transition-colors ${isLight ? 'bg-[#FEF3C7]/75 border-[#D97706]/20' : 'bg-[#D97706]/10 border-[#D97706]/20'}`}>
                  <span className="text-[12px] text-[#D97706] font-bold block uppercase">Total Retries</span>
                  <span className="text-3xl font-display font-medium text-[#D97706] block mt-0.5">{globalRetry}</span>
                </div>
              </div>
            </div>

            {/* Hand-worked estimation notebook */}
            <div className="flex-grow flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between mb-1.5 font-mono">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">YOUR WORKING NOTEBOOK</span>
                <span className="text-[9px] text-gray-400">Autosaves manually</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your core assumptions, how-tos here..."
                className={`w-full flex-grow p-4 border rounded-xl placeholder-gray-400/80 text-sm outline-none resize-none font-mono leading-relaxed transition-colors ${isLight ? 'bg-white border-gray-300 focus:border-[#2C4EDB] text-gray-800 focus:ring-1 focus:ring-[#2C4EDB]' : 'bg-[#0A0A0A] border-zinc-800 text-zinc-100 focus:border-zinc-555'}`}
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className={`mt-2 w-full font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 ${isLight ? 'bg-[#1A2E6C] hover:bg-[#152459] text-white' : 'bg-white hover:bg-zinc-200 text-black font-bold font-mono'}`}
              >
                {savingNotes ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>SAVING NOTES...</span>
                  </>
                ) : (
                  <>
                    <Save size={12} />
                    <span>SAVE NOTES</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER CONTROLS */}
        <div className={`px-6 py-4 rounded-b-2xl border-t flex items-center gap-3 transition-colors ${isLight ? 'bg-[#F4F6FA] border-[#E5E7EB]' : 'bg-bg-canvas border-zinc-800'}`}>

          <button
            onClick={() => handleToggleStatus('solved')}
            className={`flex-grow md:flex-none md:w-44 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${status === 'solved'
              ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-md'
              : (isLight ? 'bg-white hover:bg-gray-100 text-[#16A34A] border-[#16A34A]/30' : 'bg-zinc-800 border-zinc-700 text-[#16A34A] hover:bg-zinc-700')
              }`}
          >
            <Check size={16} strokeWidth={status === 'solved' ? 3 : 2} />
            <span>{status === 'solved' ? 'Solved!' : 'Mark Solved'}</span>
          </button>

          <button
            onClick={() => handleToggleStatus('retry')}
            className={`flex-grow md:flex-none md:w-44 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${status === 'retry'
              ? 'bg-[#D97706] border-[#D97706] text-white shadow-md'
              : (isLight ? 'bg-white hover:bg-gray-100 text-[#D97706] border-[#D97706]/30' : 'bg-zinc-800 border-zinc-700 text-[#D97706] hover:bg-zinc-700')
              }`}
          >
            <RefreshCw size={14} className={status === 'retry' ? 'animate-spin' : ''} />
            <span>{status === 'retry' ? 'In Retry' : 'Mark Retry'}</span>
          </button>

          <button
            onClick={onClose}
            className={`hidden md:block ml-auto font-semibold py-2.5 px-6 rounded-xl text-sm transition-all cursor-pointer ${isLight ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'}`}
          >
            Close
          </button>

          <button
            onClick={onClose}
            className={`md:hidden ml-auto w-12 h-10 font-semibold rounded-xl text-sm flex items-center justify-center transition-all cursor-pointer ${isLight ? 'bg-zinc-200 hover:bg-zinc-300 text-zinc-700' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100'}`}
          >
            <X size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};
