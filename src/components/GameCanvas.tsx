/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { PlayerStats, Enemy, EnemyType, Particle, Projectile, WeaponType, GameState, CharacterClass, ItemRarity } from '../types';
import { LEVELS, WEAPON_DATA } from '../utils/gameData';
import { soundEngine } from '../utils/sound';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Heart, Swords, HelpCircle, ArrowLeftRight, Activity, ArrowLeft, Maximize, Minimize } from 'lucide-react';

interface GameCanvasProps {
  stats: PlayerStats;
  setStats: React.Dispatch<React.SetStateAction<PlayerStats>>;
  gameState: GameState;
  setGameState: (state: GameState) => void;
  onLevelComplete: () => void;
}

interface DroppedCoin {
  id: string;
  x: number;
  y: number;
  vY: number;
  bounceCount: number;
  width: number;
  height: number;
  timer: number;
}

interface DamagePopup {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number; // updates down to 0
}

const THEMES = [
  { bg: '#132115', ground: '#123318', accent: '#4ADE80' }, // Forest
  { bg: '#291805', ground: '#5c3104', accent: '#FBBF24' }, // Desert
  { bg: '#0b1621', ground: '#1f3c5c', accent: '#38BDF8' }, // Frozen
  { bg: '#240808', ground: '#571313', accent: '#EF4444' }, // Volcanic
  { bg: '#100c24', ground: '#2e1e5e', accent: '#818CF8' }, // Indigo magic
  { bg: '#031726', ground: '#0c3d61', accent: '#38BDF8' }, // Deep Blue
  { bg: '#1e0526', ground: '#4e145e', accent: '#C084FC' }, // Purple abyss
  { bg: '#021a15', ground: '#094d3f', accent: '#34D399' }, // Emerald cave
  { bg: '#2c1002', ground: '#662402', accent: '#FB923C' }, // Amber core
  { bg: '#111317', ground: '#2d333d', accent: '#A1A1AA' }, // Monolith Slate
  { bg: '#1e0938', ground: '#4c1a85', accent: '#A78BFA' }, // Violet fortress
  { bg: '#031a1a', ground: '#0b4747', accent: '#2DD4BF' }, // Teal marsh
];

export default function GameCanvas({ stats, setStats, gameState, setGameState, onLevelComplete }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Tab view: game vs inventory vs character sheet
  const [activeTab, setActiveTab] = useState<'game' | 'inventory' | 'character'>('game');
  const activeTabRef = useRef<'game' | 'inventory' | 'character'>('game');
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  // Sound toggle
  const [isAudioOn, setIsAudioOn] = useState(soundEngine.isEnabled());

  // Fullscreen toggle state
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (isAudioOn) soundEngine.playClick();
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      const enterFs = 
        containerRef.current.requestFullscreen ||
        (containerRef.current as any).webkitRequestFullscreen ||
        (containerRef.current as any).mozRequestFullScreen ||
        (containerRef.current as any).msRequestFullscreen;
      if (enterFs) {
        enterFs.call(containerRef.current).catch((err: any) => {
          console.warn('Could not enter fullscreen:', err);
        });
      }
    } else {
      const exitFs = 
        document.exitFullscreen ||
        (document as any).webkitExitFullscreen ||
        (document as any).mozCancelFullScreen ||
        (document as any).msExitFullscreen;
      if (exitFs) {
        exitFs.call(document);
      }
    }
  };

  // Input states
  const keysRef = useRef<{ [key: string]: boolean }>({});
  const touchKeysRef = useRef<{ left: boolean; right: boolean; attack: boolean }>({
    left: false,
    right: false,
    attack: false,
  });

  // Game internal variables
  const playerRef = useRef({
    x: 100,
    y: 350,
    width: 32,
    height: 48,
    vX: 0,
    vY: 0, // vertical velocity for jumping!
    speed: 4,
    facing: 1, // 1 for right, -1 for left
    isAttacking: false,
    attackAnimProgress: 0, // 0 to 1
    attackCooldown: 0,
    invincibleTime: 0, // flash when hurt
    walkCycle: 0,
  });

  const enemiesRef = useRef<Enemy[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const popupsRef = useRef<DamagePopup[]>([]);
  const droppedCoinsRef = useRef<DroppedCoin[]>([]);

  // World dimensions
  const WORLD_WIDTH = 2500;
  const PORTAL_X = 2300;
  
  const getLevelConfig = (L: number) => {
    const isBossLevel = L % 5 === 0;
    const themeIndex = (L - 1) % THEMES.length;
    const theme = THEMES[themeIndex];

    if (isBossLevel) {
      const bossNum = L / 5;
      let bossHp = 250;
      if (L === 5) bossHp = 250;
      else if (L === 10) bossHp = 700;
      else if (L === 15) bossHp = 2000;
      else if (L === 20) bossHp = 6000;
      else bossHp = Math.round(6000 * Math.pow(3, (L - 20) / 5));

      return {
        level: L,
        name: `Overlord Sanctum (Floor ${L})`,
        nameUa: `Хрям Володаря (Поверх ${L}) 👑👺`,
        description: `Epic Boss showdown! Defeat Boss ${bossNum} to activate the Portal!`,
        descriptionUa: `Епічна битва! Здолайте Володаря Поверху ${bossNum}, щоб відчинити портал!`,
        bgColor: '#0F0E13', // Gothic dark tower theme for bosses
        groundColor: '#1F1E24',
        accentColor: '#A855F7',
        enemyCount: 1,
        enemyBaseHp: bossHp,
        enemyDamage: 4 + Math.floor(L * 1.5), // Boss deals massive damage
      };
    } else {
      const adjUa = ['Проклятий', 'Містичний', 'Тіньовий', 'Крижаний', 'Лавовий', 'Кривавий', 'Кислотний', 'Дзеркальний', 'Зоряний', 'Неоновий', 'Забутий', 'Стародавній'];
      const nounUa = ['Лабіринт', 'Аванпост', 'Грот', 'Сад', 'Бастіон', 'Склеп', 'Храм', 'Каньйон', 'Замок', 'Шахта', 'Ліс', 'Квартал'];
      const emojiUa = ['🌀', '🔮', '🕸️', '❄️', '🌋', '💀', '🧪', '✨', '🌌', '⚡', '🌳', '🏛️'];

      const adjEn = ['Cursed', 'Mystical', 'Shadowed', 'Icy', 'Volcanic', 'Bloody', 'Acidic', 'Mirroring', 'Astral', 'Neon', 'Forgotten', 'Ancient'];
      const nounEn = ['Labyrinth', 'Outpost', 'Grotto', 'Garden', 'Bastion', 'Crypt', 'Temple', 'Canyon', 'Castle', 'Mine', 'Forest', 'Quarters'];

      const idx1 = L % adjUa.length;
      const idx2 = (L * 3) % nounUa.length;

      const nameUa = `${adjUa[idx1]} ${nounUa[idx2]} ${emojiUa[idx1]} (Кімната ${L})`;
      const name = `${adjEn[idx1]} ${nounEn[idx2]} (Room ${L})`;

      // Formula: HP монстра = 12 * 1.4^(L - 1)
      const enemyHp = Math.round(12 * Math.pow(1.4, L - 1));

      return {
        level: L,
        name,
        nameUa,
        description: `Mix of fierce monsters! Demolish them all!`,
        descriptionUa: `Рівень ${L}. Чудовиська заповнили кімнату! Зберіть сили і зачистіть її!`,
        bgColor: theme.bg,
        groundColor: theme.ground,
        accentColor: theme.accent,
        enemyCount: Math.min(18, 4 + Math.floor(L * 0.7)), // Diverse enemy numbers
        enemyBaseHp: enemyHp,
        enemyDamage: 2 + Math.floor(L * 0.7), // Enemies Damage scales up with level
      };
    }
  };

  const currentLevelConfig = getLevelConfig(stats.level);

  // RPG Stat increase handler
  const addStatPoint = (stat: 'strength' | 'agility' | 'intelligence' | 'luck' | 'endurance') => {
    if (!stats.statPointsLeft) return;
    if (isAudioOn) soundEngine.playLevelUp();
    setStats(prev => {
      let updated = { ...prev };
      updated[stat] = (prev[stat] || 1) + 1;
      updated.statPointsLeft = prev.statPointsLeft - 1;
      if (stat === 'endurance') {
        updated.maxHp += 4;
        updated.hp += 4; // Heal on endurance upgrade!
      }
      if (stat === 'intelligence') {
        updated.maxMana += 8;
        updated.mana += 8; // Grant mana!
      }
      return updated;
    });
  };

  // Weapon Enchanting Handler
  const enchantWeapon = (weaponType: WeaponType) => {
    if ((stats.coins || 0) < 15) return;
    if (isAudioOn) soundEngine.playUiConfirm();

    const roll = Math.random();
    let rolledRarity = ItemRarity.COMMON;
    let label = 'Ординарна 🗡️';
    let color = '#94A3B8';

    if (roll < 0.45) {
      rolledRarity = ItemRarity.RARE;
      label = 'РІДКІСНА (RARE) 🔮🔷';
      color = '#38BDF8';
    } else if (roll < 0.75) {
      rolledRarity = ItemRarity.EPIC;
      label = 'ЕПІЧНА (EPIC) 🔮⚡';
      color = '#C084FC';
    } else if (roll < 0.93) {
      rolledRarity = ItemRarity.LEGENDARY;
      label = 'ЛЕГЕНДАРНА (LEGENDARY) 🌟🔥';
      color = '#F59E0B';
    } else {
      rolledRarity = ItemRarity.MYTHIC;
      label = 'МІФІЧНА (MYTHIC) 🎖️🔥👑';
      color = '#EF4444';
    }

    setStats(prev => {
      const nextRarities = { ...prev.weaponRarities };
      nextRarities[weaponType] = rolledRarity;
      return {
        ...prev,
        coins: Math.max(0, (prev.coins || 0) - 15),
        weaponRarities: nextRarities,
      };
    });

    const p = playerRef.current;
    spawnPopup(p.x + p.width/2, p.y - 40, `ЗАЧАРОВАНО: ${label}`, color);
    spawnParticles(p.x + p.width/2, p.y + p.height/2, color, 25, 1.8);
  };

  // Spell Caster Handler
  const castActiveSpell = (spellType: 'FIREBALL' | 'FROSTBOLT' | 'LIGHTNING' | 'HEAL' | 'SUMMON') => {
    const p = playerRef.current;
    if (gameState !== GameState.PLAYING || activeTabRef.current !== 'game') return;

    let cost = 15;
    if (spellType === 'FIREBALL') cost = 14;
    else if (spellType === 'FROSTBOLT') cost = 10;
    else if (spellType === 'LIGHTNING') cost = 22;
    else if (spellType === 'HEAL') cost = 15;
    else if (spellType === 'SUMMON') cost = 30;

    const currentMana = statsRef.current.mana || 0;
    if (currentMana < cost) {
      spawnPopup(p.x + p.width/2, p.y, 'МАНА ВИЧЕРПАНА! 🔮❌', '#818CF8');
      return;
    }

    setStats(prev => ({
      ...prev,
      mana: Math.max(0, (prev.mana || 0) - cost)
    }));

    if (isAudioOn) soundEngine.playLevelUp();

    if (spellType === 'FIREBALL') {
      spawnPopup(p.x + p.width/2, p.y - 12, '💥 ОГНЕННИЙ ШАР!', '#EF4444');
      spawnParticles(p.x + p.width/2, p.y + p.height/2, '#F97316', 12, 1.2);

      projectilesRef.current.push({
        id: Math.random().toString(),
        x: p.x + p.facing * 20 + p.width / 2,
        y: p.y + p.height / 3 + 4,
        vX: p.facing * 9.0,
        vY: 0,
        radius: 12,
        damage: Math.round((14 + (statsRef.current.intelligence || 1) * 2.5) * statsRef.current.damageMult),
        color: '#EF4444',
        fromPlayer: true,
        isFireball: true,
      } as any);
    } else if (spellType === 'FROSTBOLT') {
      spawnPopup(p.x + p.width/2, p.y - 12, '❄️ КРИЖАНА СТРІЛА!', '#38BDF8');
      spawnParticles(p.x + p.width/2, p.y + p.height/2, '#38BDF8', 12, 1.2);

      projectilesRef.current.push({
        id: Math.random().toString(),
        x: p.x + p.facing * 20 + p.width / 2,
        y: p.y + p.height / 3 + 4,
        vX: p.facing * 9.5,
        vY: 0,
        radius: 8,
        damage: Math.round((9 + (statsRef.current.intelligence || 1) * 1.5) * statsRef.current.damageMult),
        color: '#38BDF8',
        fromPlayer: true,
        isFrostbolt: true,
      } as any);
    } else if (spellType === 'LIGHTNING') {
      spawnPopup(p.x + p.width/2, p.y - 12, '⚡ ГРОМОВА БЛИСКАВКА!', '#A855F7');
      
      let nearestEn: any = null;
      let minDist = Infinity;
      enemiesRef.current.forEach(enemy => {
        const dx = enemy.x + enemy.width/2 - p.x;
        const dy = enemy.y + enemy.height/2 - p.y;
        const d = Math.hypot(dx, dy);
        if (d < minDist) {
          minDist = d;
          nearestEn = enemy;
        }
      });

      if (nearestEn) {
        const lightingDamage = Math.round((20 + (statsRef.current.intelligence || 1) * 3.5) * statsRef.current.damageMult);
        nearestEn.hp = Math.max(0, nearestEn.hp - lightingDamage);
        nearestEn.isHit = true;
        nearestEn.hitTimer = 10;
        
        (window as any).lightningStrikes = (window as any).lightningStrikes || [];
        (window as any).lightningStrikes.push({
          startX: p.x + p.width/2,
          startY: 0,
          endX: nearestEn.x + nearestEn.width/2,
          endY: nearestEn.y + nearestEn.height/2,
          timer: 15,
        });

        spawnParticles(nearestEn.x + nearestEn.width/2, nearestEn.y + nearestEn.height/2, '#C084FC', 25, 2.0);
        spawnPopup(nearestEn.x + nearestEn.width/2, nearestEn.y, `-${lightingDamage} ⚡⚡`, '#C084FC');
      } else {
        spawnPopup(p.x + p.width/2, p.y - 24, 'ВОРОГІВ НЕМАЄ!', '#6B7280');
      }
    } else if (spellType === 'HEAL') {
      const healValue = Math.round(15 + (statsRef.current.intelligence || 1) * 1.8 + (statsRef.current.endurance || 1) * 1.2);
      spawnParticles(p.x + p.width/2, p.y + p.height/2, '#10B981', 18, 1.0);
      spawnPopup(p.x + p.width/2, p.y - 12, `🩺 +${healValue} HP!`, '#10B981');
      
      setStats(prev => ({
        ...prev,
        hp: Math.min(prev.maxHp, prev.hp + healValue)
      }));
    } else if (spellType === 'SUMMON') {
      spawnPopup(p.x + p.width/2, p.y - 12, '🧟 ВИКЛИК ГОЛЕМА CONJURED!', '#F97316');
      spawnParticles(p.x + p.width/2, p.y + p.height/2, '#94A3B8', 25, 1.2);

      (window as any).summonedPet = {
        x: p.x - p.facing * 50,
        y: 350,
        width: 38,
        height: 38,
        hp: 40 + (statsRef.current.strength || 1) * 5,
        maxHp: 40 + (statsRef.current.strength || 1) * 5,
        speed: 2.2,
        direction: 1,
        attackCooldown: 0,
      };
    }
  };

  const levelEndedRef = useRef<boolean>(false);
  const bossSpawnedRef = useRef<boolean>(false);

  // Keep stats in a mutable ref to access reliably in the animation loop
  const statsRef = useRef<PlayerStats>(stats);
  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  // Audio setup
  const toggleAudio = () => {
    const nextState = soundEngine.toggle();
    setIsAudioOn(nextState);
    if (nextState) {
      soundEngine.playClick();
      if (gameState === GameState.PLAYING) {
        soundEngine.startBgm();
      }
    } else {
      soundEngine.stopBgm();
    }
  };

  // Keyboard Event Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING || activeTabRef.current !== 'game') return;
      const key = e.key.toLowerCase();
      if (['arrowleft', 'a'].includes(key)) keysRef.current['left'] = true;
      if (['arrowright', 'd'].includes(key)) keysRef.current['right'] = true;
      if (['arrowup', 'w', 'з'].includes(key)) {
        keysRef.current['jump'] = true;
        e.preventDefault(); // prevent scroll
      }
      if ([' ', 'f', 'а'].includes(key)) {
        keysRef.current['attack'] = true;
        e.preventDefault(); // prevent scroll
      }

      // Spell binds
      if (key === 'q') { castActiveSpell('FIREBALL'); e.preventDefault(); }
      if (key === 'e') { castActiveSpell('FROSTBOLT'); e.preventDefault(); }
      if (key === 'r') { castActiveSpell('LIGHTNING'); e.preventDefault(); }
      if (key === 'f') { castActiveSpell('HEAL'); e.preventDefault(); }
      if (key === 'c') { castActiveSpell('SUMMON'); e.preventDefault(); }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (activeTabRef.current !== 'game') {
        keysRef.current['left'] = false;
        keysRef.current['right'] = false;
        keysRef.current['attack'] = false;
        keysRef.current['jump'] = false;
        return;
      }
      const key = e.key.toLowerCase();
      if (['arrowleft', 'a'].includes(key)) keysRef.current['left'] = false;
      if (['arrowright', 'd'].includes(key)) keysRef.current['right'] = false;
      if (['arrowup', 'w', 'з'].includes(key)) keysRef.current['jump'] = false;
      if ([' ', 'f', 'а'].includes(key)) keysRef.current['attack'] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState]);

  // Spawn enemies initialisation
  const initializeLevel = () => {
    levelEndedRef.current = false;
    bossSpawnedRef.current = false;
    (window as any).portalPromptShown = false;
    projectilesRef.current = [];
    popupsRef.current = [];
    particlesRef.current = [];
    droppedCoinsRef.current = [];
    
    // Position player
    playerRef.current.x = 80;
    playerRef.current.y = 350;
    playerRef.current.vX = 0;
    playerRef.current.invincibleTime = 0;

    const enemies: Enemy[] = [];
    const config = currentLevelConfig;

    if (config.level % 5 === 0) {
      // Spawn Boss near the end of the wide room
      enemies.push({
        id: 'boss',
        x: 1800,
        y: 230,
        width: 80,
        height: 120,
        type: EnemyType.BOSS,
        hp: config.enemyBaseHp,
        maxHp: config.enemyBaseHp,
        speed: 1.5,
        damage: config.enemyDamage,
        color: '#A855F7', // Deep Boss Purple
        shootCooldown: 0,
        attackCooldown: 0,
      });
      bossSpawnedRef.current = true;
    } else {
      // Spawn generic enemies depending on level
      for (let i = 0; i < config.enemyCount; i++) {
        // Procedurally mix enemies (Slime, Goblin, Skeleton, Demon in rotation)
        const typeIndex = i % 4;
        let etype = EnemyType.SLIME;
        let color = '#4ADE80';
        let width = 36;
        let height = 24;
        let speed = 1.0;

        if (typeIndex === 1) {
          etype = EnemyType.GOBLIN;
          color = '#EAB308';
          width = 32;
          height = 40;
          speed = 1.6;
        } else if (typeIndex === 2) {
          etype = EnemyType.SKELETON;
          color = '#E2E8F0';
          width = 32;
          height = 48;
          speed = 0.9;
        } else if (typeIndex === 3) {
          etype = EnemyType.DEMON;
          color = '#F87171';
          width = 36;
          height = 36;
          speed = 2.0; // agile!
        }

        const finalHp = config.enemyBaseHp;
        const finalDamage = config.enemyDamage;

        // Space out along the larger world, starting from 350 up to WORLD_WIDTH - 450
        const minX = 350;
        const maxX = WORLD_WIDTH - 450;
        const segment = (maxX - minX) / Math.max(1, config.enemyCount - 1);
        const spawnX = minX + i * segment + (Math.random() * 60 - 30);

        enemies.push({
          id: `enemy_${i}`,
          x: spawnX,
          y: 350 - (height - 48), // ground aligns on y=350 + 48
          width,
          height,
          type: etype,
          hp: finalHp,
          maxHp: finalHp,
          speed: speed + (Math.random() * 0.4 - 0.2),
          damage: finalDamage,
          color,
          direction: Math.random() > 0.5 ? 1 : -1,
          attackCooldown: 0,
        });
      }
    }

    enemiesRef.current = enemies;
  };

  // Start initialization when level changes
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      initializeLevel();
      // Ensure sound is active
      if (isAudioOn) {
        soundEngine.startBgm();
      }
    } else {
      soundEngine.stopBgm();
    }
  }, [stats.level, gameState]);

  // Particle Spawner Helper
  const spawnParticles = (x: number, y: number, color: string, count: number = 8, speedMult: number = 1) => {
    const list = [...particlesRef.current];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.5 + Math.random() * 2.5) * speedMult;
      const life = 300 + Math.random() * 300;
      list.push({
        id: Math.random().toString(),
        x,
        y,
        vX: Math.cos(angle) * speed,
        vY: Math.sin(angle) * speed - (Math.random() * 1.5), // lift up some dust
        size: 2 + Math.random() * 4,
        color,
        alpha: 1,
        life,
        maxLife: life,
      });
    }
    particlesRef.current = list;
  };

  // Create Popup text and let it float
  const spawnPopup = (x: number, y: number, text: string, color: string) => {
    popupsRef.current.push({
      id: Math.random().toString(),
      x,
      y: y - 10,
      text,
      color,
      life: 50,
    });
  };

  // Perform Attack on enemies
  const performPlayerAttack = () => {
    const p = playerRef.current;
    if (p.attackCooldown > 0) return;

    // Fetch weapon stats
    const activeWeapon = WEAPON_DATA[statsRef.current.currentWeapon];
    
    // Cooldown reduction based on agility (up to -50% CD)
    const agilityVal = statsRef.current.agility || 1;
    const cooldownMultiplier = Math.max(0.5, 1 - (agilityVal - 1) * 0.04);

    const isRanged = activeWeapon.type === WeaponType.BOW || activeWeapon.type === WeaponType.CROSSBOW || activeWeapon.type === WeaponType.STAFF;

    if (isRanged) {
      const isMagic = activeWeapon.type === WeaponType.STAFF;
      const normalCount = statsRef.current.normalArrows || 0;
      const poisonCount = statsRef.current.poisonArrows || 0;

      if (!isMagic && normalCount <= 0 && poisonCount <= 0) {
        spawnPopup(p.x + p.width/2, p.y, 'ПОТРІБНО СТРІЛИ! 🏹', '#EF4444');
        p.attackCooldown = 300;
        return;
      }

      const usePoison = !isMagic && poisonCount > 0;

      if (!isMagic) {
        setStats((prev) => {
          const nextNormal = usePoison ? (prev.normalArrows || 0) : Math.max(0, (prev.normalArrows || 0) - 1);
          const nextPoison = usePoison ? Math.max(0, (prev.poisonArrows || 0) - 1) : (prev.poisonArrows || 0);
          return {
            ...prev,
            normalArrows: nextNormal,
            poisonArrows: nextPoison,
          };
        });
      }

      p.isAttacking = true;
      p.attackAnimProgress = 0;
      p.attackCooldown = activeWeapon.cooldown * cooldownMultiplier;

      soundEngine.playAttack(isMagic ? 'STAFF' : 'KNIFE');

      const rarity = statsRef.current.weaponRarities?.[activeWeapon.type] || 'COMMON';
      const isLegendRange = rarity === 'LEGENDARY' || rarity === 'MYTHIC';
      const projSpeed = activeWeapon.type === WeaponType.CROSSBOW ? 11.5 : 8.5;
      const scalingDmg = Math.round(activeWeapon.damage * (statsRef.current.damageMult + ((statsRef.current.strength || 1) - 1) * 0.05));

      if (isLegendRange) {
        // Legendary multi shot launches 3 arrows!
        const angles = [0, -2.1, 2.1];
        angles.forEach(offsetY => {
          projectilesRef.current.push({
            id: Math.random().toString(),
            x: p.x + p.facing * 10 + p.width / 2,
            y: p.y + p.height / 3 + 4,
            vX: p.facing * projSpeed,
            vY: offsetY,
            radius: isMagic ? 8 : 6,
            damage: scalingDmg,
            color: isMagic ? '#818CF8' : usePoison ? '#10B981' : '#FBBF24',
            fromPlayer: true,
            isPoison: usePoison,
            isMagic,
          } as any);
        });
      } else {
        projectilesRef.current.push({
          id: Math.random().toString(),
          x: p.x + p.facing * 10 + p.width / 2,
          y: p.y + p.height / 3 + 4,
          vX: p.facing * projSpeed,
          vY: 0,
          radius: isMagic ? 8 : 6,
          damage: scalingDmg,
          color: isMagic ? '#818CF8' : usePoison ? '#10B981' : '#FBBF24',
          fromPlayer: true,
          isPoison: usePoison,
          isMagic,
        } as any);
      }

      spawnParticles(p.x + (p.facing === 1 ? p.width + 10 : -10), p.y + p.height / 3 + 4, isMagic ? '#818CF8' : usePoison ? '#10B981' : '#FBBF24', 6, 0.8);
      return;
    }

    p.isAttacking = true;
    p.attackAnimProgress = 0;
    
    // Fetch weapon stats
    p.attackCooldown = activeWeapon.cooldown * cooldownMultiplier;

    soundEngine.playAttack(activeWeapon.type);

    // Hit boundaries: facing direction
    const range = activeWeapon.range;
    const reachX = p.facing === 1 ? p.x + p.width : p.x - range;
    const attackBox = {
      x: p.facing === 1 ? p.x + p.width - 10 : p.x - range + 10,
      y: p.y - 10,
      width: range,
      height: p.height + 20,
    };

    // Slash particle ring
    const slashCenterX = p.facing === 1 ? p.x + p.width + 30 : p.x - 30;
    spawnParticles(slashCenterX, p.y + p.height/2, activeWeapon.color, 6, 1.2);

    let hitAny = false;

    const remainingEnemies = enemiesRef.current.map((enemy) => {
      const overlapX = attackBox.x < enemy.x + enemy.width && attackBox.x + attackBox.width > enemy.x;
      const overlapY = attackBox.y < enemy.y + enemy.height && attackBox.y + attackBox.height > enemy.y;

      if (overlapX && overlapY) {
        hitAny = true;
        const rarity = statsRef.current.weaponRarities?.[activeWeapon.type] || 'COMMON';

        // Attributes scaling formulas
        const strVal = statsRef.current.strength || 1;
        const strengthDmgMult = statsRef.current.damageMult + (strVal - 1) * 0.05;

        let rarityDmgMult = 1.0;
        if (rarity === 'RARE') rarityDmgMult = 1.15;
        else if (rarity === 'EPIC') rarityDmgMult = 1.35;
        else if (rarity === 'LEGENDARY') rarityDmgMult = 1.60;
        else if (rarity === 'MYTHIC') rarityDmgMult = 2.15;

        // Luck crit calculations
        const luckVal = statsRef.current.luck || 1;
        const critChance = 0.05 + (luckVal - 1) * 0.02;
        const isCrit = Math.random() < critChance;
        const damageRaw = Math.round(activeWeapon.damage * strengthDmgMult * rarityDmgMult);
        const damage = isCrit ? Math.round(damageRaw * 1.7) : damageRaw;

        const nextHp = Math.max(0, enemy.hp - damage);

        // Chain Lightning Strike
        const isLegendsActive = rarity === 'LEGENDARY' || rarity === 'MYTHIC';
        if (isLegendsActive && Math.random() < 0.35) {
          spawnPopup(enemy.x + enemy.width/2, enemy.y - 20, '⚡ ЛАНЦЮГОВА БЛИСКАВКА! ⚡', '#A855F7');
          let struckCount = 0;
          enemiesRef.current.forEach(otherEn => {
            if (otherEn.id !== enemy.id && otherEn.hp > 0 && struckCount < 3) {
              const chainDmg = Math.round(damage * 1.2);
              otherEn.hp = Math.max(0, otherEn.hp - chainDmg);
              otherEn.isHit = true;
              otherEn.hitTimer = 10;
              struckCount++;

              (window as any).lightningStrikes = (window as any).lightningStrikes || [];
              (window as any).lightningStrikes.push({
                startX: enemy.x + enemy.width/2,
                startY: enemy.y + enemy.height/2,
                endX: otherEn.x + otherEn.width/2,
                endY: otherEn.y + otherEn.height/2,
                timer: 15,
              });

              spawnParticles(otherEn.x + otherEn.width/2, otherEn.y + otherEn.height/2, '#C084FC', 12, 1.2);
              spawnPopup(otherEn.x + otherEn.width/2, otherEn.y, `-${chainDmg} ⚡`, '#C084FC');
            }
          });
        }
        
        // Spawn hit effect
        spawnParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, isCrit ? '#FBBF24' : '#F59E0B', isCrit ? 20 : 12, 1.5);
        spawnPopup(enemy.x + enemy.width/2, enemy.y, isCrit ? `-${damage} КРИТ! 💥` : `-${damage}`, isCrit ? '#FBBF24' : '#EF4444');
        soundEngine.playHitEnemy();

        return {
          ...enemy,
          hp: nextHp,
          isHit: true,
          hitTimer: 8,
        };
      }
      return enemy;
    });

    // Check enemies filter out dead
    const deadCount = remainingEnemies.filter(e => e.hp <= 0).length;
    if (deadCount > 0) {
      setStats((prev) => ({
        ...prev,
        kills: prev.kills + deadCount,
        score: prev.score + deadCount * 120,
      }));
    }

    enemiesRef.current = remainingEnemies.filter(e => {
      if (e.hp <= 0) {
        // Splat effect
        spawnParticles(e.x + e.width/2, e.y + e.height/2, e.color, 24, 2.5);
        
        // Spawn a coin dropping at this position!
        droppedCoinsRef.current.push({
          id: Math.random().toString(),
          x: e.x + e.width / 2,
          y: e.y + e.height / 2,
          vY: -3.5, // nice jump upward!
          bounceCount: 0,
          width: 14,
          height: 14,
          timer: Math.random() * 10,
        });

        if (e.type === EnemyType.BOSS) {
          spawnPopup(e.x + e.width/2, e.y, 'ПОДОВАНО!', '#A855F7');
        }
        return false;
      }
      return true;
    });

    if (hitAny) {
      // Small screen rumble
      // simple visual kickback to game loop
    }
  };

  // Game Main Logic Thread loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (timestamp: number) => {
      if (gameState !== GameState.PLAYING) return;
      if (activeTabRef.current !== 'game') {
        animId = requestAnimationFrame(loop);
        return;
      }
      
      const dt = timestamp - lastTime;
      lastTime = timestamp;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      // 1. UPDATE STATES
      const p = playerRef.current;
      const curWeapon = WEAPON_DATA[statsRef.current.currentWeapon];

      // Passive Mana Regeneration Tick
      const maxMana = statsRef.current.maxMana || 20;
      const intelVal = statsRef.current.intelligence || 1;
      const manaRegenRate = (1.5 + intelVal * 0.15) * (dt / 1000);
      setStats(prev => ({
        ...prev,
        mana: Math.min(prev.maxMana || 20, (prev.mana || 0) + manaRegenRate)
      }));

      // Update player walk speed dynamically based on Agility!
      const agilityVal = statsRef.current.agility || 1;
      p.speed = 4 + agilityVal * 0.15;

      // Reset velocity
      p.vX = 0;
      let isMoving = false;

      if (keysRef.current['left'] || touchKeysRef.current.left) {
        p.vX = -p.speed;
        p.facing = -1;
        isMoving = true;
      }
      if (keysRef.current['right'] || touchKeysRef.current.right) {
        p.vX = p.speed;
        p.facing = 1;
        isMoving = true;
      }

      // Apply walk animation cycle
      if (isMoving) {
        p.walkCycle += 0.15;
        // spawn subtle walking dust particle
        if (Math.random() < 0.1) {
          spawnParticles(p.x + p.width/2, p.y + p.height, currentLevelConfig.groundColor, 2, 0.4);
        }
      } else {
        p.walkCycle = 0;
      }

      p.x += p.vX;

      // Restrain inside canvas bounds
      if (p.x < 10) p.x = 10;
      if (p.x > WORLD_WIDTH - p.width - 10) p.x = WORLD_WIDTH - p.width - 10;

      // Cool landing and jumping physics
      const gravity = 0.5;
      const jumpForce = -9.5;

      // Apply vertical movement & gravity
      p.vY += gravity;
      p.y += p.vY;

      // Clamp player to ground floor level Y=350
      if (p.y >= 350) {
        p.y = 350;
        p.vY = 0;
      }

      // Trigger jump if key is down and and we are on ground
      if (keysRef.current['jump'] && p.y === 350) {
        p.vY = jumpForce;
        if (isAudioOn) soundEngine.playClick();
        spawnParticles(p.x + p.width/2, 350 + p.height, currentLevelConfig.groundColor, 6, 0.6);
      }

      // Cooldown timer tick
      if (p.attackCooldown > 0) p.attackCooldown -= dt;
      if (p.invincibleTime > 0) p.invincibleTime -= dt;

      // Handle attacking animate
      if (p.isAttacking) {
        p.attackAnimProgress += 0.12;
        if (p.attackAnimProgress >= 1) {
          p.isAttacking = false;
          p.attackAnimProgress = 0;
        }
      }

      // Trigger swing attack if held
      if (keysRef.current['attack'] || touchKeysRef.current.attack) {
        performPlayerAttack();
      }

      // 2. UPDATE ENEMIES
      const nextEnemies = enemiesRef.current.map((enemy) => {
        let { x, y, speed, type } = enemy;
        let direction = enemy.direction || 1;
        let changeDir = false;

        // Flash timer tick
        let hitTimer = enemy.hitTimer ? enemy.hitTimer - 1 : 0;
        let isHit = hitTimer > 0;

        // Poison timer metrics
        let poisonTimer = (enemy as any).poisonTimer || 0;
        let poisonTickTimer = (enemy as any).poisonTickTimer || 0;
        let hp = enemy.hp;

        if (poisonTimer > 0) {
          poisonTimer -= dt;
          poisonTickTimer -= dt;
          if (poisonTickTimer <= 0) {
            hp = Math.max(0, hp - 1);
            poisonTickTimer = 500;
            spawnParticles(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2, '#10B981', 4, 0.8);
            spawnPopup(enemy.x + enemy.width / 2, enemy.y - 12, `-1 🧪`, '#10B981');
          }
        }

        // Move towards player
        const distToPlayer = Math.abs((p.x + p.width/2) - (x + enemy.width/2));
        
        if (type === EnemyType.BOSS) {
          // Boss Logic
          // Hovers or floats around smoothly
          const targetX = p.x + (p.facing === 1 ? -150 : 150) + Math.sin(timestamp * 0.002) * 50;
          x += (targetX - x) * 0.02;

          // hover wave
          y = 180 + Math.sin(timestamp * 0.003) * 15;

          // Shoots projectile
          let shootCooldown = (enemy.shootCooldown || 0) - dt;
          if (shootCooldown <= 0) {
            // fire dark missile toward player
            const angle = Math.atan2((p.y + p.height/2) - (y + enemy.height/2), (p.x + p.width/2) - (x + enemy.width/2));
            const vX = Math.cos(angle) * 4.5;
            const vY = Math.sin(angle) * 4.5;
            projectilesRef.current.push({
              id: Math.random().toString(),
              x: x + enemy.width / 2,
              y: y + enemy.height / 2,
              vX,
              vY,
              radius: 12,
              damage: enemy.damage + 2, // boss ranged deal extra hurt
              color: '#A855F7',
            });
            shootCooldown = 1800 + Math.random() * 800; // time between attacks
            soundEngine.playAttack('KNIFE'); // swoosh
          }

          // Occasional ground shockwave
          let attackCooldown = (enemy.attackCooldown || 0) - dt;
          if (attackCooldown <= 0 && distToPlayer < 200) {
            // stomp and trigger lava dust!
            spawnParticles(x + enemy.width/2, 350 + 20, '#EF4444', 35, 2.0);
            if (Math.abs(p.x - x) < 180) {
              // strike player
              applyPlayerDamage(enemy.damage);
            }
            attackCooldown = 3000;
          }

          return {
            ...enemy,
            x,
            y,
            hp,
            poisonTimer,
            poisonTickTimer,
            isHit,
            hitTimer,
            shootCooldown,
            attackCooldown,
          };
        } else {
          // Normal mob crawl AI
          const dirX = Math.sign(p.x - x);
          x += dirX * speed;

          // Ground bounce walking look
          if (type === EnemyType.SLIME) {
            y = 350 + 24 - (Math.abs(Math.sin(timestamp * 0.01)) * 12);
          } else if (type === EnemyType.GOBLIN) {
            y = 350 + 8 - (Math.abs(Math.sin(timestamp * 0.014)) * 6);
          } else if (type === EnemyType.SKELETON) {
            y = 350;
          } else if (type === EnemyType.DEMON) {
            // flutters upper air
            y = 280 + Math.sin(timestamp * 0.01) * 8;
          }

          // Attack player on overlap touch
          let attackCooldown = (enemy.attackCooldown || 0) - dt;
          const isTouchingPlayer = Math.abs((p.x + p.width/2) - (x + enemy.width/2)) < (p.width/2 + enemy.width/2) &&
                                  Math.abs((p.y + p.height/2) - (y + enemy.height/2)) < (p.height/2 + enemy.height/2);

          if (isTouchingPlayer && attackCooldown <= 0) {
            applyPlayerDamage(enemy.damage);
            attackCooldown = 1200; // delay between bites
          }

          return {
            ...enemy,
            x,
            y,
            hp,
            poisonTimer,
            poisonTickTimer,
            isHit,
            hitTimer,
            attackCooldown,
          };
        }
      });

      // Filter out poisoned dead ones with drops
      const poisonedDeadEnemies = nextEnemies.filter(e => e.hp <= 0);
      if (poisonedDeadEnemies.length > 0) {
        setStats((prev) => ({
          ...prev,
          kills: prev.kills + poisonedDeadEnemies.length,
          score: prev.score + poisonedDeadEnemies.length * 120,
        }));

        poisonedDeadEnemies.forEach(e => {
          spawnParticles(e.x + e.width / 2, e.y + e.height / 2, e.color, 24, 2.5);
          
          droppedCoinsRef.current.push({
            id: Math.random().toString(),
            x: e.x + e.width / 2,
            y: e.y + e.height / 2,
            vY: -3.5,
            bounceCount: 0,
            width: 14,
            height: 14,
            timer: Math.random() * 10,
          });

          if (e.type === EnemyType.BOSS) {
            spawnPopup(e.x + e.width / 2, e.y, 'ПОДОЛАНО!', '#A855F7');
          }
        });
      }

      enemiesRef.current = nextEnemies.filter(e => e.hp > 0);

      // 3. UPDATE MISSILES/PROJECTILES
      projectilesRef.current = projectilesRef.current.filter((missile: any) => {
        missile.x += missile.vX;
        missile.y += missile.vY;

        if (missile.fromPlayer) {
          for (let i = 0; i < enemiesRef.current.length; i++) {
            const enemy = enemiesRef.current[i];
            const overlapX = missile.x >= enemy.x && missile.x <= enemy.x + enemy.width;
            const overlapY = missile.y >= enemy.y && missile.y <= enemy.y + enemy.height;

            if (overlapX && overlapY) {
              // Check special magic spells
              if (missile.isFireball) {
                // Splash damage:
                const explosionRange = 75;
                const fbDmg = missile.damage;
                enemiesRef.current.forEach(otherEn => {
                  const enDist = Math.hypot((otherEn.x + otherEn.width/2) - missile.x, (otherEn.y + otherEn.height/2) - missile.y);
                  if (enDist <= explosionRange) {
                    otherEn.hp = Math.max(0, otherEn.hp - fbDmg);
                    otherEn.isHit = true;
                    otherEn.hitTimer = 10;
                    spawnParticles(otherEn.x + otherEn.width/2, otherEn.y + otherEn.height/2, '#EF4444', 8, 1.0);
                  }
                });
                spawnPopup(enemy.x + enemy.width/2, enemy.y - 12, `💥 ВИБУХ! -${fbDmg}`, '#EF4444');
                spawnParticles(missile.x, missile.y, '#F97316', 22, 1.8);
                soundEngine.playHitEnemy();
                return false;
              }

              if (missile.isFrostbolt) {
                // Freeze single target entirely
                enemy.hp = Math.max(0, enemy.hp - missile.damage);
                enemy.isHit = true;
                enemy.hitTimer = 10;
                (enemy as any).frozenTimer = 3000; // frozen countdown
                enemy.speed = 0; // stop moving
                spawnPopup(enemy.x + enemy.width/2, enemy.y, `❄️ ЗАМОРОЖЕНО -${missile.damage}`, '#38BDF8');
                spawnParticles(missile.x, missile.y, '#38BDF8', 16, 1.2);
                soundEngine.playHitEnemy();
                return false;
              }

              const isCrit = Math.random() < (0.05 + ((statsRef.current.luck || 1) - 1) * 0.02); // Luck bonus crit!
              const damage = isCrit ? Math.round(missile.damage * 1.7) : missile.damage;
              enemy.hp = Math.max(0, enemy.hp - damage);
              enemy.isHit = true;
              enemy.hitTimer = 8;

              if (missile.isPoison) {
                (enemy as any).poisonTimer = 2000;
                (enemy as any).poisonTickTimer = 500;
                spawnPopup(enemy.x + enemy.width / 2, enemy.y, isCrit ? `-${damage} КРИТ! 🧪` : `-${damage} 🧪 Отрута!`, '#10B981');
              } else {
                spawnPopup(enemy.x + enemy.width / 2, enemy.y, isCrit ? `-${damage} КРИТ! 💥` : `-${damage}`, '#FBBF24');
              }

              soundEngine.playHitEnemy();
              spawnParticles(missile.x, missile.y, missile.color, 14, 1.4);
              return false;
            }
          }
        } else {
          // Check strike player
          const dist = Math.hypot((p.x + p.width/2) - missile.x, (p.y + p.height/2) - missile.y);
          if (dist < missile.radius + p.width / 2) {
            applyPlayerDamage(missile.damage);
            spawnParticles(missile.x, missile.y, missile.color, 12, 1.2);
            return false; // delete missile
          }
        }

        // Check boundary out
        const offscreen = missile.x < -100 || missile.x > WORLD_WIDTH + 100 || missile.y < -100 || missile.y > 550;
        return !offscreen;
      });

      // Particulate animation tick
      particlesRef.current = particlesRef.current.map((part) => {
        part.x += part.vX;
        part.y += part.vY;
        part.life -= dt;
        part.alpha = Math.max(0, part.life / part.maxLife);
        return part;
      }).filter((part) => part.life > 0);

      // Floaters tick
      popupsRef.current = popupsRef.current.map((pop) => {
        pop.y -= 0.8;
        pop.life -= 1;
        return pop;
      }).filter((pop) => pop.life > 0);

      // 3.5 UPDATE AND COLLECT COINS
      droppedCoinsRef.current = droppedCoinsRef.current.map((coin) => {
        coin.timer += dt * 0.01;
        
        // Gravity drop until hitting floor coordinate y = 380
        if (coin.y < 380) {
          coin.vY += 0.25; // gravity pull
          coin.y += coin.vY;
        } else {
          coin.y = 380;
          if (coin.bounceCount < 2) {
            coin.vY = -coin.vY * 0.4; // bounce with coefficient 0.4
            coin.bounceCount++;
            coin.y += coin.vY;
          } else {
            coin.vY = 0;
          }
        }
        return coin;
      });

      // Collision detection between player and coins
      droppedCoinsRef.current = droppedCoinsRef.current.filter((coin) => {
        const p = playerRef.current;
        const playerCenterX = p.x + p.width / 2;
        const playerCenterY = p.y + p.height / 2;
        
        const dist = Math.hypot(playerCenterX - coin.x, playerCenterY - coin.y);
        
        if (dist < 32) {
          if (isAudioOn) {
            soundEngine.playCoin(); 
          }

          // Luck double-gold calculations
          const luckVal = statsRef.current.luck || 1;
          const doubleChance = Math.min(0.75, (luckVal - 1) * 0.03);
          const activeRarity = statsRef.current.weaponRarities?.[statsRef.current.currentWeapon] || 'COMMON';
          const isDoublingGear = activeRarity === 'LEGENDARY' || activeRarity === 'MYTHIC';
          const isDoubled = Math.random() < (doubleChance + (isDoublingGear ? 0.35 : 0.0));

          const gain = isDoubled ? 2 : 1;
          
          setStats((prev) => ({
            ...prev,
            coins: (prev.coins || 0) + gain,
            score: prev.score + (50 * gain),
          }));
          
          spawnParticles(coin.x, coin.y, '#FBBF24', 12, 1.25);
          spawnPopup(coin.x, coin.y, isDoubled ? `х2 ЗОЛОТО! 🪙🔥` : `+1 🪙`, '#FBBF24');
          return false; 
        }
        return true; // keep coin
      });

      // 4. RENDERING CANVAS SCENE
      ctx.clearRect(0, 0, 800, 450);

      // Compute camera translation scroll offset
      const cameraX = Math.max(0, Math.min(WORLD_WIDTH - 800, p.x - 400));

      // Sky Background (fixed background)
      ctx.fillStyle = currentLevelConfig.bgColor;
      ctx.fillRect(0, 0, 800, 450);

      // Ambiance Level Particles (fixed on-screen layers for weather/particles)
      drawAmbianceParticles(ctx, timestamp);

      // Apply CAMERA SCROLL Translation for in-world elements
      ctx.save();
      ctx.translate(-cameraX, 0);

      // Far background scenery (relative hills)
      drawBackgroundMountains(ctx);

      // Floor ground Line (wide world space)
      ctx.fillStyle = currentLevelConfig.groundColor;
      ctx.fillRect(0, 390, WORLD_WIDTH, 60);
      
      // Ground light stripe
      ctx.fillStyle = currentLevelConfig.accentColor + '88'; // high transparent accent stripe
      ctx.fillRect(0, 390, WORLD_WIDTH, 4);

      // Render glowing physical PORTAL if all waves/enemies are defeated!
      if (enemiesRef.current.length === 0) {
        drawPortal(ctx, timestamp);
      }

      // Render Enemies
      enemiesRef.current.forEach((enemy) => {
        ctx.save();
        
        // Color overlay and red filter if hit
        if (enemy.isHit) {
          ctx.shadowColor = '#EF4444';
          ctx.shadowBlur = 15;
        }

        ctx.fillStyle = enemy.isHit ? '#EF4444' : enemy.color;

        if (enemy.type === EnemyType.BOSS) {
          // Render giant final evil dark wizard/armored boss
          ctx.beginPath();
          // Draw hovering dark body robe
          ctx.moveTo(enemy.x, enemy.y + enemy.height);
          ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height);
          ctx.lineTo(enemy.x + enemy.width - 15, enemy.y + 35);
          ctx.lineTo(enemy.x + 15, enemy.y + 35);
          ctx.closePath();
          ctx.fill();

          // Draw Glowing Crown/Helmet
          ctx.fillStyle = '#6B21A8'; // Darker Violet
          ctx.fillRect(enemy.x + 20, enemy.y, enemy.width - 40, 36);
          // Crown spike
          ctx.fillStyle = '#F59E0B'; // Gold points
          ctx.beginPath();
          ctx.moveTo(enemy.x + 20, enemy.y);
          ctx.lineTo(enemy.x + 30, enemy.y - 15);
          ctx.lineTo(enemy.x + 40, enemy.y);
          ctx.lineTo(enemy.x + 50, enemy.y - 20); // main spike
          ctx.lineTo(enemy.x + 60, enemy.y);
          ctx.lineTo(enemy.x + 70, enemy.y - 15);
          ctx.lineTo(enemy.x + 80, enemy.y);
          ctx.closePath();
          ctx.fill();

          // Red glowing horns/face visor
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(enemy.x + 28, enemy.y + 12, enemy.width - 56, 12);
          ctx.fillStyle = '#FFFFFF'; // glaring light white slits
          ctx.fillRect(enemy.x + 35, enemy.y + 16, 8, 4);
          ctx.fillRect(enemy.x + enemy.width - 43, enemy.y + 16, 8, 4);

          // Big Purple energy wings
          ctx.strokeStyle = '#D8B4FE';
          ctx.lineWidth = 5;
          ctx.beginPath();
          // Left Wing
          ctx.moveTo(enemy.x + 25, enemy.y + 40);
          ctx.bezierCurveTo(enemy.x - 60, enemy.y - 20, enemy.x - 40, enemy.y + 90, enemy.x + 15, enemy.y + 70);
          // Right Wing
          ctx.moveTo(enemy.x + enemy.width - 25, enemy.y + 40);
          ctx.bezierCurveTo(enemy.x + enemy.width + 60, enemy.y - 20, enemy.x + enemy.width + 40, enemy.y + 90, enemy.x + enemy.width - 15, enemy.y + 70);
          ctx.stroke();

          // Render boss active hp bar above him
          const barW = 120;
          const barH = 6;
          const bx = enemy.x + enemy.width / 2 - barW / 2;
          const by = enemy.y - 30;
          ctx.fillStyle = '#111827';
          ctx.fillRect(bx, by, barW, barH);
          ctx.fillStyle = '#EF4444';
          ctx.fillRect(bx, by, barW * (enemy.hp / enemy.maxHp), barH);

          // Add shield indicator glow if phase/casting
          const pulse = Math.sin(timestamp * 0.005) * 8 + 12;
          ctx.strokeStyle = '#D8B4FE88';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(enemy.x + enemy.width/2, enemy.y + enemy.height/2, enemy.width/1.2 + pulse, 0, Math.PI * 2);
          ctx.stroke();

        } else if (enemy.type === EnemyType.SKELETON) {
          // Draw funny skeleton bones
          ctx.fillRect(enemy.x + 4, enemy.y + 12, enemy.width - 8, enemy.height - 12); // ribs torso
          // skull head
          ctx.fillStyle = '#F1F5F9';
          ctx.beginPath();
          ctx.arc(enemy.x + enemy.width / 2, enemy.y + 10, 10, 0, Math.PI * 2);
          ctx.fill();
          // skull eye cavities
          ctx.fillStyle = '#000000';
          ctx.fillRect(enemy.x + enemy.width/2 - 6, enemy.y + 8, 4, 4);
          ctx.fillRect(enemy.x + enemy.width/2 + 2, enemy.y + 8, 4, 4);
          // bones legs
          ctx.fillStyle = '#E2E8F0';
          ctx.fillRect(enemy.x + 8, enemy.y + enemy.height - 14, 4, 14);
          ctx.fillRect(enemy.x + enemy.width - 12, enemy.y + enemy.height - 14, 4, 14);

        } else if (enemy.type === EnemyType.GOBLIN) {
          // Draw green/sand goblin
          ctx.fillRect(enemy.x, enemy.y + 12, enemy.width, enemy.height - 12);
          // Head with pointy ears
          ctx.beginPath();
          ctx.arc(enemy.x + enemy.width/2, enemy.y + 10, 9, 0, Math.PI * 2);
          ctx.fill();
          // Pointy Left ear
          ctx.beginPath();
          ctx.moveTo(enemy.x + enemy.width/2 - 9, enemy.y + 10);
          ctx.lineTo(enemy.x + enemy.width/2 - 20, enemy.y + 4);
          ctx.lineTo(enemy.x + enemy.width/2 - 9, enemy.y + 14);
          ctx.fill();
          // Pointy Right ear
          ctx.beginPath();
          ctx.moveTo(enemy.x + enemy.width/2 + 9, enemy.y + 10);
          ctx.lineTo(enemy.x + enemy.width/2 + 20, enemy.y + 4);
          ctx.lineTo(enemy.x + enemy.width/2 + 9, enemy.y + 14);
          ctx.fill();

        } else if (enemy.type === EnemyType.DEMON) {
          // bat demon with wings
          ctx.fillRect(enemy.x + 6, enemy.y + 8, enemy.width - 12, enemy.height - 8);
          // Red wing flapping representation
          ctx.fillStyle = '#991B1B';
          const flap = Math.sin(timestamp * 0.02) * 10;
          ctx.beginPath();
          ctx.moveTo(enemy.x + 6, enemy.y + 12);
          ctx.lineTo(enemy.x - 16, enemy.y - flap);
          ctx.lineTo(enemy.x + 6, enemy.y + 24);
          ctx.moveTo(enemy.x + enemy.width - 6, enemy.y + 12);
          ctx.lineTo(enemy.x + enemy.width + 16, enemy.y - flap);
          ctx.lineTo(enemy.x + enemy.width - 6, enemy.y + 24);
          ctx.fill();

          // glowing eyes
          ctx.fillStyle = '#FBBF24';
          ctx.beginPath();
          ctx.arc(enemy.x + enemy.width/2 - 4, enemy.y + 12, 2.5, 0, Math.PI*2);
          ctx.arc(enemy.x + enemy.width/2 + 4, enemy.y + 12, 2.5, 0, Math.PI*2);
          ctx.fill();

        } else {
          // SLIME: pulsing blob!
          const scaleY = 1 + Math.sin(timestamp * 0.01) * 0.15;
          ctx.save();
          ctx.translate(enemy.x + enemy.width/2, enemy.y + enemy.height);
          ctx.scale(1.2, scaleY);
          ctx.beginPath();
          ctx.arc(0, -12, 12, Math.PI, 0, false);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // little white eyes
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(enemy.x + enemy.width/2 - 4, enemy.y + enemy.height - 10, 2.5, 0, Math.PI*2);
          ctx.arc(enemy.x + enemy.width/2 + 4, enemy.y + enemy.height - 10, 2.5, 0, Math.PI*2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Render Missiles
      projectilesRef.current.forEach((missile: any) => {
        ctx.save();
        
        if (missile.fromPlayer) {
          if (missile.isMagic) {
            // Draw a spinning, glowing magic energy sphere
            ctx.save();
            ctx.shadowColor = missile.color;
            ctx.shadowBlur = 12 + Math.random() * 8;
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(missile.x, missile.y, missile.radius - 2, 0, Math.PI * 2);
            ctx.fill();

            // Inner aura ring
            ctx.strokeStyle = missile.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(missile.x, missile.y, missile.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          } else {
            // Standard arrow or crossbow bolt
            ctx.strokeStyle = missile.color;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const arrowLength = 20;
            const dir = Math.sign(missile.vX || 1);
            ctx.moveTo(missile.x - dir * arrowLength, missile.y);
            ctx.lineTo(missile.x, missile.y);
            ctx.stroke();

            // feathers
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(missile.x - dir * arrowLength, missile.y);
            ctx.lineTo(missile.x - dir * (arrowLength + 4), missile.y - 4);
            ctx.moveTo(missile.x - dir * arrowLength, missile.y);
            ctx.lineTo(missile.x - dir * (arrowLength + 4), missile.y + 4);
            ctx.stroke();

            // glowing tip
            ctx.fillStyle = missile.color;
            ctx.beginPath();
            ctx.arc(missile.x, missile.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          ctx.beginPath();
          const randGlow = 4 + Math.random() * 6;
          ctx.shadowColor = missile.color;
          ctx.shadowBlur = randGlow;
          ctx.fillStyle = '#FFFFFF';
          ctx.arc(missile.x, missile.y, missile.radius - 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = missile.color;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(missile.x, missile.y, missile.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      });

      // Render Golem Pet Companion
      const pet = (window as any).summonedPet;
      if (pet) {
        ctx.save();
        ctx.shadowColor = '#64748B';
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#475569'; // Slate-stone monster appearance
        
        // Draw stone golem body
        ctx.beginPath();
        ctx.arc(pet.x + pet.width/2, pet.y + pet.height/2, 16, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw golem shoulders & head
        ctx.fillStyle = '#334155';
        ctx.fillRect(pet.x + pet.width/2 - 20, pet.y + 4, 40, 10);
        ctx.beginPath();
        ctx.arc(pet.x + pet.width/2, pet.y + 2, 6, 0, Math.PI*2);
        ctx.fill();

        // Glowing red pet magic eye
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(pet.x + pet.width/2, pet.y + 2, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw health bars for golem under/above him
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(pet.x, pet.y - 12, pet.width, 4);
        ctx.fillStyle = '#10B981';
        ctx.fillRect(pet.x, pet.y - 12, pet.width * (pet.hp / pet.maxHp), 4);
        ctx.restore();
      }

      // Draw Lightning Strikes from Thunder Spells
      const activeStrikes = (window as any).lightningStrikes || [];
      if (activeStrikes.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#E0F2FE';
        ctx.shadowColor = '#38BDF8';
        ctx.shadowBlur = 18;
        
        activeStrikes.forEach((strike: any) => {
          ctx.lineWidth = 3 + Math.random() * 2;
          ctx.beginPath();
          ctx.moveTo(strike.startX, strike.startY);
          
          // Generate realistic Jagged zig-zag lightning paths
          const segments = 12;
          let currentY = strike.startY;
          
          for (let i = 1; i <= segments; i++) {
            const nextY = strike.startY + ((strike.endY - strike.startY) / segments) * i;
            const targetX = strike.startX + ((strike.endX - strike.startX) / segments) * i;
            const randOffset = (Math.random() - 0.5) * 24;
            const nextX = targetX + randOffset;
            
            ctx.lineTo(nextX, nextY);
            currentY = nextY;
          }
          ctx.lineTo(strike.endX, strike.endY);
          ctx.stroke();

          // Spark points
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(strike.endX, strike.endY, 6, 0, Math.PI*2);
          ctx.fill();

          strike.timer--;
        });
        
        // Clean up expired visual lightning strikes
        (window as any).lightningStrikes = activeStrikes.filter((s: any) => s.timer > 0);
        ctx.restore();
      }

      // Render Dropped Coins
      droppedCoinsRef.current.forEach((coin) => {
        ctx.save();
        ctx.beginPath();
        ctx.shadowColor = '#FBBF24';
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#FBBF24'; // Gold center
        const rx = Math.max(2, Math.abs(Math.sin(coin.timer * 4)) * (coin.width / 2));
        const ry = coin.height / 2;
        ctx.ellipse(coin.x, coin.y, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#D97706'; // Amber/dark gold border
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (rx > 3) {
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(coin.x - rx * 0.3, coin.y - ry * 0.3, 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // Render Player (Human Warrior Representation)
      const pInv = p.invincibleTime > 0 && Math.floor(timestamp / 60) % 2 === 0;
      if (!pInv) {
        // Draw rarity magic auras
        const curRar = statsRef.current.weaponRarities?.[statsRef.current.currentWeapon] || 'COMMON';
        if (curRar === 'LEGENDARY' || curRar === 'MYTHIC') {
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x + p.width/2, p.y + p.height/2, 36, 0, Math.PI * 2);
          const rawGradient = ctx.createRadialGradient(
            p.x + p.width/2, p.y + p.height/2, 10,
            p.x + p.width/2, p.y + p.height/2, 36
          );
          if (curRar === 'LEGENDARY') {
            rawGradient.addColorStop(0, 'rgba(245, 158, 11, 0.28)');
            rawGradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
          } else {
            rawGradient.addColorStop(0, 'rgba(239, 68, 68, 0.40)');
            rawGradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
          }
          ctx.fillStyle = rawGradient;
          ctx.fill();
          ctx.restore();

          if (Math.random() < 0.12) {
            spawnParticles(p.x + Math.random() * p.width, p.y + p.height - 4, curRar === 'LEGENDARY' ? '#F59E0B' : '#EF4444', 1, 0.5);
          }
        }

        ctx.save();
        
        // Face Direction flip support
        ctx.translate(p.x + p.width / 2, p.y + p.height / 2);
        ctx.scale(p.facing, 1);

        // Render walking offset bounce
        const walkBounceY = isMoving ? Math.sin(p.walkCycle) * 3 : 0;

        // Player Shadow Ring below
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, p.height / 2, 15, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Armor Plate Legs (drawn as blue/metal plates)
        ctx.fillStyle = '#1E3A8A'; // Deep Navy
        ctx.fillRect(-10, walkBounceY + 12, 7, 12);
        ctx.fillRect(3, walkBounceY + 12, 7, 12);
        // Boots
        ctx.fillStyle = '#475569';
        ctx.fillRect(-12, walkBounceY + 20, 9, 4);
        ctx.fillRect(1, walkBounceY + 20, 9, 4);

        // Body Plate torso armor
        ctx.fillStyle = '#2563EB'; // Vibrant Knight blue
        ctx.fillRect(-12, walkBounceY - 14, 24, 26);
        
        // Gold Chest plate trim
        ctx.fillStyle = '#F59E0B';
        ctx.fillRect(-12, walkBounceY - 12, 24, 4);
        ctx.fillRect(-3, walkBounceY - 8, 6, 12);

        // Warrior head
        ctx.fillStyle = '#FDBA74'; // Peach head skin color
        ctx.beginPath();
        ctx.arc(0, walkBounceY - 22, 10, 0, Math.PI * 2);
        ctx.fill();

        // Blue Knight helmet cap with feather
        ctx.fillStyle = '#1D4ED8';
        ctx.beginPath();
        ctx.arc(0, walkBounceY - 24, 11, Math.PI, 0, false);
        ctx.closePath();
        ctx.fill();
        
        // Red plume helmet ribbon
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-4, walkBounceY - 33);
        ctx.quadraticCurveTo(-14, walkBounceY - 39, -18, walkBounceY - 28);
        ctx.stroke();

        // Draw Eye shield slit
        ctx.fillStyle = '#111827';
        ctx.fillRect(-1, walkBounceY - 24, 9, 3);
        ctx.fillStyle = '#FED7AA'; // bright eye sparkle slit
        ctx.fillRect(4, walkBounceY - 24, 2, 2);

        // RENDERING WEAPON & SWING ATTACK VISUAL
        if (p.isAttacking) {
          ctx.save();
          // swing rotation around player side
          const activeWDetails = WEAPON_DATA[statsRef.current.currentWeapon];
          ctx.translate(14, 4);
          
          // Swoosh arc line
          const arcAngle = (p.attackAnimProgress * Math.PI) - (Math.PI / 4);
          ctx.rotate(arcAngle);

          // Draw the physical blade
          ctx.strokeStyle = activeWDetails.color;
          ctx.lineWidth = curWeapon.type === WeaponType.KATANA ? 4 : curWeapon.type === WeaponType.SWORD ? 6 : 3;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -activeWDetails.range / 1.5); // size scaled down visually for handle
          ctx.stroke();

          // Blade glowing edge
          ctx.shadowColor = activeWDetails.color;
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(0, -activeWDetails.range / 1.5);
          ctx.stroke();

          // Hilt details
          ctx.fillStyle = '#D97706'; // gold grip
          ctx.fillRect(-3, -3, 6, 6);
          ctx.fillStyle = '#78350F';
          ctx.fillRect(-6, -4, 12, 1.5);

          ctx.restore();

          // Swing light trail aura path drawn globally on parent relative coordinates
          ctx.save();
          ctx.beginPath();
          ctx.strokeStyle = activeWDetails.color + '66'; // semi transparent trail
          ctx.lineWidth = 10;
          ctx.arc(14, 4, activeWDetails.range / 1.2, -Math.PI/3, Math.PI/2, false);
          ctx.stroke();
          ctx.restore();
        } else {
          // Drawn idle sheathed weapon in back slot!
          ctx.save();
          const activeWDetails = WEAPON_DATA[statsRef.current.currentWeapon];
          ctx.translate(-10, 4);
          ctx.rotate(-Math.PI / 4);
          ctx.strokeStyle = activeWDetails.color;
          ctx.lineWidth = curWeapon.type === WeaponType.KATANA ? 3 : curWeapon.type === WeaponType.SWORD ? 5 : 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -22);
          ctx.stroke();
          ctx.restore();
        }

        ctx.restore();
      }

      // Render Particle Systems
      particlesRef.current.forEach((part) => {
        ctx.save();
        ctx.globalAlpha = part.alpha;
        ctx.fillStyle = part.color;
        // make simple nice circles
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Render Damage Float popups
      popupsRef.current.forEach((pop) => {
        ctx.save();
        ctx.fillStyle = pop.color;
        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      });

      // Restore camera translation context for screen GUI static rendering
      ctx.restore();

      // Level Complete Check Trigger (Require walking into the physical Portal at the end of the wider world!)
      if (enemiesRef.current.length === 0) {
        if (!(window as any).portalPromptShown) {
          (window as any).portalPromptShown = true;
          spawnPopup(p.x, p.y - 65, '🧙 ПОРТАЛ ВІДЧИНЕНО! Біжіть праворуч! 🌀', '#C084FC');
        }

        const distToPortal = Math.abs(p.x - PORTAL_X);
        if (distToPortal < 55 && !levelEndedRef.current) {
          levelEndedRef.current = true;
          (window as any).portalPromptShown = false;
          handleVictoryLevel();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, stats.level]);

  // Handle Level clear progression trigger
  const handleVictoryLevel = () => {
    // Play arpeggio sound clear
    soundEngine.playLevelUp();
    
    // Give bonus points
    setStats((prev) => ({
      ...prev,
      score: prev.score + prev.level * 500,
    }));

    // Smooth transition to next levels always to allow infinite play & weapon usage!
    setTimeout(() => {
      onLevelComplete();
    }, 1000);
  };

  // Helper inside the draw loop to create nice level environments
  const drawAmbianceParticles = (ctx: CanvasRenderingContext2D, timestamp: number) => {
    ctx.save();
    
    // Forest leaf falling or rain, or desert sand, etc.
    const particleColor = currentLevelConfig.accentColor + '30';
    ctx.fillStyle = particleColor;
    
    const effectIndex = stats.level % 5;
    if (effectIndex === 1) {
      // Slow falling green forest leaves
      for (let i = 0; i < 6; i++) {
        const x = (timestamp * 0.05 + i * 150) % 850 - 50;
        const y = (timestamp * 0.02 + i * 80) % 430;
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 3, Math.sin(timestamp * 0.001 + i), 0, Math.PI*2);
        ctx.fill();
      }
    } else if (effectIndex === 2) {
      // Horizontal flying sand grains
      for (let i = 0; i < 15; i++) {
        const x = (timestamp * 0.25 + i * 80) % 850 - 50;
        const y = (i * 30 + Math.sin(timestamp * 0.005 + i) * 10) % 360;
        ctx.fillRect(x, y, 9, 2);
      }
    } else if (effectIndex === 3) {
      // Soft falling snowflakes
      ctx.fillStyle = '#FFFFFF99';
      for (let i = 0; i < 20; i++) {
        const x = (i * 45 + Math.sin(timestamp * 0.002 + i) * 15) % 800;
        const y = (timestamp * 0.04 + i * 25) % 430;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (effectIndex === 4) {
      // Floating rising heat ember sparks
      ctx.fillStyle = '#FFA500aa';
      for (let i = 0; i < 12; i++) {
        const x = (i * 70) % 800;
        const y = 430 - ((timestamp * 0.06 + i * 40) % 400);
        ctx.beginPath();
        ctx.arc(x + Math.sin(timestamp * 0.003 + i) * 10, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (effectIndex === 0) {
      // Falling dark glooms/magic orbs from heaven
      ctx.fillStyle = currentLevelConfig.accentColor + '55';
      for (let i = 0; i < 10; i++) {
        const x = (i * 90) % 800;
        const y = (timestamp * 0.08 + i * 50) % 400;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI*2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  const drawBackgroundMountains = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    // Background parallax hills looping up to 2600
    ctx.fillStyle = currentLevelConfig.groundColor + '22'; // low opacity hill backdrop
    ctx.beginPath();
    ctx.moveTo(0, 390);
    for (let x = 0; x <= 2600; x += 400) {
      ctx.quadraticCurveTo(x + 100, 240, x + 200, 390);
      ctx.quadraticCurveTo(x + 300, 200, x + 400, 390);
    }
    ctx.fill();
    ctx.restore();
  };

  const drawPortal = (ctx: CanvasRenderingContext2D, timestamp: number) => {
    ctx.save();
    
    // Portal outer mystical glowing field aura
    const pulse = Math.sin(timestamp * 0.005) * 6;
    const radiusX = 25 + pulse;
    const radiusY = 55 + pulse;
    
    // Add heavy glow
    ctx.shadowColor = '#C084FC';
    ctx.shadowBlur = 24;
    
    // Create cosmic outer ring radial gradient
    const portalGrad = ctx.createRadialGradient(
      PORTAL_X, 350 - 20, 5,
      PORTAL_X, 350 - 20, radiusY
    );
    portalGrad.addColorStop(0, 'rgba(15, 10, 30, 0.95)');
    portalGrad.addColorStop(0.4, 'rgba(107, 33, 168, 0.85)');
    portalGrad.addColorStop(0.8, 'rgba(192, 132, 252, 0.6)');
    portalGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
    
    ctx.fillStyle = portalGrad;
    ctx.beginPath();
    ctx.ellipse(PORTAL_X, 350 - 20, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Swirling center lines
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 12]);
    ctx.lineDashOffset = -timestamp * 0.08;
    ctx.beginPath();
    ctx.ellipse(PORTAL_X, 350 - 20, radiusX * 0.75, radiusY * 0.75, timestamp * 0.001, 0, Math.PI * 2);
    ctx.stroke();
    
    // Portal frame pillars or light beams
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(PORTAL_X - radiusX - 10, 350 + 40);
    ctx.lineTo(PORTAL_X - radiusX - 10, 350 - 80);
    ctx.moveTo(PORTAL_X + radiusX + 10, 350 + 40);
    ctx.lineTo(PORTAL_X + radiusX + 10, 350 - 80);
    ctx.stroke();
    
    // Portal indicator label
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText('🌀 ПОРТАЛ', PORTAL_X, 350 - 95);
    
    ctx.restore();
    
    // Spawn floating purple magic energy specs
    if (Math.random() < 0.1) {
      const pX = PORTAL_X + (Math.random() - 0.5) * 40;
      const pY = 350 - 20 + (Math.random() - 0.5) * 80;
      spawnParticles(pX, pY, '#E879F9', 2, 0.5);
    }
  };

  // Damage Application System
  const applyPlayerDamage = (baseDamage: number) => {
    const p = playerRef.current;
    if (p.invincibleTime > 0) return; // ignore hit check during invincibility iframe

    // armor reduction computation
    const reducedDamage = Math.max(1, Math.round(baseDamage * (1 - statsRef.current.armorMult)));
    const nextHp = Math.max(0, statsRef.current.hp - reducedDamage);

    p.invincibleTime = 500; // 0.5 sec invulnerability
    soundEngine.playHitPlayer();
    
    // Spawn damage splatter
    spawnParticles(p.x + p.width/2, p.y + p.height/2, '#EF4444', 15, 1.8);
    spawnPopup(p.x + p.width/2, p.y, `-${reducedDamage} HP`, '#FFF0F2');

    setStats((prev) => ({
      ...prev,
      hp: nextHp,
    }));

    if (nextHp <= 0) {
      // Trigger Game Over phase
      soundEngine.playGameOver();
      setGameState(GameState.GAME_OVER);
    }
  };

  // Level Reset Trigger
  const handleRestart = () => {
    soundEngine.playUiConfirm();
    setStats({
      maxHp: 20,
      hp: 20,
      damageMult: 1.0,
      armorMult: 0.0,
      weapons: [WeaponType.KNIFE],
      currentWeapon: WeaponType.KNIFE,
      level: 1,
      score: 0,
      kills: 0,
    });
    setGameState(GameState.PLAYING);
  };

  return (
    <div className={`flex flex-col items-center justify-center transition-all duration-300 ${
      isFullscreen 
        ? 'w-full h-full min-h-screen bg-[#0E0B12] p-6 overflow-y-auto justify-start' 
        : 'w-full max-w-5xl mx-auto p-2'
    }`} ref={containerRef}>
      {/* HUD Stats Overlay Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 bg-[#1F1E24]/70 border border-white/10 p-4 rounded-2xl mb-4 text-white z-10 shadow-lg select-none uppercase text-[10px]">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <button
            onClick={() => {
              if (isAudioOn) soundEngine.playClick();
              setGameState(GameState.MENU);
            }}
            className="p-2 bg-[#1F1E24] border border-white/10 hover:bg-white/5 text-white rounded-xl flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Назад до меню"
            id="btn-back-to-menu"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-brand-accent" />
            <span className="mono-font text-[9px] font-bold tracking-wider hidden sm:inline">НАЗАД</span>
          </button>

          <div className="h-8 w-[1px] bg-white/10 self-center" />

          {/* HP Ring status indicator */}
          <div className="flex flex-col">
            <div className="text-[10px] text-slate-400 font-bold tracking-widest flex items-center gap-1 mono-font">
              <Heart className="w-3.5 h-3.5 text-brand-accent fill-current" /> ЗДОРОВ'Я
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-36 h-3.5 bg-[#0F0E11] border border-white/10 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-brand-accent transition-all duration-150"
                  style={{ width: `${(stats.hp / stats.maxHp) * 100}%` }}
                />
                <span className="absolute inset-0 text-[9px] font-bold leading-none flex items-center justify-center mono-font">
                  {stats.hp} / {stats.maxHp} HP
                </span>
              </div>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-white/10 self-center hidden sm:block" />

          {/* Weapon display */}
          <div className="flex flex-col">
            <div className="text-[10px] text-slate-400 font-bold tracking-widest flex items-center gap-1 mono-font">
              <Swords className="w-3.5 h-3.5 text-brand-accent" /> АКТИВНА ЗБРОЯ
            </div>
            <span className="text-xs font-bold text-brand-accent mt-0.5">
              {WEAPON_DATA[stats.currentWeapon].nameUa}
            </span>
          </div>
        </div>

        {/* Location & Score board */}
        <div className="flex items-center gap-5">
          <div className="flex flex-col text-right">
            <span className="text-[9px] text-brand-accent font-black tracking-widest uppercase mono-font">
              РІВЕНЬ {stats.level}
            </span>
            <span className="text-xs font-bold text-white truncate max-w-[170px]">
              {currentLevelConfig.nameUa}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-white/10 self-center" />

          <div className="flex flex-col text-right">
            <span className="text-[9px] text-brand-accent font-black tracking-widest uppercase mono-font">
              РАХУНОК
            </span>
            <span className="text-sm font-black text-brand-accent font-mono">
              {stats.score}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-white/10 self-center" />

          <div className="flex flex-col text-right">
            <span className="text-[9px] text-brand-accent font-black tracking-widest uppercase mono-font">
              МОНЕТИ
            </span>
            <span className="text-sm font-black text-yellow-500 font-mono flex items-center gap-0.5 justify-end">
              🪙 {(stats as any).coins || 0}
            </span>
          </div>

          <div className="h-8 w-[1px] bg-white/10 self-center" />

          {/* Mute button */}
          <button
            onClick={toggleAudio}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isAudioOn
                ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20'
                : 'bg-[#1F1E24] text-slate-500 border border-white/5'
            }`}
            title="Toggle Retro Sound Effects"
            id="btn-toggle-audio"
          >
            {isAudioOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <div className="h-8 w-[1px] bg-white/10 self-center" />

          {/* Fullscreen button */}
          <button
            onClick={toggleFullscreen}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isFullscreen
                ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'
                : 'bg-[#1F1E24] text-slate-400 border border-white/5 hover:text-white'
            }`}
            title="Full Screen / Повний Екран"
            id="btn-toggle-fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tab control buttons: Game vs Inventory vs Character Statistics */}
      <div className="w-full grid grid-cols-3 gap-2 mb-3 select-none uppercase">
        <button
          onClick={() => {
            if (isAudioOn) soundEngine.playClick();
            setActiveTab('game');
          }}
          className={`py-2 px-2 rounded-xl font-bold text-[9px] tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 border ${
            activeTab === 'game'
              ? 'bg-brand-accent/15 text-white border-brand-accent/50'
              : 'bg-[#1F1E24]/50 text-slate-400 border-white/5 hover:text-white'
          }`}
          id="btn-game-tab"
        >
          🎮 Файт (Бій)
        </button>
        <button
          onClick={() => {
            if (isAudioOn) soundEngine.playClick();
            setActiveTab('inventory');
          }}
          className={`py-2 px-2 rounded-xl font-bold text-[9px] tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 border ${
            activeTab === 'inventory'
              ? 'bg-brand-accent/15 text-white border-brand-accent/50'
              : 'bg-[#1F1E24]/50 text-slate-400 border-white/5 hover:text-white'
          }`}
          id="btn-inventory-tab"
        >
          🎒 Інвентар & Зачар
        </button>
        <button
          onClick={() => {
            if (isAudioOn) soundEngine.playClick();
            setActiveTab('character');
          }}
          className={`py-2 px-2 rounded-xl font-bold text-[9px] tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1 border ${
            activeTab === 'character'
              ? 'bg-indigo-500/15 text-white border-indigo-500/50'
              : 'bg-[#1F1E24]/50 text-slate-400 border-white/5 hover:text-white'
          }`}
          id="btn-character-tab"
        >
          👤 Герой ({stats.statPointsLeft || 0})
          {stats.statPointsLeft > 0 ? (
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-ping inline-block" />
          ) : null}
        </button>
      </div>

      {/* Main retro Arcade screen */}
      <div className="relative w-full aspect-[16/9] bg-[#0F0E11] rounded-2xl border-4 border-white/10 overflow-hidden shadow-2xl select-none">
        
        {activeTab === 'inventory' ? (
          <div className="absolute inset-0 bg-[#0F0E11]/95 flex flex-col p-6 overflow-y-auto select-none">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-4">
              <h3 className="text-xs font-bold text-white tracking-widest flex items-center gap-1.5 leading-none">
                🎒 ОСОБИСТИЙ ІНВЕНТАР & МАГАЗИН ЗБРОЇ
              </h3>
              <div className="flex items-center gap-1.5 bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5 rounded-full text-yellow-400 font-bold tracking-widest text-[9px] font-mono leading-none">
                🪙 {stats.coins || 0} МОНЕТ
              </div>
            </div>

            {/* List of weapons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {Object.values(WEAPON_DATA)
                .map((weapon) => {
                  const isOwned = stats.weapons.includes(weapon.type);
                  const isEquipped = stats.currentWeapon === weapon.type;
                  
                  // Prices
                  let price = 0;
                  if (weapon.type === WeaponType.SWORD) price = 10;
                  else if (weapon.type === WeaponType.AXE) price = 12;
                  else if (weapon.type === WeaponType.SPEAR) price = 15;
                  else if (weapon.type === WeaponType.MACE) price = 18;
                  else if (weapon.type === WeaponType.DAGGER) price = 8;
                  else if (weapon.type === WeaponType.KATANA) price = 22;
                  else if (weapon.type === WeaponType.BOW) price = 25;
                  else if (weapon.type === WeaponType.CROSSBOW) price = 28;
                  else if (weapon.type === WeaponType.SCYTHE) price = 32;
                  else if (weapon.type === WeaponType.WHIP) price = 20;
                  else if (weapon.type === WeaponType.HAMMER) price = 35;
                  else if (weapon.type === WeaponType.STAFF) price = 40;

                  const hasEnoughCoins = (stats.coins || 0) >= price;

                  const getEmoji = (type: string) => {
                    if (type === WeaponType.KNIFE) return '🔪';
                    if (type === WeaponType.SWORD) return '⚔️';
                    if (type === WeaponType.KATANA) return '🗡️';
                    if (type === WeaponType.BOW) return '🏹';
                    if (type === WeaponType.AXE) return '🪓';
                    if (type === WeaponType.SPEAR) return '🔱';
                    if (type === WeaponType.MACE) return '🛡️';
                    if (type === WeaponType.DAGGER) return '🗡️';
                    if (type === WeaponType.CROSSBOW) return '🎯';
                    if (type === WeaponType.SCYTHE) return '💀';
                    if (type === WeaponType.WHIP) return '🧣';
                    if (type === WeaponType.HAMMER) return '🔨';
                    if (type === WeaponType.STAFF) return '🔮';
                    return '⚔️';
                  };

                  return (
                    <div
                      key={weapon.type}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        isEquipped
                          ? 'bg-brand-accent/5 border-brand-accent shadow-[0_0_12px_rgba(255,59,63,0.15)]'
                          : isOwned
                          ? 'bg-[#1F1E24] border-white/10 hover:border-white/20'
                          : 'bg-[#1F1E24]/30 border-white/5 opacity-80'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center pb-1 border-b border-white/5">
                          <span className="text-lg">
                            {getEmoji(weapon.type)}
                          </span>
                          {isEquipped && (
                            <span className="bg-brand-accent text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-widest leading-none">
                              ЕКІПІЙОВАНО
                            </span>
                          )}
                          {!isEquipped && isOwned && (
                            <span className="bg-white/10 text-slate-300 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-widest leading-none">
                              КУПЛЕНО
                            </span>
                          )}
                          {!isOwned && (
                            <span className="bg-yellow-400/10 border border-yellow-400/25 text-yellow-400 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-widest leading-none">
                              🪙 {price}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="text-[10px] font-black text-white uppercase tracking-wider mt-2">
                          {weapon.nameUa}
                        </h4>
                        
                        <div className="mt-2 space-y-1 text-[9px] text-slate-400 font-bold leading-snug">
                          <div className="flex justify-between">
                            <span>ШКОДА:</span>
                            <span className="text-white font-mono">{weapon.damage}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>РАДІУС:</span>
                            <span className="text-white font-mono">{weapon.range}px</span>
                          </div>
                          <div className="flex justify-between">
                            <span>КООЛДАУН:</span>
                            <span className="text-white font-mono">{weapon.cooldown}ms</span>
                          </div>
                        </div>

                        {/* Rarity & Enchanting upgrade button */}
                        {isOwned && (
                          <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-col gap-1.5">
                            <div className="flex justify-between items-center text-[8.5px] font-bold">
                              <span className="text-slate-500 uppercase">РІДКІСТЬ:</span>
                              <span className={`px-1.5 py-0.5 rounded border leading-none font-black uppercase ${
                                (stats.weaponRarities?.[weapon.type] || 'COMMON') === 'COMMON' ? 'text-slate-400 bg-slate-900 border-slate-700' :
                                (stats.weaponRarities?.[weapon.type] || 'COMMON') === 'RARE' ? 'text-blue-400 bg-blue-950 border-blue-800' :
                                (stats.weaponRarities?.[weapon.type] || 'COMMON') === 'EPIC' ? 'text-purple-400 bg-purple-950 border-purple-800' :
                                (stats.weaponRarities?.[weapon.type] || 'COMMON') === 'LEGENDARY' ? 'text-amber-400 bg-amber-950/40 border-amber-800/80' :
                                'text-red-500 bg-red-950 border-red-800 animate-pulse'
                              }`}>
                                {
                                  (stats.weaponRarities?.[weapon.type] || 'COMMON') === 'COMMON' ? 'Ординарна' :
                                  (stats.weaponRarities?.[weapon.type] || 'COMMON') === 'RARE' ? 'Рідкісна' :
                                  (stats.weaponRarities?.[weapon.type] || 'COMMON') === 'EPIC' ? 'Епічна' :
                                  (stats.weaponRarities?.[weapon.type] || 'COMMON') === 'LEGENDARY' ? 'Легендарна' :
                                  'Міфічна 👑'
                                }
                              </span>
                            </div>
                            <button
                              onClick={() => enchantWeapon(weapon.type)}
                              disabled={(stats.coins || 0) < 15}
                              className={`py-1 rounded text-[8.5px] uppercase font-black tracking-wider flex items-center justify-center gap-1 cursor-pointer border transition-all ${
                                (stats.coins || 0) >= 15
                                  ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white'
                                  : 'bg-[#151515] text-slate-600 border-white/5 cursor-not-allowed'
                              }`}
                            >
                              🔮 Зачарувати (15 🪙)
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="mt-3">
                        {isEquipped ? (
                          <button
                            disabled
                            className="w-full py-1 bg-brand-accent/20 border border-brand-accent/20 text-brand-text text-[9px] uppercase font-bold rounded-lg cursor-not-allowed text-center"
                          >
                            АКТИВНО
                          </button>
                        ) : isOwned ? (
                          <button
                            onClick={() => {
                              if (isAudioOn) soundEngine.playUiConfirm();
                              setStats((prev) => ({
                                ...prev,
                                currentWeapon: weapon.type,
                              }));
                            }}
                            className="w-full py-1 bg-[#1F1E24]/80 border border-white/10 hover:bg-white/10 text-white active:scale-95 transition-all text-[9.5px] uppercase font-bold rounded-lg cursor-pointer text-center"
                          >
                            ЕКІПІРУВАТИ
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (!hasEnoughCoins) return;
                              if (isAudioOn) soundEngine.playLevelUp(); // play lovely success sound!
                              setStats((prev) => ({
                                ...prev,
                                coins: prev.coins - price,
                                weapons: [...prev.weapons, weapon.type],
                                currentWeapon: weapon.type, // auto-equip
                              }));
                              spawnPopup(400, 225, `Куплено! ⚔️`, '#10B981');
                            }}
                            disabled={!hasEnoughCoins}
                            className={`w-full py-1 text-[9px] uppercase font-bold rounded-lg text-center border transition-all ${
                              hasEnoughCoins
                                ? 'bg-yellow-400 hover:bg-yellow-300 text-black border-yellow-400 active:scale-95 cursor-pointer'
                                : 'bg-white/5 text-slate-500 border-white/5 cursor-not-allowed'
                            }`}
                          >
                            {hasEnoughCoins ? `КУПИТИ ЗА ${price} 🪙` : `ПОТРІБНО ${price} 🪙`}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Amo shop section */}
            {(stats.weapons.includes(WeaponType.BOW) || stats.weapons.includes(WeaponType.CROSSBOW)) && (
              <div className="mt-4 border-t border-white/10 pt-4">
                <h4 className="text-[10px] font-black text-brand-accent tracking-widest uppercase mb-3 flex items-center gap-1.5 leading-none">
                  🏹 МАГАЗИН БОЄПРИПАСІВ (ЛУК)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl border border-white/10 bg-[#1F1E24]/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">🏹</span>
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">
                          Звичайні стріли (5 шт)
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">
                        Запас: <span className="text-yellow-400 font-mono">{stats.normalArrows || 0} шт</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (stats.coins < 5) return;
                        if (isAudioOn) soundEngine.playUiConfirm();
                        setStats((prev) => ({
                          ...prev,
                          coins: prev.coins - 5,
                          normalArrows: (prev.normalArrows || 0) + 5,
                        }));
                        spawnPopup(400, 225, `+5 стріл! 🏹`, '#10B981');
                      }}
                      disabled={stats.coins < 5}
                      className={`py-1.5 px-3 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                        stats.coins >= 5
                          ? 'bg-yellow-400 border-yellow-400 hover:bg-yellow-300 text-black active:scale-95 cursor-pointer'
                          : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Купити за 5 🪙
                    </button>
                  </div>

                  <div className="p-3 rounded-xl border border-white/10 bg-[#1F1E24]/60 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">🧪</span>
                        <span className="text-[10px] font-black text-[#10B981] uppercase tracking-wider">
                          Отруйні стріли (5 шт)
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold mt-1">
                        Отрута (-4 HP ворога на 2с) | Запас: <span className="text-[#10B981] font-mono">{stats.poisonArrows || 0} шт</span>
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (stats.coins < 15) return;
                        if (isAudioOn) soundEngine.playUiConfirm();
                        setStats((prev) => ({
                          ...prev,
                          coins: prev.coins - 15,
                          poisonArrows: (prev.poisonArrows || 0) + 5,
                        }));
                        spawnPopup(400, 225, `+5 отруєних! 🧪`, '#10B981');
                      }}
                      disabled={stats.coins < 15}
                      className={`py-1.5 px-3 rounded-lg text-[9px] font-bold uppercase transition-all flex items-center gap-1 border ${
                        stats.coins >= 15
                          ? 'bg-yellow-400 border-yellow-400 hover:bg-yellow-300 text-black active:scale-95 cursor-pointer'
                          : 'bg-white/5 border-white/5 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      Купити за 15 🪙
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* The Action Canvas Element */}
            <canvas
              ref={canvasRef}
              width={800}
              height={450}
              className="w-full h-full block"
              style={{ imageRendering: 'pixelated' }}
            />

            {/* Controls Tutorial Overlap banner */}
            {enemiesRef.current.length > 0 && (
              <div className="absolute left-4 bottom-4 bg-[#0F0E11]/92 backdrop-blur-md border border-white/10 px-3.5 py-2 rounded-xl text-[9px] text-slate-300 flex flex-wrap items-center gap-3 shadow-2xl uppercase">
                <div className="flex items-center gap-1">
                  <span className="bg-[#1F1E24] border-b-2 border-white/10 text-white font-black px-1.5 py-0.5 rounded text-[8px] mono-font">A/D</span>
                  <span>або</span>
                  <span className="bg-[#1F1E24] border-b-2 border-white/10 text-white font-black px-1.5 py-0.5 rounded text-[8px] mono-font">←→</span>
                  <span className="text-slate-400">РУХ</span>
                </div>
                <div className="w-[1px] h-3.5 bg-white/10" />
                <div className="flex items-center gap-1">
                  <span className="bg-[#1F1E24] border-b-2 border-white/10 text-white font-black px-1.5 py-0.5 rounded text-[8px] mono-font">W</span>
                  <span>або</span>
                  <span className="bg-[#1F1E24] border-b-2 border-white/10 text-white font-black px-1.5 py-0.5 rounded text-[8px] mono-font">↑</span>
                  <span className="text-slate-400">СТРИБОК</span>
                </div>
                <div className="w-[1px] h-3.5 bg-white/10" />
                <div className="flex items-center gap-1">
                  <span className="bg-[#1F1E24] border-b-2 border-white/10 text-white font-black px-2 py-0.5 rounded text-[8px] mono-font">SPACE / CLICK</span>
                  <span className="text-slate-400">АТАКА</span>
                </div>
                {(stats.weapons.includes(WeaponType.BOW) || stats.weapons.includes(WeaponType.CROSSBOW)) && (
                  <>
                    <div className="w-[1px] h-3.5 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🏹</span>
                      <span className="text-yellow-400 font-mono font-bold">{(stats as any).normalArrows || 0}</span>
                    </div>
                    <div className="w-[1px] h-3.5 bg-white/10" />
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">🧪</span>
                      <span className="text-[#10B981] font-mono font-bold">{(stats as any).poisonArrows || 0}</span>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Remaining enemies count badges */}
            {stats.level % 10 !== 0 && enemiesRef.current.length > 0 && (
              <div className="absolute right-4 top-4 bg-[#0F0E11]/90 border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-1 text-[10px] text-white shadow-xl uppercase font-bold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                ЗАЛИШИЛОСЬ ВОРОГІВ: <span className="font-extrabold text-brand-accent ml-1">{enemiesRef.current.length}</span>
              </div>
            )}

            {/* Boss HP bar big overlay for location divisible by 10 */}
            {stats.level % 10 === 0 && enemiesRef.current.length > 0 && (
              <div className="absolute left-1/2 -translate-x-1/2 top-4 w-full max-w-md px-4 text-center">
                <div className="text-[10px] font-black text-brand-accent tracking-widest uppercase mb-1 drop-shadow flex items-center justify-center gap-1 mono-font">
                  <Activity className="w-3.5 h-3.5 text-brand-accent animate-pulse" /> ВЕРХОВНИЙ ВОЛОДАР ПОВЕРХУ {stats.level} (БОС)
                </div>
                {enemiesRef.current[0] && (
                  <div className="w-full h-3.5 bg-[#0F0E11]/90 border border-brand-accent/30 rounded-full overflow-hidden relative shadow-lg">
                    <div
                      className="h-full bg-brand-accent transition-all duration-75"
                      style={{ width: `${(enemiesRef.current[0].hp / enemiesRef.current[0].maxHp) * 100}%` }}
                    />
                    <span className="absolute inset-0 text-[10px] font-black font-mono flex items-center justify-center text-white leading-none">
                      {enemiesRef.current[0].hp} / {enemiesRef.current[0].maxHp} HP
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'character' && (
          <div className="absolute inset-0 bg-[#0F0E11]/98 flex flex-col p-5 overflow-y-auto select-none">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-2.5 mb-3.5">
              <h3 className="text-xs font-bold text-white tracking-widest flex items-center gap-1.5 leading-none uppercase">
                👤 МЕНЮ ГЕРОЯ ТА РОЗПОДІЛ СТАТИСТИКИ
              </h3>
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 px-3 py-1 rounded-xl text-yellow-400 font-mono text-[9px] leading-none uppercase">
                🌟 РІВЕНЬ {stats.level}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Info Column */}
              <div className="bg-[#1F1E24]/70 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/5">
                    <span className="text-2xl">🏆</span>
                    <div>
                      <h4 className="text-xs text-white font-black uppercase leading-none">
                        {
                          stats.charClass === CharacterClass.WARRIOR ? 'Воїн Самурай' :
                          stats.charClass === CharacterClass.ARCHER ? 'Лучник Перехоплювач' :
                          stats.charClass === CharacterClass.MAGE ? 'Стихійний Архімаг' :
                          stats.charClass === CharacterClass.ASSASSIN ? 'Тіньовий Ассасин' :
                          'Майстер Смерті Некромант'
                        }
                      </h4>
                      <span className="text-[9px] text-[#FF3B3F] font-black uppercase tracking-wider block mt-1">КЛАС ВАШОГО ПЕРСОНАЖА</span>
                    </div>
                  </div>

                  <p className="text-[9.5px] text-slate-400 mb-3.5 leading-relaxed font-semibold">
                    Зачищайте поверхні підземелля! З зачисткою кожного 10-го поверху ви будете отримувати унікальні бали характеристик та золото.
                  </p>

                  <div className="space-y-1.5 text-[9px] text-slate-300 font-bold uppercase select-none">
                    <div className="flex justify-between bg-white/[0.01] px-2.5 py-1.5 rounded border border-white/5">
                      <span>🩸 МАКСИМАЛЬНЕ HP:</span>
                      <span className="text-white font-mono">{stats.hp} / {stats.maxHp} HP</span>
                    </div>
                    <div className="flex justify-between bg-white/[0.01] px-2.5 py-1.5 rounded border border-white/5">
                      <span>🔮 СИЛА МАНI:</span>
                      <span className="text-indigo-300 font-mono">{Math.round(stats.mana || 0)} / {stats.maxMana || 20} MP</span>
                    </div>
                    <div className="flex justify-between bg-white/[0.01] px-2.5 py-1.5 rounded border border-white/5">
                      <span>💥 ШАНС КРИТ. УДАРУ:</span>
                      <span className="text-yellow-400 font-mono">+{Math.round((0.05 + ((stats.luck || 1) - 1) * 0.02) * 100)}%</span>
                    </div>
                    <div className="flex justify-between bg-white/[0.01] px-2.5 py-1.5 rounded border border-white/5">
                      <span>💨 ШВИДКІСТЬ ХОДИ:</span>
                      <span className="text-green-400 font-mono">{(4 + (stats.agility || 1) * 0.15).toFixed(1)} u/s</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 text-[8px] text-slate-500 font-black tracking-widest text-center">
                  МАНА РЕГЕНЕРУЄТЬСЯ ПОСТІЙНО В БОЮ
                </div>
              </div>

              {/* Attributes distribution column */}
              <div className="bg-[#1F1E24]/70 p-4 rounded-xl border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-2.5 pb-2 border-b border-white/5">
                    <h4 className="text-[9.5px] font-black text-white uppercase tracking-wider">
                      ХАРАКТЕРИСТИКИ & АПГРЕЙДИ
                    </h4>
                    <span className="bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest leading-none font-mono animate-pulse">
                      ОЧОК: {stats.statPointsLeft || 0}
                    </span>
                  </div>

                  <div className="space-y-2 text-[9.5px]">
                    {/* strength */}
                    <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-red-400 font-bold">💪 Сила (Strength)</span>
                          <span className="bg-white/5 border border-white/10 text-white font-mono text-[9px] px-1 py-0.5 rounded font-black">{stats.strength || 1}</span>
                        </div>
                        <p className="text-[7.5px] text-slate-500 font-semibold leading-tight mt-0.5">Фіз урон +5% за поінт.</p>
                      </div>
                      <button
                        onClick={() => addStatPoint('strength')}
                        disabled={!stats.statPointsLeft}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                          stats.statPointsLeft ? 'bg-brand-accent/20 border-brand-accent text-brand-accent font-black hover:bg-brand-accent hover:text-white' : 'bg-[#151515] text-slate-700 border-white/5 cursor-not-allowed'
                        }`}
                      >
                        +
                      </button>
                    </div>

                    {/* agility */}
                    <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-400 font-bold">⚡ Спритність (Agility)</span>
                          <span className="bg-white/5 border border-white/10 text-white font-mono text-[9px] px-1 py-0.5 rounded font-black">{stats.agility || 1}</span>
                        </div>
                        <p className="text-[7.5px] text-slate-500 font-semibold leading-tight mt-0.5">Біг +3%, прискорює атаки CD.</p>
                      </div>
                      <button
                        onClick={() => addStatPoint('agility')}
                        disabled={!stats.statPointsLeft}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                          stats.statPointsLeft ? 'bg-brand-accent/20 border-brand-accent text-brand-accent font-black hover:bg-brand-accent hover:text-white' : 'bg-[#151515] text-slate-700 border-white/5 cursor-not-allowed'
                        }`}
                      >
                        +
                      </button>
                    </div>

                    {/* intelligence */}
                    <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-indigo-400 font-bold">🔮 Інтелект (Intelligence)</span>
                          <span className="bg-white/5 border border-white/10 text-white font-mono text-[9px] px-1 py-0.5 rounded font-black">{stats.intelligence || 1}</span>
                        </div>
                        <p className="text-[7.5px] text-slate-500 font-semibold leading-tight mt-0.5">+8 Мана, сила умінь +7%.</p>
                      </div>
                      <button
                        onClick={() => addStatPoint('intelligence')}
                        disabled={!stats.statPointsLeft}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                          stats.statPointsLeft ? 'bg-brand-accent/20 border-brand-accent text-brand-accent font-black hover:bg-brand-accent hover:text-white' : 'bg-[#151515] text-slate-700 border-white/5 cursor-not-allowed'
                        }`}
                      >
                        +
                      </button>
                    </div>

                    {/* luck */}
                    <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400 font-bold">🍀 Удачливість (Luck)</span>
                          <span className="bg-white/5 border border-white/10 text-white font-mono text-[9px] px-1 py-0.5 rounded font-black">{stats.luck || 1}</span>
                        </div>
                        <p className="text-[7.5px] text-slate-500 font-semibold leading-tight mt-0.5">Крит +2%, шанс на х2 золото.</p>
                      </div>
                      <button
                        onClick={() => addStatPoint('luck')}
                        disabled={!stats.statPointsLeft}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                          stats.statPointsLeft ? 'bg-brand-accent/20 border-brand-accent text-brand-accent font-black hover:bg-brand-accent hover:text-white' : 'bg-[#151515] text-slate-700 border-white/5 cursor-not-allowed'
                        }`}
                      >
                        +
                      </button>
                    </div>

                    {/* endurance */}
                    <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="text-orange-400 font-bold">🛡️ Стійкість (Endurance)</span>
                          <span className="bg-white/5 border border-white/10 text-white font-mono text-[9px] px-1 py-0.5 rounded font-black">{stats.endurance || 1}</span>
                        </div>
                        <p className="text-[7.5px] text-slate-500 font-semibold leading-tight mt-0.5">Здоров'я макс HP +4 пункти.</p>
                      </div>
                      <button
                        onClick={() => addStatPoint('endurance')}
                        disabled={!stats.statPointsLeft}
                        className={`w-7 h-7 rounded-full border flex items-center justify-center font-bold text-xs cursor-pointer transition-all ${
                          stats.statPointsLeft ? 'bg-brand-accent/20 border-brand-accent text-brand-accent font-black hover:bg-brand-accent hover:text-white' : 'bg-[#151515] text-slate-700 border-white/5 cursor-not-allowed'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('game')}
                  className="w-full mt-3 py-1.5 bg-brand-accent hover:bg-[#E53538] text-white font-black text-[9px] uppercase tracking-widest rounded-lg transition-all cursor-pointer text-center"
                >
                  Повернутися у Бій
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE magic spell skills hotbar panel */}
      {activeTab === 'game' && (
        <div className="w-full bg-[#131118] border border-white/10 p-3 rounded-2xl mb-3 flex flex-col gap-2 relative">
          <div className="flex justify-between items-center px-1">
            <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-1 leading-none">
              🔮 АКТИВНІ НАВИЧКИ ТА ЗАКЛИНАННЯ ГЕРОЯ
            </span>
            <div className="flex items-center gap-1.5 bg-[#4F46E5]/10 border border-[#4F46E5]/20 px-2.5 py-1 rounded-full text-[#818CF8]">
              <span className="text-[9px] font-black font-mono">
                МАНА: {Math.round(stats.mana || 0)} / {stats.maxMana || 20}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 select-none touch-none text-[9.5px]">
            <button
              onClick={() => { castActiveSpell('FIREBALL'); }}
              className="py-1.5 px-1 rounded-xl text-center bg-orange-950/20 border border-orange-500/20 hover:border-orange-500 hover:bg-orange-950/40 text-orange-400 font-extrabold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
            >
              <span>🔥 Вогняна куля</span>
              <span className="text-[8px] font-mono opacity-60">14⚡ [Q]</span>
            </button>
            
            <button
              onClick={() => { castActiveSpell('FROSTBOLT'); }}
              className="py-1.5 px-1 rounded-xl text-center bg-blue-950/20 border border-blue-500/20 hover:border-blue-500 hover:bg-blue-950/40 text-blue-400 font-extrabold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
            >
              <span>❄️ Замороження</span>
              <span className="text-[8px] font-mono opacity-60">10⚡ [E]</span>
            </button>

            <button
              onClick={() => { castActiveSpell('LIGHTNING'); }}
              className="py-1.5 px-1 rounded-xl text-center bg-purple-950/20 border border-purple-500/20 hover:border-purple-500 hover:bg-purple-950/40 text-purple-400 font-extrabold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
            >
              <span>⚡ Блискавка</span>
              <span className="text-[8px] font-mono opacity-60">22⚡ [R]</span>
            </button>

            <button
              onClick={() => { castActiveSpell('HEAL'); }}
              className="py-1.5 px-1 rounded-xl text-center bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500 hover:bg-emerald-950/40 text-emerald-400 font-extrabold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
            >
              <span>🩺 Лікування</span>
              <span className="text-[8px] font-mono opacity-60">15⚡ [F]</span>
            </button>

            <button
              onClick={() => { castActiveSpell('SUMMON'); }}
              className="py-1.5 px-1 rounded-xl text-center bg-slate-900 border border-slate-500/20 hover:border-slate-500 hover:bg-slate-800 text-slate-300 font-extrabold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all"
            >
              <span>🧟 Голем</span>
              <span className="text-[8px] font-mono opacity-60">30⚡ [C]</span>
            </button>
          </div>
        </div>
      )}

      {/* VIRTUAL JOYSTICK CONTROLLER OVERLAYS FOR TOUCH/CLICK ACCESS */}
      {activeTab === 'game' && (
        <div className="w-full grid grid-cols-2 gap-4 mt-4 select-none touch-none">
          {/* Direction Movement Keys */}
          <div className="flex gap-2 text-xs">
            <button
              onMouseDown={() => { touchKeysRef.current.left = true; }}
              onMouseUp={() => { touchKeysRef.current.left = false; }}
              onMouseLeave={() => { touchKeysRef.current.left = false; }}
              onTouchStart={(e) => { e.preventDefault(); touchKeysRef.current.left = true; }}
              onTouchEnd={() => { touchKeysRef.current.left = false; }}
              className="flex-1 py-5 bg-[#1F1E24] hover:bg-white/5 active:scale-95 transition-all text-white border border-white/10 rounded-2xl flex items-center justify-center font-bold cursor-pointer uppercase tracking-wider"
              id="touch-move-left"
            >
              ← Вліво
            </button>
            <button
              onMouseDown={() => { touchKeysRef.current.right = true; }}
              onMouseUp={() => { touchKeysRef.current.right = false; }}
              onMouseLeave={() => { touchKeysRef.current.right = false; }}
              onTouchStart={(e) => { e.preventDefault(); touchKeysRef.current.right = true; }}
              onTouchEnd={() => { touchKeysRef.current.right = false; }}
              className="flex-1 py-5 bg-[#1F1E24] hover:bg-white/5 active:scale-95 transition-all text-white border border-white/10 rounded-2xl flex items-center justify-center font-bold cursor-pointer uppercase tracking-wider"
              id="touch-move-right"
            >
              Вправо →
            </button>
          </div>

          {/* Big Fight/Attack Button */}
          <button
            onMouseDown={() => { touchKeysRef.current.attack = true; }}
            onMouseUp={() => { touchKeysRef.current.attack = false; }}
            onMouseLeave={() => { touchKeysRef.current.attack = false; }}
            onTouchStart={(e) => { e.preventDefault(); touchKeysRef.current.attack = true; }}
            onTouchEnd={() => { touchKeysRef.current.attack = false; }}
            className="py-5 bg-brand-accent hover:bg-[#E53538] font-bold text-xs uppercase tracking-widest text-white border border-white/10 active:scale-95 transition-all rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-brand-accent/15"
            id="touch-attack"
          >
            💥 АТАКА [SPACE]
          </button>
        </div>
      )}

      {/* Bonus Stats Info panel */}
      <div className="w-full mt-4 bg-[#1F1E24]/50 border border-white/10 p-4 rounded-xl text-slate-400 text-[10px] flex flex-wrap items-center justify-between gap-4 uppercase">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-brand-accent" />
          <span>Підказка: Кожна локація збільшує шкоду ворогів. Покращуйте броню або ХП для захисту!</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300 font-bold">
          <span>БРОНЯ: <strong className="text-white">+{Math.round(stats.armorMult * 100)}%</strong></span>
          <span>ДОД. ШКОДА: <strong className="text-brand-accent">+{Math.round((stats.damageMult - 1) * 100)}%</strong></span>
        </div>
      </div>
    </div>
  );
}
