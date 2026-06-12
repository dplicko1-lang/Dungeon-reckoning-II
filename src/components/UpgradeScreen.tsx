/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PlayerStats, WeaponType, ItemRarity } from '../types';
import { WEAPON_DATA } from '../utils/gameData';
import { soundEngine } from '../utils/sound';
import { Heart, Shield, Swords, Sparkles, Award } from 'lucide-react';

interface UpgradeOption {
  id: string;
  type: 'HP' | 'WARRIOR' | 'DEFENDER';
  title: string;
  desc: string;
  rarity: ItemRarity;
  hpAdd: number;
  damagePercentAdd: number;
  armorPercentReductionAdd: number;
  agilityAdd: number;
}

interface UpgradeScreenProps {
  stats: PlayerStats;
  newWeaponUnlocked: WeaponType | null;
  onSelectUpgrade: (bonuses: {
    hpAdd: number;
    damageMultAdd: number;
    armorMultAdd: number;
    agilityAdd: number;
    optName: string;
    rarity: ItemRarity;
  }) => void;
}

const getRandomRarity = (): ItemRarity => {
  const r = Math.random();
  if (r < 0.05) return ItemRarity.MYTHIC;
  if (r < 0.20) return ItemRarity.LEGENDARY;
  if (r < 0.45) return ItemRarity.EPIC;
  if (r < 0.75) return ItemRarity.RARE;
  return ItemRarity.COMMON;
};

const generateThreeOptions = (): UpgradeOption[] => {
  const optionsList: UpgradeOption[] = [];
  const types: ('HP' | 'WARRIOR' | 'DEFENDER')[] = ['HP', 'WARRIOR', 'DEFENDER'];

  types.forEach((type, index) => {
    const rarity = getRandomRarity();
    let title = '';
    let desc = '';
    let hpAdd = 0;
    let damagePercentAdd = 0;
    let armorPercentReductionAdd = 0;
    let agilityAdd = 0;

    let mult = 1;
    let rarityLabel = '';
    if (rarity === ItemRarity.COMMON) { mult = 1; rarityLabel = 'Ординарне'; }
    else if (rarity === ItemRarity.RARE) { mult = 2; rarityLabel = 'Рідкісне'; }
    else if (rarity === ItemRarity.EPIC) { mult = 4; rarityLabel = 'Епічне'; }
    else if (rarity === ItemRarity.LEGENDARY) { mult = 8; rarityLabel = 'Легендарне'; }
    else { mult = 12; rarityLabel = 'Міфічне'; }

    if (type === 'HP') {
      const baseHpVal = 15;
      hpAdd = baseHpVal * mult;
      title = `❤️ ${rarityLabel} покращення HP`;
      desc = `Збільшує максимальне та поточне здоров'я вашого лицаря на +${hpAdd} HP.`;
    } else if (type === 'WARRIOR') {
      damagePercentAdd = 0.10 * mult;
      agilityAdd = Math.max(1, Math.floor(1 * mult));
      title = `⚔️ ${rarityLabel} Мечник`;
      desc = `Збільшує шкоду зброєю на +${Math.round(damagePercentAdd * 100)}% та Спритність на +${agilityAdd}.`;
    } else if (type === 'DEFENDER') {
      armorPercentReductionAdd = 0.10 * mult;
      title = `🛡️ ${rarityLabel} Страж`;
      desc = `Знижує будь-яку вхідну шкоду з підземелля на -${Math.round(armorPercentReductionAdd * 100)}%.`;
    }

    optionsList.push({
      id: `upgrade_${type}_${index}`,
      type,
      title,
      desc,
      rarity,
      hpAdd,
      damagePercentAdd,
      armorPercentReductionAdd,
      agilityAdd,
    });
  });

  return optionsList;
};

const getRarityStyles = (rarity: ItemRarity) => {
  switch (rarity) {
    case ItemRarity.COMMON:
      return {
        badgeClass: 'text-slate-400 bg-slate-900 border-slate-700',
        cardBorderClass: 'hover:border-slate-500 border-white/10',
        activeShadow: 'shadow-[0_0_15px_rgba(148,163,184,0.15)] bg-slate-500/10 border-slate-400',
        prefix: '🟢',
      };
    case ItemRarity.RARE:
      return {
        badgeClass: 'text-blue-400 bg-blue-950 border-blue-800',
        cardBorderClass: 'hover:border-blue-500 border-blue-900/40',
        activeShadow: 'shadow-[0_0_20px_rgba(59,130,246,0.3)] bg-blue-500/10 border-blue-500',
        prefix: '🔵',
      };
    case ItemRarity.EPIC:
      return {
        badgeClass: 'text-purple-400 bg-purple-950 border-purple-800',
        cardBorderClass: 'hover:border-purple-500 border-purple-900/40',
        activeShadow: 'shadow-[0_0_25px_rgba(168,85,247,0.45)] bg-purple-500/10 border-purple-500',
        prefix: '🟣',
      };
    case ItemRarity.LEGENDARY:
      return {
        badgeClass: 'text-amber-400 bg-amber-950/50 border-amber-800',
        cardBorderClass: 'hover:border-amber-500 border-amber-900/40 animate-pulse',
        activeShadow: 'shadow-[0_0_30px_rgba(245,158,11,0.6)] bg-amber-500/10 border-amber-500',
        prefix: '🟠',
      };
    case ItemRarity.MYTHIC:
    default:
      return {
        badgeClass: 'text-red-400 bg-red-950 border-red-800',
        cardBorderClass: 'hover:border-red-500 border-red-900/40 animate-bounce',
        activeShadow: 'shadow-[0_0_35px_rgba(239,68,68,0.75)] bg-red-500/10 border-red-500 border-dashed',
        prefix: '👑⚡',
      };
  }
};

export default function UpgradeScreen({ stats, newWeaponUnlocked, onSelectUpgrade }: UpgradeScreenProps) {
  const [options, setOptions] = useState<UpgradeOption[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  useEffect(() => {
    setOptions(generateThreeOptions());
  }, []);

  const handleSelect = (idx: number) => {
    soundEngine.playClick();
    setSelectedIdx(idx);
  };

  const handleConfirm = () => {
    if (selectedIdx !== null) {
      soundEngine.playUiConfirm();
      const chosen = options[selectedIdx];
      onSelectUpgrade({
        hpAdd: chosen.hpAdd,
        damageMultAdd: chosen.damagePercentAdd,
        armorMultAdd: chosen.armorPercentReductionAdd,
        agilityAdd: chosen.agilityAdd,
        optName: chosen.title,
        rarity: chosen.rarity,
      });
    }
  };

  const getWeaponDetails = () => {
    if (!newWeaponUnlocked) return null;
    return WEAPON_DATA[newWeaponUnlocked];
  };

  const weaponDetails = getWeaponDetails();

  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] bg-[#0F0E11] text-brand-text p-6 w-full max-w-4xl mx-auto rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden my-6 shadow-[#FF3B3F]/5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,59,63,0.06),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_70%)]" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center z-10"
      >
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-brand-accent text-[10px] uppercase font-bold tracking-widest mb-4">
          <Award className="w-4 h-4 text-brand-accent animate-pulse" /> ЛОКАЦІЮ {stats.level} ПРОЙДЕНО!
        </div>
        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
          ЧАС ПОКРАЩЕННЯ!
        </h2>
        <p className="text-slate-400 mt-2 max-w-lg mx-auto text-xs leading-relaxed uppercase tracking-wide">
          Ви подолали випробування запеклих ворогів. Оберіть одне з потужних тактичних покращень різної рідкісності.
        </p>
      </motion.div>

      {/* Weapon Unlock Showcase */}
      {weaponDetails && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full max-w-md bg-white/[0.02] p-5 rounded-2xl border border-brand-accent/30 text-center my-6 shadow-lg z-10 relative"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-accent text-white text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3 text-white animate-spin" /> НОВА ЗБРОЯ РОЗБЛОКОВАНА!
          </div>
          <div className="text-4xl mt-2">{weaponDetails.nameUa.split(' ')[1] || '⚔️'}</div>
          <h3 className="text-xl font-bold text-brand-accent mt-1 uppercase tracking-tight">{weaponDetails.nameUa}</h3>
          <p className="text-slate-300 text-[10px] mono-font mt-1 uppercase">
            ШКОДА: <span className="text-white font-bold">{weaponDetails.damage}</span> | РАДІУС: <span className="text-white font-bold">{weaponDetails.range}px</span>
          </p>
        </motion.div>
      )}

      {/* Upgrade Choice Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-4 z-10">
        {options.map((opt, idx) => {
          const styles = getRarityStyles(opt.rarity);
          const isSelected = selectedIdx === idx;

          return (
            <motion.button
              key={opt.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelect(idx)}
              className={`relative p-6 rounded-2xl border transition-all text-left flex flex-col justify-between h-52 cursor-pointer ${
                isSelected ? styles.activeShadow : `bg-white/[0.02] ${styles.cardBorderClass}`
              }`}
            >
              <div className="flex justify-between items-start w-full">
                <div className={`p-2.5 rounded-xl border leading-none text-xs font-black uppercase text-[8px] ${styles.badgeClass}`}>
                  {styles.prefix} {opt.rarity === ItemRarity.COMMON ? 'Ординарне' :
                    opt.rarity === ItemRarity.RARE ? 'Рідкісне' :
                    opt.rarity === ItemRarity.EPIC ? 'Епічне' :
                    opt.rarity === ItemRarity.LEGENDARY ? 'Легендарне' : 'Міфічне'}
                </div>
                {isSelected && (
                  <span className="bg-brand-accent text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase leading-none">
                    Обрано
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h4 className="text-sm font-black text-white tracking-wide uppercase leading-tight">
                  {opt.title}
                </h4>
                <p className="text-slate-400 text-[10px] mt-2 leading-relaxed uppercase">
                  {opt.desc}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Confirmation & CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 w-full max-w-md z-10 text-center">
        <p className="text-[10px] text-brand-accent animate-pulse font-medium uppercase mono-font">
          Для підтвердження вибору здібності натисніть відповідну кнопку на екрані.
        </p>
        <button
          onClick={handleConfirm}
          disabled={selectedIdx === null}
          id="btn-confirm-upgrade"
          className={`w-full py-4 px-8 rounded-xl font-bold text-base tracking-wider transition-all shadow-lg transform active:scale-95 uppercase ${
            selectedIdx !== null
              ? 'bg-brand-accent hover:bg-[#E53538] text-white cursor-pointer shadow-brand-accent/20'
              : 'bg-[#1F1E24] text-slate-500 cursor-not-allowed border border-white/5'
          }`}
        >
          {selectedIdx !== null ? 'ПІДТВЕРДИТИ ВИБІР' : 'ОБЕРІТЬ ЗДІБНІСТЬ'}
        </button>
      </div>
    </div>
  );
}
