import React from 'react';
import { PetCategory } from './types';

export const STORAGE_KEY_BOOKS = 'parfai_books';
export const STORAGE_KEY_STATS = 'parfai_stats';
export const STORAGE_KEY_LOGS = 'parfai_logs';
export const STORAGE_KEY_PETS = 'parfai_pets';
export const STORAGE_KEY_GAME = 'parfai_game_progress';

export const SHOVEL_COST_PER_DIG = 1;
export const COINS_PER_DIG = 40;
export const COINS_TO_PASS_LEVEL = 800;

export const LEVELS = [
  { name: "埃及金字塔", theme: "desert", bg: "#87CEEB", ground: "#E6C288", text: "#000" },
  { name: "美国西部大草原", theme: "canyon", bg: "#87CEEB", ground: "#CD853F", text: "#000" },
  { name: "加利福尼亚沿海公路", theme: "coast", bg: "#00BFFF", ground: "#F4A460", text: "#000" },
  { name: "纽约中央公园", theme: "city", bg: "#ADD8E6", ground: "#556B2F", text: "#000" },
  { name: "中国长城", theme: "mountain", bg: "#87CEFA", ground: "#808080", text: "#000" },
  { name: "夏威夷海岛", theme: "island", bg: "#00CED1", ground: "#F0E68C", text: "#000" },
  { name: "法国薰衣草田", theme: "field", bg: "#E6E6FA", ground: "#9370DB", text: "#000" },
  { name: "澳大利亚黄金海岸", theme: "beach", bg: "#1E90FF", ground: "#FFD700", text: "#000" },
  { name: "南极大陆", theme: "snow", bg: "#F0F8FF", ground: "#DEE2E6", text: "#000" },
  { name: "内蒙古大草原", theme: "grassland", bg: "#87CEEB", ground: "#228B22", text: "#FFF" },
  { name: "月球", theme: "space", bg: "#000000", ground: "#696969", text: "#FFF" },
  { name: "火星", theme: "mars", bg: "#4A0404", ground: "#CD5C5C", text: "#FFF" },
  { name: "英国巨人阵", theme: "ruins", bg: "#778899", ground: "#556B2F", text: "#FFF" },
  { name: "玛雅金字塔遗迹", theme: "jungle", bg: "#228B22", ground: "#8B4513", text: "#FFF" },
  { name: "古罗马街道", theme: "ancient", bg: "#87CEEB", ground: "#A0522D", text: "#000" },
  { name: "希腊神庙", theme: "temple", bg: "#87CEEB", ground: "#F5F5F5", text: "#000" },
];

// Data Generators with Icons
export const MAMMALS = [
  { name: "考拉", region: "澳大利亚", icon: "🐨" },
  { name: "大熊猫", region: "中国四川", icon: "🐼" },
  { name: "非洲狮", region: "非洲草原", icon: "🦁" },
  { name: "北极熊", region: "北极圈", icon: "🐻‍❄️" },
  { name: "红袋鼠", region: "澳大利亚", icon: "🦘" },
  { name: "长颈鹿", region: "肯尼亚", icon: "🦒" },
  { name: "水豚", region: "南美洲", icon: "🥔" }, // Close enough representation or custom
  { name: "藏羚羊", region: "青藏高原", icon: "🐐" },
  { name: "美洲豹", region: "亚马逊雨林", icon: "🐆" },
  { name: "狐猴", region: "马达加斯加", icon: "🐒" },
  { name: "大象", region: "泰国", icon: "🐘" },
  { name: "斑马", region: "坦桑尼亚", icon: "🦓" },
  { name: "老虎", region: "西伯利亚", icon: "🐅" }
];

export const POP_CULTURE = [
  { name: "吉伊卡哇 (Chikawa)", icon: "🐹" },
  { name: "哈契瓦 (Hachiware)", icon: "🐱" },
  { name: "乌萨奇 (Usagi)", icon: "🐰" },
  { name: "Hello Kitty", icon: "🎀" },
  { name: "酷洛米", icon: "😈" },
  { name: "大耳狗", icon: "🐶" },
  { name: "美乐蒂", icon: "👒" },
  { name: "米奇", icon: "🐭" },
  { name: "唐老鸭", icon: "🦆" },
  { name: "史迪奇", icon: "👽" },
  { name: "巴斯光年", icon: "👨‍🚀" },
  { name: "蜘蛛侠", icon: "🕷️" },
  { name: "钢铁侠", icon: "🦾" },
  { name: "格鲁特", icon: "🌳" },
  { name: "美国队长", icon: "🛡️" }
];

export const TREASURES = [
  { name: "希望蓝钻", icon: "💎" },
  { name: "女王的权杖", icon: "🪄" },
  { name: "黄金面具", icon: "👺" },
  { name: "古代法典", icon: "📜" },
  { name: "红宝石王冠", icon: "👑" },
  { name: "海盗金币", icon: "🪙" },
  { name: "翡翠白菜", icon: "🥬" },
  { name: "恐龙化石", icon: "🦖" },
  { name: "外星陨石", icon: "☄️" },
  { name: "神秘钥匙", icon: "🗝️" },
  { name: "圣杯", icon: "🏆" },
  { name: "古老戒指", icon: "💍" }
];