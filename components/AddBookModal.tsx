import React, { useState } from 'react';
import { X, BookOpen, Layers } from 'lucide-react';
import Button from './Button';

interface AddBookModalProps {
  onClose: () => void;
  onAdd: (title: string, chapters: number) => void;
}

const AddBookModal: React.FC<AddBookModalProps> = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [chapters, setChapters] = useState<number | string>(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const numChapters = typeof chapters === 'string' ? parseInt(chapters) || 1 : chapters;
    onAdd(title, numChapters);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-pixel-lg relative border-4 border-black">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 bg-gray-200 rounded-full p-1 hover:bg-mario-red hover:text-white transition-colors border-2 border-black"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-pixel text-mario-red mb-6 flex items-center gap-2 border-b-4 border-mario-red pb-2">
          <BookOpen className="text-mario-blue" />
          新的挑战
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-800 font-bold mb-2 ml-1 font-round text-lg">书籍名称</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如: 超级马里奥攻略"
              className="w-full bg-mario-cloud border-2 border-black rounded-xl p-4 text-lg font-bold outline-none focus:ring-4 focus:ring-mario-yellow transition-all shadow-inset-pixel"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-800 font-bold mb-2 ml-1 font-round text-lg">章节数量</label>
            <div className="flex items-center bg-mario-cloud rounded-xl p-2 border-2 border-black shadow-inset-pixel">
               <Layers className="text-gray-400 ml-2" />
               <input
                type="number"
                min="1"
                max="100"
                value={chapters}
                onChange={(e) => setChapters(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 text-lg font-black p-2 outline-none"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 ml-1 font-bold">*如果不填写，默认全书只有一个章节</p>
          </div>

          <div className="pt-2">
            <Button 
              type="submit" 
              label="开始冒险!" 
              fullWidth 
              variant="success"
            />
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookModal;