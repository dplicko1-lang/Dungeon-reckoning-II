/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { GameState, PlayerStats, WeaponType, CharacterClass, ItemRarity } from './types';
import MainMenu from './components/MainMenu';
import GameOverScreen from './components/GameOverScreen';
import VictoryScreen from './components/VictoryScreen';
import UpgradeScreen from './components/UpgradeScreen';
import GameCanvas from './components/GameCanvas';
import { Shield, Sparkles, Trophy, Flame } from 'lucide-react';
import { soundEngine } from './utils/sound';

export default function App() {
  // Global Game states
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  
  const [stats, setStats] = useState<PlayerStats>({
    maxHp: 100,
    hp: 100,
    damageMult: 1.0,
    armorMult: 0.0,
    weapons: [WeaponType.KNIFE],
    currentWeapon: WeaponType.KNIFE,
    level: 1,
    score: 0,
    kills: 0,
    coins: 0,
    normalArrows: 0,
    poisonArrows: 0,
    charClass: CharacterClass.WARRIOR,
    strength: 1,
    agility: 1,
    intelligence: 1,
    luck: 1,
    endurance: 1,
    mana: 20,
    maxMana: 20,
    statPointsLeft: 5,
    weaponRarities: { [WeaponType.KNIFE]: ItemRarity.COMMON },
    summonedPet: null,
    unlockedSkills: ['HEAL'],
  });

  const [newWeaponUnlocked, setNewWeaponUnlocked] = useState<WeaponType | null>(null);

  // Auto-setup of title styles
  useEffect(() => {
    document.title = "Dungeon Quests & Combat RPG";
  }, []);

  const handleStartGame = (chosenClass: CharacterClass) => {
    // Generate class-specific stats
    let maxHp = 100;
    let weapons = [WeaponType.KNIFE];
    let currentWeapon = WeaponType.KNIFE;
    let strength = 1;
    let agility = 1;
    let intelligence = 1;
    let luck = 1;
    let endurance = 1;
    let maxMana = 20;
    let normalArrows = 0;
    let poisonArrows = 0;
    let unlockedSkills = ['HEAL']; // Gained magic divine heal
    let weaponRarities: any = { [WeaponType.KNIFE]: ItemRarity.COMMON };

    if (chosenClass === CharacterClass.WARRIOR) {
      maxHp = 120;
      weapons = [WeaponType.KNIFE, WeaponType.SWORD];
      currentWeapon = WeaponType.SWORD;
      strength = 6;
      endurance = 5;
      maxMana = 15;
      weaponRarities[WeaponType.SWORD] = ItemRarity.COMMON;
    } else if (chosenClass === CharacterClass.ARCHER) {
      maxHp = 100;
      weapons = [WeaponType.KNIFE, WeaponType.BOW];
      currentWeapon = WeaponType.BOW;
      agility = 6;
      luck = 5;
      normalArrows = 45;
      weaponRarities[WeaponType.BOW] = ItemRarity.COMMON;
    } else if (chosenClass === CharacterClass.MAGE) {
      maxHp = 80;
      weapons = [WeaponType.KNIFE, WeaponType.STAFF];
      currentWeapon = WeaponType.STAFF;
      intelligence = 8;
      maxMana = 60;
      unlockedSkills.push('FIREBALL'); // Free starter offensive spell!
      weaponRarities[WeaponType.STAFF] = ItemRarity.COMMON;
    } else if (chosenClass === CharacterClass.ASSASSIN) {
      maxHp = 90;
      weapons = [WeaponType.KNIFE, WeaponType.DAGGER];
      currentWeapon = WeaponType.DAGGER;
      agility = 6;
      strength = 4;
      luck = 3;
      weaponRarities[WeaponType.DAGGER] = ItemRarity.COMMON;
    } else if (chosenClass === CharacterClass.NECROMANCER) {
      maxHp = 110;
      weapons = [WeaponType.KNIFE, WeaponType.SCYTHE];
      currentWeapon = WeaponType.SCYTHE;
      intelligence = 5;
      endurance = 4;
      maxMana = 35;
      weaponRarities[WeaponType.SCYTHE] = ItemRarity.COMMON;
    }

    setStats({
      maxHp,
      hp: maxHp,
      damageMult: 1.0,
      armorMult: 0.0,
      weapons,
      currentWeapon,
      level: 1,
      score: 0,
      kills: 0,
      coins: 30, // Start bonus coins for exploration!
      normalArrows,
      poisonArrows,
      charClass: chosenClass,
      strength,
      agility,
      intelligence,
      luck,
      endurance,
      mana: maxMana,
      maxMana,
      statPointsLeft: 5, // Extra skill points immediately!
      weaponRarities,
      summonedPet: null,
      unlockedSkills,
    });
    setGameState(GameState.PLAYING);
  };

  // Level complete state triggers
  const handleLevelComplete = () => {
    const nextLevel = stats.level;
    let unlocked: WeaponType | null = null;

    if (nextLevel === 1) {
      unlocked = WeaponType.SWORD;
    } else if (nextLevel === 2) {
      unlocked = WeaponType.KATANA;
    } else if (nextLevel === 3) {
      unlocked = WeaponType.AXE;
    }

    setNewWeaponUnlocked(unlocked);
    setGameState(GameState.UPGRADE);
  };

  // Upgraded confirmation triggers
  const handleSelectUpgrade = (bonuses: {
    hpAdd: number;
    damageMultAdd: number;
    armorMultAdd: number;
    agilityAdd: number;
    optName: string;
    rarity: ItemRarity;
  }) => {
    setStats((prev) => {
      let upgradedMaxHp = prev.maxHp + bonuses.hpAdd;
      let upgradedHp = Math.min(upgradedMaxHp, prev.hp + bonuses.hpAdd);
      let upgradedDmgMult = prev.damageMult + bonuses.damageMultAdd;
      let upgradedArmorMult = Math.min(0.85, prev.armorMult + bonuses.armorMultAdd); // limit armor mitigation to 85%
      let updatedWeapons = [...prev.weapons];
      let updatedWeapon = prev.currentWeapon;
      let upgradedAgility = (prev.agility || 1) + bonuses.agilityAdd;

      // Add weapon if unlocked
      if (newWeaponUnlocked) {
        if (!updatedWeapons.includes(newWeaponUnlocked)) {
          updatedWeapons.push(newWeaponUnlocked);
        }
        updatedWeapon = newWeaponUnlocked; // Auto equip newest unlocked weapon
      }

      return {
        ...prev,
        maxHp: upgradedMaxHp,
        hp: upgradedHp,
        damageMult: upgradedDmgMult,
        armorMult: upgradedArmorMult,
        agility: upgradedAgility,
        weapons: updatedWeapons,
        currentWeapon: updatedWeapon,
        level: prev.level + 1, // Advance location
        coins: (prev.coins || 0) + 15, // Location reward coins!
        statPointsLeft: (prev.statPointsLeft || 0) + 5, // Gained 5 attribute points on clearing dungeons!
      };
    });

    setNewWeaponUnlocked(null);
    setGameState(GameState.PLAYING);
  };

  const handleRestart = () => {
    setGameState(GameState.MENU);
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text flex flex-col game-font transition-all duration-300">
      
      {/* Top universal premium header */}
      <header className="border-b border-white/10 bg-brand-bg/90 backdrop-blur-md sticky top-0 z-50 py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="game-font text-2xl font-black tracking-tighter text-brand-accent leading-none">
              DUNGEON RECKONING II
            </h1>
            <p className="mono-font text-[10px] text-brand-text/50 uppercase tracking-widest mt-1">
              {stats.level <= 5 ? `DUNGEON DEPTH: 0${stats.level} — ACTIVE RAID` : 'DUNGEON CONQUERED'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {stats.charClass && (
              <div className="bg-brand-accent/15 border border-brand-accent/20 px-3 py-1 rounded-xl text-[10px] uppercase font-bold text-white tracking-widest text-center">
                🛡️ Клас: {
                  stats.charClass === CharacterClass.WARRIOR ? 'Воїн' :
                  stats.charClass === CharacterClass.ARCHER ? 'Лучник' :
                  stats.charClass === CharacterClass.MAGE ? 'Маг' :
                  stats.charClass === CharacterClass.ASSASSIN ? 'Ассасин' : 'Некромант'
                }
              </div>
            )}
            <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold text-brand-text">
              <span className="w-2 h-2 rounded-full bg-brand-accent animate-ping" />
              <span className="mono-font uppercase tracking-widest text-[10px]">REACTION-X CORE ACTIVATED</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container screen area */}
      <main className="flex-1 flex flex-col justify-center items-center py-8 px-4 max-w-6xl mx-auto w-full">
        {gameState === GameState.MENU && (
          <MainMenu onStartGame={(chosenClass) => handleStartGame(chosenClass)} />
        )}

        {gameState === GameState.PLAYING && (
          <GameCanvas
            stats={stats}
            setStats={setStats}
            gameState={gameState}
            setGameState={setGameState}
            onLevelComplete={handleLevelComplete}
          />
        )}

        {gameState === GameState.UPGRADE && (
          <UpgradeScreen
            stats={stats}
            newWeaponUnlocked={newWeaponUnlocked}
            onSelectUpgrade={handleSelectUpgrade}
          />
        )}

        {gameState === GameState.GAME_OVER && (
          <GameOverScreen
            stats={stats}
            onRestart={handleRestart}
          />
        )}

        {gameState === GameState.VICTORY && (
          <VictoryScreen
            stats={stats}
            onRestart={handleRestart}
          />
        )}
      </main>

      {/* Aesthetic bottom footer credits */}
      <footer className="border-t border-white/10 bg-brand-bg py-8 px-6 text-center text-[10px] text-brand-text/40 mono-font tracking-wider uppercase">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>⚔️ Gothic RPG Roguelite — 1-5 level dungeon challenge with pets and magic skills</span>
          <span>© 1206-2026 Всі права захищено</span>
        </div>
      </footer>
    </div>
  );
}
