import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Question, Category, Profile, UserProgress, Difficulty, QuestionStatus } from '../types';
import { db } from '../lib/db';
import { ContentStudioModal } from '../components/ContentStudioModal';
import { UserStudioModal } from '../components/UserStudioModal';
import { BulkUploadModal } from '../components/BulkUploadModal';
import {
  Users, BarChart2, ShieldAlert, Edit, Trash2, Award, Plus, Upload,
  Search, SlidersHorizontal, RotateCcw, AlertCircle, LogOut, CheckCircle, RefreshCw, BarChart3, ChevronLeft, ChevronRight, HelpCircle, X,
  Sun, Moon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export const AdminDashboard: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';
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
  const [showBulkUploadModal, setShowBulkUploadModal] = useState<boolean>(false);

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
    <div className={`min-h-screen transition-colors duration-300 flex flex-col select-none ${isLight ? 'bg-[#FAFAFB] text-zinc-700' : 'bg-[#0A0A0A] text-zinc-300'}`}>

      {/* Header bar */}
      <nav className={`sticky top-0 z-40 transition-colors duration-300 border-b ${isLight ? 'bg-white border-zinc-200' : 'bg-[#050505] border-zinc-850'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-serif italic font-black text-xl shadow-md transition-colors ${isLight ? 'bg-zinc-950 text-white' : 'bg-white text-black'}`}>
                G.
              </div>
              <span className={`font-serif italic text-xl transition-colors ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                Hello, {adminName}!
              </span>
            </div>

            {/* Tab Swiffer */}
            <div className={`p-0.5 rounded-xl flex text-xs font-semibold transition-colors border ${isLight ? 'bg-zinc-100 border-zinc-250' : 'bg-zinc-900 border-zinc-800'}`}>
              <button
                onClick={() => setActiveTab('guesstimates')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'guesstimates'
                  ? (isLight ? 'bg-zinc-900 text-white font-semibold shadow-sm' : 'bg-white text-black font-semibold shadow-sm')
                  : (isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white')
                  }`}
              >
                Guesstimates Library
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${activeTab === 'users'
                  ? (isLight ? 'bg-zinc-900 text-white font-semibold shadow-sm' : 'bg-white text-black font-semibold shadow-sm')
                  : (isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white')
                  }`}
              >
                Users Management
              </button>
            </div>
          </div>

          <div className="ml-4 flex items-center gap-3">
            {/* <span className="bg-[#D97706]/10 text-[#D97706] border border-[#D97706]/20 rounded-md text-[9px] uppercase font-mono px-2 py-0.5 font-bold">
              ADMIN CONTROL PANEL
            </span> */}
            <button
              onClick={toggleTheme}
              className={`p-2 border transition-all duration-200 rounded-xl cursor-pointer ${isLight
                ? 'border-zinc-200 text-zinc-600 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900'
                : 'border-zinc-800 text-zinc-400 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 hover:text-amber-400'
                }`}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <button
              onClick={logout}
              className={`p-2 border rounded-xl transition-all duration-200 cursor-pointer ${isLight
                ? 'bg-zinc-100 border-zinc-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-zinc-600'
                : 'bg-zinc-900/50 border-zinc-800 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 text-zinc-400'
                }`}
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>

        </div>
      </nav>

      {/* Main dashboard view container */}
      <main className="flex-grow max-w-7xl mx-auto px-6 py-8 w-full">

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-80">
            <div className={`w-10 h-10 rounded-full border-4 border-t-transparent animate-spin mb-4 ${isLight ? 'border-zinc-900' : 'border-white'}`}></div>
            <span className={`text-sm font-semibold font-mono ${isLight ? 'text-zinc-500' : 'text-gray-400'}`}>LOADING CONTROL DESKS...</span>
          </div>
        ) : activeTab === 'guesstimates' ? (

          /* ==========================================================
             Guesstimates / GUESSTIMATES MANAGEMENT TAB
             ========================================================== */
          <div className="flex flex-col gap-6">
            {/* Quick Metrics ribbon of Questions */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Card 1: Total Questions - Indigo */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${isLight
                ? 'bg-zinc-50 border-zinc-200 shadow-sm'
                : 'bg-[#121214] border-zinc-800 shadow-lg shadow-black/50 dark:shadow-indigo-500/[0.02]'
                }`}>
                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Total Questions</span>
                <span className={`font-serif font-bold italic text-2xl block mt-1 ${isLight ? 'text-zinc-950' : 'text-indigo-400'}`}>
                  {totalQuestionsCount}
                </span>
              </div>

              {/* Card 2: Categories - Purple */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${isLight
                ? 'bg-purple-50/40 border-purple-100 shadow-sm'
                : 'bg-[#121017] border-purple-950/60 shadow-lg shadow-black/50 dark:shadow-purple-500/[0.02]'
                }`}>
                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Categories</span>
                <span className={`font-serif font-bold italic text-2xl block mt-1 ${isLight ? 'text-purple-900' : 'text-purple-400'}`}>
                  {categoriesCount}
                </span>
              </div>

              {/* Card 3: Difficulty Split - Amber */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${isLight
                ? 'bg-amber-50/40 border-amber-100 shadow-sm'
                : 'bg-[#14110D] border-amber-950/60 shadow-lg shadow-black/50 dark:shadow-amber-500/[0.02]'
                }`}>
                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Difficulty Split</span>
                <span className={`font-serif font-bold text-lg italic block mt-2.5 truncate ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>
                  {easyQCount} Easy / {mediumQCount} Medium / {hardQCount} Hard
                </span>
              </div>

              {/* Card 4: Publishing Status - Emerald */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${isLight
                ? 'bg-emerald-50/40 border-emerald-100 shadow-sm'
                : 'bg-[#0E1411] border-emerald-950/60 shadow-lg shadow-black/50 dark:shadow-emerald-500/[0.02]'
                }`}>
                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Publishing Status</span>
                <span className={`font-serif font-bold italic text-2xl block mt-1 ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>
                  {publishedQuestionsCount} <span className="text-xs font-mono font-normal text-zinc-500">/ {draftQuestionsCount} Draft</span>
                </span>
              </div>

            </div>

            {/* Database header search filters and add actions */}
            <div className={`p-4 rounded-xl border transition-all duration-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${isLight ? 'bg-white border-zinc-200' : 'bg-[#121212] border-zinc-850/80'}`}>

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
                    className={`w-full pl-8 pr-8 py-2 border rounded-lg outline-none transition-colors ${isLight
                      ? 'bg-zinc-50 border-zinc-350 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-550'
                      : 'bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-650 focus:border-zinc-500'
                      }`}
                  />
                  {qSearch && (
                    <button onClick={() => setQSearch('')} className={`absolute right-2.5 top-2.5 transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-800' : 'text-zinc-555 hover:text-white'}`}>×</button>
                  )}
                </div>

                {/* Category select */}
                <select
                  value={qCategoryFilter}
                  onChange={(e) => { setQCategoryFilter(e.target.value); setQPage(1); }}
                  className={`p-2 border rounded-lg outline-none cursor-pointer font-mono transition-colors ${isLight
                    ? 'bg-zinc-50 border-zinc-250 text-zinc-850 focus:bg-white focus:border-zinc-550'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-300 focus:border-zinc-500'
                    } max-w-[150px]`}
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
                  className={`p-2 border rounded-lg outline-none cursor-pointer font-mono transition-colors ${isLight
                    ? 'bg-zinc-50 border-zinc-250 text-zinc-850 focus:bg-white focus:border-zinc-550'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-300 focus:border-zinc-500'
                    }`}
                >
                  <option value="All">All Difficulties</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>

                {/* Clear */}
                <button
                  onClick={handleResetQFilters}
                  className={`p-2 border rounded-lg cursor-pointer transition-colors ${isLight
                    ? 'bg-zinc-550/10 border-zinc-250 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-805'
                    }`}
                  title="Reset filters"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Bulk Upload CTA */}
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className={`py-2.5 px-4 font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all font-mono uppercase tracking-wider text-xs border ${isLight
                    ? 'bg-white hover:bg-zinc-50 border-zinc-250 text-zinc-700'
                    : 'bg-zinc-900 hover:bg-zinc-805 border-zinc-800 text-zinc-350 hover:text-white'
                    }`}
                  title="Bulk Upload Questions"
                >
                  <Upload size={14} strokeWidth={2.5} />
                  <span>Bulk Upload</span>
                </button>

                {/* Add New CTA */}
                <button
                  onClick={() => {
                    setSelectedQuestion(null); // Add Mode
                    setShowQModal(true);
                  }}
                  className={`py-2.5 px-4 font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all font-mono uppercase tracking-wider text-xs ${isLight
                    ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                    : 'bg-white hover:bg-zinc-200 text-black'
                    }`}
                >
                  <Plus size={14} strokeWidth={3} />
                  <span>Add Question</span>
                </button>
              </div>

            </div>
            {/* Questions Inventory Table */}
            <div className={`border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${isLight ? 'bg-white border-zinc-200 shadow-sm' : 'bg-[#121212] border-zinc-850'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`text-xs font-bold uppercase font-mono transition-colors ${isLight ? 'bg-zinc-100/80 border-b border-zinc-205 border-zinc-200 text-zinc-500' : 'bg-[#050505] border-b border-zinc-850 text-zinc-500'}`}>
                    <tr>
                      <th className="px-6 py-4">Question</th>
                      <th className="px-6 py-4 text-center">Category</th>
                      <th className="px-6 py-4 text-center">Difficulty</th>
                      <th className="px-6 py-4 text-center">Attempts</th>
                      <th className="px-6 py-4 text-center">Status</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-sans transition-colors ${isLight ? 'divide-zinc-200 text-zinc-700' : 'divide-zinc-850 text-zinc-300'}`}>
                    {paginatedQuestions.map(q => {
                      // Attempts = solved + retry counts dynamically combined across progress list
                      const qProgress = allProgress.filter(p => p.question_id === q.id);
                      const qAttemptsCount = qProgress.filter(p => p.status === 'solved' || p.status === 'retry').length;

                      const getDiffLabelStyle = (d: string) => {
                        if (d === 'Easy') return isLight ? 'text-emerald-700 bg-emerald-50 border border-emerald-200/50' : 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/20';
                        if (d === 'Medium') return isLight ? 'text-amber-705 text-amber-700 bg-amber-50 border border-amber-200/50' : 'text-amber-500 bg-amber-500/10 border border-amber-500/20';
                        return isLight ? 'text-red-700 bg-red-50 border border-red-200/50' : 'text-red-500 bg-red-500/10 border border-red-500/20';
                      };

                      return (
                        <tr key={q.id} className={`transition-colors ${isLight ? 'hover:bg-zinc-50/70' : 'hover:bg-zinc-900/40'}`}>
                          <td className={`px-6 py-4 max-w-xl truncate font-medium transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`} title={q.question}>
                            {q.question}
                          </td>
                          <td className={`px-6 py-4 text-xs font-semibold transition-colors ${isLight ? 'text-zinc-500' : 'text-zinc-450'}`}>{q.category_name}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[12px] font-bold px-2.5 py-1 rounded-md ${getDiffLabelStyle(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-center font-mono text-[13px] font-bold transition-colors ${isLight ? 'text-zinc-800' : 'text-zinc-350'}`}>{qAttemptsCount}</td>
                          <td className="px-6 py-4">
                            {q.status === 'Published' ? (
                              <span className={`text-[12px] px-2 py-1 rounded-md font-bold font-mono ${isLight
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}>
                                Published
                              </span>
                            ) : (
                              <span className={`text-[12px] px-2 py-1 rounded-md font-bold font-mono ${isLight
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-amber-500/10 text-amber-500 border border-[#F59E0B]/10'
                                }`}>
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
                                className={`p-1 px-2.5 border rounded-md font-semibold text-xs transition-colors cursor-pointer ${isLight
                                  ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-250 text-zinc-700 font-bold'
                                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                                  }`}
                                title="Edit Question"
                              >
                                Edit
                              </button>

                              {/* Stats Report */}
                              <button
                                onClick={() => setReadOnlyQStats(q)}
                                className={`p-1 px-2 hover:underline text-xs font-bold cursor-pointer font-mono transition-colors ${isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
                                  }`}
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
                <div className={`border-t px-6 py-3 flex items-center justify-between text-xs font-semibold font-mono transition-colors ${isLight ? 'bg-zinc-50/80 border-zinc-200 text-zinc-550' : 'bg-[#050505] border-zinc-850 text-zinc-500'
                  }`}>
                  <span>
                    Showing {(qPage - 1) * rowsPerPage + 1} to {Math.min(qPage * rowsPerPage, filteredQuestions.length)} of {filteredQuestions.length} entries
                  </span>

                  {/* Steppers paging joiner */}
                  <div className={`flex items-center gap-1 p-0.5 rounded-lg border transition-colors ${isLight ? 'bg-zinc-100 border-zinc-250' : 'bg-zinc-900 border border-zinc-800'
                    }`}>
                    <button
                      onClick={() => setQPage(prev => Math.max(1, prev - 1))}
                      disabled={qPage === 1}
                      className={`p-1.5 rounded-md disabled:opacity-40 cursor-pointer transition-colors ${isLight ? 'hover:bg-zinc-200 text-zinc-650' : 'hover:bg-zinc-800 text-zinc-400'
                        }`}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: qTotalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setQPage(idx + 1)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${qPage === idx + 1
                          ? (isLight ? 'bg-zinc-900 text-white font-bold font-mono' : 'bg-white text-black font-semibold font-mono')
                          : (isLight ? 'text-zinc-500 hover:bg-zinc-200' : 'text-zinc-400 hover:bg-zinc-800')
                          }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setQPage(prev => Math.min(qTotalPages, prev + 1))}
                      disabled={qPage === qTotalPages}
                      className={`p-1.5 rounded-md disabled:opacity-40 cursor-pointer transition-colors ${isLight ? 'hover:bg-zinc-200 text-zinc-650' : 'hover:bg-zinc-800 text-zinc-400'
                        }`}
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
             Users / USERS MANAGEMENT TAB
             ========================================================== */
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Quick Metrics ribbon of Users */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

              {/* Card 1: Total Users - Indigo */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${isLight
                ? 'bg-zinc-50 border-zinc-200 shadow-sm'
                : 'bg-[#121214] border-zinc-800 shadow-lg shadow-black/50 dark:shadow-indigo-500/[0.02]'
                }`}>
                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Total Users</span>
                <span className={`font-serif italic text-2xl block mt-1 ${isLight ? 'text-zinc-950' : 'text-indigo-400'}`}>
                  {totalUsersCount}
                </span>
              </div>

              {/* Card 2: Overall Success Rate - Purple */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${isLight
                ? 'bg-purple-50/40 border-purple-100 shadow-sm'
                : 'bg-[#121017] border-purple-950/60 shadow-lg shadow-black/50 dark:shadow-purple-500/[0.02]'
                }`}>
                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Overall Success Rate</span>
                <span className={`font-serif italic text-2xl block mt-1 ${isLight ? 'text-purple-900' : 'text-purple-400'}`}>
                  {successRate}%
                </span>
              </div>

              {/* Card 3: Total Solved Questions - Amber */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${isLight
                ? 'bg-amber-50/40 border-amber-100 shadow-sm'
                : 'bg-[#14110D] border-amber-950/60 shadow-lg shadow-black/50 dark:shadow-amber-500/[0.02]'
                }`}>
                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Total Solved Questions</span>
                <span className={`font-serif italic text-2xl block mt-1 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  {globalSolvedCount}
                </span>
              </div>

              {/* Card 4: Total Retry Questions - Emerald */}
              <div className={`p-4 rounded-xl border transition-all duration-300 ${isLight
                ? 'bg-emerald-50/40 border-emerald-100 shadow-sm'
                : 'bg-[#0E1411] border-emerald-950/60 shadow-lg shadow-black/50 dark:shadow-emerald-500/[0.02]'
                }`}>
                <span className="text-[12px] text-zinc-500 uppercase tracking-widest font-mono font-bold block">Total Retry Questions</span>
                <span className={`font-serif italic text-2xl block mt-1 ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  {globalRetryCount}
                </span>
              </div>

            </div>

            {/* Top 5 Dynamic Leaderboard grid lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Component A: Top 5 Solve Questions */}
              <div className={`border rounded-xl p-5 shadow-sm transition-all duration-300 ${isLight ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-[#121212] border-zinc-850/80 text-zinc-300'}`}>
                <div className="flex items-center gap-1.5 mb-4 text-zinc-400">
                  <BarChart3 size={15} />
                  <span className={`font-serif italic font-semibold text-sm tracking-wide ${isLight ? 'text-zinc-950' : 'text-white'}`}>Top Guesstimates by Completes</span>
                </div>
                <div className={`divide-y font-sans text-xs ${isLight ? 'divide-zinc-200 text-zinc-700' : 'divide-zinc-850 text-zinc-300'}`}>
                  {topQuestions.map((q, i) => (
                    <div key={q.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 max-w-[60%]">
                        <span className={`font-mono font-bold ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`}>{i + 1}.</span>
                        <span className={`truncate font-sans ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`} title={q.question}>{q.question}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[12px]">
                        <span className={`${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-500 font-bold'}`}>{q.solvedCount} Solves</span>
                        <span className="text-zinc-500">{q.retryCount} Retries</span>
                      </div>
                    </div>
                  ))}
                  {topQuestions.length === 0 && <span className="text-zinc-500 italic block py-4 text-center font-mono">No solve records logged yet.</span>}
                </div>
              </div>

              {/* Component B: Top 5 Active Users */}
              <div className={`border rounded-xl p-5 shadow-sm transition-all duration-300 ${isLight ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-[#121212] border-zinc-850/80 text-zinc-300'}`}>
                <div className="flex items-center gap-1.5 mb-4 text-zinc-400">
                  <Award size={15} />
                  <span className={`font-serif italic font-semibold text-sm tracking-wide ${isLight ? 'text-zinc-950' : 'text-white'}`}>Top Performing Users</span>
                </div>
                <div className={`divide-y font-sans text-xs ${isLight ? 'divide-zinc-200 text-zinc-700' : 'divide-zinc-850 text-zinc-300'}`}>
                  {topUsers.map((u, i) => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${isLight ? 'text-zinc-400' : 'text-zinc-600'}`}>{i + 1}.</span>
                        <span className={`font-sans ${isLight ? 'text-zinc-800' : 'text-zinc-100'}`}>{u.first_name} {u.last_name}</span>
                        {u.role === 'admin' && <span className={`font-bold px-1.5 text-[9px] rounded-md font-mono scale-90 ${isLight ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-850 text-zinc-400'}`}>ADMIN</span>}
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[12px]">
                        <span className={`${isLight ? 'text-emerald-700 font-bold' : 'text-emerald-500 font-bold'}`}>{u.solvedCount} Solves</span>
                        <span className="text-zinc-500">{u.retryCount} Retries</span>
                      </div>
                    </div>
                  ))}
                  {topUsers.length === 0 && <span className="text-zinc-500 italic block py-4 text-center font-mono">No active users recorded.</span>}
                </div>
              </div>

            </div>

            {/* Filters Row of Users */}
            <div className={`p-4 rounded-xl border transition-all duration-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${isLight ? 'bg-white border-zinc-200' : 'bg-[#121212] border-zinc-850/80'}`}>

              <div className="flex flex-wrap items-center gap-3 flex-grow/1">
                {/* Search */}
                <div className="relative grow max-w-sm">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    value={uSearch}
                    onChange={(e) => { setUSearch(e.target.value); setUPage(1); }}
                    placeholder="Search by user name or email..."
                    className={`w-full pl-8 pr-8 py-2 border rounded-lg outline-none transition-colors font-mono text-xs ${isLight
                      ? 'bg-zinc-50 border-zinc-350 text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-550'
                      : 'bg-zinc-950 border border-zinc-800 text-white placeholder:text-zinc-650 focus:border-zinc-500'
                      }`}
                  />
                  {uSearch && (
                    <button onClick={() => setUSearch('')} className={`absolute right-2.5 top-2.5 transition-colors ${isLight ? 'text-zinc-400 hover:text-zinc-800' : 'text-zinc-555 hover:text-white'}`}>×</button>
                  )}
                </div>

                {/* Sort dropdown */}
                <select
                  value={uSortBy}
                  onChange={(e) => { setUSortBy(e.target.value as any); setUPage(1); }}
                  className={`p-2 border rounded-lg outline-none cursor-pointer text-xs font-mono transition-colors ${isLight
                    ? 'bg-zinc-50 border-zinc-250 text-zinc-850 focus:bg-white focus:border-zinc-550'
                    : 'bg-zinc-950 border border-zinc-800 text-zinc-300 focus:border-zinc-500'
                    }`}
                >
                  <option value="newest">Sort by Newest Account</option>
                  <option value="oldest">Sort by Oldest Account</option>
                </select>

                <button
                  onClick={handleResetUFilters}
                  className={`p-2 border rounded-lg cursor-pointer transition-colors ${isLight
                    ? 'bg-zinc-550/10 border-zinc-250 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-805'
                    }`}
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
                className={`py-2.5 px-4 font-semibold rounded-lg flex items-center justify-center gap-1.5 shadow-md cursor-pointer shrink-0 transition-all font-mono uppercase tracking-wider text-xs ${isLight
                  ? 'bg-zinc-900 hover:bg-zinc-800 text-white'
                  : 'bg-white hover:bg-zinc-200 text-black'
                  }`}
              >
                <Plus size={14} strokeWidth={3} />
                <span>Add User</span>
              </button>

            </div>

            {/* Users Comprehensive Table representation with Completion sliders */}
            <div className={`border rounded-xl shadow-sm overflow-hidden transition-all duration-300 ${isLight ? 'bg-white border-zinc-200' : 'bg-[#121212] border-zinc-850'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className={`text-xs font-bold uppercase font-mono transition-colors ${isLight ? 'bg-zinc-100 border-b border-zinc-200 text-zinc-500' : 'bg-[#050505] border-b border-zinc-850 text-zinc-500'}`}>
                    <tr>
                      <th className="px-6 py-4">User Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4 text-center">Easy Solves</th>
                      <th className="px-6 py-4 text-center">Med Solves</th>
                      <th className="px-6 py-4 text-center">Hard Solves</th>
                      <th className="px-6 py-4 text-center">Solved</th>
                      <th className="px-6 py-4 text-center">Retries</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y font-sans text-xs transition-colors ${isLight ? 'divide-zinc-200 text-zinc-700' : 'divide-zinc-850 text-zinc-300'}`}>
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
                        <tr key={u.id} className={`transition-colors ${isLight ? 'hover:bg-zinc-50/70' : 'hover:bg-zinc-900/40'}`}>
                          <td className={`px-6 py-4 font-semibold transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                            {u.first_name} {u.last_name}
                            {u.role === 'admin' && <span className={`ml-1.5 text-[9px] py-0.5 px-1.5 rounded-sm font-mono font-bold transition-colors ${isLight ? 'bg-zinc-150 text-zinc-650' : 'bg-zinc-850 text-zinc-400'}`}>ADMIN</span>}
                          </td>
                          <td className={`px-6 py-4 font-mono text-[11px] font-semibold lowercase transition-colors ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>{u.email}</td>

                          {/* Easy Progress slide */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 w-24">
                              <div className={`flex-grow h-1 rounded-full overflow-hidden border transition-colors ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-700 border-zinc-800/3'}`}>
                                <div className="bg-emerald-500 h-full" style={{ width: `${easyPercent}%` }}></div>
                              </div>
                              <span className={`font-mono text-[12px] font-bold ${isLight ? 'text-zinc-450' : 'text-zinc-500'}`}>{easyPercent}%</span>
                            </div>
                          </td>

                          {/* Med Progress slide */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 w-24">
                              <div className={`flex-grow h-1 rounded-full overflow-hidden border transition-colors ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-700 border-zinc-800/3'}`}>
                                <div className="bg-[#D97706] h-full" style={{ width: `${medPercent}%` }}></div>
                              </div>
                              <span className={`font-mono text-[12px] font-bold ${isLight ? 'text-zinc-450' : 'text-zinc-500'}`}>{medPercent}%</span>
                            </div>
                          </td>

                          {/* Hard Progress slide */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 w-24">
                              <div className={`flex-grow h-1 rounded-full overflow-hidden border transition-colors ${isLight ? 'bg-zinc-100 border-zinc-200' : 'bg-zinc-700 border-zinc-800/3'}`}>
                                <div className="bg-red-500 h-full" style={{ width: `${hardPercent}%` }}></div>
                              </div>
                              <span className={`font-mono text-[12px] font-bold ${isLight ? 'text-zinc-450' : 'text-zinc-500'}`}>{hardPercent}%</span>
                            </div>
                          </td>

                          <td className={`px-6 py-4 text-center text-[13px] font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-500'}`}>{uSolved.length}</td>
                          <td className={`px-6 py-4 text-center text-[13px] font-mono font-semibold ${isLight ? 'text-amber-700' : 'text-amber-500'}`}>{uRetryCount}</td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Edit credentials / reset */}
                              <button
                                onClick={() => {
                                  setSelectedUserProfile(u);
                                  setShowUModal(true);
                                }}
                                className={`p-1 px-2.5 border rounded-md font-semibold text-[12px] transition-colors cursor-pointer font-mono ${isLight
                                  ? 'bg-zinc-50 hover:bg-zinc-100 border-zinc-250 text-zinc-700 font-bold'
                                  : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-805 border-zinc-805 text-zinc-350'
                                  }`}
                                title="Edit User"
                              >
                                Edit
                              </button>

                              {/* Stats Report summary */}
                              <button
                                onClick={() => setReadOnlyUStats(u)}
                                className={`p-1 px-2 hover:underline text-[12px] font-bold cursor-pointer font-mono transition-colors ${isLight ? 'text-zinc-500 hover:text-zinc-900' : 'text-zinc-400 hover:text-white'
                                  }`}
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
                <div className={`border-t px-6 py-3 flex items-center justify-between text-xs font-semibold font-mono transition-colors ${isLight ? 'bg-zinc-50/80 border-zinc-200 text-zinc-555' : 'bg-[#050505] border-t border-zinc-850 text-zinc-500'
                  }`}>
                  <span>
                    Showing {(uPage - 1) * rowsPerPage + 1} to {Math.min(uPage * rowsPerPage, filteredProfiles.length)} of {filteredProfiles.length} entries
                  </span>

                  {/* Steppers */}
                  <div className={`flex items-center gap-1 p-0.5 rounded-lg border transition-colors ${isLight ? 'bg-zinc-100 border-zinc-250' : 'bg-zinc-900 border border-zinc-800'
                    }`}>
                    <button
                      onClick={() => setUPage(prev => Math.max(1, prev - 1))}
                      disabled={uPage === 1}
                      className={`p-1.5 rounded-md disabled:opacity-40 cursor-pointer transition-colors ${isLight ? 'hover:bg-zinc-200 text-zinc-650' : 'hover:bg-zinc-805 text-zinc-400'
                        }`}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    {Array.from({ length: uTotalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setUPage(idx + 1)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${uPage === idx + 1
                          ? (isLight ? 'bg-zinc-900 text-white font-bold font-mono' : 'bg-white text-black font-semibold font-mono')
                          : (isLight ? 'text-zinc-500 hover:bg-zinc-200' : 'text-zinc-400 hover:bg-zinc-800')
                          }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                    <button
                      onClick={() => setUPage(prev => Math.min(uTotalPages, prev + 1))}
                      disabled={uPage === uTotalPages}
                      className={`p-1.5 rounded-md disabled:opacity-40 cursor-pointer transition-colors ${isLight ? 'hover:bg-zinc-200 text-zinc-650' : 'hover:bg-zinc-805 text-zinc-400'
                        }`}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        )}

      </main>      {/* FOOTER ADVERTISEMENT */}
      <footer className={`border-t flex justify-between py-4 px-6 text-justify text-[12px] font-mono tracking-widest mt-12 shrink-0 transition-colors duration-300 ${isLight ? 'bg-zinc-100 border-zinc-250 text-zinc-550' : 'bg-[#050505] border-zinc-850/80 text-zinc-650'}`}>
        <div className="max-w-6xl flex justify-between items-center w-full mx-auto">
          <p>&copy; 2026 Soham Banerjee. Version 1.0</p>
          <p>PLAY.SIDELOWER.IN</p>
        </div>

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
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`border rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col relative transition-all duration-300 ${isLight ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-[#121212] border-zinc-800 text-zinc-350'
            }`}>
            <button onClick={() => setReadOnlyQStats(null)} className={`absolute top-4 right-4 cursor-pointer transition-colors ${isLight ? 'text-zinc-450 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'
              }`}>
              <X size={18} />
            </button>

            <div className="flex items-center gap-1.5 text-xs text-zinc-455 text-zinc-500 font-semibold mb-2 uppercase font-mono tracking-wider">
              <BarChart2 size={14} />
              <span>Guesstimate Statistics</span>
            </div>

            <p className={`font-display font-medium text-base leading-relaxed border-b pb-4 mb-4 transition-colors ${isLight ? 'text-zinc-900 border-zinc-150' : 'text-white border-zinc-850'
              }`}>
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
                    <div className={`p-3 rounded-lg border transition-colors ${isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200/50' : 'bg-emerald-500/10 border-emerald-500/20'
                      }`}>
                      <span className={`text-[12px] uppercase font-bold font-mono tracking-wider block ${isLight ? 'text-emerald-700' : 'text-emerald-500'}`}>Total Solved</span>
                      <span className={`text-3xl font-serif italic block mt-1 ${isLight ? 'text-emerald-900' : 'text-emerald-400'}`}>{solves}</span>
                    </div>
                    <div className={`p-3 rounded-lg border transition-colors ${isLight ? 'bg-amber-50 text-amber-800 border-amber-200/50' : 'bg-amber-500/10 border-amber-500/20'
                      }`}>
                      <span className={`text-[12px] uppercase font-bold font-mono tracking-wider block ${isLight ? 'text-amber-700' : 'text-amber-500'}`}>Total Retries</span>
                      <span className={`text-3xl font-serif italic block mt-1 ${isLight ? 'text-amber-900' : 'text-amber-400'}`}>{retries}</span>
                    </div>
                    <div className={`p-3 rounded-lg border col-span-2 transition-colors ${isLight ? 'bg-zinc-50 border-zinc-200' : 'bg-zinc-950 border-zinc-850'
                      }`}>
                      <span className="text-[12px] uppercase font-bold text-zinc-500 font-mono tracking-wider block">Upvotes / Downvotes</span>
                      <span className={`text-sm font-mono block mt-1 ${isLight ? 'text-zinc-800' : 'text-zinc-300'}`}>
                        👍 {readOnlyQStats.upvotes} / 👎 {readOnlyQStats.downvotes}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setReadOnlyQStats(null)}
                    className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg mt-4 cursor-pointer transition-colors font-mono ${isLight ? 'bg-zinc-950 hover:bg-zinc-850 text-white shadow-md' : 'bg-white hover:bg-zinc-200 text-black shadow-md'
                      }`}
                  >
                    Close Statistics
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* READ-ONLY OVERLAY MODAL: Specific User Stats breakdown */}
      {readOnlyUStats && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className={`border rounded-2xl p-6 w-full max-w-md shadow-2xl flex flex-col relative max-h-[90vh] transition-all duration-300 ${isLight ? 'bg-white border-zinc-200 text-zinc-700' : 'bg-[#121212] border-zinc-800 text-zinc-350 font-sans'
            }`}>
            <button onClick={() => setReadOnlyUStats(null)} className={`absolute top-4 right-4 cursor-pointer transition-colors ${isLight ? 'text-zinc-450 hover:text-zinc-900' : 'text-zinc-500 hover:text-white'
              }`}>
              <X size={18} />
            </button>

            <div className={`text-center pb-4 border-b mb-4 transition-colors ${isLight ? 'border-zinc-150' : 'border-zinc-850'}`}>
              <div className={`w-12 h-12 flex items-center justify-center rounded-full text-sm font-bold mx-auto mb-2 font-mono border transition-colors ${isLight ? 'bg-zinc-100 border-zinc-250 text-zinc-800' : 'bg-zinc-900 border-zinc-800 text-white'
                }`}>
                {readOnlyUStats.first_name[0].toUpperCase()}{readOnlyUStats.last_name[0].toUpperCase()}
              </div>
              <h4 className={`font-serif italic font-medium text-lg transition-colors ${isLight ? 'text-zinc-900' : 'text-white'}`}>
                {readOnlyUStats.first_name} {readOnlyUStats.last_name}
              </h4>
              <span className={`text-[12px] font-mono lowercase tracking-widest block mt-1 ${isLight ? 'text-zinc-450' : 'text-zinc-400'}`}>{readOnlyUStats.email}</span>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1">
              {/* <span className="text-[12px] uppercase tracking-widest text-zinc-500 font-mono font-bold block">Performance Card</span> */}

              {(() => {
                const uProg = allProgress.filter(p => p.user_id === readOnlyUStats.id);
                const solves = uProg.filter(p => p.status === 'solved').length;
                const retries = uProg.filter(p => p.status === 'retry').length;

                return (
                  <div className="space-y-4 text-xs font-sans text-zinc-300">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className={`p-3 rounded-lg border transition-colors ${isLight ? 'bg-emerald-50 border-emerald-200/50 text-emerald-800' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}>
                        <span className={`text-[12px] uppercase font-mono font-bold block ${isLight ? 'text-emerald-700' : 'text-emerald-500'}`}>SOLVED</span>
                        <span className={`text-3xl font-serif italic block mt-1 ${isLight ? 'text-emerald-900' : 'text-emerald-450'}`}>{solves}</span>
                      </div>
                      <div className={`p-3 rounded-lg border transition-colors ${isLight ? 'bg-amber-50 border-amber-200/50 text-amber-800' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                        }`}>
                        <span className={`text-[12px] uppercase font-mono font-bold block ${isLight ? 'text-amber-700' : 'text-amber-500'}`}>RETRIES</span>
                        <span className={`text-3xl font-serif italic block mt-1 ${isLight ? 'text-amber-900' : 'text-amber-450'}`}>{retries}</span>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-lg space-y-3 border transition-colors ${isLight ? 'bg-zinc-50 border-zinc-200' : 'border-[#222] border-zinc-850 bg-zinc-950'
                      }`}>
                      <span className="font-bold text-zinc-500 font-mono uppercase block text-[12px] tracking-wider">Category Performance</span>
                      {categories.map(cat => {
                        const catQuestions = questions.filter(q => q.category_id === cat.id);
                        const catSolved = uProg.filter(p => p.status === 'solved' && catQuestions.some(q => q.id === p.question_id)).length;
                        const ratio = catQuestions.length > 0 ? Math.round((catSolved / catQuestions.length) * 100) : 0;

                        return (
                          <div key={cat.id} className="flex items-center justify-between text-[12px] font-mono">
                            <span className={`font-semibold font-sans ${isLight ? 'text-zinc-800' : 'text-zinc-300'}`}>{cat.name}</span>
                            <span className={`font-bold ${isLight ? 'text-zinc-505 text-zinc-500 font-semibold' : 'text-zinc-500'}`}>{catSolved}/{catQuestions.length} ({ratio}%)</span>
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
              className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg mt-6 cursor-pointer font-mono ${isLight ? 'bg-zinc-950 hover:bg-zinc-850 text-white shadow-md' : 'bg-white hover:bg-zinc-200 text-black shadow-md'
                }`}
            >
              Close Performance Report
            </button>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal component */}
      <BulkUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
        onSuccess={() => {
          loadAdminMetrics();
        }}
        categories={categories}
      />

    </div>
  );
};
