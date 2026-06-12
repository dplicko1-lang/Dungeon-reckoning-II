/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Play, Shield, Swords, Wand, Target, Ghost } from 'lucide-react';
import { soundEngine } from '../utils/sound';
import { CharacterClass } from '../types';

interface MainMenuProps {
  onStartGame: (chosenClass: CharacterClass) => void;
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
  const [selectedClass, setSelectedClass] = useState<CharacterClass>(CharacterClass.WARRIOR);

  const classesConfig = [
    {
      id: CharacterClass.WARRIOR,
      name: 'Воїн',
      english: 'Warrior',
      icon: Swords,
      desc: 'Могутній боєць ближнього бою. Має підвищений запас здоров’я та велику фізичну Силу.',
      perks: ['🩸 +30 ХП на старті', '💪 +6 Сили (Фізичний урон)', '⚔️ Починає з Ніжем та Мечем'],
      color: 'border-red-500/30 text-red-400 bg-red-950/20 hover:border-red-500/50',
      activeColor: 'border-red-500 bg-red-500/10 text-red-300 ring-2 ring-red-500/20',
      tag: '🔥 СТІЙКИЙ',
    },
    {
      id: CharacterClass.ARCHER,
      name: 'Лучник',
      english: 'Archer',
      icon: Target,
      desc: 'Мастер стрільби на відстані. Може випускати стріли здалеку, ухилятися та знаходити золоті крити.',
      perks: ['🏹 Починає з Бойовим Луком', '🎯 45 Стріл у сагайдаку', '⚡ +6 Спритності (Ловкість)'],
      color: 'border-green-500/30 text-green-400 bg-green-950/20 hover:border-green-500/50',
      activeColor: 'border-green-500 bg-green-500/10 text-green-300 ring-2 ring-green-500/20',
      tag: '🏹 ДАЛЬНІЙ БІЙ',
    },
    {
      id: CharacterClass.MAGE,
      name: 'Маг',
      english: 'Mage',
      icon: Wand,
      desc: 'Володар стихійного чаклунства. Стріляє магічними сферами та спалює ворогів заклинаннями.',
      perks: ['🔮 Починає з Палицею Мага', '🔥 Заклинання Огненний Шар', '✨ +60 Стартової Мани'],
      color: 'border-indigo-500/30 text-indigo-400 bg-indigo-950/20 hover:border-indigo-500/50',
      activeColor: 'border-indigo-500 bg-indigo-500/10 text-indigo-300 ring-2 ring-indigo-500/20',
      tag: '⚡ МАГІЯ',
    },
    {
      id: CharacterClass.ASSASSIN,
      name: 'Ассасин',
      english: 'Assassin',
      icon: Shield,
      desc: 'Швидкий, смертоносний тіньовий убивця. Має шалений показник критичного удару.',
      perks: ['🗡️ Починає з Швидким Кинджалом', '💨 Неймовірний крит-рейт + Удача', '⚡ Швидкі блискавичні випади'],
      color: 'border-pink-500/30 text-pink-400 bg-pink-950/20 hover:border-pink-500/50',
      activeColor: 'border-pink-500 bg-pink-500/10 text-pink-300 ring-2 ring-pink-500/20',
      tag: '💥 КРИТИ',
    },
    {
      id: CharacterClass.NECROMANCER,
      name: 'Некромант',
      english: 'Necromancer',
      icon: Ghost,
      desc: 'Викликає темних істот відплати. Володіє важкою косою та високою Стійкістю.',
      perks: ['💀 Починає з Косою Смерті', '🧟 Здатність викликати союзного Голема', '🩺 Стійкість та вампіризм'],
      color: 'border-purple-500/30 text-purple-400 bg-purple-950/20 hover:border-purple-500/50',
      activeColor: 'border-purple-500 bg-purple-500/10 text-purple-300 ring-2 ring-purple-500/20',
      tag: '💀 ТЕМРЯВА',
    },
  ];

  const handleStart = () => {
    soundEngine.init();
    soundEngine.toggle(true);
    soundEngine.playUiConfirm();
    onStartGame(selectedClass);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[580px] bg-[#0F0E11] text-brand-text p-6 max-w-4xl mx-auto rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden my-6 select-none shadow-[#FF3B3F]/5">
      {/* Decorative ambient background circular patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,63,0.06),transparent_70%)]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      {/* Game Title */}
      <motion.div
         initial={{ y: -30, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ duration: 0.6, type: 'spring' }}
         className="text-center z-10"
      >
        <div className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-brand-accent text-[10px] uppercase font-bold tracking-widest mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-pulse" />DUNGEON HACK & SLASH ROGUELITE
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none text-white uppercase">
          DUNGEON RECKONING II
        </h1>
        <h2 className="text-xl md:text-2xl font-black text-brand-accent uppercase tracking-wide mt-2">
          ЛЕГЕНДА П’ЯТИ ПІДЗЕМЕЛЬ
        </h2>
      </motion.div>

      {/* Characters Class Selection grid */}
      <div className="w-full mt-8 z-10 max-w-3xl">
        <label className="text-[10px] uppercase font-black text-slate-400 tracking-widest block text-center mb-4">
          — ВИБЕРІТЬ СВІЙ СТАРТОВИЙ КЛАС ГЕРОЯ —
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {classesConfig.map((cls) => {
            const IconComponent = cls.icon;
            const isSelected = selectedClass === cls.id;
            return (
              <button
                key={cls.id}
                onClick={() => {
                  soundEngine.playClick();
                  setSelectedClass(cls.id);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer text-center flex flex-col items-center justify-between ${
                  isSelected ? cls.activeColor : cls.color
                }`}
              >
                <div className="flex flex-col items-center">
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold mb-2 uppercase leading-none border select-none ${
                    isSelected ? 'bg-white/15 border-white/15' : 'bg-white/5 border-white/5'
                  }`}>
                    {cls.tag}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-2">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-black text-white leading-none tracking-wide">{cls.name}</h3>
                  <span className="text-[8px] uppercase tracking-wide opacity-50 block mt-1">{cls.english}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Class Description details Card */}
      <div className="w-full max-w-3xl mt-5 bg-[#1F1E24]/60 border border-white/10 p-5 rounded-2xl z-10 flex flex-col md:flex-row gap-5 items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-black text-white flex items-center gap-2 uppercase">
            {classesConfig.find(c => c.id === selectedClass)?.name} — ДЕТАЛЬНИЙ КЛАСОВИЙ ПРОФІЛЬ
          </h4>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {classesConfig.find(c => c.id === selectedClass)?.desc}
          </p>
        </div>
        <div className="md:w-64 bg-[#0F0E11] p-3 rounded-xl border border-white/5">
          <span className="text-[9px] text-[#FF3B3F] font-black uppercase tracking-widest block mb-2">СТАРТОВІ ТРЕЙТИ:</span>
          <ul className="space-y-1 text-[10px] text-slate-300 font-bold">
            {classesConfig.find(c => c.id === selectedClass)?.perks.map((p, idx) => (
              <li key={idx} className="flex items-center gap-1">
                <span>•</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Legend Rules Box */}
      <div className="w-full max-w-3xl bg-white/[0.01] border border-white/10 px-5 py-4 rounded-xl mt-4 z-10 text-center text-xs text-brand-text/80 leading-relaxed">
        <span className="font-extrabold text-brand-accent block mb-1 uppercase tracking-wider text-[10px] mono-font">🌟 СУПЕР МОЖЛИВОСТІ ТА СИСТЕМА ДІАБЛО</span>
        Використовуйте кнопки <strong className="text-white">Q, E, R, F, C</strong> для активації Активних Навичок (Магічні Кулі, Стріли Морозу, Покращене лікування чи Виклик Блискавки/Голема)! Використовуйте здобуте золото щоб <strong className="text-yellow-400">Enchant (Зачаровувати)</strong> зброю до Легендарного та Міфічного рівня з унікальними ефектами!
      </div>

      {/* Start Action Call to action */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="mt-6 z-10 w-full max-w-sm"
      >
        <button
          onClick={handleStart}
          id="btn-start-game"
          className="w-full py-4 px-8 bg-brand-accent hover:bg-[#E53538] text-white font-extrabold text-lg rounded-2xl tracking-tight shadow-xl shadow-brand-accent/20 transform hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 cursor-pointer uppercase font-sans"
        >
          <Play className="w-4 h-4 fill-current text-white" /> РОЗПОЧАТИ КВЕСТ ПІДЗЕМЕЛЛЯ
        </button>
      </motion.div>
    </div>
  );
}
