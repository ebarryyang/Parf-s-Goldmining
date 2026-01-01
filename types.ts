
export interface Chapter {
  id: string;
  number: number;
  isCompleted: boolean;
  proofImage?: string; 
  timestamp?: number;
}

export interface Book {
  id: string;
  title: string;
  totalChapters: number;
  chapters: Chapter[];
  createdAt: number;
}

export interface UserStats {
  shovels: number;
  coins: number;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'EARN' | 'SPEND' | 'DELETE_PENALTY' | 'FIND_PET' | 'WITHDRAW';
  message: string;
  change: {
    shovels?: number;
    coins?: number;
  };
}

export type PetCategory = 'MAMMAL' | 'POP_CULTURE' | 'TREASURE';

export interface Pet {
  id: string;
  name: string;
  category: PetCategory;
  rarity: number; // 1-5
  description: string; // Region or flavor text
  icon: string; // Emoji or visual representation
  obtainedAt: number;
}

export interface GameProgress {
  currentLevelIndex: number; // 0-15
  levelCoinsFound: number; // 0-40
}

export type ModalType = 'ADD_BOOK' | 'MINING' | 'CHAPTER_VIEW' | 'LOGS' | 'MUSEUM' | 'WITHDRAW' | null;
