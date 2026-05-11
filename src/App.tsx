/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flame, 
  Skull, 
  Heart, 
  ShieldAlert, 
  Share2, 
  RotateCcw, 
  ChevronRight, 
  MessageSquareHeart,
  TrendingDown,
  ExternalLink,
  Copy,
  Download,
  AlertTriangle,
  Zap,
  Info,
  ShieldCheck,
  FileText,
  Lock,
  ArrowLeft,
  User as UserIcon,
  LogOut,
  History
} from 'lucide-react';
import { scanRelationship, ScanMode, ScanResult, ReportCard as ReportCardType } from './services/geminiService';
import { PRIVACY_POLICY, TERMS_OF_SERVICE, DISCLAIMER } from './constants/legal';
import { BREAKUP_STORIES, type BreakupStory } from './constants/stories';
import Markdown from 'react-markdown';
import { auth, db } from './lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp,
  addDoc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { OperationType, handleFirestoreError } from './lib/firebaseUtils';

// --- Components ---

const FloatingEmoji = ({ emoji, delay, x, size }: { emoji: string; delay: number; x: string; size: string; key?: number | string }) => (
  <motion.div
    initial={{ y: '110vh', opacity: 0 }}
    animate={{ 
      y: '-10vh', 
      opacity: [0, 1, 1, 0],
      x: [x, `${parseFloat(x) + (Math.random() * 20 - 10)}%`]
    }}
    transition={{ 
      duration: 15, 
      repeat: Infinity, 
      delay, 
      ease: "linear" 
    }}
    className={`absolute pointer-events-none select-none ${size} z-0 filter blur-[1px] opacity-30`}
    style={{ left: x }}
  >
    {emoji}
  </motion.div>
);

const Background = () => {
  const emojis = ['🚩', '😭', '💀', '🤡', '☠️', '💔', '🔪', '🥀', '🔥', '🤌'];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute inset-0 bg-[#080808]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d] via-transparent to-[#080808] opacity-60" />
      <div className="absolute inset-0 toxic-gradient opacity-[0.03] mix-blend-overlay" />
      {Array.from({ length: 12 }).map((_, i) => (
        <FloatingEmoji 
          key={i} 
          emoji={emojis[i % emojis.length]} 
          delay={i * 2.5} 
          x={`${Math.random() * 100}%`}
          size={i % 3 === 0 ? 'text-3xl' : i % 2 === 0 ? 'text-xl' : 'text-lg'}
        />
      ))}
    </div>
  );
};

const Header = ({ onStoriesClick }: { 
  onStoriesClick: () => void; 
}) => (
  <nav className="relative z-50 flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3 cursor-pointer"
      onClick={() => window.location.href = '/'}
    >
      <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.1)]">
        <ShieldAlert className="text-black w-5 h-5" />
      </div>
      <span className="font-black text-lg tracking-widest uppercase text-white">RedFlag<span className="text-rose-600">Scanner</span></span>
    </motion.div>
    
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-4 md:gap-6"
    >
      <button 
        onClick={onStoriesClick}
        className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-rose-950/30 border border-rose-900/20 text-rose-500 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-rose-900/40 transition-all group"
      >
        Breakup Stories 💔
      </button>
      
      <div className="flex items-center gap-2 px-4 py-2 glass border-zinc-800 rounded-full">
        <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse" />
        <span className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">Neural Mode active</span>
      </div>
    </motion.div>
  </nav>
);

const DynamicHeroText = () => {
  return (
    <div className="min-h-[120px] md:min-h-[160px] flex items-center justify-center py-4">
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-4xl md:text-8xl font-black tracking-tighter leading-[1] text-center uppercase max-w-4xl"
      >
        <span className="text-zinc-100">CHECK YOUR </span>
        <span className="text-gradient">KATNE KA </span>
        <span className="text-zinc-100">CHANCE 🔪</span>
      </motion.h1>
    </div>
  );
};

const ToxicityMeter = ({ score }: { score: number }) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">Toxicity Index</span>
        <span className={`text-2xl font-black tracking-tighter ${score > 70 ? 'text-rose-600' : score > 40 ? 'text-orange-500' : 'text-emerald-500'}`}>
          {score}%
        </span>
      </div>
      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/[0.05]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 2, ease: "circOut" }}
          className={`h-full ${score > 70 ? 'bg-rose-600' : score > 40 ? 'bg-orange-500' : 'bg-emerald-500'} shadow-[0_0_15px_rgba(225,29,72,0.3)]`}
        />
      </div>
    </div>
  );
};

const ReportCard = ({ card, index }: { card: ReportCardType; index: number; key?: number | string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.5 + 0.1 * index, type: "spring", damping: 15 }}
    className="glass p-4 flex flex-col items-center justify-center text-center space-y-1 group hover:bg-white/[0.05] transition-all cursor-default border-white/[0.05] hover:border-white/[0.1] rounded-2xl"
  >
    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform filter grayscale group-hover:grayscale-0">{card.emoji}</span>
    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-black leading-none">{card.title}</span>
    <span className="text-sm font-black text-white uppercase tracking-tighter">{card.value}</span>
  </motion.div>
);

const ScanResultView = ({ result, onReset, partnerName, partnerGender }: { result: ScanResult; onReset: () => void; partnerName: string; partnerGender: string; key?: string }) => {
  const resultRef = useRef<HTMLDivElement>(null);
  const [revealIndex, setRevealIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRevealIndex(prev => prev < result.reportCards.length ? prev + 1 : prev);
    }, 400);
    return () => clearInterval(timer);
  }, [result]);

  const getAlias = () => {
    if (partnerGender === 'Female') return 'Meri Bali';
    if (partnerGender === 'Male') return 'Mere Bala';
    return 'Mera Partner';
  };

  const sanitizeText = (text: string) => {
    if (!partnerName) return text;
    // escape regex special characters in name
    const escapedName = partnerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedName, 'gi');
    return text.replace(regex, getAlias());
  };

  const handleShareWhatsApp = () => {
    const verdict = sanitizeText(result.verdict);
    const commentary = sanitizeText(result.savageCommentary);
    
    const shareText = `Bhai/Behen, mera relationship scan ka result aa gaya! 🚩💀\n\nVerdict: ${verdict}\n\nAnalysis: "${commentary}"\n\nKatne ka Chance: ${result.katneKaChance.percentage}% 🔪\n\nScan your own risk before it's too late: ${window.location.origin}\n#RedFlagScanner #KatneKaChance`;
    const encodedText = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleCopy = () => {
    const verdict = sanitizeText(result.verdict);
    const commentary = sanitizeText(result.savageCommentary);
    
    const text = `🚩 Neural Red Flag Scan Result 🚩\n\nVerdict: ${verdict}\n\n"${commentary}"\n\nToxicity: ${result.toxicityScore}% 💀\n\nAnalyze your disaster at: ${window.location.origin}\n\n*AIS Report - Entertainment Only*`;
    navigator.clipboard.writeText(text);
    alert('Diagnostics copied to clipboard! (Name hidden for privacy) 🚩');
  };

  const getToxicityColor = (score: number) => {
    if (score > 80) return 'text-rose-600';
    if (score > 50) return 'text-orange-500';
    return 'text-emerald-500';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto w-full space-y-8 pb-32 px-4"
    >
      <div ref={resultRef} className="glass-card neon-border p-5 md:p-8 space-y-10 relative overflow-hidden backdrop-blur-3xl">
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-rose-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-purple-600/10 blur-[120px] rounded-full" />

        {/* Diagnostic Seal */}
        <div className="flex justify-center -mt-12 mb-4">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="w-16 h-16 bg-zinc-950 border border-white/10 rounded-full flex items-center justify-center shadow-2xl relative z-20"
          >
            <ShieldAlert className="w-8 h-8 text-rose-600" />
            <div className="absolute inset-0 rounded-full border border-rose-600/20 animate-ping opacity-20" />
          </motion.div>
        </div>

        <div className="space-y-6 text-center relative z-10">
          <motion.h2 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase text-gradient"
          >
            {result.openingReaction}
          </motion.h2>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="relative"
          >
            <p className="text-zinc-400 text-lg md:text-xl leading-relaxed font-bold max-w-lg mx-auto">
              {result.analysis}
            </p>
          </motion.div>
        </div>

        <div className="p-5 md:p-8 bg-black/60 rounded-[2rem] md:rounded-[3rem] border border-white/5 space-y-10 relative z-10 backdrop-blur-md">
          <ToxicityMeter score={result.toxicityScore} />
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {result.reportCards.slice(0, revealIndex).map((card, i) => (
              <ReportCard key={i} card={card} index={i} />
            ))}
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="space-y-4 relative z-10"
        >
          <div className="flex items-center gap-2 px-2 text-rose-600/60 justify-center">
            <Zap className="w-3 h-3 fill-current" />
            <span className="font-black uppercase tracking-[0.4em] text-[8px]">Inevitability Quotient</span>
          </div>
          <div className="glass p-5 md:p-8 bg-rose-600/10 border-rose-600/40 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group rounded-[2.5rem] shadow-[0_0_50px_rgba(225,29,72,0.1)]">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-600/5 to-transparent pointer-events-none" />
            <div className="relative z-10 text-center md:text-left">
              <span className="text-6xl md:text-7xl font-black text-rose-600 tracking-tighter block mb-1 drop-shadow-[0_0_15px_rgba(225,29,72,0.5)]">
                {result.katneKaChance.percentage}%
              </span>
              <p className="text-sm text-zinc-300 font-black uppercase tracking-[0.2em] max-w-[200px]">{result.katneKaChance.message}</p>
            </div>
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 5 }}
              className="relative z-10 w-28 h-28 rounded-full border border-rose-600/30 flex items-center justify-center bg-zinc-950 shadow-[0_0_30px_rgba(225,29,72,0.2)]"
            >
              <div 
                className="absolute inset-0 rounded-full border-4 border-rose-600 shadow-[0_0_30px_rgba(225,29,72,0.6)]" 
                style={{ clipPath: `inset(${100 - result.katneKaChance.percentage}% 0 0 0)`, transition: 'clip-path 2s ease-out' }}
              />
              <Skull className="w-12 h-12 text-rose-600 animate-pulse" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="p-6 md:p-10 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] md:rounded-[3rem] text-center relative overflow-hidden group hover:border-rose-600/20 transition-colors"
        >
          <div className="absolute top-4 left-6 opacity-20 text-4xl font-black text-rose-600 select-none italic">"</div>
          <p className="text-white font-black text-2xl md:text-3xl relative z-10 tracking-tight leading-snug">
            {result.savageCommentary}
          </p>
          <div className="absolute bottom-4 right-6 opacity-20 text-4xl font-black text-rose-600 select-none italic rotate-180">"</div>
        </motion.div>

        <div className="text-center pt-16 pb-12 relative z-10 w-full flex justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center w-full max-w-xl"
          >
            <div className="mb-10 flex flex-col items-center gap-2">
              <span className="text-[10px] md:text-[12px] uppercase tracking-[1em] text-zinc-800 font-black italic">Neural Classification Seal</span>
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
            </div>

            <div className="relative group">
              {/* Primary Stamp Circle */}
              <div className="bg-white text-black w-72 h-72 md:w-[400px] md:h-[400px] rounded-full shadow-[0_50px_100px_-20px_rgba(255,255,255,0.2)] relative z-10 border-[16px] border-zinc-100 flex flex-col items-center justify-center p-8 md:p-12 transform group-hover:scale-[1.02] transition-all duration-700">
                
                {/* Auth Decor */}
                <div className="absolute top-10 md:top-16 opacity-20 hidden md:block">
                   <div className="flex items-center gap-2">
                     <div className="h-[2px] w-6 bg-black" />
                     <span className="text-[8px] font-black tracking-widest">A-2026/X</span>
                     <div className="h-[2px] w-6 bg-black" />
                   </div>
                </div>

                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <p className="text-xl md:text-3xl font-black tracking-tight uppercase leading-[1] text-center w-full break-words">
                    {result.verdict}
                  </p>
                </motion.div>

                {/* Bottom Decor */}
                <div className="absolute bottom-10 md:bottom-16 opacity-20 hidden md:block">
                   <div className="flex items-center gap-2">
                     <div className="h-[2px] w-6 bg-black" />
                     <span className="text-[8px] font-black tracking-widest">CERTIFIED DISASTER</span>
                     <div className="h-[2px] w-6 bg-black" />
                   </div>
                </div>
              </div>

              {/* The "Red Flag" Seal */}
              <div className="absolute -bottom-6 -right-6 md:-bottom-10 md:-right-10 w-20 h-20 md:w-28 md:h-28 bg-rose-600 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(225,29,72,0.4)] z-20 border-[6px] md:border-[10px] border-[#080808] -rotate-15 group-hover:rotate-0 transition-transform duration-500">
                <Skull className="w-8 h-8 md:w-12 md:h-12 text-white" />
              </div>

              {/* Secondary Icon badge */}
              <div className="absolute -top-4 -left-4 md:-top-8 md:-left-8 w-12 h-12 md:w-16 md:h-16 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl z-20 border-4 border-white/5 rotate-12 group-hover:rotate-0 transition-transform duration-500">
                <ShieldAlert className="w-6 h-6 md:w-8 md:h-8 text-rose-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Motivational Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="p-6 bg-emerald-950/10 border border-emerald-900/20 rounded-2xl text-center relative overflow-hidden"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-500/60">AI Advisory Bulletin</span>
          </div>
          <p className="text-emerald-400 font-bold text-xs md:text-sm leading-relaxed">
            {result.motivationalMessage}
          </p>
        </motion.div>

        {/* Safety Disclaimer Card */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 p-6 glass-card border-rose-950/20 bg-rose-950/5 rounded-2xl relative overflow-hidden"
        >
          <div className="flex items-start gap-4 text-left">
            <div className="mt-1">
              <Info className="w-5 h-5 text-rose-800" />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-800/60 block">Entertainment Analysis Only</span>
              <p className="text-[10px] text-zinc-500 font-bold leading-relaxed">
                This AI-generated postmortem is for humor and entertainment purposes only. Results may be exaggerated or inaccurate. Detects vibes, not verified facts. 💀
              </p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-2 opacity-5">
             <ShieldCheck className="w-12 h-12 text-rose-600" />
          </div>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <button 
          onClick={handleShareWhatsApp}
          className="flex-1 flex items-center justify-center gap-3 p-6 bg-[#25D366] text-white rounded-2xl hover:bg-[#128C7E] transition-all font-black uppercase text-xs tracking-widest shadow-2xl group"
        >
          <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Share on WhatsApp</span>
        </button>
        <button 
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-3 p-6 glass border-white/10 text-white rounded-2xl hover:bg-white/5 transition-all font-black uppercase text-xs tracking-widest group"
        >
          <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span>New Investigation</span>
        </button>
      </div>

      <div className="flex justify-center gap-8 pt-4">
        {['WhatsApp', 'Instagram', 'Twitter'].map(plat => (
          <button 
            key={plat} 
            onClick={() => plat === 'WhatsApp' ? handleShareWhatsApp() : handleCopy()}
            className="flex flex-col items-center gap-2 group"
          >
            <div className="w-12 h-12 glass rounded-full flex items-center justify-center group-hover:bg-white/10 transition-colors border-white/5">
              <Share2 className="w-5 h-5 text-zinc-400 group-hover:text-white" />
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400">{plat}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};

const LoadingView = () => {
  const [msgIdx, setMsgIdx] = useState(0);
  const messages = [
    "Initializing forensic autopsy...",
    "Extracting betrayal DNA...",
    "Scanning emotional crime scene...",
    "Tracing red flag origin...",
    "Analyzing heartbreak trajectory...",
    "Consulting local trauma specialists...",
    "Calibrating roast intensity...",
    "Drafting final causality report..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-12">
      <div className="relative">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full border border-white/[0.03] border-t-rose-700 shadow-xl"
        />
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 flex items-center justify-center text-3xl filter grayscale"
        >
          🚩
        </motion.div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={msgIdx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-xs font-black uppercase tracking-[0.4em] text-zinc-500"
        >
          {messages[msgIdx]}
        </motion.p>
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-10"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="px-6 py-2 bg-rose-600/10 border border-rose-600/30 rounded-full flex items-center gap-3 shadow-[0_0_20px_rgba(225,29,72,0.1)]">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">
              Approved by the International Red Flag Association 🚩
            </span>
          </div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-800">
            Certificate ID: IRFA-2026-69420-ROAST
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const LegalView = ({ type, onBack }: { type: 'privacy' | 'terms' | 'disclaimer'; onBack: () => void }) => {
  const content = {
    privacy: PRIVACY_POLICY,
    terms: TERMS_OF_SERVICE,
    disclaimer: DISCLAIMER
  }[type];

  const titles = {
    privacy: 'Privacy Encryption',
    terms: 'Registry Terms',
    disclaimer: 'Official Disclaimer'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-3xl mx-auto px-4"
    >
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-white mb-10 font-black text-[10px] uppercase tracking-widest group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Return to Neutral Zone
      </button>

      <div className="glass-card p-8 md:p-16 border-white/5 backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/5 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-4 border-b border-white/10 pb-8">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <FileText className="text-zinc-400 w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tighter">{titles[type]}</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">Secure Protocol Document</p>
            </div>
          </div>

          <div className="markdown-body prose prose-invert prose-zinc max-w-none prose-h1:text-3xl prose-h1:font-black prose-h1:uppercase prose-h1:tracking-tighter prose-h2:text-xl prose-h2:font-black prose-h2:uppercase prose-h2:tracking-tight prose-p:text-zinc-400 prose-p:font-bold prose-p:leading-relaxed prose-strong:text-white">
            <Markdown>{content}</Markdown>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const BreakupStoriesView = ({ onBack }: { onBack: () => void }) => {
  const [selectedStory, setSelectedStory] = useState<BreakupStory | null>(null);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      <AnimatePresence mode="wait">
        {!selectedStory ? (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-12"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
              <div className="space-y-4">
                <button 
                  onClick={onBack}
                  className="flex items-center gap-2 text-zinc-500 hover:text-white font-black text-[10px] uppercase tracking-widest group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Escape to Mainframe
                </button>
                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                  Emotional <span className="text-rose-600 italic">Damage</span> Archive 💀
                </h2>
                <p className="text-zinc-500 font-bold text-sm tracking-[0.05em]">India's Unofficial Breakup Database & Character Development Records</p>
              </div>

              <div className="flex gap-4">
                 <div className="glass px-4 py-2 rounded-full border-white/5 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Verified Disasters</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {BREAKUP_STORIES.map((story) => (
                <motion.div
                  key={story.id}
                  whileHover={{ y: -5 }}
                  className="glass-card p-8 border-white/5 space-y-6 flex flex-col bg-black/40 group hover:border-rose-600/30 transition-all cursor-pointer"
                  onClick={() => setSelectedStory(story)}
                >
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-rose-500 uppercase tracking-widest border border-white/5">
                      {story.category}
                    </span>
                    <div className="flex gap-1">
                      {story.reactions.map((r, i) => <span key={i} className="text-sm grayscale group-hover:grayscale-0 transition-all">{r}</span>)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-rose-500 transition-colors">{story.title}</h3>
                    <p className="text-zinc-500 text-xs font-bold leading-relaxed line-clamp-3 italic">"{story.preview}"</p>
                  </div>

                  <div className="pt-4 mt-auto border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-rose-600" />
                      <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Toxicity: {story.toxicityScore}%</span>
                    </div>
                    <button className="text-[10px] font-black uppercase text-white tracking-[0.2em] flex items-center gap-2 group/btn">
                      Read File
                      <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-3xl mx-auto space-y-10"
          >
             <button 
                onClick={() => setSelectedStory(null)}
                className="flex items-center gap-2 text-zinc-500 hover:text-white font-black text-[10px] uppercase tracking-widest group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to Archives
              </button>

              <div className="glass-card p-10 md:p-16 border-white/5 relative overflow-hidden backdrop-blur-3xl bg-black/60">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Skull className="w-32 h-32 text-rose-600" />
                 </div>
                 
                 <div className="relative z-10 space-y-10 text-left">
                    <div className="space-y-4">
                       <span className="text-rose-600 font-black text-[10px] uppercase tracking-[0.4em]">Historical Incident File</span>
                       <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none">{selectedStory.title}</h2>
                       <div className="flex flex-wrap gap-3">
                          <span className="px-5 py-2 bg-rose-600/10 border border-rose-600/20 text-rose-500 font-black text-[9px] uppercase tracking-widest rounded-full">{selectedStory.category}</span>
                          <span className="px-5 py-2 bg-white/5 border border-white/10 text-zinc-400 font-black text-[9px] uppercase tracking-widest rounded-full">Severity: {selectedStory.toxicityScore}%</span>
                       </div>
                    </div>

                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-3xl">
                       <p className="text-zinc-200 font-bold text-lg leading-relaxed italic">
                         {selectedStory.fullStory}
                       </p>
                    </div>

                    <div className="space-y-6">
                       <div className="flex items-center gap-3">
                          <div className="h-[1px] flex-1 bg-white/10" />
                          <span className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.3em]">AI Character Takeaway</span>
                          <div className="h-[1px] flex-1 bg-white/10" />
                       </div>
                       <blockquote className="p-8 bg-zinc-950/50 border-l-4 border-rose-600 rounded-r-3xl">
                          <p className="text-rose-400 font-black text-xl italic leading-relaxed">
                             "{selectedStory.takeaway}"
                          </p>
                       </blockquote>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 pt-6">
                       <button 
                        onClick={() => setSelectedStory(null)}
                        className="flex-1 px-8 py-5 glass border-white/5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/5 transition-all text-zinc-400"
                       >
                         Read Another Disaster
                       </button>
                       <button className="flex-1 px-8 py-5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all flex items-center justify-center gap-3 group">
                         Share This Roast 🚩
                         <Share2 className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [step, setStep] = useState<'home' | 'userGender' | 'name' | 'gender' | 'story' | 'consent' | 'scan' | 'result' | 'privacy' | 'terms' | 'disclaimer' | 'stories' | 'history'>('home');
  const [lastStep, setLastStep] = useState<'home' | 'userGender' | 'name' | 'gender' | 'story' | 'consent' | 'scan' | 'result' | 'privacy' | 'terms' | 'disclaimer' | 'stories' | 'history'>('home');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);
  const [situation, setSituation] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [partnerGender, setPartnerGender] = useState('');
  const [userGender, setUserGender] = useState('');
  const [mode, setMode] = useState<ScanMode>(ScanMode.SAVAGE);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [consentOne, setConsentOne] = useState(false);
  const [consentTwo, setConsentTwo] = useState(false);
  const [showSafetyWarning, setShowSafetyWarning] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        // Sync user to firestore
        const userRef = doc(db, 'users', u.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName,
              photoURL: u.photoURL,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
          } else {
            await updateDoc(userRef, {
              displayName: u.displayName,
              photoURL: u.photoURL,
              updatedAt: serverTimestamp()
            });
          }
          fetchHistory(u.uid);
        } catch (e) {
          // Identify if it was the initial getDoc or a subsequent write
          const isGet = (e as any)?.code === 'permission-denied' && !(e as any)?.stack?.includes('setDoc') && !(e as any)?.stack?.includes('updateDoc');
          handleFirestoreError(e, isGet ? OperationType.GET : OperationType.WRITE, `users/${u.uid}`);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchHistory = async (uid: string) => {
    const q = query(
      collection(db, 'scans'), 
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    try {
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setHistory(docs);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, 'scans');
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      console.error("Login failed:", e);
      if (e.code === 'auth/popup-closed-by-user') {
        alert("The sign-in popup was closed before completion. Please try again and keep the popup open.");
      } else {
        alert("Login failed. Please check if your browser is blocking popups or if the domain is authorized in Firebase console.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setHistory([]);
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const navigateToLegal = (view: 'privacy' | 'terms' | 'disclaimer') => {
    setLastStep(step);
    setStep(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScan = async () => {
    if (!situation.trim()) return;
    if (!consentOne || !consentTwo) {
      setStep('consent');
      return;
    }
    setShowSafetyWarning(true);
    setTimeout(async () => {
      setShowSafetyWarning(false);
      setStep('scan');
      try {
        const res = await scanRelationship(situation, mode, partnerName, partnerGender, userGender);
        setResult(res);
        
        // Save scan to firestore
        const scanId = `scan-${Date.now()}`;
        const scanData = {
          id: scanId,
          userId: user?.uid || null,
          partnerName,
          partnerGender,
          userGender,
          situation,
          mode,
          result: res,
          createdAt: serverTimestamp()
        };
        
        try {
          await setDoc(doc(db, 'scans', scanId), scanData);
          if (user) fetchHistory(user.uid);
        } catch (e) {
          handleFirestoreError(e, OperationType.WRITE, `scans/${scanId}`);
        }

        setStep('result');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        console.error("Scan failed:", error);
        setStep('story');
      }
    }, 2500);
  };

  const resetAll = () => {
    setStep('home');
    setSituation('');
    setPartnerName('');
    setPartnerGender('');
    setUserGender('');
    setResult(null);
    setConsentOne(false);
    setConsentTwo(false);
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleSituationChange = (text: string) => {
    setSituation(text);
  };

  const isWordLimitExceeded = getWordCount(situation) > 150;

  return (
    <div className="min-h-screen relative text-white selection:bg-rose-500 selection:text-white pb-10">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="bg-glow -top-40 -left-40 opacity-40" />
        <div className="bg-glow top-1/2 -right-40 opacity-30 bg-purple-500/20" />
        <div className="bg-glow -bottom-40 left-1/4 opacity-20 bg-rose-500/20" />
      </div>
      <Background />
      <Header 
        onStoriesClick={() => setStep('stories')} 
      />

      <main className="relative z-10 container mx-auto px-4 md:px-6 pt-6 md:pt-10">
        <AnimatePresence mode="wait">
          {step === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto space-y-12 text-center"
            >
              <div className="space-y-10">
                <DynamicHeroText />

                <p className="text-zinc-400 text-base md:text-xl font-bold max-w-xl mx-auto px-4 leading-relaxed">
                  The most savage AI relationship analyst. No Login. No Drama. Just Roasts. 💀
                </p>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
                <button
                  onClick={() => setStep('userGender')}
                  className="w-full max-w-xs px-10 py-5 bg-white text-black rounded-full font-black tracking-widest text-xs uppercase hover:bg-zinc-200 transition-all shadow-xl flex items-center justify-center gap-3 group"
                >
                  Start Investigation
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => setStep('stories')}
                  className="w-full max-w-xs px-10 py-5 bg-zinc-900/50 border border-zinc-800 text-zinc-400 rounded-full font-black tracking-widest text-xs uppercase hover:bg-zinc-800 hover:text-white transition-all flex items-center justify-center gap-3 group"
                >
                  Analyze Breakup Story 🥀
                </button>
              </div>
                
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:max-w-2xl px-2">
                  {[
                    { icon: Heart, label: "EX DRAMA", color: "text-rose-400" },
                    { icon: ShieldAlert, label: "RED FLAGS", color: "text-red-500" },
                    { icon: TrendingDown, label: "LOW LOYALTY", color: "text-purple-400" },
                    { icon: Flame, label: "TOXIC VIBES", color: "text-orange-400" },
                  ].map((item, i) => (
                    <div key={i} className="glass p-4 text-center space-y-2 hover:bg-white/10 transition-colors cursor-default group">
                      <item.icon className={`w-6 h-6 mx-auto ${item.color} group-hover:scale-110 transition-transform`} />
                      <span className="block text-[10px] font-black uppercase tracking-widest text-zinc-300">{item.label}</span>
                    </div>
                  ))}
                </div>

              <div className="glass p-8 max-w-xl mx-auto border-zinc-800 bg-white/[0.01] rounded-[2rem]">
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 block mb-3 text-center">Global Statistics</span>
                <p className="text-zinc-500 font-bold text-sm text-center">
                  "Over 1.2M subjects analyzed. 99.4% detected with severe relational abnormalities. 💀"
                </p>
              </div>

              {/* Viral Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                <div className="glass p-8 text-left space-y-4 border-rose-900/20 bg-rose-950/5">
                   <div className="flex items-center gap-2">
                    <Flame className="text-rose-600 w-4 h-4" />
                    <span className="font-black text-[10px] tracking-[0.2em] uppercase text-zinc-400">Real-time Trend</span>
                   </div>
                   <p className="text-zinc-300 text-sm font-bold leading-relaxed">"Sending 'Good Morning' texts to multiple prospects is a documented crisis. 🚩"</p>
                </div>
                <div className="glass p-8 text-left space-y-4 border-zinc-800 bg-zinc-900/10">
                   <div className="flex items-center gap-2">
                    <Skull className="text-rose-900 w-4 h-4 opacity-50" />
                    <span className="font-black text-[10px] tracking-[0.2em] uppercase text-zinc-600">Regional Severity</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <span>1. Delhi Metro</span>
                    <span className="text-rose-600">99%</span>
                   </div>
                   <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    <span>2. Mumbai (Situationships)</span>
                    <span className="text-rose-800">92%</span>
                   </div>
                </div>
              </div>

              {/* Breakup Hook Section */}
              <motion.div 
                id="breakup-section"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="max-w-3xl mx-auto glass p-10 md:p-16 border-rose-900/30 bg-black/40 rounded-[3rem] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-900/10 blur-[100px] -mr-32 -mt-32 rounded-full" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-zinc-900/10 blur-[100px] -ml-32 -mb-32 rounded-full" />
                
                <div className="relative z-10 space-y-8">
                  <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-950/30 border border-rose-900/20 rounded-full">
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">Post-Damage Assessment</span>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight uppercase max-w-2xl mx-auto">
                      Ex ne character development de diya? 💀
                    </h2>
                    <p className="text-zinc-500 font-bold text-sm md:text-lg max-w-xl mx-auto">
                      Your breakup deserves a forensic investigation. Therapy is expensive, the roast is free. 🥀
                    </p>
                  </div>

                  <div className="max-w-lg mx-auto space-y-4">
                    <div className="glass bg-black/60 border-zinc-800 p-2 rounded-2xl focus-within:border-rose-900/50 transition-colors relative">
                      <input 
                        type="text"
                        placeholder="What happened? 'She said I need space...'"
                        value={situation}
                        onChange={(e) => handleSituationChange(e.target.value)}
                        className={`w-full bg-transparent px-6 py-4 text-sm font-bold text-white outline-none placeholder:text-zinc-700 ${isWordLimitExceeded ? 'text-rose-500' : ''}`}
                      />
                      <div className={`absolute right-3 bottom-3 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest backdrop-blur-md border transition-colors ${
                        isWordLimitExceeded 
                          ? 'bg-rose-500 border-rose-600 text-white' 
                          : 'bg-white/5 border-white/10 text-zinc-500'
                      }`}>
                        {getWordCount(situation)} / 150 <span className={isWordLimitExceeded ? 'text-white' : 'opacity-50'}>WORDS</span>
                      </div>
                    </div>
                    {isWordLimitExceeded && (
                      <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center animate-bounce">
                        Please trim your story to 150 words! ✂️
                      </p>
                    )}
                    <button 
                      onClick={() => {
                        if (situation.trim() && !isWordLimitExceeded) {
                          setStep('name');
                        } else if (!isWordLimitExceeded) {
                          setStep('name');
                        }
                      }}
                      disabled={isWordLimitExceeded}
                      className="w-full py-5 bg-rose-900/20 border border-rose-900/30 text-rose-500 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rose-900/40 transition-all flex items-center justify-center gap-3 group disabled:opacity-20"
                    >
                      Begin Toxicology Scan
                      <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-700">
                      * Closure not guaranteed. Analytics provided.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {step === 'userGender' && (
            <motion.div
              key="userGender"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-md mx-auto space-y-12 text-center"
            >
              <div className="space-y-4">
                <span className="text-rose-600 font-black text-[10px] uppercase tracking-[0.4em]">Step 01/03</span>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight uppercase leading-none">Who are you? 👤</h2>
                <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Select your identity for calibration</p>
              </div>

              <div className="flex flex-col gap-4">
                {['Male', 'Female'].map((g) => (
                  <button
                    key={g}
                    onClick={() => { 
                      setUserGender(g); 
                      if (g === 'Male') setPartnerGender('Female');
                      else if (g === 'Female') setPartnerGender('Male');
                      setStep('name'); 
                    }}
                    className="group relative p-8 bg-zinc-900/50 border border-zinc-800 rounded-3xl hover:border-rose-600/50 transition-all flex items-center justify-between overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-rose-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-xl font-black uppercase tracking-widest relative z-10 group-hover:text-white transition-colors">{g}</span>
                    <ChevronRight className="w-6 h-6 text-zinc-800 group-hover:text-rose-600 group-hover:translate-x-1 transition-all relative z-10" />
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setStep('home')} 
                className="text-zinc-600 font-black hover:text-white transition-colors text-[10px] uppercase tracking-widest"
              >
                ← Return to Neutral Zone
              </button>
            </motion.div>
          )}

          {step === 'name' && (
            <motion.div
              key="name"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="max-w-xl mx-auto space-y-10 text-center relative"
            >
              {/* Decorative Particles */}
              <div className="absolute -z-10 inset-0 pointer-events-none">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                  transition={{ duration: 10, repeat: Infinity }}
                  className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full" 
                />
                <motion.div 
                   animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
                   transition={{ duration: 12, repeat: Infinity }}
                   className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/10 blur-[60px] rounded-full" 
                />
              </div>

              <div className="space-y-4">
                <motion.div 
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  className="inline-block p-4 bg-white/5 rounded-3xl border border-white/10 mb-2"
                >
                  <span className="text-4xl">🎯</span>
                </motion.div>
                <span className="text-rose-600 font-black text-[10px] uppercase tracking-[0.4em]">Step 02/03</span>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none uppercase">
                  {[
                    "IDENTIFY THE TARGET 🚩",
                    "WHO'S UNDER INVESTIGATION? 👀",
                    "NAME OF THE SUSPECT 💀",
                    "MARK THE RED FLAG 🚩",
                    "WHOM ARE WE EXPOSING? 👁️"
                  ][Math.floor(Date.now() / 4000) % 5]}
                </h2>
                <p className="text-zinc-500 font-bold text-sm tracking-[0.1em] uppercase">
                  Initial Diagnostics Preparation
                </p>
              </div>

              <div className="glass-card neon-border p-2 md:p-4 group">
                <div className="relative overflow-hidden rounded-[2rem]">
                  <input
                    autoFocus
                    type="text"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && partnerName.trim() && setStep('story')}
                    placeholder="SUSPECT NAME..."
                    className="w-full bg-white/[0.02] p-8 md:p-12 text-3xl md:text-5xl rounded-[2rem] outline-none text-center font-black text-zinc-100 placeholder:text-zinc-800 transition-all focus:bg-white/[0.05] tracking-tighter uppercase"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-700" />
                </div>
              </div>

    <div className="flex justify-between items-center px-4">
                <button 
                  onClick={() => setStep('userGender')} 
                  className="text-zinc-400 font-bold hover:text-white transition-colors text-xs uppercase tracking-widest"
                >
                  <span className="opacity-50 inline-block mr-2">←</span>
                  Back
                </button>
                <button 
                  disabled={!partnerName.trim()}
                  onClick={() => setStep('story')}
                  className="px-8 py-3 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-30 flex items-center gap-2"
                >
                  Confirm
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'gender' && (
            <motion.div
              key="gender"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-xl mx-auto space-y-8 text-center"
            >
              <div className="space-y-4">
                <span className="text-rose-500 font-bold text-4xl">🤌</span>
                <span className="text-rose-600 font-black text-[10px] uppercase tracking-[0.4em]">Step 03/04</span>
                <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter capitalize">{partnerName}'s Gender?</h2>
                <p className="text-zinc-500 font-medium tracking-tight">Help the scanner calibrate properly. 🤖</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'Male', emoji: '🤵', label: 'Male' },
                  { id: 'Female', emoji: '👸', label: 'Female' },
                  { id: 'Other', emoji: '🌈', label: 'Other/NPC' },
                ].map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setPartnerGender(g.id);
                      setStep('story');
                    }}
                    className={`p-10 glass-card border transition-all flex flex-col items-center gap-4 group ${
                      partnerGender === g.id ? 'border-rose-600 bg-rose-900/10' : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <span className="text-5xl group-hover:scale-110 transition-transform filter grayscale group-hover:grayscale-0">{g.emoji}</span>
                    <span className="font-black uppercase text-xs tracking-widest">{g.label}</span>
                  </button>
                ))}
              </div>

              <button onClick={() => setStep('name')} className="text-zinc-500 font-bold hover:text-white transition-colors">BACK</button>
            </motion.div>
          )}

          {step === 'story' && (
            <motion.div
              key="story"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-2xl mx-auto space-y-8 text-center"
            >
              <div className="space-y-4">
                <span className="text-rose-500 font-bold text-4xl">😭</span>
                <span className="text-rose-600 font-black text-[10px] uppercase tracking-[0.4em]">Step 03/03</span>
                <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter capitalize">EXPOSE "{partnerName}"</h2>
                <p className="text-zinc-500 font-medium tracking-tight">Ab pura kissa bataiye. Spicy details only. 📱🚩</p>
              </div>

              <div className="glass-card neon-border ring-1 ring-white/10 focus-within:ring-rose-500/50 transition-all shadow-2xl overflow-hidden p-1 relative">
                <textarea
                  autoFocus
                  value={situation}
                  onChange={(e) => handleSituationChange(e.target.value)}
                  placeholder={[
                    "My boyfriend replies after 8 hours...",
                    "She still talks to her ex daily 😭",
                    "He calls himself sigma male 💀",
                    "My crush sends mixed signals 🤡",
                    "She blocked me then watched my story 🚩"
                  ][Math.floor(Date.now() / 3000) % 5]}
                  className={`w-full bg-transparent p-6 text-xl md:text-2xl outline-none resize-none min-h-[250px] text-white placeholder-zinc-700 font-bold italic ${isWordLimitExceeded ? 'text-rose-500' : ''}`}
                />
                
                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border backdrop-blur-lg transition-all duration-300 ${
                  isWordLimitExceeded 
                    ? 'bg-rose-600 border-rose-600 text-white animate-pulse ring-4 ring-rose-600/20' 
                    : 'bg-black/40 border-white/5 text-zinc-500'
                }`}>
                  <span className={isWordLimitExceeded ? 'text-white' : 'text-zinc-300'}>{getWordCount(situation)}</span>
                  <span className="opacity-30 mx-1">/</span> 
                  150 
                  <span className="hidden md:inline opacity-40 ml-1">WORDS</span>
                </div>

                {isWordLimitExceeded && (
                  <div className="absolute inset-x-0 top-16 flex justify-center pointer-events-none">
                    <span className="bg-rose-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">
                       Word Limit Exceeded - Please Trim! ✂️
                    </span>
                  </div>
                )}

                {/* Trust Indicators */}
                <div className="flex items-center justify-center gap-4 py-3 border-t border-white/5 bg-black/20">
                   <div className="flex items-center gap-1 opacity-40">
                      <Lock className="w-3 h-3 text-zinc-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Private Analysis</span>
                   </div>
                   <div className="flex items-center gap-1 opacity-40">
                      <ShieldCheck className="w-3 h-3 text-zinc-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Entertainment only</span>
                   </div>
                   <div className="flex items-center gap-1 opacity-40">
                      <Info className="w-3 h-3 text-zinc-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest">No storage</span>
                   </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 p-4 border-t border-white/5 items-center justify-between bg-black/40 rounded-b-[2.5rem]">
                   <div className="flex gap-2 p-1.5 bg-black/40 rounded-xl border border-white/[0.05] w-full md:w-auto overflow-x-auto no-scrollbar">
                    {[
                      { id: ScanMode.SAVAGE, label: 'Savage' },
                      { id: ScanMode.SOFT, label: 'Soft' },
                      { id: ScanMode.TOXIC, label: 'Toxic' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMode(m.id)}
                        className={`flex-1 md:flex-none whitespace-nowrap px-5 py-2.5 rounded-lg text-[10px] font-black transition-all uppercase tracking-widest ${
                          mode === m.id 
                            ? 'bg-zinc-100 text-black shadow-lg shadow-white/5' 
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleScan}
                    disabled={!situation.trim() || isWordLimitExceeded}
                    className="w-full md:w-auto px-10 py-5 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-rose-700 transition-all shadow-xl md:relative fixed bottom-6 left-6 right-6 z-50 md:bottom-0 md:left-0 md:right-0 flex items-center justify-center gap-2 group disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    Run Diagnostics 🚩
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {[
                  "Late replies 📱",
                  "Still talking to ex 💔",
                  "Private likes 🕵️",
                  "Hide story 🫥",
                  "NPC behavior 🤖",
                  "Situationship drama 🌫️"
                ].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSituation(prev => prev + (prev ? " " : "") + tag)}
                    className="px-3 py-2 glass rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition-all border-white/5"
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <button onClick={() => setStep('name')} className="text-zinc-500 font-bold hover:text-white transition-colors">BACK</button>
            </motion.div>
          )}

          {step === 'consent' && (
            <motion.div
              key="consent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="max-w-xl mx-auto space-y-10 text-center"
            >
              <div className="space-y-4">
                <div className="inline-block p-4 bg-white/5 rounded-3xl border border-white/10 mb-2">
                  <ShieldCheck className="w-8 h-8 text-rose-600" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase">
                  Investigation Permit 📜
                </h2>
                <p className="text-zinc-500 font-bold text-sm tracking-[0.1em] uppercase">
                  Verify your intent before diagnostics
                </p>
              </div>

              <div className="glass-card p-8 md:p-10 border-white/5 space-y-8 text-left bg-black/40">
                <div className="space-y-6">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-1">
                      <input 
                        type="checkbox"
                        checked={consentOne}
                        onChange={(e) => setConsentOne(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-zinc-800 rounded flex items-center justify-center peer-checked:bg-rose-600 peer-checked:border-rose-600 transition-all" />
                      <ShieldCheck className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs md:text-sm text-zinc-400 font-bold leading-relaxed group-hover:text-zinc-300 transition-colors">
                        I understand this app is for **entertainment purposes only**. Reports may be humorous, exaggerated, or factually inaccurate. 💀
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center justify-center mt-1">
                      <input 
                        type="checkbox"
                        checked={consentTwo}
                        onChange={(e) => setConsentTwo(e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-zinc-800 rounded flex items-center justify-center peer-checked:bg-rose-600 peer-checked:border-rose-600 transition-all" />
                      <Lock className="absolute w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs md:text-sm text-zinc-400 font-bold leading-relaxed group-hover:text-zinc-300 transition-colors">
                        I agree to the <button onClick={() => navigateToLegal('privacy')} className="text-zinc-100 underline hover:text-rose-500 underline-offset-4">Privacy Policy</button>, <button onClick={() => navigateToLegal('terms')} className="text-zinc-100 underline hover:text-rose-500 underline-offset-4">Terms</button>, and <button onClick={() => navigateToLegal('disclaimer')} className="text-zinc-100 underline hover:text-rose-500 underline-offset-4">Disclaimer</button>.
                      </p>
                    </div>
                  </label>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                   <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest leading-loose">
                      * Neural diagnostics investigate vibes, not criminal cases. No life choices should be made based on this output.
                   </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <button 
                  onClick={() => setStep('story')} 
                  className="text-zinc-400 font-bold hover:text-white transition-colors text-xs uppercase tracking-widest order-2 md:order-1"
                >
                  <span className="opacity-50 inline-block mr-2">←</span>
                  Back to story
                </button>
                <button 
                  disabled={!consentOne || !consentTwo}
                  onClick={handleScan}
                  className="w-full md:w-auto px-12 py-5 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-xl shadow-white/5 order-1 md:order-2 flex items-center justify-center gap-3 group"
                >
                  Grant Access & Scan
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="max-w-xl mx-auto space-y-12 text-center py-20"
            >
              <div className="relative inline-block">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-full border-4 border-rose-600/20 border-t-rose-600 shadow-[0_0_50px_rgba(225,29,72,0.2)]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                   <motion.div
                     animate={{ scale: [1, 1.2, 1] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                   >
                    <Skull className="w-12 h-12 text-rose-600" />
                   </motion.div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-none uppercase">
                  Analyzing <span className="text-rose-600">Disaster</span>...
                </h2>
                <div className="flex flex-col items-center gap-2">
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-zinc-500 font-bold text-xs uppercase tracking-[0.3em]"
                  >
                    {[
                      "Decrypting text history",
                      "Locating red flag coordinates",
                      "Quantifying emotional damage",
                      "Calibrating toxicity sensors",
                      "Testing loyalty server response"
                    ][Math.floor(Date.now() / 2000) % 5]}...
                  </motion.p>
                  <p className="text-zinc-600 font-medium text-[10px] uppercase tracking-widest">
                    Neural nodes are heating up 🛡️
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto pt-8">
                {[
                  "Toxic Logic",
                  "Vibe Patterns",
                  "Red Flag Map",
                  "Loyalty Servers"
                ].map((node) => (
                  <div key={node} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                    <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">{node}</span>
                  </div>
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="pt-6 flex flex-col items-center gap-3"
              >
                <div className="px-5 py-2 bg-rose-600/10 border border-rose-600/30 rounded-full flex items-center gap-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">
                    Approved by the International Red Flag Association 🚩
                  </span>
                </div>
                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-zinc-800">
                  Authentication: IRFA-ROAST-992-SECURE
                </p>
              </motion.div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <ScanResultView 
              key="result" 
              result={result} 
              onReset={resetAll} 
              partnerName={partnerName}
              partnerGender={partnerGender}
            />
          )}
        </AnimatePresence>

        <footer className="mt-32 pb-20 text-center space-y-10">
          <div className="glass p-10 max-w-sm mx-auto border-zinc-900 bg-white/[0.01] rounded-[2rem]">
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-zinc-700 block mb-4 text-center">Protocol Advice 🥀</span>
            <p className="text-zinc-500 font-bold text-sm leading-relaxed">
              "If they wanted to, they would. But they don't, so they won't. Terminate the process and seek recovery. 💀"
            </p>
          </div>
          
          <div className="space-y-6">
            <p className="text-zinc-700 text-[10px] font-black uppercase tracking-[0.3em]">Authorized by the Neural Roast Department</p>
            <div className="flex flex-wrap justify-center gap-8 text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] px-4">
              <button onClick={() => navigateToLegal('privacy')} className="hover:text-rose-600 transition-colors uppercase">Privacy Encryption</button>
              <button onClick={() => navigateToLegal('terms')} className="hover:text-rose-600 transition-colors uppercase">Terms of Registry</button>
              <button onClick={() => navigateToLegal('disclaimer')} className="hover:text-rose-600 transition-colors uppercase">Official Disclaimer</button>
            </div>
            <div className="flex items-center justify-center gap-6 pt-4 opacity-30">
               <div className="flex items-center gap-1.5 grayscale">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="text-[8px] font-black">Private Analysis</span>
               </div>
               <div className="flex items-center gap-1.5 grayscale">
                  <Lock className="w-3 h-3" />
                  <span className="text-[8px] font-black">Secure Tunnel</span>
               </div>
               <div className="flex items-center gap-1.5 grayscale">
                  <Info className="w-3 h-3" />
                  <span className="text-[8px] font-black">Entertainment Only</span>
               </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Safety Warning Overlay */}
      <AnimatePresence>
        {showSafetyWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl px-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full glass-card p-10 border-rose-600/30 text-center space-y-6"
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-rose-600/10 rounded-full flex items-center justify-center border border-rose-600/20">
                  <AlertTriangle className="w-8 h-8 text-rose-600 animate-pulse" />
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Diagnostic Warning 💀</h3>
                <p className="text-zinc-400 font-bold text-sm leading-relaxed">
                  AI-generated roast ahead. Severe emotional damage possible. Results are for entertainment and may be brutally exaggerated.
                </p>
              </div>
              <div className="pt-4">
                 <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2 }}
                      className="h-full bg-rose-600"
                    />
                 </div>
                 <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-600 mt-4">Calibrating Roast Intensity...</p>
              </div>

              <div className="pt-2 flex flex-col items-center gap-2">
                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-zinc-500" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                    IRFA Protocol 01-A Compliant 🚩
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {(step === 'privacy' || step === 'terms' || step === 'disclaimer') && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black pt-10 pb-20">
          <Background />
          <LegalView 
            type={step as any} 
            onBack={() => setStep(lastStep)} 
          />
        </div>
      )}

          {step === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto space-y-10"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
                <div className="space-y-4">
                  <button 
                    onClick={() => setStep('home')}
                    className="flex items-center gap-2 text-zinc-500 hover:text-white font-black text-[10px] uppercase tracking-widest group"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Laboratory
                  </button>
                  <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                    Investigative <span className="text-rose-600 italic">Archive</span> 📂
                  </h2>
                  <p className="text-zinc-500 font-bold text-sm tracking-[0.05em]">Your personal history of relationship postmortems</p>
                </div>
              </div>

              {history.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
                  {history.map((scan) => (
                    <motion.div
                      key={scan.id}
                      whileHover={{ y: -5 }}
                      onClick={() => {
                        setResult(scan.result);
                        setStep('result');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="glass-card p-8 border-white/5 space-y-4 bg-black/40 group hover:border-rose-600/30 transition-all cursor-pointer relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-rose-600 font-black text-[9px] uppercase tracking-widest block">Scan Result</span>
                          <h3 className="text-xl font-black uppercase tracking-tight group-hover:text-rose-500 transition-colors">{scan.partnerName}</h3>
                        </div>
                        <div className={`text-xl font-black tracking-tighter ${scan.result.toxicityScore > 70 ? 'text-rose-600' : 'text-emerald-500'}`}>
                          {scan.result.toxicityScore}%
                        </div>
                      </div>
                      <p className="text-zinc-500 text-[10px] font-bold line-clamp-2 italic">"{scan.situation}"</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest">
                          {scan.createdAt?.toDate ? scan.createdAt.toDate().toLocaleDateString() : 'Recent Case'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-rose-600 group-hover:translate-x-1 transition-all" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-20 text-center space-y-6 bg-black/20 border-dashed border-white/10 rounded-[3rem]">
                   <Skull className="w-16 h-16 text-zinc-800 mx-auto" />
                   <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No case files found. You are suspiciously clean. 💀</p>
                   <button 
                    onClick={() => setStep('userGender')}
                    className="px-8 py-3 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl"
                   >
                    Start First Investigation
                   </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'stories' && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#080808]">
          <Background />
          <BreakupStoriesView 
            onBack={() => setStep('home')} 
          />
        </div>
      )}
    </div>
  );
}
