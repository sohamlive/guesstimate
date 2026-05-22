import React, { useState, useEffect } from 'react';
import { Question, ProgressStatus, VoteType } from '../types';
import { db } from '../lib/db';
import { X, ThumbsUp, ThumbsDown, Link, BookOpen, RefreshCw, Check, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
        toast.success('Added to your retry queue.');
      } else {
        if (status === 'solved') setGlobalSolved(prev => Math.max(0, prev - 1));
        if (status === 'retry') setGlobalRetry(prev => Math.max(0, prev - 1));
        toast.success('Removed state capsule.');
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
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/55 backdrop-blur-md">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <BookOpen className="text-[#1A2E6C]" size={20} />
            <span className="font-display font-bold text-lg text-[#1A2E6C]">Challenge Sandbox</span>
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
              <div className="mt-2 p-4 rounded-xl bg-[#F4F6FA] border border-[#E5E7EB] min-h-[140px] flex items-center">
                <p className="font-display font-bold text-[#111827] text-lg leading-relaxed">
                  {question.question}
                </p>
              </div>
            </div>

            {/* Metadata Badges */}
            <div>
              <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">METADATA</span>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty} Difficulty
                </span>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#E8ECF8] text-[#1A2E6C] border border-[#1A2E6C]/10">
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
                      className="text-xs bg-[#EEF0F5] text-gray-600 px-2.5 py-0.5 rounded-md font-mono"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resource hints links */}
            {(question.url_1 || question.url_2) && (
              <div className="mt-auto pt-4 border-t border-gray-100">
                <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">HINTS & CITATIONS</span>
                <div className="flex flex-col gap-2 mt-2">
                  {question.url_1 && (
                    <a 
                      href={question.url_1} 
                      target="_blank" 
                      referrerPolicy="no-referrer"
                      className="flex items-center gap-2 text-xs text-[#2C4EDB] hover:text-[#2342C4] hover:underline font-medium transition-colors cursor-pointer"
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
                      className="flex items-center gap-2 text-xs text-[#2C4EDB] hover:text-[#2342C4] hover:underline font-medium transition-colors cursor-pointer"
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
          <div className="flex flex-col gap-5 border-t md:border-t-0 md:border-l border-gray-100 pt-5 md:pt-0 md:pl-6">
            
            {/* Feedback & Analytics Row */}
            <div className="flex items-center justify-between gap-4 bg-[#F4F6FA] p-3 rounded-xl border border-gray-100">
              <span className="text-xs font-semibold text-gray-500">How would you rate this?</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote('up')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    userVote === 'up'
                      ? 'bg-[#1A2E6C] text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  <ThumbsUp size={12} className={userVote === 'up' ? 'fill-white' : ''} />
                  <span>{qUpvotes}</span>
                </button>

                <button
                  onClick={() => handleVote('down')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    userVote === 'down'
                      ? 'bg-[#DC2626] text-white'
                      : 'bg-white hover:bg-gray-100 text-gray-600'
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
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <div className="bg-[#DCFCE7]/75 p-3 rounded-lg border border-[#16A34A]/10 text-center">
                  <span className="text-[10px] text-[#16A34A]/90 font-bold block uppercase">Total Solved</span>
                  <span className="text-xl font-display font-medium text-[#16A34A] block mt-0.5">{globalSolved}</span>
                </div>
                <div className="bg-[#FEF3C7]/75 p-3 rounded-lg border border-[#D97706]/10 text-center">
                  <span className="text-[10px] text-[#D97706]/90 font-bold block uppercase">Total Retries</span>
                  <span className="text-xl font-display font-medium text-[#D97706] block mt-0.5">{globalRetry}</span>
                </div>
              </div>
            </div>

            {/* Hand-worked estimation notebook */}
            <div className="flex-grow flex flex-col min-h-[220px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold">YOUR WORKING NOTEBOOK</span>
                <span className="text-[10px] font-mono text-gray-400">Autosaves manually</span>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your calculations, estimates, core assumptions, and Fermi loops here..."
                className="w-full flex-grow p-4 border border-gray-300 rounded-xl placeholder-gray-400/80 text-sm focus:border-[#2C4EDB] focus:ring-1 focus:ring-[#2C4EDB] outline-none resize-none font-mono leading-relaxed text-gray-800"
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="mt-2 w-full bg-[#1A2E6C] hover:bg-[#152459] text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                {savingNotes ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    <span>PRESERVING CALCULATION...</span>
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
        <div className="bg-[#F4F6FA] px-6 py-4 rounded-b-2xl border-t border-[#E5E7EB] flex items-center gap-3">
          
          <button
            onClick={() => handleToggleStatus('solved')}
            className={`flex-grow md:flex-none md:w-44 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              status === 'solved'
                ? 'bg-[#16A34A] border-[#16A34A] text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-[#16A34A] border-[#16A34A]/30'
            }`}
          >
            <Check size={16} strokeWidth={status === 'solved' ? 3 : 2} />
            <span>{status === 'solved' ? 'Solved!' : 'Mark Solved'}</span>
          </button>

          <button
            onClick={() => handleToggleStatus('retry')}
            className={`flex-grow md:flex-none md:w-44 py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
              status === 'retry'
                ? 'bg-[#D97706] border-[#D97706] text-white shadow-md'
                : 'bg-white hover:bg-gray-100 text-[#D97706] border-[#D97706]/30'
            }`}
          >
            <RefreshCw size={14} className={status === 'retry' ? 'animate-spin' : ''} />
            <span>{status === 'retry' ? 'In Retry' : 'Mark Retry'}</span>
          </button>

          <button
            onClick={onClose}
            className="hidden md:block ml-auto bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 px-6 rounded-xl text-sm transition-all cursor-pointer"
          >
            Close
          </button>
          
          <button
            onClick={onClose}
            className="md:hidden ml-auto w-12 h-10 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl text-sm flex items-center justify-center transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};
