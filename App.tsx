import React, { useState, useEffect } from 'react';
import { Book, UserStats, ModalType, LogEntry, GameProgress, Pet } from './types';
import { Plus, Download, Shovel, Coins, BookOpen, ScrollText, Trophy, Gamepad2, CreditCard, FileSpreadsheet } from 'lucide-react';
import { STORAGE_KEY_BOOKS, STORAGE_KEY_STATS, STORAGE_KEY_LOGS, STORAGE_KEY_PETS, STORAGE_KEY_GAME } from './constants';
import AddBookModal from './components/AddBookModal';
import ChapterModal from './components/ChapterModal';
import MiningGame from './components/MiningGame'; // New Game Component
import LogModal from './components/LogModal';
import PetMuseum from './components/PetMuseum'; // New Component
import WithdrawModal from './components/WithdrawModal'; // New Component
import Button from './components/Button';

const App: React.FC = () => {
  // State
  const [books, setBooks] = useState<Book[]>([]);
  const [stats, setStats] = useState<UserStats>({ shovels: 0, coins: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [gameProgress, setGameProgress] = useState<GameProgress>({ currentLevelIndex: 0, levelCoinsFound: 0 });
  
  // UI State
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    const loadedBooks = localStorage.getItem(STORAGE_KEY_BOOKS);
    const loadedStats = localStorage.getItem(STORAGE_KEY_STATS);
    const loadedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
    const loadedPets = localStorage.getItem(STORAGE_KEY_PETS);
    const loadedGame = localStorage.getItem(STORAGE_KEY_GAME);
    
    if (loadedBooks) setBooks(JSON.parse(loadedBooks));
    if (loadedStats) setStats(JSON.parse(loadedStats));
    if (loadedLogs) setLogs(JSON.parse(loadedLogs));
    if (loadedPets) setPets(JSON.parse(loadedPets));
    if (loadedGame) setGameProgress(JSON.parse(loadedGame));
  }, []);

  // Save Data
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BOOKS, JSON.stringify(books));
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    localStorage.setItem(STORAGE_KEY_PETS, JSON.stringify(pets));
    localStorage.setItem(STORAGE_KEY_GAME, JSON.stringify(gameProgress));
  }, [books, stats, logs, pets, gameProgress]);

  // Helpers
  const addLog = (message: string, change: { shovels?: number, coins?: number }, type: LogEntry['type']) => {
    const newLog: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now(),
      type,
      message,
      change
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Actions
  const handleAddBook = (title: string, chapterCount: number) => {
    const newBook: Book = {
      id: Date.now().toString(),
      title,
      totalChapters: chapterCount,
      createdAt: Date.now(),
      chapters: Array.from({ length: chapterCount }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        number: i + 1,
        isCompleted: false,
      })),
    };
    setBooks(prev => [newBook, ...prev]);
    addLog(`录入新书: ${title}`, {}, 'EARN');
    setActiveModal(null);
  };

  const handleUploadProof = (bookId: string, chapterId: string, image: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    setBooks(prevBooks => prevBooks.map(b => {
      if (b.id !== bookId) return b;
      return {
        ...b,
        chapters: b.chapters.map(chapter => {
          if (chapter.id !== chapterId) return chapter;
          return { ...chapter, isCompleted: true, proofImage: image, timestamp: Date.now() };
        })
      };
    }));

    // Reward: Add a shovel
    setStats(prev => ({ ...prev, shovels: prev.shovels + 1 }));
    addLog(`完成《${book.title}》章节`, { shovels: 1 }, 'EARN');
  };

  // Called from within the Game Component
  const handleUpdateStats = (newStats: UserStats) => {
      // Logic for log is a bit tricky here since game updates frequently.
      // We will trust the Game component to pass the final state, but we might log major milestones or batch them.
      // For simplicity, we just update state here. The game handles the animation.
      const diffShovels = newStats.shovels - stats.shovels;
      const diffCoins = newStats.coins - stats.coins;
      
      setStats(newStats);
      if (diffCoins > 0) {
          addLog('冒险挖掘', { shovels: diffShovels, coins: diffCoins }, 'SPEND');
      }
  };

  const handleAddPet = (pet: Pet) => {
      setPets(prev => [pet, ...prev]);
      addLog(`发现收藏品: ${pet.name}`, {}, 'FIND_PET');
  };

  const handleDeleteBook = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const completedChapters = book.chapters.filter(c => c.isCompleted).length;
    let shovelsToRemove = completedChapters;
    let coinsToRemove = 0;
    const currentShovels = stats.shovels;
    
    if (currentShovels >= shovelsToRemove) {
        // shovelsToRemove stays as is
    } else {
        const shovelsShortage = shovelsToRemove - currentShovels;
        shovelsToRemove = currentShovels;
        coinsToRemove = shovelsShortage * 40; // Approx logic based on previous rules
    }

    setBooks(prev => prev.filter(b => b.id !== bookId));
    setStats(prev => ({
        shovels: Math.max(0, prev.shovels - shovelsToRemove),
        coins: Math.max(0, prev.coins - coinsToRemove)
    }));
    addLog(`删除书籍《${book.title}》`, { shovels: -shovelsToRemove, coins: -coinsToRemove }, 'DELETE_PENALTY');
    setSelectedBookId(null);
    setActiveModal(null);
  };

  const handleWithdraw = (amount: number) => {
    setStats(prev => ({ ...prev, coins: prev.coins - amount }));
    addLog(`金币提现`, { coins: -amount }, 'WITHDRAW');
    setActiveModal(null);
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ books, stats, logs, pets, gameProgress }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "parfai_adventure_save.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleExportHistory = () => {
    // CSV Header with BOM for Excel UTF-8 compatibility
    let csvContent = "\uFEFF"; 
    csvContent += "录入时间,完成时间,书籍名称,章节\n";

    books.forEach(book => {
        const entryDate = new Date(book.createdAt).toLocaleString('zh-CN', { hour12: false });
        // Escape quotes in title
        const safeTitle = book.title.replace(/"/g, '""');

        book.chapters.forEach(chapter => {
            const completionDate = chapter.isCompleted && chapter.timestamp 
                ? new Date(chapter.timestamp).toLocaleString('zh-CN', { hour12: false }) 
                : "未完成";
            
            // CSV row format: "Entry Date","Completion Date","Title","Chapter"
            csvContent += `"${entryDate}","${completionDate}","${safeTitle}","第${chapter.number}章"\n`;
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reading_list_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedBook = books.find(b => b.id === selectedBookId);

  return (
    <div className="h-screen w-full flex flex-col font-round selection:bg-mario-red selection:text-white relative z-10">
      
      {/* 1. Header Area - Mario Style */}
      <header className="pt-6 pb-2 px-6 flex items-center justify-center relative z-20">
        <div className="bg-gradient-to-r from-mario-red to-orange-500 text-white px-6 py-3 rounded-xl font-pixel text-lg md:text-2xl tracking-widest shadow-pixel border-4 border-white flex items-center gap-3 transform rotate-[-2deg] hover:rotate-0 transition-transform cursor-default">
          <BookOpen fill="white" size={28} />
          Parf's Book Goldmining Adventure
        </div>
      </header>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex overflow-hidden p-4 md:p-6 gap-6 max-w-6xl mx-auto w-full flex-col md:flex-row">
        
        {/* Left: Book List */}
        <section className="flex-1 bg-white/90 rounded-[1.5rem] shadow-pixel-lg p-4 md:p-6 flex flex-col border-4 border-black backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6 border-b-4 border-black/10 pb-4">
            <h2 className="text-xl md:text-2xl font-pixel text-gray-800 flex items-center gap-3">
              <span className="bg-mario-green w-4 h-8 rounded-md block shadow-pixel border-2 border-black"></span>
              任务书架
            </h2>
            <span className="text-sm font-bold text-white bg-black px-3 py-1 rounded-full border-2 border-gray-500">
              x {books.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
            {books.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                <BookOpen size={64} className="mb-4 text-mario-red" />
                <p className="font-bold text-xl font-pixel text-mario-blue text-center leading-relaxed">Let's Go!<br/>添加一本书开始吧!</p>
              </div>
            ) : (
              books.map(book => {
                const completedCount = book.chapters.filter(c => c.isCompleted).length;
                const progress = Math.round((completedCount / book.totalChapters) * 100);
                
                return (
                  <div 
                    key={book.id}
                    onClick={() => { setSelectedBookId(book.id); setActiveModal('CHAPTER_VIEW'); }}
                    className="group bg-[#FFD180] hover:bg-[#FFB74D] rounded-xl p-0 cursor-pointer transition-all duration-200 border-4 border-black shadow-pixel hover:shadow-none hover:translate-y-1 relative overflow-hidden"
                  >
                     <div className="absolute top-1 right-1 opacity-10 font-pixel text-4xl font-black text-[#E65100]">?</div>
                     <div className="p-4 relative z-10">
                       <div className="flex justify-between items-center">
                         <div className="flex items-center gap-4">
                           <div className="bg-white p-3 rounded-lg border-2 border-black shadow-sm">
                              <BookOpen size={24} className="text-mario-brown" />
                           </div>
                           <div>
                             <h3 className="font-black text-lg text-[#3E2723] leading-tight mb-1">{book.title}</h3>
                             <div className="inline-block bg-white/50 px-2 py-0.5 rounded text-xs font-bold text-[#3E2723] border border-[#3E2723]/20">
                               进度: {completedCount} / {book.totalChapters}
                             </div>
                           </div>
                         </div>
                         <div className="text-right">
                             <span className="block text-xl font-pixel text-[#E65100] drop-shadow-sm">{progress}%</span>
                         </div>
                       </div>
                     </div>
                     <div className="h-3 bg-[#E65100]/20 border-t-2 border-black">
                        <div className="h-full bg-mario-green transition-all duration-500 relative" style={{ width: `${progress}%` }}>
                            <div className="absolute inset-0 w-full h-full" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
                        </div>
                     </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right: Stats & Info */}
        <section className="w-full md:w-1/3 flex flex-col gap-4">
          {/* Stats Card */}
          <div className="bg-[#3E2723] rounded-[1.5rem] p-6 shadow-pixel-lg text-white relative flex flex-col border-4 border-[#FFECB3]">
             {/* Decorative Rivets */}
             <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#FFECB3] shadow-inner"></div>
             <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FFECB3] shadow-inner"></div>
             <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#FFECB3] shadow-inner"></div>
             <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#FFECB3] shadow-inner"></div>

             <div className="mb-6 w-full">
                <div className="flex justify-between items-center mb-2 px-2">
                  <span className="text-[#FFECB3] font-pixel text-xs tracking-wider">我的铲子</span>
                </div>
                <div className="bg-black/30 rounded-xl p-4 flex items-center justify-between gap-2 border-2 border-[#5D4037] shadow-inner">
                   <Shovel className="text-mario-blue" size={32} />
                   <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-pixel text-white drop-shadow-md">x {stats.shovels}</span>
                   </div>
                </div>
             </div>

             <div className="w-full mb-6">
                <div className="flex justify-between items-center mb-2 px-2">
                  <span className="text-[#FFECB3] font-pixel text-xs tracking-wider">金币数量</span>
                </div>
                <div className="bg-black/30 rounded-xl p-4 flex flex-col border-2 border-[#5D4037] shadow-inner gap-3">
                   <div className="flex items-center justify-between">
                       <Coins className="text-mario-yellow animate-pulse" size={32} />
                       <span className="text-4xl font-pixel text-mario-yellow drop-shadow-md">x {stats.coins}</span>
                   </div>
                   
                   <button 
                       onClick={() => setActiveModal('WITHDRAW')}
                       className="bg-mario-yellow text-mario-brown text-xs font-bold py-2 rounded-lg hover:bg-yellow-400 active:translate-y-0.5 border-2 border-black/10 flex items-center justify-center gap-1 transition-all"
                   >
                       <CreditCard size={14} />
                       提取金币
                   </button>
                </div>
             </div>
             
             <button 
                onClick={() => setActiveModal('LOGS')}
                className="mt-auto bg-[#5D4037] hover:bg-[#6D4C41] text-[#FFECB3] py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 border-[#8D6E63] shadow-pixel active:shadow-none active:translate-y-1 transition-all"
             >
                <ScrollText size={18} />
                查看记录
             </button>
          </div>
        </section>
      </main>

      {/* 3. Bottom Control Bar */}
      <footer className="bg-white/80 backdrop-blur-md p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30 border-t-4 border-mario-blue">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-3 md:gap-6">
          
          <Button 
            onClick={() => setActiveModal('ADD_BOOK')}
            label="录入书籍"
            variant="success"
            icon={<Plus size={18} />}
            className="flex-1 min-w-[120px]"
          />

          <Button 
             onClick={() => setActiveModal('MINING')}
             label="冒险开始"
             variant="warning"
             icon={<Gamepad2 size={18} />}
             className="flex-1 min-w-[120px]"
          />

          <Button 
             onClick={() => setActiveModal('MUSEUM')}
             label="宠物博物馆"
             variant="primary"
             icon={<Trophy size={18} />}
             className="flex-1 min-w-[120px]"
          />

          <Button 
             onClick={handleExport}
             label="保存"
             variant="neutral"
             icon={<Download size={18} />}
             className="w-auto px-4"
          />

          <Button 
             onClick={handleExportHistory}
             label="导出清单"
             variant="secondary"
             icon={<FileSpreadsheet size={18} />}
             className="w-auto px-4"
          />
          
        </div>
      </footer>

      {/* Modals */}
      {activeModal === 'ADD_BOOK' && (
        <AddBookModal 
          onClose={() => setActiveModal(null)}
          onAdd={handleAddBook}
        />
      )}

      {activeModal === 'CHAPTER_VIEW' && selectedBook && (
        <ChapterModal 
          book={selectedBook}
          onClose={() => { setActiveModal(null); setSelectedBookId(null); }}
          onUploadProof={handleUploadProof}
          onDeleteBook={handleDeleteBook}
        />
      )}

      {activeModal === 'MINING' && (
        <MiningGame 
          stats={stats}
          progress={gameProgress}
          onClose={() => setActiveModal(null)}
          onUpdateStats={handleUpdateStats}
          onUpdateProgress={setGameProgress}
          onFindPet={handleAddPet}
        />
      )}
      
      {activeModal === 'LOGS' && (
        <LogModal 
          logs={logs}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'MUSEUM' && (
        <PetMuseum 
          pets={pets}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'WITHDRAW' && (
        <WithdrawModal 
            maxCoins={stats.coins}
            onClose={() => setActiveModal(null)}
            onWithdraw={handleWithdraw}
        />
      )}

    </div>
  );
};

export default App;