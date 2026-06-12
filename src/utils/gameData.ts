/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Weapon, WeaponType, LevelConfig } from '../types';

export const WEAPON_DATA: Record<WeaponType, Weapon> = {
  [WeaponType.KNIFE]: {
    type: WeaponType.KNIFE,
    name: 'Knife',
    nameUa: 'Ніж (Урон 2) 🔪',
    damage: 2,
    range: 48,
    cooldown: 250, // ms
    color: '#94A3B8', // slate-400
    icon: 'Sword',
  },
  [WeaponType.SWORD]: {
    type: WeaponType.SWORD,
    name: 'Sword',
    nameUa: 'Меч (Урон 3) ⚔️',
    damage: 3,
    range: 75,
    cooldown: 340, // ms
    color: '#38BDF8', // sky-400
    icon: 'Shield',
  },
  [WeaponType.KATANA]: {
    type: WeaponType.KATANA,
    name: 'Samurai Katana',
    nameUa: 'Катана (Урон 4) 🗡️',
    damage: 4,
    range: 110,
    cooldown: 220, // ms
    color: '#F59E0B', // amber-500
    icon: 'Zap',
  },
  [WeaponType.BOW]: {
    type: WeaponType.BOW,
    name: 'Archer Bow',
    nameUa: 'Бойовий Лук (Урон 5) 🏹',
    damage: 5,
    range: 500,
    cooldown: 500, // ms
    color: '#10B981', // green-500
    icon: 'Compass',
  },
  [WeaponType.AXE]: {
    type: WeaponType.AXE,
    name: 'War Axe',
    nameUa: 'Бойова Сокира (Урон 6) 🪓',
    damage: 6,
    range: 85,
    cooldown: 450, // ms
    color: '#EF4444', // red-500
    icon: 'Flame',
  },
  [WeaponType.SPEAR]: {
    type: WeaponType.SPEAR,
    name: 'Gladiator Spear',
    nameUa: 'Спис (Урон 7) 🔱',
    damage: 7,
    range: 130,
    cooldown: 300, // ms
    color: '#3B82F6', // blue-500
    icon: 'Compass',
  },
  [WeaponType.MACE]: {
    type: WeaponType.MACE,
    name: 'Golden Mace',
    nameUa: 'Булава (Урон 8) 🛡️',
    damage: 8,
    range: 70,
    cooldown: 400, // ms
    color: '#A855F7', // purple-500
    icon: 'Award',
  },
  [WeaponType.DAGGER]: {
    type: WeaponType.DAGGER,
    name: 'Classic Dagger',
    nameUa: 'Кинджал (Урон 9) 🗡️',
    damage: 9,
    range: 40,
    cooldown: 140, // ms
    color: '#EC4899', // pink-500
    icon: 'Sword',
  },
  [WeaponType.CROSSBOW]: {
    type: WeaponType.CROSSBOW,
    name: 'Assault Crossbow',
    nameUa: 'Арбалет (Урон 10) 🎯',
    damage: 10,
    range: 500,
    cooldown: 400, // ms
    color: '#F97316', // orange-500
    icon: 'Target',
  },
  [WeaponType.SCYTHE]: {
    type: WeaponType.SCYTHE,
    name: 'Death Scythe',
    nameUa: 'Коса Смерті (Урон 11) 💀',
    damage: 11,
    range: 115,
    cooldown: 360, // ms
    color: '#84CC16', // lime-500
    icon: 'Skull',
  },
  [WeaponType.WHIP]: {
    type: WeaponType.WHIP,
    name: 'Fiery Whip',
    nameUa: 'Батіг (Урон 12) 🧣',
    damage: 12,
    range: 100,
    cooldown: 180, // ms
    color: '#EAB308', // yellow-500
    icon: 'Heart',
  },
  [WeaponType.HAMMER]: {
    type: WeaponType.HAMMER,
    name: 'Thunder Hammer',
    nameUa: 'Молот Грому (Урон 13) 🔨',
    damage: 13,
    range: 80,
    cooldown: 520, // ms
    color: '#06B6D4', // cyan-500
    icon: 'Activity',
  },
  [WeaponType.STAFF]: {
    type: WeaponType.STAFF,
    name: 'Archmage Staff',
    nameUa: 'Палиця Мага (Урон 14) 🔮',
    damage: 14,
    range: 500,
    cooldown: 600, // ms
    color: '#6366F1', // indigo-500
    icon: 'Sparkles',
  },
};

export const LEVELS: LevelConfig[] = [
  {
    level: 1,
    name: 'Whispering Forest',
    nameUa: 'Шепочучий Ліс 🌳',
    description: 'Enemies deal 2 HP. Clear the slimes to proceed!',
    descriptionUa: 'Вороги наносять 2 ХП шкоди. Знищіть слимаків, щоб пройти далі!',
    bgColor: '#132115', // Dark deep forest green
    groundColor: '#1B4D22', // Forest floor
    accentColor: '#4ADE80',
    enemyCount: 5,
    enemyBaseHp: 15,
    enemyDamage: 2,
  },
  {
    level: 2,
    name: 'Scorched Desert',
    nameUa: 'Випалена Пустеля 🏜️',
    description: 'Enemies deal 3 HP. Sand Goblins await!',
    descriptionUa: 'Вороги наносять 3 ХП шкоди. На вас чекають пустельні гобліни!',
    bgColor: '#1D1A10', // Dark sandy/orange sky
    groundColor: '#D38E2A', // Orange brown sand
    accentColor: '#FBBF24',
    enemyCount: 7,
    enemyBaseHp: 25,
    enemyDamage: 3,
  },
  {
    level: 3,
    name: 'Frost Cavern',
    nameUa: 'Крижана Печера ❄️',
    description: 'Enemies deal 4 HP. Fight through the Frozen Skeletons.',
    descriptionUa: 'Вороги наносять 4 ХП шкоди. Проривайтеся через замерзлих скелетів.',
    bgColor: '#0F1A24', // Ice dark blue
    groundColor: '#475569', // Ice stone
    accentColor: '#38BDF8',
    enemyCount: 9,
    enemyBaseHp: 40,
    enemyDamage: 4,
  },
  {
    level: 4,
    name: 'Volcanic Dungeon',
    nameUa: 'Вулканічне Підземелля 🌋',
    description: 'Enemies deal 5 HP. Demon imps are extremely aggressive!',
    descriptionUa: 'Вороги наносять 5 ХП шкоди. Демони надзвичайно агресивні!',
    bgColor: '#240F0F', // Red glow
    groundColor: '#991B1B', // Red hot lava rocks
    accentColor: '#EF4444',
    enemyCount: 12,
    enemyBaseHp: 60,
    enemyDamage: 5,
  },
  {
    level: 5,
    name: 'Dark Overlord Castle',
    nameUa: 'Замок Темного Володаря 🏰',
    description: 'The Ultimate Boss fight. Dodge projectiles and vanquish the Overlord!',
    descriptionUa: 'Фінальна битва з Босом. Ухиляйтеся від снарядів та здолайте Володаря!',
    bgColor: '#111827', // Black ink
    groundColor: '#374151', // Castle floor dark gray
    accentColor: '#A855F7', // Magenta shadow
    enemyCount: 1, // Will spawn boss + occasional minions
    enemyBaseHp: 250,
    enemyDamage: 6,
  },
];
