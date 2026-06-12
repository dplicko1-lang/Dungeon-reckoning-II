/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { PlayerStats } from '../types';
import { soundEngine } from '../utils/sound';
import { Sparkles, RotateCcw, Award, ShieldCheck, Heart } from 'lucide-react';

interface VictoryScreenProps {
  stats: PlayerStats;
  onRestart: () => void;
}

export default function VictoryScreen({ stats, onRestart }: VictoryScreenProps) {
  const handleRestart = () => {
    soundEngine.playUiConfirm();
    onRestart();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-[#0F0E11] text-brand-text p-6 max-w-xl mx-auto rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden my-6 text-center select-none shadow-[#FF3B3F]/5">
      {/* Red ambient rays */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,63,0.06),transparent_70%)]" />

      {/* Sparkling particle animations in visual background */}
      <div className="absolute top-10 left-10 text-brand-accent/20 text-3xl animate-bounce">✨</div>
      <div className="absolute bottom-10 right-10 text-brand-accent/20 text-4xl animate-pulse">✨</div>
      <div className="absolute top-20 right-10 text-brand-accent/20 text-2xl animate-spin">🌟</div>

      {/* Sparkle Cup Icon */}
      <motion.div
        initial={{ scale: 0, rotate: 360 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
        className="p-5 bg-brand-accent/10 rounded-full border border-brand-accent/20 text-brand-accent mb-6 relative z-10"
      >
        <Sparkles className="w-12 h-12" />
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="z-10"
      >
        <span className="text-[9px] font-bold tracking-widest text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-3.5 py-1 rounded-full uppercase mono-font">
          🏆 ФІНАЛЬНА ПЕРЕМОГА
        </span>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase mt-4">
          ЛЕГЕНДУ ЗДЕСЯНЕНО!
        </h2>
        <p className="text-slate-300 text-xs mt-3 max-w-sm mx-auto leading-relaxed uppercase">
          Ви здолали Темного Володаря в його замку та врятували цілих 5 локацій! Ваше ім'я навіки закарбоване в історії!
        </p>
      </motion.div>

      {/* Comprehensive metrics stats showcasing */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full bg-[#1F1E24]/60 border border-white/10 p-5 rounded-2xl my-6 z-10 space-y-3 uppercase text-[10px]"
      >
        <div className="flex justify-between items-center">
          <span className="text-slate-400 mono-font">ПРОЙДЕНІ СВІТИ:</span>
          <span className="font-extrabold text-brand-accent">5 / 5 (Повна зачистка)</span>
        </div>
        <div className="h-[1px] bg-white/5" />
        <div className="flex justify-between items-center">
          <span className="text-slate-400 mono-font">КІНЦЕВА БРОНЯ ГЕРОЯ:</span>
          <span className="font-extrabold text-white">+{Math.round(stats.armorMult * 100)}%</span>
        </div>
        <div className="h-[1px] bg-white/5" />
        <div className="flex justify-between items-center">
          <span className="text-slate-400 mono-font">ВСЬОГО ЗНЕШКОДЖЕНО:</span>
          <span className="font-extrabold text-brand-accent">{stats.kills} Ворогів</span>
        </div>
        <div className="h-[1px] bg-white/5" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-brand-accent font-extrabold flex items-center gap-1">
            <Award className="w-4 h-4" /> ФІНАЛЬНИЙ РАХУНОК:
          </span>
          <span className="font-black text-brand-accent text-2xl mono-font">{stats.score}</span>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="z-10 w-full"
      >
        <button
          onClick={handleRestart}
          id="btn-restart-victory"
          className="w-full py-4 px-6 bg-brand-accent hover:bg-[#E53538] text-white font-extrabold text-lg rounded-2xl shadow-xl shadow-brand-accent/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          <RotateCcw className="w-4 h-4" /> ПОЧАТИ НОВУ ПОДОРОЖ
        </button>
      </motion.div>
    </div>
  );
}
