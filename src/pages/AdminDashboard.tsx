import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Question, Category, Profile, UserProgress, Difficulty, QuestionStatus } from '../types';
import { db } from '../lib/db';
import { ContentStudioModal } from '../components/ContentStudioModal';
import { UserStudioModal } from '../components/UserStudioModal';
import {
  Users, BarChart2, ShieldAlert, Edit, Trash2, Award, Plus,
  Search, SlidersHorizontal, RotateCcw, AlertCircle, LogOut, CheckCircle, RefreshCw, BarChart3, ChevronLeft, ChevronRight, HelpCircle, X
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const { session, logout } = useAuth();
  const adminName = session?.profile?.first_name || 'Admin';

  // Navigation tab states
  const [activeTab, setActiveTab] = useState<'guesstimates' | 'users'>('guesstimates');

  // Shared Data store
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allProgress, setAllProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination states
  const [qPage, setQPage] = useState<number>(1);
  const [uPage, setUPage] = useState<number>(1);
  const rowsPerPage = 10; // Page size of 10 rows matching responsive parameters

  // Filters for Guesstimates Tab
  const [qSearch, setQSearch] = useState<string>('');
  const [qCategoryFilter, setQCategoryFilter] = useState<string>('All');
  const [qDifficultyFilter, setQDifficultyFilter] = useState<string>('All');

  // Filters for Users Tab
  const [uSearch, setUSearch] = useState<string>('');
  const [uSortBy, setUSortBy] = useState<'newest' | 'oldest'>('newest');

  // Modal State machines
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [showQModal, setShowQModal] = useState<boolean>(false);

  const [selectedUserProfile, setSelectedUserProfile] = useState<Profile | null>(null);
  const [showUModal, setShowUModal] = useState<boolean>(false);

  // Questionnaire read-only stats modal trigger
  const [readOnlyQStats, setReadOnlyQStats] = useState<Question | null>(null);

  // Specific user statistics summary
  const [readOnlyUStats, setReadOnlyUStats] = useState<Profile | null>(null);

  const loadAdminMetrics = async () => {
    try {
      // Load everything including drafts
      const qList = await db.getQuestions(true);
      const catList = await db.getCategories();
      const profList = await db.getProfiles();
      const progList = await db.getAllProgress();

      setQuestions(qList);
      setCategories(catList);
      setProfiles(profList);
      setAllProgress(progList);
    } catch (err) {
      toast.error('Failed to compile administration reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminMetrics();
  }, []);

  const handleResetQFilters = () => {
    setQSearch('');
    setQCategoryFilter('All');
    setQDifficultyFilter('All');
    setQPage(1);
    toast.success('Guesstimate database filters reset.');
  };

  const handleResetUFilters = () => {
    setUSearch('');
    setUSortBy('newest');
    setUPage(1);
    toast.success('User profiles filters reset.');
  };

  // ==========================================
  // FILTERED COLLECTIONS CALCULATIONS
  // ==========================================

  // Guesstimates filtration
  const filteredQuestions = questions.filter(q => {
    if (qSearch && !q.question.toLowerCase().includes(qSearch.toLowerCase())) return false;
    if (qCategoryFilter !== 'All' && q.category_id !== qCategoryFilter) return false;
    if (qDifficultyFilter !== 'All' && q.difficulty !== qDifficultyFilter) return false;
    return true;
  });

  // User list filtration and sorting
  const filteredProfiles = profiles.filter(p => {
    if (!uSearch) return true;
    const matchName = `${p.first_name} ${p.last_name}`.toLowerCase().includes(uSearch.toLowerCase());
    const matchEmail = p.email.toLowerCase().includes(uSearch.toLowerCase());
    return matchName || matchEmail;
  }).sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return uSortBy === 'newest' ? timeB - timeA : timeA - timeB;
  });

  // ==========================================
  // QUESTION METRICS MATHS
  // ==========================================
  const totalQuestionsCount = questions.length;
  const categoriesCount = categories.length;
  const publishedQuestionsCount = questions.filter(q => q.status === 'Published').length;
  const draftQuestionsCount = totalQuestionsCount - publishedQuestionsCount;

  const easyQCount = questions.filter(q => q.difficulty === 'Easy').length;
  const mediumQCount = questions.filter(q => q.difficulty === 'Medium').length;
  const hardQCount = questions.filter(q => q.difficulty === 'Hard').length;

  // ==========================================
  // USER METRICS MATHS
  // ==========================================
  const totalUsersCount = profiles.length;
  const globalSolvedCount = allProgress.filter(p => p.status === 'solved').length;
  const globalRetryCount = allProgress.filter(p => p.status === 'retry').length;

  // successRate Formula from PRD:
  // (Total Solved across all users) / (Total Published Questions * Total Users) * 100
  const denominator = publishedQuestionsCount * totalUsersCount;
  const successRate = denominator > 0
    ? Math.round((globalSolvedCount / denominator) * 100)
    : 0;

  // ==========================================
  // TOP 5 REPORTS GENERATIONS
  // ==========================================

  // Top 5 Questions by Solve Count
  const topQuestions = [...questions]
    .map(q => {
      const qSolved = allProgress.filter(p => p.question_id === q.id && p.status === 'solved').length;
      const qRetry = allProgress.filter(p => p.question_id === q.id && p.status === 'retry').length;
      return { ...q, solvedCount: qSolved, retryCount: qRetry };
    })
    .sort((a, b) => b.solvedCount - a.solvedCount)
    .slice(0, 5);

  // Top 5 Users by Solve Count
  const topUsers = [...profiles]
    .map(u => {
      const uSolved = allProgress.filter(p => p.user_id === u.id && p.status === 'solved').length;
      const uRetry = allProgress.filter(p => p.user_id === u.id && p.status === 'retry').length;
      return { ...u, solvedCount: uSolved, retryCount: uRetry };
    })
    .sort((a, b) => b.solvedCount - a.solvedCount)
    .slice(0, 5);

  // ==========================================
  // PAGINATION SUB-COMPUTATIONS
  // ==========================================
  const qTotalPages = Math.ceil(filteredQuestions.length / rowsPerPage) || 1;
  const paginatedQuestions = filteredQuestions.slice((qPage - 1) * rowsPerPage, qPage * rowsPerPage);

  const uTotalPages = Math.ceil(filteredProfiles.length / rowsPerPage) || 1;
  const paginatedProfiles = filteredProfiles.slice((uPage - 1) * rowsPerPage, uPage * rowsPerPage);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-300 flex flex-col select-none">

      {/* Header bar */}
      <nav className="bg-[#050505] border-b border-zinc-850 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black font-serif italic font-black text-xl shadow-md">
                G.
              </div>
              <span className="font-serif italic text-xl text-white">
                Hello, {adminName}!
              </span>
            </div>

            {/* Tab Swiffer */}
            <div className="bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl flex ml-4 text-xs font-semibold">
              <button
                onClick={() => setActiveTab('guesstimates')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'guesstimates'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-zinc-550 hover:text-white'
                  }`}
              >
                Guesstimates Library
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'users'
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-zinc-550 hover:text-white'
                  }`}
              >
                Practitioners Management
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20 rounded-md text-[9px] uppercase font-mono px-2 py-0.5 font-bold">
              ADMIN CONTROL PANEL
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-xs text-red-500 font-semibold border border-red-950/40 bg-red-950/10 hover:bg-red-950/30 px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors font-mono"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>

        </div>
      </nav>

      {/* Main dashboard view container */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-8 w-full">

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-80">
            <div className="w-10 h-10 rounded-full border-4 border-[#1A2E6C] border-t-transparent animate-spin mb-4"></div>
            <span className="text-sm font-semibold text-gray-400 font-mono">LOADING CONTROL DESKS...</span>
          </div>
        ) : activeTab === 'guesstimates' ? (

          /* ==========================================================
             GUESSTIMATES MANAGEMENT DOMAIN
             ========================================================== */
          <div className="flex flex-col gap-6">

            {/* Quick Metrics ribbon of Guesstimates */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-lg">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Total Challenges</span>
                <span className="font-serif italic text-2xl text-white block mt-1">{totalQuestionsCount}</span>
                <span className="text-[10px] text-zinc-600 block mt-1 font-mono">Global stored index</span>
              </div>
              <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-lg">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Categories Created</span>
                <span className="font-serif italic text-2xl text-white block mt-1">{categoriesCount}</span>
                <span className="text-[10px] text-zinc-600 block mt-1 font-mono">Dynamic classifications</span>
              </div>
              <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-lg">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Difficulty Split</span>
                <span className="font-serif italic text-lg text-zinc-100 block mt-2.5 truncate font-mono">
                  {easyQCount}E / {mediumQCount}M / {hardQCount}H
                </span>
              </div>
              <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-lg">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Publishing Indices</span>
                <span className="font-serif italic text-2xl text-emerald-500 block mt-1">
                  {publishedQuestionsCount} <span className="text-zinc-500 text-xs font-mono font-normal">/ {draftQuestionsCount} Draft</span>
                </span>
              </div>
            </div>

            {/* Database header search filters and add actions */}
            <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">

              <div className="flex flex-wrap items-center gap-3 flex-grow">
                {/* Search */}
                <div className="relative flex-grow max-w-sm">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={qSearch}
                    onChange={(e) => { setQSearch(e.target.value); setQPage(1); }}
                    placeholder="Search questions text..."
                    className="w-full pl-8 pr-3 py-2 border border-zinc-800 rounded-lg outline-none bg-zinc-950 text-white placeholder:text-zinc-650 focus:border-zinc-500"
                  />
                  {qSearch && (
                    <button onClick={() => setQSearch('')} className="absolute right-2.5 top-2.5 text-zinc-550 hover:text-white">×</button>
                  )}
                </div>

                {/* Category select */}
                <select
                  value={qCategoryFilter}
                  onChange={(e) => { setQCategoryFilter(e.target.value); setQPage(1); }}
                  className="p-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-300 outline-none focus:border-zinc-500 max-w-[150px] cursor-pointer font-mono"
                >
                  <option value="All">All Categories</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Difficulty selector */}
                <select
                  value={qDifficultyFilter}
                  onChange={(e) => { setQDifficultyFilter(e.target.value); setQPage(1); }}
                  className="p-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-300 outline-none focus:border-zinc-500 cursor-pointer font-mono"
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                {/* Clear */}
                <button
                  onClick={handleResetQFilters}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                  title="Reset filters"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Add New CTA */}
              <button
                onClick={() => {
                  setSelectedQuestion(null); // Add Mode
                  setShowQModal(true);
                }}
                className="py-2.5 px-4 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0 transition-all font-mono uppercase tracking-wider text-xs"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Add Question</span>
              </button>

            </div>
            {/* Questions Inventory Table */}
            <div className="bg-[#121212] border border-zinc-850 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#050505] border-b border-zinc-850 text-xs font-bold text-zinc-500 uppercase font-mono">
                    <tr>
                      <th className="px-6 py-4">Question Prompt</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Difficulty</th>
                      <th className="px-6 py-4">Attempts</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 font-sans text-zinc-300">
                    {paginatedQuestions.map(q => {
                      // Attempts = solved + retry counts dynamically combined across progress list
                      const qProgress = allProgress.filter(p => p.question_id === q.id);
                      const qAttemptsCount = qProgress.filter(p => p.status === 'solved' || p.status === 'retry').length;

                      const getDiffLabelStyle = (d: string) => {
                        if (d === 'Easy') return 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20';
                        if (d === 'Medium') return 'text-amber-500 bg-amber-500/10 border border-amber-500/20';
                        return 'text-red-500 bg-red-500/10 border border-red-500/20';
                      };

                      return (
                        <tr key={q.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="px-6 py-4 max-w-[320px] truncate font-medium text-white" title={q.question}>
                            {q.question}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-zinc-450">{q.category_name}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md ${getDiffLabelStyle(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs font-bold text-zinc-350">{qAttemptsCount}</td>
                          <td className="px-6 py-4">
                            {q.status === 'Published' ? (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold font-mono">
                                Published
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-md font-bold font-mono">
                                Draft
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setSelectedQuestion(q);
                                  setShowQModal(true);
                                }}
                                className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-md font-semibold text-xs transition-colors cursor-pointer"
                                title="Edit Question"
                              >
                                Edit
                              </button>

                              {/* Stats Report */}
                              <button
                                onClick={() => setReadOnlyQStats(q)}
                                className="p-1 px-2 text-zinc-400 hover:text-white hover:underline text-xs font-bold cursor-pointer font-mono"
                                title="Platform Metrics"
                              >
                                Stats
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedQuestions.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center p-12 text-zinc-550 italic font-mono">
                          No questions matching current system filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table pagination control deck */}
              {filteredQuestions.length > rowsPerPage && (
                <div className="bg-[#050505] border-t border-zinc-850 px-6 py-3 flex items-center justify-between text-xs text-zinc-500 font-semibold font-mono">
                  <span>
                    Showing {(qPage - 1) * rowsPerPage + 1} to {Math.min(qPage * rowsPerPage, filteredQuestions.length)} of {filteredQuestions.length} entries
                  </span>

                  {/* Steppers paging joiner */}
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => setQPage(prev => Math.max(1, prev - 1))}
                      disabled={qPage === 1}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-400 rounded-md disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: qTotalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQPage(idx + 1)}
                        className={`px-2.5 py-1 text-xs rounded-md ${qPage === idx + 1
                            ? 'bg-white text-black font-semibold font-mono'
                            : 'text-zinc-400 hover:bg-zinc-800'
                          }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setQPage(prev => Math.min(qTotalPages, prev + 1))}
                      disabled={qPage === qTotalPages}
                      className="p-1.5 hover:bg-zinc-800 text-zinc-400 rounded-md disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        ) : (

          /* ==========================================================
             PRACTITIONERS / USERS MANAGEMENT TAB
             ========================================================== */
          <div className="flex flex-col gap-6">

            {/* Quick Metrics ribbon of Users */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-lg">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Total Users</span>
                <span className="font-serif italic text-2xl text-white block mt-1">{totalUsersCount}</span>
                <span className="text-[10px] text-zinc-650 block mt-1 font-mono">Practitioners registered</span>
              </div>
              <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-lg">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Mean Success Rate</span>
                <span className="font-serif italic text-2xl text-emerald-500 block mt-1">{successRate}%</span>
                <span className="text-[10px] text-zinc-650 block mt-1 font-mono">Platform completion metric</span>
              </div>
              <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-lg">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Global Solved Flags</span>
                <span className="font-serif italic text-2xl text-emerald-500 block mt-1">{globalSolvedCount}</span>
                <span className="text-[10px] text-zinc-650 block mt-1 font-mono">Aggregated completes</span>
              </div>
              <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-lg">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Global Retry Backlog</span>
                <span className="font-serif italic text-2xl text-amber-500 block mt-1">{globalRetryCount}</span>
                <span className="text-[10px] text-zinc-650 block mt-1 font-mono">Assisted backlog queue</span>
              </div>
            </div>
            {/* Top 5 Dynamic Leaderboard grid lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Component A: Top 5 Solve Questions */}
              <div className="bg-[#121212] border border-zinc-850/80 rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-1.5 mb-4 text-zinc-400">
                  <BarChart3 size={15} />
                  <span className="font-serif italic font-semibold text-sm tracking-wide text-white">Top Guesstimates by Completes</span>
                </div>
                <div className="divide-y divide-zinc-850 font-sans text-xs text-zinc-300">
                  {topQuestions.map((q, i) => (
                    <div key={q.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 max-w-[70%]">
                        <span className="font-mono text-zinc-600 font-bold">{i + 1}.</span>
                        <span className="truncate font-semibold text-zinc-100 font-serif italic" title={q.question}>{q.question}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px]">
                        <span className="text-emerald-500 font-bold">{q.solvedCount} resolved</span>
                        <span className="text-zinc-500">{q.retryCount} retry</span>
                      </div>
                    </div>
                  ))}
                  {topQuestions.length === 0 && <span className="text-zinc-500 italic block py-4 text-center font-mono">No solve records logged yet.</span>}
                </div>
              </div>

              {/* Component B: Top 5 Active Practitioners */}
              <div className="bg-[#121212] border border-zinc-850/80 rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-1.5 mb-4 text-zinc-400">
                  <Award size={15} />
                  <span className="font-serif italic font-semibold text-sm tracking-wide text-white">Top Performing Users</span>
                </div>
                <div className="divide-y divide-zinc-850 font-sans text-xs text-zinc-300">
                  {topUsers.map((u, i) => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-600 font-bold">{i + 1}.</span>
                        <span className="font-semibold text-zinc-100 font-serif italic">{u.first_name} {u.last_name}</span>
                        {u.role === 'admin' && <span className="bg-zinc-850 text-zinc-400 font-bold px-1.5 text-[9px] rounded-md font-mono scale-90">ADMIN</span>}
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px]">
                        <span className="text-emerald-500 font-bold">{u.solvedCount} Solved</span>
                        <span className="text-zinc-500">{u.retryCount} Retry</span>
                      </div>
                    </div>
                  ))}
                  {topUsers.length === 0 && <span className="text-zinc-500 italic block py-4 text-center font-mono">No active users recorded.</span>}
                </div>
              </div>

            </div>

            {/* Filters Row of Users */}
            <div className="bg-[#121212] p-4 rounded-xl border border-zinc-850/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">

              <div className="flex flex-wrap items-center gap-3 flex-grow/1">
                {/* Search */}
                <div className="relative flex-grow max-w-sm">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={uSearch}
                    onChange={(e) => { setUSearch(e.target.value); setUPage(1); }}
                    placeholder="Search by practitioner name or email..."
                    className="w-full pl-8 pr-3 py-2 border border-zinc-800 rounded-lg outline-none bg-zinc-950 text-white placeholder:text-zinc-650 focus:border-zinc-500 font-mono text-xs"
                  />
                  {uSearch && (
                    <button onClick={() => setUSearch('')} className="absolute right-2.5 top-2.5 text-zinc-550 hover:text-white">×</button>
                  )}
                </div>

                {/* Sort dropdown */}
                <select
                  value={uSortBy}
                  onChange={(e) => { setUSortBy(e.target.value as any); setUPage(1); }}
                  className="p-2 border border-zinc-800 rounded-lg bg-zinc-950 text-zinc-300 outline-none focus:border-zinc-500 cursor-pointer text-xs font-mono"
                >
                  <option value="newest">Sort by Newest Account</option>
                  <option value="oldest">Sort by Oldest Account</option>
                </select>

                <button
                  onClick={handleResetUFilters}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                  title="Reset filters"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Add User CTA */}
              <button
                onClick={() => {
                  setSelectedUserProfile(null); // Add Mode
                  setShowUModal(true);
                }}
                className="py-2.5 px-4 bg-white hover:bg-zinc-200 text-black font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0 transition-all font-mono uppercase tracking-wider text-xs"
              >
                <Plus size={14} strokeWidth={3} />
                <span>Add User</span>
              </button>

            </div>

            {/* Users Comprehensive Table representation with Completion sliders */}
            <div className="bg-[#121212] border border-zinc-850 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#050505] border-b border-zinc-850 text-xs font-bold text-zinc-500 uppercase font-mono">
                    <tr>
                      <th className="px-6 py-4">Practitioner Name</th>
                      <th className="px-6 py-4">Email Coordinates</th>
                      <th className="px-6 py-4">Easy Solves</th>
                      <th className="px-6 py-4">Med Solves</th>
                      <th className="px-6 py-4">Hard Solves</th>
                      <th className="px-6 py-4">Solved</th>
                      <th className="px-6 py-4">Retries</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850 font-sans text-zinc-300 text-xs">
                    {paginatedProfiles.map(u => {
                      const uProgress = allProgress.filter(p => p.user_id === u.id);

                      const uSolved = uProgress.filter(p => p.status === 'solved');
                      const uRetryCount = uProgress.filter(p => p.status === 'retry').length;

                      // Easy solves ratio
                      const easyTotal = questions.filter(q => q.difficulty === 'Easy');
                      const easySolved = uSolved.filter(p => easyTotal.some(q => q.id === p.question_id)).length;
                      const easyPercent = easyTotal.length > 0 ? Math.round((easySolved / easyTotal.length) * 100) : 0;

                      // Medium Solves ratio
                      const medTotal = questions.filter(q => q.difficulty === 'Medium');
                      const medSolved = uSolved.filter(p => medTotal.some(q => q.id === p.question_id)).length;
                      const medPercent = medTotal.length > 0 ? Math.round((medSolved / medTotal.length) * 100) : 0;

                      // Hard Solves ratio
                      const hardTotal = questions.filter(q => q.difficulty === 'Hard');
                      const hardSolved = uSolved.filter(p => hardTotal.some(q => q.id === p.question_id)).length;
                      const hardPercent = hardTotal.length > 0 ? Math.round((hardSolved / hardTotal.length) * 100) : 0;

                      return (
                        <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="px-6 py-4 font-semibold text-white">
                            {u.first_name} {u.last_name}
                            {u.role === 'admin' && <span className="ml-1.5 text-[9px] bg-zinc-850 text-zinc-400 py-0.5 px-1.5 rounded-sm font-mono font-bold">ADMIN</span>}
                          </td>
                          <td className="px-6 py-4 text-zinc-400 font-mono text-[11px] font-semibold uppercase">{u.email}</td>

                          {/* Easy Progress slide */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 w-24">
                              <div className="flex-grow bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-900">
                                <div className="bg-emerald-500 h-full" style={{ width: `${easyPercent}%` }}></div>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-500 font-bold">{easyPercent}%</span>
                            </div>
                          </td>

                          {/* Med Progress slide */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 w-24">
                              <div className="flex-grow bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-900">
                                <div className="bg-[#D97706] h-full" style={{ width: `${medPercent}%` }}></div>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-500 font-bold">{medPercent}%</span>
                            </div>
                          </td>

                          {/* Hard Progress slide */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 w-24">
                              <div className="flex-grow bg-zinc-950 h-1 rounded-full overflow-hidden border border-zinc-900">
                                <div className="bg-red-500 h-full" style={{ width: `${hardPercent}%` }}></div>
                              </div>
                              <span className="font-mono text-[10px] text-zinc-500 font-bold">{hardPercent}%</span>
                            </div>
                          </td>

                          <td className="px-6 py-4 font-mono font-bold text-emerald-500">{uSolved.length}</td>
                          <td className="px-6 py-4 font-mono font-semibold text-amber-500">{uRetryCount}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit credentials / reset */}
                              <button
                                onClick={() => {
                                  setSelectedUserProfile(u);
                                  setShowUModal(true);
                                }}
                                className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-350 rounded-md font-bold text-[10px] transition-colors cursor-pointer font-mono"
                                title="Edit Practitioner"
                              >
                                Edit
                              </button>

                              {/* Stats Report summary */}
                              <button
                                onClick={() => setReadOnlyUStats(u)}
                                className="p-1 px-2 text-zinc-400 hover:text-white hover:underline text-[10px] font-bold cursor-pointer font-mono"
                              >
                                Stats
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {paginatedProfiles.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center p-12 text-zinc-550 italic font-mono">
                          No users matching search filters found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Users footer pagination sliders */}
              {filteredProfiles.length > rowsPerPage && (
                <div className="bg-[#050505] border-t border-zinc-850 px-6 py-3 flex items-center justify-between text-xs text-zinc-500 font-semibold font-mono">
                  <span>
                    Showing {(uPage - 1) * rowsPerPage + 1} to {Math.min(uPage * rowsPerPage, filteredProfiles.length)} of {filteredProfiles.length} entries
                  </span>

                  {/* Steppers */}
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
                    <button
                      onClick={() => setUPage(prev => Math.max(1, prev - 1))}
                      disabled={uPage === 1}
                      className="p-1.5 hover:bg-zinc-805 text-zinc-400 rounded-md disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: uTotalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setUPage(idx + 1)}
                        className={`px-2.5 py-1 text-xs rounded-md ${uPage === idx + 1
                            ? 'bg-white text-black font-semibold font-mono'
                            : 'text-zinc-400 hover:bg-zinc-800'
                          }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setUPage(prev => Math.min(uTotalPages, prev + 1))}
                      disabled={uPage === uTotalPages}
                      className="p-1.5 hover:bg-zinc-805 text-zinc-400 rounded-md disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        )}

      </main>

      {/* FOOTER ADVERTISEMENT */}
      <footer className="bg-[#0c0c0c] border-t border-zinc-850 py-6 text-center text-[10px] text-zinc-550 font-mono mt-12">
        CONTROL DECK INTERFACE SYSTEM &copy; 2026 GUESSTIMATE DB METRICS
      </footer>

      {/* ADMINISTRATIVE QUESTION ADD/EDIT CONTENT STUDIO MODAL */}
      {showQModal && (
        <ContentStudioModal
          question={selectedQuestion}
          onClose={() => setShowQModal(false)}
          onSaveSuccess={loadAdminMetrics}
          onDeleteSuccess={loadAdminMetrics}
        />
      )}

      {/* ADMINISTRATIVE USER ADD/EDIT STUDIO MODAL */}
      {showUModal && (
        <UserStudioModal
          userProfile={selectedUserProfile}
          onClose={() => setShowUModal(false)}
          onSaveSuccess={loadAdminMetrics}
          onDeleteSuccess={loadAdminMetrics}
        />
      )}

      {/* READ-ONLY OVERLAY MODAL: Question Statistics breakdown */}
      {readOnlyQStats && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col relative text-zinc-350">
            <button onClick={() => setReadOnlyQStats(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer transition-colors">
              <X size={18} />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold mb-2 uppercase font-mono tracking-wider">
              <BarChart2 size={14} />
              <span>Guesstimate Statistics</span>
            </div>

            <p className="font-display font-medium text-white text-base leading-relaxed border-b border-zinc-850 pb-4 mb-4">
              "{readOnlyQStats.question}"
            </p>

            {/* Compute details */}
            {(() => {
              const qProg = allProgress.filter(p => p.question_id === readOnlyQStats.id);
              const solves = qProg.filter(p => p.status === 'solved').length;
              const retries = qProg.filter(p => p.status === 'retry').length;

              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center text-xs">
                    <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                      <span className="text-[10px] uppercase font-bold text-emerald-500 font-mono tracking-wider block">Total Solved</span>
                      <span className="text-xl font-serif italic text-emerald-400 block mt-1">{solves}</span>
                    </div>
                    <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      <span className="text-[10px] uppercase font-bold text-amber-500 font-mono tracking-wider block">Total Retries</span>
                      <span className="text-xl font-serif italic text-amber-400 block mt-1">{retries}</span>
                    </div>
                    <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-850 col-span-2">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider block">Upvotes / Downvotes Balance</span>
                      <span className="text-sm font-mono text-zinc-300 block mt-1">
                        👍 {readOnlyQStats.upvotes} / 👎 {readOnlyQStats.downvotes}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setReadOnlyQStats(null)}
                    className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider rounded-lg mt-4 cursor-pointer transition-colors font-mono"
                  >
                    Close Statistics
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* READ-ONLY OVERLAY MODAL: Specific Practitioner Stats breakdown */}
      {readOnlyUStats && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col relative max-h-[90vh] text-zinc-350">
            <button onClick={() => setReadOnlyUStats(null)} className="absolute top-4 right-4 text-zinc-500 hover:text-white cursor-pointer transition-colors">
              <X size={18} />
            </button>

            <div className="text-center pb-4 border-b border-zinc-850 mb-4">
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center rounded-full text-sm font-bold mx-auto mb-2 font-mono">
                {readOnlyUStats.first_name[0].toUpperCase()}{readOnlyUStats.last_name[0].toUpperCase()}
              </div>
              <h4 className="font-serif italic font-medium text-white text-lg">
                {readOnlyUStats.first_name} {readOnlyUStats.last_name}
              </h4>
              <span className="text-[10px] text-zinc-455 font-mono uppercase tracking-widest block mt-1">{readOnlyUStats.email}</span>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold block">Individual Performance Card</span>

              {(() => {
                const uProg = allProgress.filter(p => p.user_id === readOnlyUStats.id);
                const solves = uProg.filter(p => p.status === 'solved').length;
                const retries = uProg.filter(p => p.status === 'retry').length;

                return (
                  <div className="space-y-4 text-xs font-sans text-zinc-300">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-500 uppercase font-mono font-bold block">SOLVED CARD</span>
                        <span className="text-xl font-serif italic text-emerald-450 block mt-1">{solves}</span>
                      </div>
                      <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                        <span className="text-[10px] text-amber-500 uppercase font-mono font-bold block">RETRY CAP</span>
                        <span className="text-xl font-serif italic text-amber-450 block mt-1">{retries}</span>
                      </div>
                    </div>

                    <div className="border border-zinc-850 bg-zinc-950 p-3.5 rounded-lg space-y-3">
                      <span className="font-bold text-zinc-500 font-mono uppercase block text-[10px] tracking-wider">Category Performance Matrix</span>
                      {categories.map(cat => {
                        const catQuestions = questions.filter(q => q.category_id === cat.id);
                        const catSolved = uProg.filter(p => p.status === 'solved' && catQuestions.some(q => q.id === p.question_id)).length;
                        const ratio = catQuestions.length > 0 ? Math.round((catSolved / catQuestions.length) * 100) : 0;

                        return (
                          <div key={cat.id} className="flex items-center justify-between text-[11px] font-mono">
                            <span className="font-semibold text-zinc-300 font-serif italic">{cat.name}</span>
                            <span className="text-zinc-500 font-bold">{catSolved}/{catQuestions.length} ({ratio}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>

            <button
              onClick={() => setReadOnlyUStats(null)}
              className="w-full py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-bold uppercase tracking-wider rounded-lg mt-6 cursor-pointer font-mono"
            >
              Close Performance Report
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
