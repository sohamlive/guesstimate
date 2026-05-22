import React from 'react';
import { Question, ProgressStatus } from '../types';
import { Play, ThumbsUp, Check, RefreshCw, Sparkles } from 'lucide-react';

interface DotGridCardProps {
  question: Question;
  progressStatus: ProgressStatus;
  isNew: boolean;
  onPlay: (question: Question) => void;
}

export const DotGridCard: React.FC<DotGridCardProps> = ({
  question,
  progressStatus,
  isNew,
  onPlay,
}) => {
  // Determine card style class based on solved state and category
  // const getCardBgClass = () => {
  //   if (progressStatus === 'solved') {
  //     return 'card-solved border border-zinc-800/80 shadow-sm';
  //   }

  //   switch (question.category_name) {
  //     case 'Population':
  //       return 'card-population border border-[#ED946D]/30 shadow-lg shadow-black/30';
  //     case 'Market Sizing':
  //       return 'card-market-sizing border border-[#A594DC]/30 shadow-lg shadow-black/30';
  //     case 'Fermi Estimate':
  //       return 'card-fermi-estimate border border-[#76BCB2]/30 shadow-lg shadow-black/30';
  //     case 'Scientific':
  //       return 'card-scientific border border-[#74A9DF]/30 shadow-lg shadow-black/30';
  //     default:
  //       return 'card-default border border-zinc-850 shadow-lg shadow-black/30';
  //   }
  // };
  const getCardBgClass = () => {
    if (progressStatus === 'solved') {
      return 'card-solved border border-zinc-800/80 hover:border-zinc-600 shadow-sm';
    }

    switch (question.category_name) {
      case 'Population':
        return 'card-population border border-[#ED946D]/30 hover:border-[#ED946D]/80 shadow-lg shadow-black/30 hover:shadow-[#ED946D]/10';

      case 'Market Sizing':
        return 'card-market-sizing border border-[#A594DC]/30 hover:border-[#A594DC]/80 shadow-lg shadow-black/30 hover:shadow-[#A594DC]/10';

      case 'Fermi Estimate':
        return 'card-fermi-estimate border border-[#76BCB2]/30 hover:border-[#76BCB2]/80 shadow-lg shadow-black/30 hover:shadow-[#76BCB2]/10';

      case 'Scientific':
        return 'card-scientific border border-[#74A9DF]/30 hover:border-[#74A9DF]/80 shadow-lg shadow-black/30 hover:shadow-[#74A9DF]/10';

      default:
        // Assuming border-zinc-800 for fallback, lighting up to a clean zinc-600
        return 'card-default border border-zinc-800 hover:border-zinc-600 shadow-lg shadow-black/30 hover:shadow-white/5';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-[#10B981]'; // emerald-500
      case 'Medium':
        return 'text-[#F59E0B]'; // amber-500
      case 'Hard':
        return 'text-[#EF4444]'; // red-500
      default:
        return 'text-zinc-500';
    }
  };

  return (
    <div
      // className={`relative rounded-xl p-5 min-h-[190px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-zinc-700/50 ${getCardBgClass()}`}
      className={`relative rounded-xl p-5 min-h-[190px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${getCardBgClass()}`}
    >
      {/* Top row with badges */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-300 bg-zinc-900 border border-zinc-800/80 px-2.5 py-1 rounded-md">
          {question.category_name}
        </span>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 font-mono">
          {progressStatus === 'solved' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/25 px-2 py-0.5 rounded-md">
              <Check size={10} strokeWidth={3} /> SOLVED
            </span>
          )}
          {progressStatus === 'retry' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/25 px-2 py-0.5 rounded-md">
              <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '4s' }} /> RETRY
            </span>
          )}
          {isNew && progressStatus === 'none' && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-white bg-white/10 border border-white/20 px-2 py-0.5 rounded-md">
              <Sparkles size={10} /> NEW
            </span>
          )}
        </div>
      </div>

      {/* Question prompt */}
      <div className="flex-grow flex items-center mb-4">
        <h3 className="font-serif italic text-white text-base sm:text-lg leading-relaxed line-clamp-3">
          "{question.question}"
        </h3>
      </div>

      {/* Bottom info row */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-600/60">
        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
          <ThumbsUp size={13} className="text-zinc-500" />
          <span className="font-mono">{question.upvotes || 0}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[11px] font-mono uppercase tracking-wider font-semibold ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>
          <button
            onClick={() => onPlay(question)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${progressStatus === 'solved'
              ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              : 'bg-white text-black hover:bg-zinc-200 shadow-md'
              }`}
            title="Open Challenge Workspace"
          >
            <Play size={10} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
