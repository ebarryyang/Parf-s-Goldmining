import React, { useRef } from 'react';
import { X, Camera, CheckCircle, Lock, Trash2, Image as ImageIcon } from 'lucide-react';
import { Book, Chapter } from '../types';
import Button from './Button';

interface ChapterModalProps {
  book: Book;
  onClose: () => void;
  onUploadProof: (bookId: string, chapterId: string, image: string) => void;
  onDeleteBook: (bookId: string) => void;
}

const ChapterModal: React.FC<ChapterModalProps> = ({ book, onClose, onUploadProof, onDeleteBook }) => {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [selectedChapterId, setSelectedChapterId] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedChapterId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUploadProof(book.id, selectedChapterId, reader.result as string);
        setSelectedChapterId(null); 
      };
      reader.readAsDataURL(file);
    }
    // Reset inputs to allow selecting the same file again if needed
    e.target.value = '';
  };

  const triggerCamera = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    cameraInputRef.current?.click();
  };

  const triggerGallery = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    galleryInputRef.current?.click();
  };

  const handleDelete = () => {
    onDeleteBook(book.id);
    onClose();
  };

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-md">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full border-4 border-mario-red shadow-pixel-lg text-center">
            <h3 className="font-pixel text-mario-red text-lg mb-4">危险操作!</h3>
            <p className="mb-6 font-bold text-gray-600">
                删除这本书会扣除你因此获得的所有铲子和金币！
                <br/><br/>
                确定要删除吗？
            </p>
            <div className="flex gap-4">
                <Button label="取消" variant="neutral" onClick={() => setShowDeleteConfirm(false)} fullWidth />
                <Button label="确认删除" variant="danger" onClick={handleDelete} fullWidth />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
       <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[2rem] p-6 md:p-8 shadow-pixel-lg relative flex flex-col border-8 border-mario-blue">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 border-b-4 border-gray-100 pb-4 border-dashed">
          <div>
            <h2 className="text-2xl md:text-3xl font-pixel text-gray-800 leading-relaxed drop-shadow-sm">{book.title}</h2>
            <div className="flex items-center gap-3 mt-2">
                <div className="bg-mario-yellow text-mario-brown px-3 py-1 rounded-lg font-black text-sm border-2 border-mario-brown shadow-pixel">
                    进度: {book.chapters.filter(c => c.isCompleted).length} / {book.totalChapters}
                </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-red-100 p-3 rounded-xl border-2 border-red-200 hover:bg-red-500 hover:text-white hover:border-black transition-all shadow-sm"
                title="删除书籍"
            >
                <Trash2 size={24} />
            </button>
            <button 
                onClick={onClose}
                className="bg-gray-200 p-3 rounded-xl border-2 border-gray-300 hover:bg-gray-300 transition-colors shadow-sm"
            >
                <X size={24} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Scrollable Chapter List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-2">
          {book.chapters.map((chapter) => (
            <div 
              key={chapter.id}
              className={`relative rounded-2xl p-4 border-4 transition-all duration-300 flex flex-col gap-3 shadow-pixel
                ${chapter.isCompleted 
                  ? 'bg-green-50 border-mario-green' 
                  : 'bg-gray-50 border-gray-300'}`}
            >
              <div className="flex justify-between items-start">
                <span className={`font-pixel text-lg ${chapter.isCompleted ? 'text-mario-green' : 'text-gray-400'}`}>
                  Level {chapter.number}
                </span>
                {chapter.isCompleted ? (
                   <div className="bg-mario-green text-white px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1 border border-green-700 shadow-sm">
                     <CheckCircle size={12} /> CLEAR!
                   </div>
                ) : (
                  <div className="bg-gray-200 text-gray-500 px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                    LOCKED
                  </div>
                )}
              </div>

              {chapter.isCompleted && chapter.proofImage ? (
                <div className="w-full h-40 rounded-xl overflow-hidden border-4 border-white shadow-md bg-white">
                  <img src={chapter.proofImage} alt="Proof" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 rounded-xl border-4 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 bg-white/50">
                  <Lock size={32} className="mb-2 opacity-30" />
                  <span className="text-xs font-bold">待解锁</span>
                </div>
              )}

              {!chapter.isCompleted && (
                <div className="mt-auto w-full flex gap-3">
                    <button
                      onClick={() => triggerCamera(chapter.id)}
                      className="flex-1 bg-mario-blue text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-pixel border-2 border-black/10 font-round"
                    >
                      <Camera size={20} />
                      <span>拍照</span>
                    </button>
                    <button
                      onClick={() => triggerGallery(chapter.id)}
                      className="flex-1 bg-mario-yellow text-mario-brown font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-pixel border-2 border-black/10 font-round"
                    >
                      <ImageIcon size={20} />
                      <span>相册</span>
                    </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Hidden Inputs */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
        <input
          type="file"
          accept="image/*"
          // No capture attribute allows iOS to show the Photo Library option
          ref={galleryInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default ChapterModal;