import React from 'react';
//import { Question, ProgressStatus } from '../types';
//import { Play, ThumbsUp, Check, RefreshCw, Sparkles } from 'lucide-react';
import { Question, ProgressStatus, VoteType } from '../types';
import { Play, ThumbsUp, ThumbsDown, Check, RefreshCw, Sparkles } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface DotGridCardProps {
  question: Question;
  progressStatus: ProgressStatus;
  isNew: boolean;
  onPlay: (question: Question) => void;
  currentUserVote?: VoteType | null;
  onToggleStatus?: (questionId: string, currentStatus: ProgressStatus, targetStatus: ProgressStatus) => void;
  onToggleVote?: (questionId: string, currentUserVote: VoteType | null, targetVote: VoteType) => void;

}

export const DotGridCard: React.FC<DotGridCardProps> = ({
  question,
  progressStatus,
  isNew,
  onPlay,
  currentUserVote = null,
  onToggleStatus,
  onToggleVote,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

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

  // ------------------------------
  // GOOD CARD BACKGROUND
  // ------------------------------
  // const getCardBgClass = () => {
  //   if (progressStatus === 'solved') {
  //     return 'card-solved border border-zinc-300 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm';
  //   }

  //   switch (question.category_name) {
  //     case 'Population':
  //       return 'card-population border border-[#ED946D]/30 hover:border-[#ED946D]/80 shadow-lg shadow-black/30 hover:shadow-[#ED946D]/10';

  //     case 'Market Sizing':
  //       return 'card-market-sizing border border-[#A594DC]/30 hover:border-[#A594DC]/80 shadow-lg shadow-black/30 hover:shadow-[#A594DC]/10';

  //     case 'Fermi Estimate':
  //       return 'card-fermi-estimate border border-[#76BCB2]/30 hover:border-[#76BCB2]/80 shadow-lg shadow-black/30 hover:shadow-[#76BCB2]/10';

  //     case 'Scientific':
  //       return 'card-scientific border border-[#74A9DF]/30 hover:border-[#74A9DF]/80 shadow-lg shadow-black/30 hover:shadow-[#74A9DF]/10';

  //     default:
  //       // Assuming border-zinc-800 for fallback, lighting up to a clean zinc-600
  //       return 'card-default border border-zinc-300 dark:border-zinc-800 hover:border-zinc-450 dark:hover:border-zinc-600 shadow-lg shadow-black/30 hover:shadow-white/5';
  //   }
  // };

  const getCardBgClass = () => {
    if (progressStatus === 'solved') {
      // Solved state uses a subtle white glow in dark mode so it stands out calmly, rather than a colored glow
      return 'card-solved border border-zinc-300 dark:border-zinc-800/80 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm dark:shadow-white/[0.02] dark:hover:shadow-white/[0.06]';
    }

    switch (question.category_name) {
      case 'Population':
        return 'card-population border border-[#ED946D]/30 hover:border-[#ED946D]/80 shadow-lg shadow-black/30 dark:shadow-[#ED946D]/5 hover:shadow-[#ED946D]/10 dark:hover:shadow-[#ED946D]/20';

      case 'Market Sizing':
        return 'card-market-sizing border border-[#A594DC]/30 hover:border-[#A594DC]/80 shadow-lg shadow-black/30 dark:shadow-[#A594DC]/5 hover:shadow-[#A594DC]/10 dark:hover:shadow-[#A594DC]/20';

      case 'Fermi Estimate':
        return 'card-fermi-estimate border border-[#76BCB2]/30 hover:border-[#76BCB2]/80 shadow-lg shadow-black/30 dark:shadow-[#76BCB2]/5 hover:shadow-[#76BCB2]/10 dark:hover:shadow-[#76BCB2]/20';

      case 'Scientific':
        return 'card-scientific border border-[#74A9DF]/30 hover:border-[#74A9DF]/80 shadow-lg shadow-black/30 dark:shadow-[#74A9DF]/5 hover:shadow-[#74A9DF]/10 dark:hover:shadow-[#74A9DF]/20';

      default:
        // Fixed the invalid 'hover:border-zinc-450' to standard 'hover:border-zinc-400'
        // Uses a generic soft white/zinc halo in dark mode
        return 'card-default border border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 shadow-lg shadow-black/30 dark:shadow-white/[0.02] hover:shadow-zinc-400/10 dark:hover:shadow-white/[0.08]';
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
        <span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border ${isLight
          ? 'text-zinc-800 bg-zinc-100/50 border-zinc-300'
          : 'text-zinc-300 bg-zinc-900/50 border-zinc-700'
          }`}>
          {question.category_name}
        </span>

        {/* Status badges */}
        <div className="flex items-center gap-1.5 font-mono">
          {progressStatus === 'solved' && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${isLight
              ? 'text-[#047857] bg-[#E6F4EA] border-[#047857]/30'
              : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25'
              }`}>
              <Check size={10} strokeWidth={3} /> SOLVED
            </span>
          )}
          {progressStatus === 'retry' && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border animate-pulse ${isLight
              ? 'text-[#B45309] bg-[#FEF3C7] border-[#B45309]/30'
              : 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/25'
              }`}>
              <RefreshCw size={10} className="animate-spin" style={{ animationDuration: '4s' }} /> RETRY
            </span>
          )}
          {isNew && progressStatus === 'none' && (
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${isLight
              ? 'text-zinc-850 bg-zinc-200 border-zinc-350 shadow-sm'
              : 'text-white bg-white/10 border-white/20'
              }`}>
              <Sparkles size={10} /> NEW
            </span>
          )}
        </div>
      </div>

      {/* Question prompt */}
      <div className="grow flex items-center mb-5">
        <h3 className={`font-serif text-base sm:text-lg leading-relaxed line-clamp-3 ${isLight ? 'text-zinc-900' : 'text-white'
          }`}>
          "{question.question}"
        </h3>
      </div>

      {/* Bottom info row */}
      {/* <div className="flex items-center justify-between mt-auto pt-3 border-t border-zinc-600/60">
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
      </div> */}


      {/* Bottom info row with Interactive Controls */}
      <div className={`flex flex-wrap items-center justify-between gap-y-3 gap-x-1.5 mt-auto pt-3 border-t select-none ${isLight ? 'border-zinc-400' : 'border-zinc-700'
        }`}>

        {/* Left Side: Upvote / Downvote Capsule */}
        <div className={`flex items-center gap-1 rounded-lg p-0.5 font-mono text-xs ${isLight
          ? 'bg-zinc-100 border border-zinc-400'
          : 'bg-zinc-950 border border-zinc-700'
          }`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVote?.(question.id, currentUserVote, 'up');
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer border border-transparent ${currentUserVote === 'up'
              ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30 font-bold'
              : (isLight
                ? 'text-zinc-605 hover:text-zinc-900 hover:bg-zinc-200/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900')
              }`}
            title={currentUserVote === 'up' ? 'Remove Upvote' : 'Upvote Challenge'}
          >
            <ThumbsUp size={11} fill={currentUserVote === 'up' ? 'currentColor' : 'none'} />
            <span className="text-[10px]">{question.upvotes || 0}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVote?.(question.id, currentUserVote, 'down');
            }}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer border border-transparent ${currentUserVote === 'down'
              ? 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30 font-bold'
              : (isLight
                ? 'text-zinc-605 hover:text-zinc-900 hover:bg-zinc-200/50'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900')
              }`}
            title={currentUserVote === 'down' ? 'Remove Downvote' : 'Downvote Challenge'}
          >
            <ThumbsDown size={11} fill={currentUserVote === 'down' ? 'currentColor' : 'none'} />
            {question.downvotes > 0 && (
              <span className="text-[10px]">{question.downvotes}</span>
            )}
          </button>
        </div>

        {/* Right Side: Solved/Retry Toggle Pill & Play Button */}
        <div className="flex items-center justify-between gap-2.5">

          {/* Solved / Retry Action Box */}
          <div className={`flex items-center gap-1 rounded-lg p-0.5 font-mono text-xs ${isLight
            ? 'bg-zinc-100 border border-zinc-400'
            : 'bg-zinc-950 border border-zinc-700'
            }`}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(question.id, progressStatus, 'solved');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer text-[9px] font-bold uppercase border border-transparent ${progressStatus === 'solved'
                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/25 font-bold'
                : (isLight
                  ? 'text-zinc-605 hover:text-zinc-900 hover:bg-zinc-200/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900')
                }`}
              title={progressStatus === 'solved' ? 'Unmark Solved' : 'Mark as Solved'}
            >
              <Check size={11} strokeWidth={3} />
              <span className="hidden xs:inline">SOLVE</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(question.id, progressStatus, 'retry');
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all cursor-pointer text-[9px] font-bold uppercase border border-transparent ${progressStatus === 'retry'
                ? 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25 font-bold'
                : (isLight
                  ? 'text-zinc-605 hover:text-zinc-900 hover:bg-zinc-200/50'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900')
                }`}
              title={progressStatus === 'retry' ? 'Unmark Retry' : 'Flag for Retry'}
            >
              <RefreshCw size={10} strokeWidth={3} className={progressStatus === 'retry' ? 'animate-spin' : ''} style={{ animationDuration: '6s' }} />
              <span className="hidden xs:inline">RETRY</span>
            </button>
          </div>

          <span className={`text-[12px] font-mono uppercase tracking-wider font-bold ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlay(question);
            }}
            className={`w-7.5 h-7.5 rounded-full flex items-center justify-center transition-all cursor-pointer border ${isLight
              ? (progressStatus === 'solved'
                ? 'bg-zinc-150 border-zinc-250 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 font-bold'
                : 'bg-zinc-900 border-zinc-900 text-white hover:bg-zinc-800'
              )
              : (progressStatus === 'solved'
                ? 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white'
                : 'bg-white border-white text-black hover:bg-zinc-200 shadow-md'
              )
              } mt-0.5 hover:scale-105`}
            title="Open Challenge Workspace"
          >
            <Play size={10} fill="currentColor" className="ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
