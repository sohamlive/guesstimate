import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, Filter, RefreshCw, BarChart2, Shield, Compass, ChevronRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const PublicHeroPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-300 font-sans ${isLight ? 'bg-[#FAFAFB] text-zinc-700 selection:bg-zinc-200 selection:text-black' : 'bg-[#0A0A0A] text-zinc-300 selection:bg-white selection:text-black'}`}>

      {/* Sophisticated Navigation Bar */}
      <header className={`sticky top-0 z-50 transition-all duration-300 backdrop-blur-md border-b ${isLight
        ? 'bg-white/80 border-zinc-200'
        : 'bg-bg-navbar border-zinc-600/40 shadow-lg shadow-black/20'
        }`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-serif italic font-black text-xl shadow-md ${isLight ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-950'
              }`}>
              G.
            </div>
            <span className={`font-serif italic text-2xl tracking-tight transition-colors ${isLight ? 'text-zinc-950' : 'text-zinc-100'
              }`}>
              Guesstimate Tracker.
            </span>
          </div>

          {/* Actions Action Ribbon */}
          <div className="flex items-center gap-3">

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 border transition-all duration-200 rounded-xl cursor-pointer ${isLight
                ? 'border-zinc-200 text-zinc-600 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900'
                : 'border-zinc-600/40 text-zinc-400 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 hover:text-amber-400'
                }`}
              title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isLight ? <Moon size={14} /> : <Sun size={14} />}
            </button>

            {/* Sign In Button - Redesigned to match layout ecosystem */}
            <button
              onClick={() => navigate('/login')}
              className={`px-4 py-2 border transition-all duration-200 rounded-xl text-sm font-bold cursor-pointer font-mono ${isLight
                ? 'border-zinc-200 text-zinc-600 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-900'
                : 'border-zinc-600/40 text-zinc-300 bg-zinc-900/40 hover:bg-zinc-800/60 hover:border-zinc-700 hover:text-white'
                }`}
            >
              Sign In
            </button>

          </div>
        </div>
      </header>

      {/* Main Hero Section with Drifting Grid Background */}
      <section className="relative flex-grow flex items-center pt-16 pb-16 px-6 hero-dot-drift">
        <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

          {/* Left Text Column */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">

            <h1 className={`font-serif italic leading-tight tracking-tight text-4xl sm:text-5xl lg:text-6xl backdrop-blur-[2px] ${isLight ? 'text-zinc-950' : 'text-white'}`}>
              Sharpen Your <br className="hidden sm:inline" />
              <span className={`not-italic font-sans font-light ${isLight ? 'text-zinc-550' : 'text-zinc-400'}`}>Guesstimate</span> Thinking.
            </h1>

            <p className={`font-sans text-sm sm:text-base lg:text-lg max-w-xl leading-relaxed backdrop-blur-[2px] ${isLight ? 'text-zinc-650' : 'text-zinc-450'}`}>
              From Enrico Fermi estimating an atomic blast's yield with scraps of paper in 1945, to modern market-sizing and scientific bounds. This is the home for your back-of-the-envelope calculations. Structure complex problems, filter by complexity, and map your progress.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4">
              <button
                onClick={() => navigate('/login')}
                className={`px-8 py-4 rounded-lg shadow-lg font-semibold text-base transition-all cursor-pointer text-center font-mono ${isLight ? 'bg-zinc-950 hover:bg-zinc-800 text-white' : 'bg-white hover:bg-zinc-200 text-black'}`}
              >
                Start Practising Now
              </button>
            </div>
          </div>

          {/* Right Column: Floating Mock Card Presentation */}
          <div className="lg:col-span-5 flex justify-center items-center hidden lg:block">
            <div className="relative w-full max-w-[380px] hover:scale-[1.02] transition-transform duration-500">

              {/* Back ambient circles */}
              <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-blue-500/5 dark:bg-white/5 blur-2xl"></div>
              <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-[#10B981]/5 blur-2xl"></div>

              {/* Floating Active Question Card Mock */}
              <div className={`relative rounded-xl border p-6 shadow-2xl z-10 transition-colors duration-300 ${isLight ? 'bg-white border-zinc-300' : 'bg-[#121212] border-zinc-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[12px] uppercase font-mono tracking-wider text-zinc-550 dark:text-zinc-500">
                    MARKET SIZING
                  </span>
                  <span className="text-[12px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-md font-mono">
                    RETRY
                  </span>
                </div>

                <div className="mb-6 min-h-[100px] flex items-center">
                  <h4 className={`font-serif italic text-lg leading-relaxed ${isLight ? 'text-zinc-950' : 'text-white'}`}>
                    "How many tennis balls are consumed annually in the Wimbledon tournament?"
                  </h4>
                </div>

                <div className={`border-t pt-3 flex items-center justify-between text-xs ${isLight ? 'border-zinc-200' : 'border-zinc-805/80'}`}>
                  <span className="text-zinc-500 font-mono">★ Medium Difficulty</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isLight ? 'bg-zinc-950 text-white hover:bg-zinc-800' : 'bg-white text-black hover:bg-zinc-200'}`}>
                    <Play size={10} fill="currentColor" className="ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Stack effect behind active card */}
              <div className={`absolute top-4 left-4 right-4 h-full border rounded-xl -z-10 shadow-lg transform rotate-2 transition-colors ${isLight ? 'bg-white border-zinc-200/80' : 'bg-bg-card/90 border-zinc-700/60'}`}></div>
              <div className={`absolute top-8 left-8 right-8 h-full border rounded-xl -z-20 shadow-md transform -rotate-3 transition-colors ${isLight ? 'bg-white/65 border-zinc-200/40' : 'bg-bg-card/70 border-zinc-700/30'}`}></div>

            </div>
          </div>

        </div>
      </section>

      {/* Stats Counter Panel Strip */}
      <section className={`border-t transition-colors duration-300 py-8 px-6 ${isLight ? 'bg-zinc-100/50 border-zinc-250 text-zinc-850' : 'bg-bg-canvas border-zinc-600/40 text-white'}`}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center font-mono">
          <div>
            <span className="font-sans italic font-extrabold text-3xl sm:text-4xl block">50+</span>
            <span className="text-[12px] text-zinc-400 block uppercase tracking-widest mt-3">Questions</span>
          </div>
          <div>
            <span className="font-sans italic font-extrabold text-3xl sm:text-4xl block">5</span>
            <span className="text-[12px] text-zinc-400 block uppercase tracking-widest mt-3">Categories</span>
          </div>
          <div>
            <span className="font-sans italic font-extrabold text-3xl sm:text-4xl block">3</span>
            <span className="text-[12px] text-zinc-400 block uppercase tracking-widest mt-3">Difficulty Levels</span>
          </div>
          <div>
            <span className="font-sans italic font-extrabold text-3xl sm:text-4xl block">100%</span>
            <span className="text-[12px] text-zinc-400 block uppercase tracking-widest mt-3">Personal Progress Tracker</span>
          </div>
        </div>
      </section>

      {/* Details walkthrough: How It Works */}
      {/* <section id="details-section" className="py-20 px-6 bg-[#0D0D0D] border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase font-mono font-bold tracking-widest text-zinc-400">COGNITIVE STEPPERS</span>
            <h2 className="font-serif italic text-white text-3xl sm:text-4xl block mt-2">
              Optimize Your Fermi Loop.
            </h2>
            <p className="text-zinc-500 mt-3 text-sm sm:text-base font-sans leading-relaxed">
              We make structured estimations frictionless. Learn to build rapid mathematical models visually under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">*/}

      {/* Step 1 */}
      {/* <div className="flex flex-col gap-4 p-6 bg-[#0A0A0A] border border-zinc-800 rounded-xl relative group hover:border-[#27272A] transition-colors">
        <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center text-white border border-zinc-800/60 font-serif italic text-lg mb-2">
          01
        </div>
        <h4 className="font-serif italic text-white text-lg">
          Browse & Filter
        </h4>
        <p className="text-xs sm:text-sm text-zinc-450 leading-relaxed font-sans">
          Browse our curated repository. Filter questions dynamically based on classification topics (e.g. Population models) or difficulty parameters.
        </p>
      </div> */}

      {/* Step 2 */}
      {/* <div className="flex flex-col gap-4 p-6 bg-[#0A0A0A] border border-zinc-800 rounded-xl relative group hover:border-[#27272A] transition-colors">
        <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center text-white border border-zinc-800/60 font-serif italic text-lg mb-2">
          02
        </div>
        <h4 className="font-serif italic text-white text-lg">
          Log Workings & Estimates
        </h4>
        <p className="text-xs sm:text-sm text-zinc-450 leading-relaxed font-sans">
          Boot up the interactive canvas. Jot down core assumptions, outline multiplication steps, and query integrated citation references.
        </p>
      </div> */}

      {/* Step 3 */}
      {/* <div className="flex flex-col gap-4 p-6 bg-[#0A0A0A] border border-zinc-800 rounded-xl relative group hover:border-[#27272A] transition-colors">
        <div className="w-12 h-12 rounded-lg bg-zinc-900 flex items-center justify-center text-white border border-zinc-800/60 font-serif italic text-lg mb-2">
          03
        </div>
        <h4 className="font-serif italic text-white text-lg">
          Track & Perfect
        </h4>
        <p className="text-xs sm:text-sm text-zinc-450 leading-relaxed font-sans">
          Mark queries solved, or log retries for difficult calculations. Monitor detailed analytics through your personal visual breakout boards.
        </p>
      </div> */}

      {/* </div>

        </div >
      </section > */}

      {/* Category Showcases Section */}
      {/* <section className="py-20 px-6 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs uppercase font-mono tracking-widest text-zinc-500">CATEGORICAL THEMES</span>
            <h2 className="font-serif italic text-white text-3xl sm:text-4xl block mt-2">
              Deep-Dive By Question Genre.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Population theme */}
      {/* <div className="p-6 bg-[#121212] border border-zinc-800/80 rounded-xl flex flex-col gap-3 hover:border-zinc-700 hover:bg-[#141414] transition-all">
        <div className="w-10 h-10 rounded-lg bg-[#0F0C0B] flex items-center justify-center text-[#F5C4AD] border border-[#F5C4AD]/10">
          <Compass size={18} className="text-[#ED946D]" style={{ color: '#ED946D' }} />
        </div>
        <h4 className="font-serif italic text-lg text-white">Population</h4>
        <p className="text-xs text-zinc-500 font-sans leading-relaxed">
          Analyze demographic sizes, density coefficients, and target geographical coordinates.
        </p>
      </div> */}

      {/* Market Sizing theme */}
      {/* <div className="p-6 bg-[#121212] border border-zinc-800/80 rounded-xl flex flex-col gap-3 hover:border-zinc-700 hover:bg-[#141414] transition-all">
        <div className="w-10 h-10 rounded-lg bg-[#0C0B10] flex items-center justify-center border border-[#A594DC]/10">
          <BarChart2 size={18} className="text-[#A594DC]" style={{ color: '#A594DC' }} />
        </div>
        <h4 className="font-serif italic text-lg text-white">Market Sizing</h4>
        <p className="text-xs text-zinc-500 font-sans leading-relaxed">
          Estimate sales volume, consumer loops, device counts, and commercial potentials.
        </p>
      </div> */}

      {/* Fermi Estimate theme */}
      {/* <div className="p-6 bg-[#121212] border border-zinc-800/80 rounded-xl flex flex-col gap-3 hover:border-zinc-700 hover:bg-[#141414] transition-all">
        <div className="w-10 h-10 rounded-lg bg-[#0B0E0D] flex items-center justify-center border border-[#76BCB2]/10">
          <RefreshCw size={18} className="text-[#76BCB2]" style={{ color: '#76BCB2' }} />
        </div>
        <h4 className="font-serif italic text-lg text-white">Fermi Estimate</h4>
        <p className="text-xs text-zinc-500 font-sans leading-relaxed">
          Practice clean dimensional analyses and multiplication bounds under strict uncertainties.
        </p>
      </div> */}

      {/* Scientific theme */}
      {/* <div className="p-6 bg-[#121212] border border-zinc-800/80 rounded-xl flex flex-col gap-3 hover:border-zinc-700 hover:bg-[#141414] transition-all">
        <div className="w-10 h-10 rounded-lg bg-[#0B0C0E] flex items-center justify-center border border-[#74A9DF]/10">
          <Sparkles size={18} className="text-[#74A9DF]" style={{ color: '#74A9DF' }} />
        </div>
        <h4 className="font-serif italic text-lg text-white">Scientific</h4>
        <p className="text-xs text-zinc-500 font-sans leading-relaxed">
          Compute physical matrices, atmosphere masses, biology weights, and geometric distances.
        </p>
      </div> */}

      {/* </div >

        </div >
      </section > */}

      {/* Footer banner block */}
      <footer className={`border-t flex justify-between py-4 px-6 text-justify text-[12px] font-mono tracking-widest mt-auto shrink-0 transition-colors duration-300 ${isLight ? 'bg-zinc-100 border-zinc-200 text-zinc-500' : 'bg-bg-base border-zinc-600 text-zinc-400'}`}>
        <div className="max-w-6xl flex justify-between items-center w-full mx-auto">
          <p>&copy; 2026 Soham Banerjee. Version 1.0</p>
          <p>PLAY.SIDELOWER.IN</p>
        </div>
      </footer>

    </div >
  );
};
