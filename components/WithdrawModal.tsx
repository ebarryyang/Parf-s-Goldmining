import React, { useState, useRef, useEffect } from 'react';
import { X, Coins, ArrowRight, CheckCircle } from 'lucide-react';
import Button from './Button';

interface WithdrawModalProps {
  maxCoins: number;
  onClose: () => void;
  onWithdraw: (amount: number) => void;
}

const WithdrawModal: React.FC<WithdrawModalProps> = ({ maxCoins, onClose, onWithdraw }) => {
  const [amount, setAmount] = useState<string>('');
  const [viewState, setViewState] = useState<'INPUT' | 'SUCCESS'>('INPUT');
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(amount);
    if (!val || val <= 0 || val > maxCoins) return;

    // 1. Switch to Success View
    setViewState('SUCCESS');

    // 2. Play Sound
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.error(err));
    }

    // 3. Wait for animation then call onWithdraw (which closes modal via parent)
    setTimeout(() => {
        onWithdraw(val);
    }, 1500);
  };

  const handleMax = () => {
      setAmount(maxCoins.toString());
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Sound Effect: Cash Register / Coins */}
      <audio ref={audioRef} src="https://assets.mixkit.co/sfx/preview/mixkit-coins-sound-2003.mp3" />

      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-pixel-lg relative border-4 border-mario-yellow overflow-hidden min-h-[300px] flex flex-col justify-center">
        
        {/* Close Button (Only show in Input mode) */}
        {viewState === 'INPUT' && (
            <button 
            onClick={onClose}
            className="absolute top-4 right-4 bg-gray-200 rounded-full p-1 hover:bg-mario-red hover:text-white transition-colors border-2 border-black z-20"
            >
            <X size={24} />
            </button>
        )}

        {viewState === 'INPUT' ? (
            <>
                <h2 className="text-xl font-pixel text-mario-yellow mb-6 flex items-center gap-2 border-b-4 border-mario-yellow pb-2 drop-shadow-sm text-shadow-black">
                <Coins className="text-mario-yellow fill-black" />
                金币提现
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-gray-800 font-bold mb-2 ml-1 font-round text-lg">
                        可提取余额: <span className="text-mario-yellow font-pixel text-xl drop-shadow-sm">{maxCoins}</span>
                    </label>
                    
                    <div className="relative">
                        <input
                        type="number"
                        min="0"
                        max={maxCoins}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full bg-mario-cloud border-2 border-black rounded-xl p-4 text-2xl font-black outline-none focus:ring-4 focus:ring-mario-yellow transition-all shadow-inset-pixel text-right pr-20"
                        autoFocus
                        />
                        <button 
                            type="button"
                            onClick={handleMax}
                            className="absolute right-2 top-2 bottom-2 bg-mario-blue text-white text-xs font-bold px-3 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            全部
                        </button>
                    </div>
                </div>

                <div className="pt-2">
                    <Button 
                    type="submit" 
                    label="确认提取" 
                    fullWidth 
                    variant="warning"
                    disabled={!amount || parseInt(amount) <= 0 || parseInt(amount) > maxCoins}
                    icon={<ArrowRight />}
                    />
                </div>
                </form>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center animate-in zoom-in duration-300">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-yellow-200 rounded-full animate-ping opacity-75"></div>
                    <div className="bg-mario-yellow text-white rounded-full p-6 border-4 border-black shadow-pixel relative z-10">
                        <CheckCircle size={64} className="drop-shadow-md" />
                    </div>
                </div>
                
                <h3 className="font-pixel text-2xl text-mario-yellow drop-shadow-[2px_2px_0_#000] mb-2">
                    提取成功!
                </h3>
                
                <p className="font-pixel text-gray-500 text-lg">
                    -{amount} 金币
                </p>
            </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawModal;