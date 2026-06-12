/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  UPGRADE = 'UPGRADE',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
}

export enum CharacterClass {
  WARRIOR = 'WARRIOR',
  ARCHER = 'ARCHER',
  MAGE = 'MAGE',
  ASSASSIN = 'ASSASSIN',
  NECROMANCER = 'NECROMANCER',
}

export enum ItemRarity {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
}

export enum WeaponType {
  KNIFE = 'KNIFE',     // Ніж
  SWORD = 'SWORD',     // Меч
  KATANA = 'KATANA',   // Катана самурая
  BOW = 'BOW',         // Лук
  AXE = 'AXE',         // Бойова Сокира
  SPEAR = 'SPEAR',     // Спис
  MACE = 'MACE',       // Булава
  DAGGER = 'DAGGER',   // Кинжал
  CROSSBOW = 'CROSSBOW', // Арбалет
  SCYTHE = 'SCYTHE',   // Коса Смерті
  WHIP = 'WHIP',       // Батіг
  HAMMER = 'HAMMER',   // Магічний Молот
  STAFF = 'STAFF',     // Палиця Мага
}

export interface Weapon {
  type: WeaponType;
  name: string;
  nameUa: string;
  damage: number;
  range: number;
  cooldown: number; // ms
  color: string;
  icon: string;
}

export interface PlayerStats {
  maxHp: number;
  hp: number;
  damageMult: number; // e.g., 1.2 for +20%
  armorMult: number;  // e.g., 0.3 for 30% reduction (damage = base * (1 - armorMult))
  weapons: WeaponType[];
  currentWeapon: WeaponType;
  level: number; // 1 to 5
  score: number;
  kills: number;
  coins: number;
  normalArrows?: number;
  poisonArrows?: number;
  
  // Dungeon & Diablo II Core Attributes
  charClass?: CharacterClass;
  strength?: number;      // + Physical melee damage
  agility?: number;       // + Move speed, triple arrow bow chance
  intelligence?: number;  // + Magic damage, spell cooldown reductions, higher mana
  luck?: number;          // + Critical rate, chance to double coin pickups
  endurance?: number;     // + Extra max HP multiplier
  mana?: number;
  maxMana?: number;
  statPointsLeft?: number;
  
  // Weapon Crafting/Rarity system
  weaponRarities?: { [key in WeaponType]?: ItemRarity };
  
  // Pets System
  summonedPet?: 'WOLF' | 'DRAGON' | 'GOLEM' | 'FAIRY' | null;
  petHp?: number;
  petMaxHp?: number;
  
  // Custom skills unlocked
  unlockedSkills?: string[];
}

export enum EnemyType {
  SLIME = 'SLIME',
  GOBLIN = 'GOBLIN',
  SKELETON = 'SKELETON',
  DEMON = 'DEMON',
  BOSS = 'BOSS',
}

export interface Enemy {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: EnemyType;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  color: string;
  isHit?: boolean;
  hitTimer?: number;
  direction?: number; // -1 for left, 1 for right
  attackCooldown?: number;
  shootCooldown?: number; // for boss or ranged
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vX: number;
  vY: number;
  size: number;
  color: string;
  alpha: number;
  life: number; // ms
  maxLife: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vX: number;
  vY: number;
  radius: number;
  damage: number;
  color: string;
}

export interface LevelConfig {
  level: number;
  name: string;
  nameUa: string;
  description: string;
  descriptionUa: string;
  bgColor: string;
  groundColor: string;
  accentColor: string;
  enemyCount: number;
  enemyBaseHp: number;
  enemyDamage: number; // Level 1 is 2hp, Level 2 is 3hp, etc.
}
