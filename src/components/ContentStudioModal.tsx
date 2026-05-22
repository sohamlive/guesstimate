import React, { useState, useEffect } from 'react';
import { Question, Category, Difficulty, QuestionStatus } from '../types';
import { db } from '../lib/db';
import { X, Save, Trash2, RotateCcw, Plus, CheckCircle, HelpCircle, Link2, PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ContentStudioModalProps {
  question: Question | null; // null = Add Mode, non-null = Edit Mode
  onClose: () => void;
  onSaveSuccess: () => void;
  onDeleteSuccess: () => void;
}

export const ContentStudioModal: React.FC<ContentStudioModalProps> = ({
  question,
  onClose,
  onSaveSuccess,
  onDeleteSuccess,
}) => {
  const isEditMode = !!question;

  // Form Fields
  const [questionText, setQuestionText] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [tagsInput, setTagsInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [url1, setUrl1] = useState<string>('');
  const [url2, setUrl2] = useState<string>('');
  const [status, setStatus] = useState<QuestionStatus>('Published');

  // Stats Counters (Read-only / resettable in Edit Mode)
  const [upvotes, setUpvotes] = useState<number>(0);
  const [downvotes, setDownvotes] = useState<number>(0);
  const [totalSolved, setTotalSolved] = useState<number>(0);
  const [totalRetry, setTotalRetry] = useState<number>(0);

  // Loading / UI Sub-States
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState<boolean>(false);
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  
  // Custom Category Creation Sub-Modal
  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [addingCategory, setAddingCategory] = useState<boolean>(false);

  useEffect(() => {
    // Fetch categories
    const loadCategories = async () => {
      try {
        const catList = await db.getCategories();
        setCategories(catList);
        if (catList.length > 0 && !isEditMode) {
          setCategoryId(catList[0].id);
        }
      } catch (err) {
        toast.error('Failed to load categories.');
      }
    };

    loadCategories();
  }, [isEditMode]);

  useEffect(() => {
    if (question) {
      // Prepopulate fields in Edit Mode
      setQuestionText(question.question);
      setCategoryId(question.category_id);
      setDifficulty(question.difficulty);
      setTags(question.tags || []);
      setUrl1(question.url_1 || '');
      setUrl2(question.url_2 || '');
      setStatus(question.status);
      setUpvotes(question.upvotes || 0);
      setDownvotes(question.downvotes || 0);

      // Load analytics for this question
      const loadQuestionAnalytics = async () => {
        try {
          const allProgress = await db.getAllProgress();
          const qProgress = allProgress.filter(p => p.question_id === question.id);
          setTotalSolved(qProgress.filter(p => p.status === 'solved').length);
          setTotalRetry(qProgress.filter(p => p.status === 'retry').length);
        } catch {
          // ignore error
        }
      };
      loadQuestionAnalytics();
    }
  }, [question]);

  const handleAddTag = () => {
    const clean = tagsInput.trim().toLowerCase();
    if (!clean) return;
    if (tags.includes(clean)) {
      setTagsInput('');
      return;
    }
    setTags([...tags, clean]);
    setTagsInput('');
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategoryName.trim();
    if (name.length < 2) {
      toast.error('Category name must be at least 2 characters long.');
      return;
    }
    setAddingCategory(true);
    try {
      const created = await db.addCategory(name);
      setCategories([...categories, created]);
      setCategoryId(created.id);
      setNewCategoryName('');
      setShowAddCategory(false);
      toast.success(`Category "${name}" created.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to register category.');
    } finally {
      setAddingCategory(false);
    }
  };

  const handleResetStats = async () => {
    if (!question) return;
    try {
      await db.resetQuestionStats(question.id);
      setUpvotes(0);
      setDownvotes(0);
      setTotalSolved(0);
      setTotalRetry(0);
      setShowConfirmReset(false);
      toast.success('Question metrics reset successfully.');
      onSaveSuccess();
    } catch (err: any) {
      toast.error('Failed to reset statistics.');
    }
  };

  const handleDeleteQuestion = async () => {
    if (!question) return;
    try {
      await db.deleteQuestion(question.id);
      toast.success('Question permanently removed.');
      setShowConfirmDelete(false);
      onDeleteSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Constraint error: Cannot delete question with active references.');
    }
  };

  // URL checker
  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    const cleanPrompt = questionText.trim();
    if (!cleanPrompt || cleanPrompt.length < 10) {
      toast.error('Question prompt must be at least 10 characters long.');
      return;
    }
    if (!categoryId) {
      toast.error('Please assign a category.');
      return;
    }
    if ((url1 && !isValidUrl(url1)) || (url2 && !isValidUrl(url2))) {
      toast.error('Invalid URL link format. Must start with http:// or https://');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        question: cleanPrompt,
        category_id: categoryId,
        difficulty,
        tags,
        url_1: url1 || undefined,
        url_2: url2 || undefined,
        status,
      };

      if (isEditMode && question) {
        await db.updateQuestion(question.id, payload);
        toast.success('Guesstimate updated successfully!');
      } else {
        await db.addQuestion(payload);
        toast.success('New Guesstimate published successfully!');
      }
      onSaveSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit challenge details.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <div className="relative bg-[#0c0c0c] border border-zinc-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-850">
          <span className="font-serif italic text-lg text-white">
            {isEditMode ? 'Edit Guesstimate Challenge' : 'Create Guesstimate Challenge'}
          </span>
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Two-column layout */}
        <div className="flex-grow overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN: Main Question settings */}
          <div className="flex flex-col gap-4">
            
            {/* Question Text */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono">
                Question Prompt *
              </label>
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="How many liters of tea are consumed in Shanghai daily? (Be descriptive)"
                className="w-full h-32 p-3 bg-zinc-950 border border-zinc-800 rounded-xl outline-none focus:border-zinc-550 focus:ring-1 focus:ring-zinc-650 text-sm leading-relaxed text-zinc-250 font-serif italic"
              />
            </div>

            {/* Category selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(true)}
                  className="text-xs text-zinc-350 hover:text-white font-semibold flex items-center gap-1 cursor-pointer font-mono"
                >
                  <Plus size={12} strokeWidth={3} />
                  <span>Add Category</span>
                </button>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 border border-zinc-800 rounded-xl outline-none bg-zinc-950 text-sm text-zinc-300 focus:border-zinc-550 font-mono"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id} className="bg-zinc-950 text-zinc-300">{c.name}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Level (Segmented Control) */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1.5 font-mono">
                Difficulty Tier *
              </label>
              <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer font-mono ${
                      difficulty === d
                        ? 'bg-zinc-800 text-white border border-zinc-700 font-bold shadow-xs'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Hint resources links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1 font-mono">
                  Hint Link 1
                </label>
                <input
                  type="url"
                  value={url1}
                  onChange={(e) => setUrl1(e.target.value)}
                  placeholder="https://en.wikipedia.org/wiki/..."
                  className="w-full p-2.5 border border-zinc-805 bg-zinc-950 rounded-xl outline-none text-xs text-zinc-300 focus:border-zinc-550 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest block mb-1 font-mono">
                  Hint Link 2
                </label>
                <input
                  type="url"
                  value={url2}
                  onChange={(e) => setUrl2(e.target.value)}
                  placeholder="https://statista.com/..."
                  className="w-full p-2.5 border border-zinc-805 bg-zinc-950 rounded-xl outline-none text-xs text-zinc-300 focus:border-zinc-550 font-mono"
                />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Tags, draft, and statistics control block */}
          <div className="flex flex-col gap-4 border-t md:border-t-0 md:border-l border-zinc-850 pt-4 md:pt-0 md:pl-6 justify-between">
            
            {/* Token Tags Manager */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 font-mono tracking-wider">
                Chips & Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Type tag (e.g. food) and press Enter"
                  className="flex-grow p-2.5 border border-zinc-800 bg-zinc-950 text-zinc-350 rounded-xl outline-none text-xs focus:border-zinc-550 font-mono"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-305 font-bold border border-zinc-800 rounded-xl text-xs transition-all cursor-pointer font-mono"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[40px] p-2 bg-zinc-950 border border-zinc-850 rounded-xl">
                {tags.map((tag, i) => (
                  <span 
                    key={i}
                    className="flex items-center gap-1 text-[11px] font-mono bg-zinc-900 text-zinc-300 px-2.5 py-0.5 rounded-md border border-zinc-800"
                  >
                    #{tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(i)}
                      className="text-red-400 hover:text-red-200 font-bold ml-1 cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {tags.length === 0 && (
                  <span className="text-xs text-zinc-650 italic font-mono">No tags associated yet.</span>
                )}
              </div>
            </div>

            {/* Publishing segmented switch */}
            <div>
              <label className="text-xs font-bold text-zinc-500 uppercase block mb-1.5 font-mono tracking-wider">
                Publishing Status
              </label>
              <div className="grid grid-cols-2 gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-850">
                {(['Draft', 'Published'] as QuestionStatus[]).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer font-mono ${
                      status === st
                        ? st === 'Published' ? 'bg-emerald-600 text-white font-bold shadow-xs' : 'bg-amber-600 text-white font-bold shadow-xs'
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Analytics Stats Registry */}
            <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-850">
              <span className="text-xs font-bold text-zinc-500 uppercase block mb-2 font-mono tracking-wider">Metrics Status Registry</span>
              
              <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3 font-mono">
                <div className="bg-[#121212] p-2 rounded-lg border border-zinc-805">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Solved</span>
                  <span className="font-serif italic text-emerald-400 text-base block mt-0.5">{totalSolved}</span>
                </div>
                <div className="bg-[#121212] p-2 rounded-lg border border-zinc-805">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Total Retry</span>
                  <span className="font-serif italic text-amber-400 text-base block mt-0.5">{totalRetry}</span>
                </div>
                <div className="bg-[#121212] p-2 rounded-lg border border-zinc-805">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Upvotes</span>
                  <span className="font-serif italic text-zinc-350 text-base block mt-0.5">{upvotes}</span>
                </div>
                <div className="bg-[#121212] p-2 rounded-lg border border-zinc-805">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block">Downvotes</span>
                  <span className="font-serif italic text-zinc-450 text-base block mt-0.5">{downvotes}</span>
                </div>
              </div>

              {isEditMode ? (
                !showConfirmReset ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmReset(true)}
                    className="w-full text-xs text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 py-1.5 border border-amber-500/10 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold font-mono"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Question Metrics</span>
                  </button>
                ) : (
                  <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs leading-normal text-zinc-300 font-mono">
                    <span className="font-bold text-amber-500 block mb-1">RESET METRICS?</span>
                    <p className="text-zinc-500 mb-2">This will clear global solve/retry states and votes for this question.</p>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleResetStats}
                        className="bg-amber-600 text-white text-[10px] font-bold py-1 px-3 rounded-md cursor-pointer hover:bg-amber-700"
                      >
                        Confirm Reset
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
                )
              ) : (
                <span className="text-[10px] text-zinc-650 block text-center italic font-mono">Metrics are initialized at zero for new questions.</span>
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
                  className="text-xs text-red-500 font-bold border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 px-4 py-2.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer font-mono"
                >
                  <Trash2 size={13} />
                  <span>Delete Guesstimate</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-red-500/5 border border-red-500/20 p-2 rounded-lg font-mono">
                  <span className="text-[11px] text-red-400 font-semibold">PRUNING CONFIRM. SINK THREADS?</span>
                  <button
                    type="button"
                    onClick={handleDeleteQuestion}
                    className="bg-[#DC2626] text-white text-[10px] font-bold px-2 py-1 rounded-md"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(false)}
                    className="bg-zinc-805 text-zinc-300 text-[10px] px-2 py-1 rounded-md font-semibold"
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
              className="bg-zinc-900 border border-zinc-805 hover:bg-zinc-800 text-zinc-300 font-bold py-2 px-5 rounded-lg text-sm transition-all cursor-pointer"
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
              <span>{isEditMode ? 'Save Changes' : 'Publish Question'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* SUB-MODAL: Add custom category */}
      {showAddCategory && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveCategory}
            className="bg-[#121212] w-full max-w-sm rounded-xl p-5 shadow-2xl border border-zinc-800 text-zinc-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h5 className="font-serif italic text-white text-base">Add New Category</h5>
              <button 
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mb-4">
              <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-550 block mb-1 font-mono">Category Name</label>
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Real Estate Sizing"
                className="w-full p-2.5 border border-zinc-805 bg-zinc-950 text-zinc-200 rounded-xl outline-none text-xs focus:border-zinc-550 font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 text-xs font-semibold font-mono">
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 py-1.5 px-3 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addingCategory}
                className="bg-white hover:bg-zinc-200 text-black py-1.5 px-4 rounded-lg flex items-center gap-1 font-bold"
              >
                <span>Save</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
