import React, { useState } from 'react';
import { X, Shovel, Coins, Hammer } from 'lucide-react';
import { UserStats } from '../types';
import Button from './Button';
import { COINS_PER_DIG } from '../constants';

interface MiningModalProps {
  stats: UserStats;
  onClose: () => void;
  onDig: (amount: number) => void;
}

const MiningModal: React.FC<MiningModalProps> = ({ stats, onClose, onDig }) => {
  const [isDigging, setIsDigging] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const handleDig = () => {
    if (stats.shovels <= 0) return;
    
    setIsDigging(true);
    setShowCelebration(false);

    // Dig animation time
    setTimeout(() => {
      onDig(1); // Consumes 1 shovel
      setIsDigging(false);
      setShowCelebration(true);
      
      // Hide celebration after a few seconds
      setTimeout(() => setShowCelebration(false), 2500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#9C4D1D] to-[#5D2B0B] w-full max-w-2xl rounded-2xl p-1 shadow-pixel-lg relative border-4 border-[#FFD700] text-white flex flex-col items-center overflow-hidden">
        
        {/* Brick Pattern Background */}
        <div className="absolute inset-0 opacity-30 pointer-events-none" 
             style={{
               backgroundImage: `linear-gradient(335deg, rgba(0,0,0,0.2) 23px, transparent 23px),
               linear-gradient(155deg, rgba(0,0,0,0.2) 23px, transparent 23px),
               linear-gradient(335deg, rgba(0,0,0,0.2) 23px, transparent 23px),
               linear-gradient(155deg, rgba(0,0,0,0.2) 23px, transparent 23px)`,
               backgroundSize: '58px 58px',
               backgroundColor: '#8B4513'
             }}>
        </div>

        <div className="relative z-10 w-full h-full p-6 flex flex-col items-center">
            <button 
            onClick={onClose}
            className="absolute top-0 right-0 bg-mario-red border-2 border-white p-2 rounded-lg hover:scale-110 transition-transform shadow-pixel"
            >
            <X size={24} className="text-white" />
            </button>

            <h2 className="text-2xl md:text-3xl font-pixel text-mario-yellow mb-8 drop-shadow-[4px_4px_0_#000] tracking-wider text-center">
            地下金矿层
            </h2>

            {/* Stats Display */}
            <div className="flex gap-4 md:gap-8 mb-8 w-full justify-center">
            <div className="bg-black/40 p-3 rounded-lg border-2 border-white/20 flex flex-col items-center min-w-[100px]">
                <div className="text-xs font-bold text-gray-300 mb-1">铲子</div>
                <div className="flex items-center gap-2 text-2xl font-pixel text-mario-blue">
                    <Shovel size={20} />
                    {stats.shovels}
                </div>
            </div>
            <div className="bg-black/40 p-3 rounded-lg border-2 border-white/20 flex flex-col items-center min-w-[100px]">
                <div className="text-xs font-bold text-gray-300 mb-1">金币</div>
                <div className="flex items-center gap-2 text-2xl font-pixel text-mario-yellow">
                    <Coins size={20} />
                    {stats.coins}
                </div>
            </div>
            </div>

            {/* Mining Visuals */}
            <div className="relative w-full flex-1 min-h-[250px] flex items-center justify-center mb-4">
                
                {/* 8-bit Fireworks CSS */}
                {showCelebration && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-50">
                        {/* Text */}
                        <div className="animate-bounce text-mario-yellow font-pixel text-xl md:text-2xl text-center drop-shadow-[4px_4px_0_#E60012] mb-32 z-50 bg-black/50 p-4 rounded-xl backdrop-blur-sm border-2 border-white">
                            哇，你又变得<br/>更富啦！<br/>
                            <span className="text-white text-lg mt-2 block">+{COINS_PER_DIG} 金币</span>
                        </div>
                        
                        {/* Particles (Pure CSS implementation of 8-bit explosion) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-mario-yellow shadow-[0_0_0_4px_#FFF,100px_-50px_0_4px_#00FF00,-80px_-60px_0_4px_#00FFFF,60px_60px_0_4px_#FF00FF,-60px_50px_0_4px_#FFFF00] animate-ping opacity-75"></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white shadow-[0_-80px_0_4px_#FF0000,80px_0_0_4px_#00FF00,0_80px_0_4px_#0000FF,-80px_0_0_4px_#FFFF00] animate-[spin_1s_ease-out_infinite]"></div>
                    </div>
                )}

                {/* Dirt Block */}
                <div className="w-32 h-32 bg-[#CD853F] border-4 border-[#8B4513] relative shadow-pixel-lg flex items-center justify-center group active:scale-95 transition-transform cursor-pointer"
                     style={{
                         backgroundImage: `linear-gradient(45deg, #8B4513 25%, transparent 25%, transparent 75%, #8B4513 75%, #8B4513), 
                         linear-gradient(45deg, #8B4513 25%, transparent 25%, transparent 75%, #8B4513 75%, #8B4513)`,
                         backgroundSize: '20px 20px',
                         backgroundPosition: '0 0, 10px 10px'
                     }}
                     onClick={handleDig}
                >
                    <div className="w-24 h-24 border-2 border-[#8B4513]/30 flex items-center justify-center">
                        <span className="font-pixel text-4xl text-[#5D2B0B] opacity-50">?</span>
                    </div>
                </div>
                
                {/* Shovel Animation */}
                <div className={`absolute top-1/2 left-1/2 ml-12 -mt-24 transition-all duration-300 pointer-events-none
                    ${isDigging ? 'rotate-[-60deg] translate-y-12 translate-x-[-20px]' : 'rotate-0'}`}>
                    <Shovel size={100} className="text-gray-300 drop-shadow-xl" fill="#aaa" strokeWidth={1.5} />
                </div>
            </div>

            {/* Action Button */}
            <div className="w-full max-w-xs z-20">
            <Button 
                onClick={handleDig}
                disabled={stats.shovels <= 0 || isDigging}
                label={stats.shovels > 0 ? (isDigging ? "挖掘中..." : "立刻挖掘!") : "没有铲子啦"}
                variant={stats.shovels > 0 ? "warning" : "danger"}
                fullWidth
                className="text-xl py-4 shadow-pixel font-pixel"
                icon={<Hammer className="mr-2" />}
            />
            {stats.shovels === 0 && (
                <p className="text-center text-white mt-4 text-xs font-bold bg-black/30 p-2 rounded">
                去做任务获得铲子吧!
                </p>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MiningModal;