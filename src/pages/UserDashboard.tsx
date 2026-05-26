import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
//import { Question, Category, UserProgress, Difficulty, ProgressStatus } from '../types';
import { Question, Category, UserProgress, Difficulty, ProgressStatus, UserVote, VoteType } from '../types';
import { db } from '../lib/db';
import { DotGridCard } from '../components/DotGridCard';
import { WorkspaceModal } from '../components/WorkspaceModal';
import { StatsModal } from '../components/StatsModal';
import { Search, LogOut, Award, SlidersHorizontal, RotateCcw, AlertCircle, X, ChevronDown, Sun, Moon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

export const UserDashboard: React.FC = () => {
  const { session, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
  const userId = session?.user?.id || '';
  const profile = session?.profile;

  // Data Store States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]); // empty = All
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('All'); // All, Easy, Medium, Hard
  const [showSolved, setShowSolved] = useState<boolean>(false);
  const [showRetriesOnly, setShowRetriesOnly] = useState<boolean>(false);

  // Pagination / Load More
  const [itemsLimit, setItemsLimit] = useState<number>(12);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  // Modal Triggers
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);

  // Fetch initial collections
  const loadDashboardData = async () => {
    try {
      const cats = await db.getCategories();
      // Only view published questions for practitioners
      const qList = await db.getQuestions(false);
      setCategories(cats);
      setQuestions(qList);

      if (userId) {
        const prog = await db.getUserProgress(userId);
        setUserProgress(prog);
        const votes = await db.getUserVotes(userId);
        setUserVotes(votes);

      }
    } catch (err) {
      toast.error('Failed to sync library parameters.');
    } finally {
      setLoading(false);
    }
  };

  // Handling Question Toggles
  const handleToggleQuestionStatus = async (questionId: string, currentStatus: ProgressStatus, targetStatus: ProgressStatus) => {
    if (!userId) {
      toast.error('You must be logged in to update progress.');
      return;
    }
    try {
      const nextStatus = currentStatus === targetStatus ? 'none' : targetStatus;
      await db.toggleProgressStatus(userId, questionId, nextStatus);

      setUserProgress(prev => {
        const existingIdx = prev.findIndex(p => p.question_id === questionId);
        if (existingIdx !== -1) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            status: nextStatus,
            updated_at: new Date().toISOString()
          };
          return updated;
        } else {
          return [
            ...prev,
            {
              id: 'new-prog-' + Date.now(),
              user_id: userId,
              question_id: questionId,
              status: nextStatus,
              notes: '',
              updated_at: new Date().toISOString()
            }
          ];
        }
      });

      if (nextStatus === 'solved') {
        toast.success('Challenge marked as Solved!');
      } else if (nextStatus === 'retry') {
        toast.success('Added to your Retry queue.');
      } else {
        toast.success('Removed from Solve/Retry list.');
      }

      // Sync back counters silently
      await loadDashboardData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update progress status.');
    }
  };

  const handleToggleQuestionVote = async (questionId: string, currentUserVote: VoteType | null, targetVote: VoteType) => {
    if (!userId) {
      toast.error('You must be logged in to register reaction.');
      return;
    }
    try {
      const nextVote = currentUserVote === targetVote ? null : targetVote;
      await db.toggleVote(userId, questionId, nextVote);

      setUserVotes(prev => {
        const filtered = prev.filter(v => v.question_id !== questionId);
        if (nextVote) {
          return [
            ...filtered,
            {
              id: 'new-vote-' + Date.now(),
              user_id: userId,
              question_id: questionId,
              vote: nextVote,
              created_at: new Date().toISOString()
            }
          ];
        }
        return filtered;
      });

      setQuestions(prevQuestions => {
        return prevQuestions.map(q => {
          if (q.id === questionId) {
            let upvotesDiff = 0;
            let downvotesDiff = 0;

            if (currentUserVote === 'up') {
              upvotesDiff -= 1;
            } else if (currentUserVote === 'down') {
              downvotesDiff -= 1;
            }

            if (nextVote === 'up') {
              upvotesDiff += 1;
            } else if (nextVote === 'down') {
              downvotesDiff += 1;
            }

            return {
              ...q,
              upvotes: Math.max(0, (q.upvotes || 0) + upvotesDiff),
              downvotes: Math.max(0, (q.downvotes || 0) + downvotesDiff)
            };
          }
          return q;
        });
      });

      if (nextVote === 'up') {
        toast.success('Upvoted!');
      } else if (nextVote === 'down') {
        toast.success('Downvoted!');
      } else {
        toast.success('Removed vote.');
      }

      await loadDashboardData();
    } catch (err: any) {
      toast.error('Failed to register reaction.');
    }
  };

  useEffect(() => {
    loadDashboardData();
    const handleSyncRollback = () => {
      // Refresh local user progress and states automatically
      loadDashboardData().catch(console.error);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('g_sync_rollback', handleSyncRollback);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('g_sync_rollback', handleSyncRollback);
      }
    };
  }, [userId]);

  const handleCategoryToggle = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== catId));
    } else {
      setSelectedCategories([...selectedCategories, catId]);
    }
    setItemsLimit(12); // Reset paging limit
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
    setItemsLimit(12);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedDifficulty('All');
    setShowSolved(false);
    setShowRetriesOnly(false);
    setItemsLimit(12);
    toast.success('Filters reset successfully.');
  };

  // Filter Combination Logic
  const filteredQuestions = questions.filter(q => {
    // Search filter
    if (searchQuery) {
      const matchText = q.question.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag = q.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchText && !matchTag) return false;
    }

    // Category filter
    if (selectedCategories.length > 0) {
      if (!selectedCategories.includes(q.category_id)) return false;
    }

    // Difficulty filter
    if (selectedDifficulty !== 'All') {
      if (q.difficulty !== selectedDifficulty) return false;
    }

    // Find progress status for this question
    const progressRow = userProgress.find(p => p.question_id === q.id);
    const status: ProgressStatus = progressRow ? progressRow.status : 'none';

    // Show solved filter -> acts as "Show Solved Only" when active, and hides solved when inactive
    if (showSolved) {
      if (status !== 'solved') return false;
    } else {
      if (status === 'solved') return false;
    }

    // Show retries only filter
    if (showRetriesOnly && status !== 'retry') return false;

    return true;
  });

  const handlePlayQuestion = (q: Question) => {
    setActiveQuestion(q);
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setItemsLimit(prev => prev + 12);
      setLoadingMore(false);
    }, 450);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 flex flex-col select-none ${isLight
      ? 'bg-white/80 border-zinc-200'
      : 'bg-bg-base/50 border-zinc-600/40 shadow-lg shadow-black/20'
      }`}>

      {/* Dynamic Header Navbar */}
      <nav className={`sticky top-0 z-40 border-b transition-colors duration-300 ${isLight ? 'bg-white border-zinc-200' : 'bg-bg-navbar border-zinc-600/40'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-serif italic font-black text-xl shadow-md ${isLight ? 'bg-zinc-950 text-white' : 'bg-white text-black'}`}>
              G.
            </div>
            <span className={`font-serif italic text-2xl tracking-tight hidden sm:inline transition-colors ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              Guesstimate Tracker.
            </span>
          </div>

          {/* Search bar centered */}
          <div className="grow max-w-lg relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setItemsLimit(12);
              }}
              placeholder="Search by keyword or tags..."
              className={`w-full pl-9 pr-4 py-2 text-sm border rounded-xl outline-none transition-colors ${isLight ? 'border-zinc-300 bg-zinc-100 text-black placeholder:text-zinc-400 focus:border-zinc-500' : 'border-zinc-800 bg-zinc-600/40 text-white placeholder:text-zinc-650 focus:border-zinc-500 focus:ring-1 focus:ring-zinc-850'}`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={`absolute inset-y-0 right-3 flex items-center cursor-pointer transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-800' : 'text-zinc-400 hover:text-white'}`}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* User Profile Avatar, Theme & Logout */}
          <div className="flex items-center gap-3 shrink-0">

            {/* Theme toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 border transition-all duration-200 rounded-xl cursor-pointer ${isLight
                ? 'border-zinc-200 text-zinc-600 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900 hover:border-zinc-400/50'
                : 'border-zinc-600/40 text-zinc-400 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 hover:text-amber-400'
                }`}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            {/* View Stats Button */}
            {/* <button
              onClick={() => setShowStatsModal(true)}
              className={`flex items-center gap-1 text-xs border font-semibold tracking-wider font-mono px-3 py-2 rounded-xl cursor-pointer transition-colors ${isLight ? 'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 text-zinc-800 hover:text-zinc-950' : 'bg-zinc-900 border-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white'}`}
              title="Your Statistics"
            >
              <Award size={13} />
              <span className="hidden md:inline">Analytics</span>
            </button> */}

            {/* Profile Circle Icon */}
            <button
              onClick={() => setShowStatsModal(true)}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-xs font-bold font-serif shadow-md cursor-pointer transition-colors ${isLight ? 'bg-zinc-950 text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'}`}
              title="Review Profile"
            >
              {profile?.first_name?.[0]?.toUpperCase() || 'P'}
            </button>

            {/* Log Out */}
            <button
              onClick={logout}
              className={`p-2 border rounded-xl transition-all duration-200 cursor-pointer ${isLight
                ? 'bg-zinc-100 border-zinc-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-zinc-600'
                : 'bg-zinc-900/40 border-zinc-600/40 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-zinc-400'
                }`}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>

          </div>
        </div>
      </nav>

      {/* Primary Filtering Ribbon Panel */}
      <section className={`border-b py-3.5 px-6 transition-colors duration-300 ${isLight ? 'bg-zinc-100/50 border-zinc-250' : 'bg-bg-canvas border-zinc-850/80'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Leftside category capsules */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[12px] uppercase font-mono tracking-widest font-bold text-zinc-500 mr-1 shrink-0">Genre:</span>

            <button
              onClick={handleClearCategories}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all shrink-0 font-sans ${selectedCategories.length === 0
                ? (isLight ? 'bg-zinc-900 text-white border border-transparent shadow-xs' : 'bg-white text-black border border-transparent shadow-xs')
                : (isLight ? 'bg-white text-zinc-650 border border-zinc-250 hover:bg-zinc-200 hover:text-zinc-900' : 'bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white hover:bg-zinc-800')
                }`}
            >
              All
            </button>

            {categories.map(c => {
              const isActive = selectedCategories.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => handleCategoryToggle(c.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all shrink-0 font-sans ${isActive
                    ? (isLight ? 'bg-zinc-900 text-white border border-transparent shadow-xs' : 'bg-white text-black border border-transparent shadow-xs')
                    : (isLight ? 'bg-white text-zinc-650 border border-zinc-250 hover:bg-zinc-200 hover:text-zinc-900' : 'bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white hover:bg-zinc-800')
                    }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* Rightside additional parameters */}
          <div className={`flex flex-wrap items-center gap-5 text-xs font-semibold font-mono ${isLight ? 'text-zinc-550' : 'text-zinc-400'}`}>

            {/* Difficulty Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-555 dark:text-zinc-500 text-[12px] uppercase tracking-widest">Difficulty:</span>
              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    setSelectedDifficulty(e.target.value);
                    setItemsLimit(12);
                  }}
                  className={`p-1.5 pr-6 rounded-lg text-xs outline-none appearance-none cursor-pointer transition-colors font-mono ${isLight ? 'bg-white border border-zinc-300 text-zinc-800 hover:bg-zinc-50 focus:border-zinc-550' : 'bg-zinc-900 border border-zinc-600/40 text-zinc-300 hover:bg-zinc-850 focus:border-zinc-500'}`}
                >
                  <option value="All">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <ChevronDown size={11} className="absolute right-2 top-2.5 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            {/* Switch toggles */}
            <div className="flex items-center gap-4">

              {/* Hide Solved Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showSolved}
                  onChange={(e) => {
                    setShowSolved(e.target.checked);
                    setItemsLimit(12);
                  }}
                  className={`w-3.5 h-3.5 focus:ring-0 cursor-pointer ${isLight ? 'accent-zinc-900 bg-white border border-zinc-300' : 'accent-white bg-zinc-950 border border-zinc-800'}`}
                />
                <span className={`font-mono text-[12px] uppercase tracking-widest ${isLight ? 'text-zinc-500 hover:text-zinc-850' : 'text-zinc-500 hover:text-zinc-300'}`}>Show Solved</span>
              </label>

              {/* Show Retries Toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showRetriesOnly}
                  onChange={(e) => {
                    setShowRetriesOnly(e.target.checked);
                    setItemsLimit(12);
                  }}
                  className={`w-3.5 h-3.5 focus:ring-0 cursor-pointer ${isLight ? 'accent-zinc-900 bg-white border border-zinc-300' : 'accent-white bg-zinc-950 border border-zinc-800'}`}
                />
                <span className={`flex items-center gap-1 font-mono text-[12px] uppercase tracking-widest ${isLight ? 'text-zinc-500 hover:text-zinc-850' : 'text-zinc-500 hover:text-zinc-300'}`}>
                  <span>Retries Only</span>
                  {showRetriesOnly && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                </span>
              </label>

            </div>

            {/* Reset Stats Icon Button */}
            <button
              onClick={handleResetFilters}
              className={`p-1.5 border hover:text-white rounded-lg cursor-pointer transition-colors ${isLight ? 'bg-white border-zinc-300 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900' : 'bg-zinc-900 border-zinc-600/40 text-zinc-400 hover:bg-zinc-800'}`}
              title="Reset All Filters"
            >
              <RotateCcw size={12} />
            </button>

          </div>

        </div>
      </section>

      {/* Main card grid container */}
      <main className="grow max-w-7xl mx-auto px-6 py-8 w-full flex flex-col justify-between">

        {loading ? (
          /* Skeletons loader */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`rounded-xl p-5 min-h-47.5 animate-pulse flex flex-col justify-between border ${isLight ? 'bg-white border-zinc-250' : 'bg-bg-card border-zinc-805/85 border-zinc-800/80'}`}>
                <div className={`h-4 rounded-md w-1/3 mb-4 ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}></div>
                <div className="space-y-2 grow">
                  <div className={`h-4 rounded-md w-full ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}></div>
                  <div className={`h-4 rounded-md w-4/5 ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}></div>
                </div>
                <div className={`h-6 rounded-md w-1/4 mt-4 ${isLight ? 'bg-zinc-200' : 'bg-zinc-800'}`}></div>
              </div>
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (

          /* Empty state */
          <div className={`py-14 px-10 border rounded-xl flex flex-col items-center justify-center text-center max-w-md mx-auto my-12 shadow-2xl transition-colors ${isLight ? 'bg-white border-zinc-300' : 'bg-bg-card border-zinc-800/80'}`}>
            <AlertCircle className="text-zinc-400 mb-4" size={44} />
            <h4 className={`font-serif italic text-lg ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              No challenges match your filters
            </h4>
            <p className={`text-xs mt-2 font-sans leading-relaxed ${isLight ? 'text-zinc-550' : 'text-zinc-500'}`}>
              Try adjusting your genre categories, expanding difficulty parameters, or clearing the search query string directly to retry.
            </p>
            <button
              onClick={handleResetFilters}
              className={`mt-6 px-5 py-2.5 font-semibold rounded-lg text-xs transition-colors cursor-pointer font-mono uppercase tracking-wider ${isLight ? 'bg-zinc-950 text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'}`}
            >
              Reset Filters
            </button>
          </div>

        ) : (

          /* Grid list populated */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredQuestions.slice(0, itemsLimit).map(q => {
                // Find user progress row
                const progressRow = userProgress.find(p => p.question_id === q.id);
                const progressStatus: ProgressStatus = progressRow ? progressRow.status : 'none';

                // Determine if new (e.g., created recently, or mock newly marked)
                // const isNew = new Date(q.created_at).getTime() > new Date('2026-03-01').getTime();

                // Calculates 5 days ago in milliseconds and compares it dynamically
                const fiveDaysAgo = Date.now() - (5 * 24 * 60 * 60 * 1000);
                const isNew = new Date(q.created_at).getTime() > fiveDaysAgo;

                // Find user vote row
                const voteRow = userVotes.find(v => v.question_id === q.id);
                const currentUserVote = voteRow ? voteRow.vote : null;

                return (
                  <DotGridCard
                    key={q.id}
                    question={q}
                    progressStatus={progressStatus}
                    isNew={isNew}
                    onPlay={handlePlayQuestion}
                    currentUserVote={currentUserVote}
                    onToggleStatus={handleToggleQuestionStatus}
                    onToggleVote={handleToggleQuestionVote}

                  />
                );
              })}
            </div>

            {/* Load more controls */}
            {filteredQuestions.length > itemsLimit && (
              <div className="mt-12 flex flex-col items-center">
                {loadingMore ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1 justify-center">
                      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isLight ? 'bg-zinc-950' : 'bg-white'}`} style={{ animationDelay: '0ms' }}></span>
                      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isLight ? 'bg-zinc-950' : 'bg-white'}`} style={{ animationDelay: '150ms' }}></span>
                      <span className={`w-1.5 h-1.5 rounded-full animate-bounce ${isLight ? 'bg-zinc-950' : 'bg-white'}`} style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-500">
                      Syncing parameters...
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleLoadMore}
                    className={`px-6 py-2.5 border font-semibold rounded-lg text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap font-mono uppercase tracking-wider ${isLight ? 'bg-white border-zinc-300 text-zinc-900 hover:bg-zinc-100' : 'bg-zinc-800 border-zinc-800 text-zinc-105 hover:text-white hover:bg-zinc-700'}`}
                  >
                    Load More Questions
                  </button>
                )}
              </div>
            )}
          </div>

        )}

      </main>

      {/* FOOTER METRIC NOTE */}
      <footer className={`border-t py-6 px-6 text-[12px] font-mono tracking-widest mt-auto shrink-0 transition-colors duration-300 ${isLight
        ? 'bg-zinc-100 border-zinc-200 text-zinc-500'
        : 'bg-bg-base border-zinc-600 text-zinc-400'
        }`}>
        <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-center text-center sm:text-left">
          <p>&copy; 2026 Soham Banerjee. v1.0</p>
          <a
            href="https://play.sidelower.in"
            target="_blank"
            rel="noopener noreferrer"
            className={`tracking-widest font-bold transition-all duration-200 hover:underline underline-offset-4 ${isLight
              ? 'text-indigo-600 hover:text-indigo-800'
              : 'text-indigo-400/80 hover:text-indigo-300'
              }`}
          >
            PLAY.SIDELOWER.IN
          </a>
        </div>
      </footer>

      {/* OVERLAY MODAL: Question Sandbox Workspace */}
      {activeQuestion && (
        <WorkspaceModal
          question={activeQuestion}
          userId={userId}
          onClose={() => setActiveQuestion(null)}
          onProgressChange={loadDashboardData} // refresh filters/states
        />
      )}

      {/* OVERLAY MODAL: User Statistics dashboard */}
      {showStatsModal && profile && (
        <StatsModal
          profile={profile}
          onClose={() => setShowStatsModal(false)}
          onResetSuccess={loadDashboardData}
        />
      )}

    </div>
  );
};
