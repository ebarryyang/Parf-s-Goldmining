import React from 'react';
import { X, ScrollText, Clock } from 'lucide-react';
import { LogEntry } from '../types';

interface LogModalProps {
  logs: LogEntry[];
  onClose: () => void;
}

const LogModal: React.FC<LogModalProps> = ({ logs, onClose }) => {
  const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
      });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FFF8E7] w-full max-w-md h-[80vh] rounded-2xl p-6 shadow-pixel-lg relative border-4 border-[#8B4513] flex flex-col">
        {/* Paper texture overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{backgroundImage: 'radial-gradient(#8B4513 0.5px, transparent 0.5px)', backgroundSize: '10px 10px'}}></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-mario-red text-white p-2 rounded-lg border-2 border-black/20 hover:scale-105 transition-transform z-10 shadow-pixel"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-pixel text-[#8B4513] mb-6 flex items-center gap-3 border-b-4 border-[#8B4513] pb-4 border-dashed">
          <ScrollText className="text-[#8B4513]" />
          冒险日志
        </h2>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 relative z-0">
          {logs.length === 0 ? (
            <div className="text-center text-[#8B4513]/50 mt-10 font-bold">
              <p>暂无记录</p>
              <p className="text-sm mt-2">快去读书挖掘宝藏吧！</p>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-white/80 p-3 rounded-xl border-2 border-[#8B4513]/20 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-[#8B4513] text-sm">{log.message}</span>
                  <span className="text-[10px] text-[#8B4513]/60 font-mono bg-[#8B4513]/10 px-2 py-0.5 rounded flex items-center gap-1 whitespace-nowrap">
                    <Clock size={10} />
                    {formatDate(log.timestamp)}
                  </span>
                </div>
                <div className="flex gap-3 text-xs font-black mt-1">
                   {log.change.shovels !== undefined && log.change.shovels !== 0 && (
                     <span className={log.change.shovels > 0 ? "text-mario-blue" : "text-mario-red"}>
                       {log.change.shovels > 0 ? '+' : ''}{log.change.shovels} 铲子
                     </span>
                   )}
                   {log.change.coins !== undefined && log.change.coins !== 0 && (
                     <span className={log.change.coins > 0 ? "text-mario-yellow drop-shadow-sm shadow-black" : "text-mario-red"}>
                       {log.change.coins > 0 ? '+' : ''}{log.change.coins} 金币
                     </span>
                   )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LogModal;