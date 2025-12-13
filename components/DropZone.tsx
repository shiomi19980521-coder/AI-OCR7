import React, { useCallback, useState } from 'react';
import { UploadCloud, X, ImagePlus, Crown, Layers } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (files: File[]) => void;
  selectedFiles: File[];
  onClear: () => void;
  disabled?: boolean;
  isPremium?: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, selectedFiles, onClear, disabled, isPremium }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files).filter((f: File) => f.type.startsWith('image/'));
    if (droppedFiles.length > 0) {
      if (isPremium) {
        onFileSelect(droppedFiles.slice(0, 10)); // Cap at 10 for premium
      } else {
        onFileSelect([droppedFiles[0]]); // Cap at 1 for free
      }
    }
  }, [onFileSelect, disabled, isPremium]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      if (isPremium) {
        onFileSelect(fileArray.slice(0, 10));
      } else {
        onFileSelect([fileArray[0]]);
      }
    }
  }, [onFileSelect, isPremium]);

  if (selectedFiles.length > 0) {
    return (
      <div className="relative w-full group animate-in fade-in zoom-in duration-300">
        <div className="w-full bg-slate-50 rounded-2xl overflow-hidden border-2 border-indigo-100 p-4 relative shadow-md">

          {selectedFiles.length === 1 ? (
            // Single File View
            <div className="h-64 flex items-center justify-center">
              <img
                src={URL.createObjectURL(selectedFiles[0])}
                alt="Preview"
                className="max-w-full max-h-full object-contain shadow-sm rounded-lg"
              />
            </div>
          ) : (
            // Grid View for Multiple Files
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
              {selectedFiles.map((file, idx) => (
                <div key={idx} className="aspect-square relative rounded-lg overflow-hidden border border-slate-200 bg-white">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${idx}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium shadow-sm">
              {selectedFiles.length}枚選択中
            </div>
            <button
              onClick={onClear}
              disabled={disabled}
              className="bg-white/90 backdrop-blur hover:bg-red-50 text-slate-600 hover:text-red-600 p-1.5 rounded-full shadow-lg transition-all duration-200 border border-slate-200 disabled:opacity-50"
              title="削除"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative w-full h-72 rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out flex flex-col items-center justify-center cursor-pointer overflow-hidden
        ${isDragging
          ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-xl'
          : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-white hover:shadow-lg'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        type="file"
        accept="image/*"
        multiple={isPremium}
        onChange={handleInputChange}
        disabled={disabled}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-20"
      />

      <div className={`
         w-20 h-20 mb-6 rounded-3xl flex items-center justify-center transition-transform duration-500 relative
         ${isDragging ? 'bg-indigo-100 scale-110 rotate-3' : 'bg-white shadow-md rotate-0 group-hover:scale-110'}
      `}>
        {isDragging ? (
          <ImagePlus className="w-10 h-10 text-indigo-600" />
        ) : isPremium ? (
          <Layers className="w-10 h-10 text-indigo-600" />
        ) : (
          <UploadCloud className="w-10 h-10 text-indigo-600" />
        )}

        {isPremium && (
          <div className="absolute -top-2 -right-2 bg-amber-400 text-white p-1.5 rounded-full shadow-sm border-2 border-white">
            <Crown className="w-3 h-3 fill-current" />
          </div>
        )}
      </div>

      <h3 className="text-xl font-bold text-slate-800 mb-2">
        {isDragging ? 'ここにドロップ' : '画像をアップロード'}
      </h3>
      <p className="text-sm text-slate-500 text-center max-w-xs leading-relaxed">
        ファイルをドラッグ＆ドロップ<br />
        <span className="text-indigo-600 font-semibold underline decoration-indigo-300 underline-offset-2">
          {isPremium ? '最大10枚まで選択可能' : 'クリックして選択'}
        </span>
      </p>

      {!isPremium && (
        <div className="mt-4 px-3 py-1 bg-slate-200/50 rounded-full flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Free Plan: 1枚のみ</span>
        </div>
      )}
      {isPremium && (
        <div className="mt-4 px-3 py-1 bg-amber-100 rounded-full flex items-center gap-1.5 border border-amber-200">
          <Crown className="w-3 h-3 text-amber-600" />
          <span className="text-[10px] font-bold text-amber-700 uppercase">Premium: 一括アップロード対応</span>
        </div>
      )}
    </div>
  );
};