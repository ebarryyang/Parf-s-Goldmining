import React, { useMemo } from 'react';
import { X, Trophy } from 'lucide-react';
import { Pet } from '../types';

interface PetMuseumProps {
  pets: Pet[];
  onClose: () => void;
}

interface GroupedPet extends Pet {
  count: number;
}

const PetMuseum: React.FC<PetMuseumProps> = ({ pets, onClose }) => {
  
  // Group pets by name to calculate quantity
  const groupedPets = useMemo(() => {
    const map = new Map<string, GroupedPet>();
    
    pets.forEach(pet => {
      if (map.has(pet.name)) {
        const existing = map.get(pet.name)!;
        existing.count += 1;
        // Keep the earliest obtained date or highest rarity if they somehow differ (usually rarity is static per name)
      } else {
        map.set(pet.name, { ...pet, count: 1 });
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      if (b.rarity !== a.rarity) return b.rarity - a.rarity;
      return b.obtainedAt - a.obtainedAt;
    });
  }, [pets]);

  const getRarityColor = (r: number) => {
    switch(r) {
      case 5: return "bg-yellow-100 border-yellow-500 text-yellow-700 shadow-[0_0_15px_rgba(234,179,8,0.4)]";
      case 4: return "bg-purple-100 border-purple-500 text-purple-700";
      case 3: return "bg-blue-100 border-blue-500 text-blue-700";
      case 2: return "bg-green-100 border-green-500 text-green-700";
      default: return "bg-gray-100 border-gray-400 text-gray-700";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#2C3E50] w-full max-w-5xl h-[90vh] rounded-2xl p-6 shadow-pixel-lg relative border-4 border-[#34495E] flex flex-col">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-mario-red text-white p-2 rounded-lg border-2 border-black/20 hover:scale-105 transition-transform z-10 shadow-pixel"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-pixel text-white mb-6 flex items-center gap-4 border-b-4 border-white/20 pb-4">
          <Trophy className="text-mario-yellow" size={32} />
          Parfai的皇家博物馆
          <span className="text-sm font-round bg-black/40 px-3 py-1 rounded-full text-gray-300">
             收藏种类: {groupedPets.length}
          </span>
        </h2>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
          {groupedPets.length === 0 ? (
            <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400 font-pixel">
               <span className="text-6xl mb-4 opacity-50">🏛️</span>
               <p>博物馆空空如也...</p>
               <p className="text-sm mt-2 font-round">快去金矿冒险挖掘宝藏吧！</p>
            </div>
          ) : (
            groupedPets.map((pet) => (
              <div key={pet.id} className={`relative p-4 rounded-xl border-4 shadow-pixel group hover:-translate-y-2 transition-transform duration-200 bg-white`}>
                
                {/* Rarity Badge */}
                <div className={`absolute top-2 right-2 text-xs font-black px-2 py-0.5 rounded border ${getRarityColor(pet.rarity)}`}>
                   {Array(pet.rarity).fill(0).map((_, i) => '★').join('')}
                </div>
                
                {/* Quantity Badge */}
                <div className="absolute top-2 left-2 bg-mario-blue text-white text-xs font-black px-2 py-1 rounded-full border-2 border-white shadow-md z-10">
                   x{pet.count}
                </div>
                
                {/* Pet Icon Display */}
                <div className="h-24 flex items-center justify-center text-6xl mb-2 filter drop-shadow-md transform transition-transform group-hover:scale-110">
                   {pet.icon}
                </div>
                
                <h3 className="font-pixel text-sm md:text-base text-gray-800 text-center mb-1 leading-tight min-h-[1.5em]">{pet.name}</h3>
                
                <p className="text-xs text-center text-gray-500 font-bold mb-2 min-h-[1.5em]">{pet.description}</p>
                
                <div className="text-[10px] text-center text-gray-400 font-mono border-t border-gray-100 pt-2">
                   最新获取: {new Date(pet.obtainedAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PetMuseum;