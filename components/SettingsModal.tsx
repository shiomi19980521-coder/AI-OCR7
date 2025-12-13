import React, { useState, useEffect } from 'react';
import { X, Save, Sheet, HelpCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string) => void;
  initialSpreadsheetId: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialSpreadsheetId 
}) => {
  const [spreadsheetId, setSpreadsheetId] = useState(initialSpreadsheetId);

  useEffect(() => {
    if (isOpen) {
      setSpreadsheetId(initialSpreadsheetId);
    }
  }, [isOpen, initialSpreadsheetId]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Attempt to extract ID if a full URL is provided
    let finalId = spreadsheetId;
    // Match /d/ID_HERE/
    const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      finalId = match[1];
    }
    
    onSave(finalId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-in zoom-in-95 duration-200 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2 text-slate-800">
            <div className="bg-green-100 p-2 rounded-lg">
              <Sheet className="w-5 h-5 text-green-700" />
            </div>
            <h3 className="font-bold text-lg">Google Sheets連携</h3>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs md:text-sm text-blue-800">
            <p className="flex gap-2">
              <HelpCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                解析データをGoogleスプレッドシートに自動転記できます。<br/>
                対象のスプレッドシートURLを入力してください。
              </span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                スプレッドシート URL
              </label>
              <input 
                type="text" 
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm font-mono text-slate-700"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 ml-1">
                ブラウザのアドレスバーからURLをコピーして貼り付けてください。
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            キャンセル
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            設定を保存
          </button>
        </div>
      </div>
    </div>
  );
};