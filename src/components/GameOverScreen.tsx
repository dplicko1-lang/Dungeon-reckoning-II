/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { PlayerStats } from '../types';
import { soundEngine } from '../utils/sound';
import { Skull, RotateCcw, Award } from 'lucide-react';

interface GameOverScreenProps {
  stats: PlayerStats;
  onRestart: () => void;
}

export default function GameOverScreen({ stats, onRestart }: GameOverScreenProps) {
  const handleRestart = () => {
    soundEngine.playUiConfirm();
    onRestart();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] bg-[#0F0E11] text-brand-text p-6 max-w-xl mx-auto rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden my-6 text-center select-none shadow-[#FF3B3F]/5">
      {/* Red ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,63,0.06),transparent_60%)]" />

      {/* Skull Icon animate */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 100, delay: 0.1 }}
        className="p-5 bg-brand-accent/10 rounded-full border border-brand-accent/20 text-brand-accent mb-6 relative z-10"
      >
        <Skull className="w-12 h-12" />
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="z-10"
      >
        <h2 className="text-4xl md:text-5xl font-black text-brand-accent tracking-tighter uppercase">
          ГЕРОЙ ЗАГИНУВ
        </h2>
        <p className="text-slate-400 text-xs mt-3 max-w-sm mx-auto uppercase leading-relaxed">
          Ви відважно билися на локації {stats.level}, але сили зла цього разу були надто нищівними.
        </p>
      </motion.div>

      {/* Final Score presentation */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-full bg-[#1F1E24]/60 border border-white/10 p-5 rounded-2xl my-6 z-10 space-y-3 text-[10px] uppercase"
      >
        <div className="flex justify-between items-center">
          <span className="text-slate-400 mono-font">ПРОЙДЕНО ЛОКАЦІЙ:</span>
          <span className="font-extrabold text-white">{stats.level} / 5</span>
        </div>
        <div className="h-[1px] bg-white/5" />
        <div className="flex justify-between items-center">
          <span className="text-slate-400 mono-font">ЗНИЩЕНО ВОРОГІВ:</span>
          <span className="font-extrabold text-brand-accent">{stats.kills} МОБС</span>
        </div>
        <div className="h-[1px] bg-white/5" />
        <div className="flex justify-between items-center text-sm">
          <span className="text-brand-accent font-extrabold flex items-center gap-1">
            <Award className="w-4 h-4" /> НАБРАНИЙ РАХУНОК:
          </span>
          <span className="font-black text-brand-accent text-xl mono-font">{stats.score}</span>
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
          id="btn-restart-gameover"
          className="w-full py-4 px-6 bg-brand-accent hover:bg-[#E53538] text-white font-extrabold rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider text-sm"
        >
          <RotateCcw className="w-4 h-4" /> СПРОБУВАТИ ЗНОВУ
        </button>
      </motion.div>
    </div>
  );
}
