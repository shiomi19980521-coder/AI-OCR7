import React from 'react';
import { ScanLine, Crown, LogIn, LogOut } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  onOpenPremium?: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPremium,
  onOpenLogin,
  onLogout,
  user
}) => {
  const isPremium = user?.isPremium || false;

  return (
    <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <ScanLine className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">
              AI-タイムカード-OCR
            </h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                タイムカード専用AI-OCRツール
              </span>
              {isPremium && (
                <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                  <Crown className="w-3 h-3 fill-current" />
                  PRO
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Model Status - Removed as per request */}

          {/* Premium CTA (Only if not premium) */}
          {!isPremium && (
            <button
              onClick={onOpenPremium}
              className="flex items-center space-x-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-3 py-1.5 rounded-lg shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 text-xs font-bold"
            >
              <Crown className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">有料会員登録</span>
            </button>
          )}

          <div className="h-6 w-px bg-slate-200 mx-2 hidden md:block"></div>

          {user ? (
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-700">「{user.email}」でログインしています</span>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition-colors text-sm font-medium bg-slate-50 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">ログアウト</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-colors text-sm font-bold px-3 py-1.5 rounded-lg hover:bg-indigo-50"
            >
              <LogIn className="w-4 h-4" />
              <span>ログイン</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
