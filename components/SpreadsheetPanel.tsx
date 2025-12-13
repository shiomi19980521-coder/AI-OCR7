import React, { useState, useEffect } from 'react';
import { Sheet, Link2, Check, X, AlertCircle } from 'lucide-react';

interface SpreadsheetPanelProps {
  savedId: string;
  onSave: (id: string) => void;
}

export const SpreadsheetPanel: React.FC<SpreadsheetPanelProps> = ({ savedId, onSave }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (savedId) {
      setUrl(`https://docs.google.com/spreadsheets/d/${savedId}/edit`);
      setIsSaved(true);
    }
  }, [savedId]);

  const handleSave = () => {
    if (!url.trim()) {
      onSave('');
      setIsSaved(false);
      return;
    }

    // Extract ID using regex to find string between /d/ and /
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      onSave(match[1]);
      setError(null);
      setIsSaved(true);
    } else {
      setError('有効なスプレッドシートURLを入力してください');
      setIsSaved(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    onSave('');
    setIsSaved(false);
    setError(null);
  };

  return (
    <div className="max-w-xl mx-auto mt-8 flex flex-col items-center">
      <div className={`
        w-full bg-white rounded-xl border p-1.5 flex items-center gap-2 shadow-sm transition-all duration-300
        ${error ? 'border-red-300 ring-2 ring-red-100' : 'border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100'}
      `}>
        <div className={`p-2 rounded-lg transition-colors ${isSaved ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          <Sheet className="w-5 h-5" />
        </div>
        
        <div className="flex-1 relative">
          <input 
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (isSaved) setIsSaved(false);
              if (error) setError(null);
            }}
            placeholder="GoogleスプレッドシートのURLを貼り付け"
            className="w-full bg-transparent border-none text-sm text-slate-700 placeholder:text-slate-400 focus:ring-0 p-1"
            onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
            }}
          />
        </div>

        {url && !isSaved && (
           <button onClick={handleClear} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100">
               <X className="w-4 h-4" />
           </button>
        )}

        <button 
          onClick={handleSave}
          disabled={isSaved || !url}
          className={`
            px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0
            ${isSaved 
                ? 'bg-green-500 text-white cursor-default' 
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 active:scale-95'
            }
            ${(!url && !isSaved) ? 'opacity-50 cursor-not-allowed bg-slate-300 shadow-none text-slate-500' : ''}
          `}
        >
          {isSaved ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>連携中</span>
            </>
          ) : (
            <>
              <Link2 className="w-3.5 h-3.5" />
              <span>連携</span>
            </>
          )}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-red-500 text-xs font-medium mt-2 animate-in slide-in-from-top-1">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
      <p className="text-[10px] text-slate-400 mt-2 text-center">
        URLを設定すると解析完了時に自動で転記されます
      </p>
    </div>
  );
};
