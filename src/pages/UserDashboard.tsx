import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Question, Category, UserProgress, Difficulty, ProgressStatus } from '../types';
import { db } from '../lib/db';
import { DotGridCard } from '../components/DotGridCard';
import { WorkspaceModal } from '../components/WorkspaceModal';
import { StatsModal } from '../components/StatsModal';
import { Search, LogOut, Award, SlidersHorizontal, RotateCcw, AlertCircle, X, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

export const UserDashboard: React.FC = () => {
  const { session, logout } = useAuth();
  const userId = session?.user?.id || '';
  const profile = session?.profile;

  // Data Store States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
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
      }
    } catch (err) {
      toast.error('Failed to sync library parameters.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
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

    // Show solved filter
    if (!showSolved && status === 'solved') return false;

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
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 flex flex-col select-none">

      {/* Dynamic Header Navbar in Sophisticated Dark */}
      <nav className="bg-[#050505] border-b border-zinc-850/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-serif italic font-black text-xl shadow-md">
              G.
            </div>
            <span className="font-serif italic text-2xl text-white tracking-tight hidden sm:inline">
              Guesstimate Tracker.
            </span>
          </div>

          {/* Search bar centered */}
          <div className="flex-grow max-w-lg relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-550">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setItemsLimit(12);
              }}
              placeholder="Search challenges by keyword or tags..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-800 rounded-xl outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-850 bg-zinc-900/40 text-white placeholder:text-zinc-650"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* User Profile Avatar & Logout */}
          <div className="flex items-center gap-3 shrink-0">

            {/* View Stats Button */}
            <button
              onClick={() => setShowStatsModal(true)}
              className="flex items-center gap-1 text-xs bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white font-semibold tracking-wider font-mono px-3 py-2 rounded-xl cursor-pointer transition-colors"
              title="Your Statistics"
            >
              <Award size={13} />
              <span className="hidden md:inline">Analytics</span>
            </button>

            {/* Profile Circle Icon representing dropdown click */}
            <button
              onClick={() => setShowStatsModal(true)}
              className="w-9 h-9 bg-white text-black flex items-center justify-center rounded-full text-xs font-bold font-serif shadow-md cursor-pointer hover:bg-zinc-200 transition-colors"
              title="Review Profile"
            >
              {profile?.first_name?.[0]?.toUpperCase() || 'P'}
            </button>

            {/* Log Out */}
            <button
              onClick={logout}
              className="p-2 border border-red-950/40 text-red-500 bg-red-950/10 hover:bg-red-950/30 rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>

          </div>
        </div>
      </nav>

      {/* Primary Filtering Ribbon Panel */}
      <section className="bg-[#0D0D0D] border-b border-zinc-850/80 py-3.5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Leftside category capsules */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-zinc-550 mr-1 shrink-0">Genre:</span>

            <button
              onClick={handleClearCategories}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all shrink-0 font-sans ${selectedCategories.length === 0
                ? 'bg-white text-black border border-transparent shadow-xs'
                : 'bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white hover:bg-zinc-800'
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
                    ? 'bg-white text-black border border-transparent shadow-xs'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-850 hover:text-white hover:bg-zinc-800'
                    }`}
                >
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* Rightside additional parameters */}
          <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-zinc-400 font-mono">

            {/* Difficulty Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-[10px] uppercase tracking-widest">Difficulty:</span>
              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => {
                    setSelectedDifficulty(e.target.value);
                    setItemsLimit(12);
                  }}
                  className="p-1.5 pr-6 bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-lg text-xs outline-none focus:border-zinc-500 appearance-none cursor-pointer hover:bg-zinc-850 transition-colors font-mono"
                >
                  <option value="All">All Levels</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
                <ChevronDown size={11} className="absolute right-2 top-2.5 text-zinc-550 pointer-events-none" />
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
                  className="w-3.5 h-3.5 bg-zinc-950 border-zinc-800 rounded-xs accent-white checked:bg-zinc-750 checked:border-transparent text-white focus:ring-0 cursor-pointer"
                />
                <span className="text-zinc-500 hover:text-zinc-300 font-mono text-[10px] uppercase tracking-widest">Show Solved</span>
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
                  className="w-3.5 h-3.5 bg-zinc-950 border-zinc-800 rounded-xs accent-white checked:bg-zinc-750 checked:border-transparent text-white focus:ring-0 cursor-pointer"
                />
                <span className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest">
                  <span>Retries Only</span>
                  {showRetriesOnly && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>}
                </span>
              </label>

            </div>

            {/* Reset Stats Icon Button */}
            <button
              onClick={handleResetFilters}
              className="p-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg cursor-pointer transition-colors"
              title="Reset All Filters"
            >
              <RotateCcw size={12} />
            </button>

          </div>

        </div>
      </section>

      {/* Main card grid container */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-8 w-full flex flex-col justify-between">

        {loading ? (
          /* Skeletons loader */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-[#121212] rounded-xl p-5 min-h-[190px] animate-pulse flex flex-col justify-between border border-zinc-800/80">
                <div className="h-4 bg-zinc-800 rounded-md w-1/3 mb-4"></div>
                <div className="space-y-2 flex-grow">
                  <div className="h-4 bg-zinc-800 rounded-md w-full"></div>
                  <div className="h-4 bg-zinc-800 rounded-md w-4/5"></div>
                </div>
                <div className="h-6 bg-zinc-800 rounded-md w-1/4 mt-4"></div>
              </div>
            ))}
          </div>
        ) : filteredQuestions.length === 0 ? (

          /* Empty state */
          <div className="bg-[#121212] py-14 px-10 border border-zinc-800/80 rounded-xl flex flex-col items-center justify-center text-center max-w-md mx-auto my-12 shadow-2xl">
            <AlertCircle className="text-zinc-650 mb-4" size={44} />
            <h4 className="font-serif italic text-lg text-white">
              No challenges match your filters
            </h4>
            <p className="text-xs text-zinc-500 mt-2 font-sans leading-relaxed">
              Try adjusting your genre categories, expanding difficulty parameters, or clearing the search query string directly to retry.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-6 px-5 py-2.5 bg-white text-black font-semibold rounded-lg text-xs transition-colors cursor-pointer font-mono uppercase tracking-wider hover:bg-zinc-200"
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
                const isNew = new Date(q.created_at).getTime() > new Date('2026-03-01').getTime();

                return (
                  <DotGridCard
                    key={q.id}
                    question={q}
                    progressStatus={progressStatus}
                    isNew={isNew}
                    onPlay={handlePlayQuestion}
                  />
                );
              })}
            </div>

            {/* Load more controls matching PRD caption tags */}
            {filteredQuestions.length > itemsLimit && (
              <div className="mt-12 flex flex-col items-center">
                {loadingMore ? (
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-1 justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-mono text-zinc-550">
                      Syncing parameters...
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleLoadMore}
                    className="px-6 py-2.5 bg-[#121212] hover:bg-zinc-800 border border-zinc-800 text-zinc-105 hover:text-white font-semibold rounded-lg text-xs transition-all shadow-sm cursor-pointer whitespace-nowrap font-mono uppercase tracking-wider"
                  >
                    Load More Calculations
                  </button>
                )}
              </div>
            )}
          </div>

        )}

      </main>

      {/* FOOTER METRIC NOTE */}
      <footer className="bg-[#050505] border-t border-zinc-850/80 py-4 px-6 text-center text-[9px] text-zinc-650 font-mono tracking-widest mt-12 shrink-0">
        POWERED BY GUESSTIMATE DB ENGINE . PERSISTING METRICS SAFELY
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
