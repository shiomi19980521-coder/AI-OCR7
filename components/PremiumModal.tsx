import React, { useState } from 'react';
import { X, Crown, Check, Zap, Image, Infinity, CreditCard } from 'lucide-react';
import { User as UserType } from '../types';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: (user: UserType) => void;
  onRegister: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade, onRegister }) => {
  const [step, setStep] = useState<1 | 2>(1); // 1: Features, 2: Registration Form

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-4xl relative animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[95vh] overflow-y-auto">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-300 to-yellow-500 shadow-lg shadow-amber-500/20 mb-4">
              <Crown className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">プラン比較</h2>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm mb-8">
            <table className="w-full text-sm md:text-base text-left">
              <thead className="bg-slate-50 text-slate-900 font-bold">
                <tr>
                  <th className="p-4 border-b border-slate-200 w-1/3"></th>
                  <th className="p-4 border-b border-slate-200 w-1/3 text-center text-slate-500">非会員</th>
                  <th className="p-4 border-b border-slate-200 w-1/3 text-center text-indigo-600 bg-indigo-50/50">有料会員</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">料金</td>
                  <td className="p-4 text-center text-slate-600">0円</td>
                  <td className="p-4 text-center font-bold text-indigo-600 bg-indigo-50/30">月額1480円（税込）</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">会員登録</td>
                  <td className="p-4 text-center text-slate-600">不要</td>
                  <td className="p-4 text-center font-bold text-indigo-600 bg-indigo-50/30">必要（新規会員登録）</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">OCR利用回数</td>
                  <td className="p-4 text-center text-slate-600">
                    <div className="flex flex-col items-center gap-1">
                      <span>1日2回まで</span>
                      <span className="text-[10px] text-slate-400">（有料会員検討のデモとして）</span>
                    </div>
                  </td>
                  <td className="p-4 text-center font-bold text-indigo-600 bg-indigo-50/30">
                    <div className="flex items-center justify-center gap-1">
                      <Infinity className="w-4 h-4" />
                      <span>無制限</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">一括アップロード</td>
                  <td className="p-4 text-center text-slate-600">１枚まで</td>
                  <td className="p-4 text-center font-bold text-indigo-600 bg-indigo-50/30">１０枚まで</td>
                </tr>
                <tr>
                  <td className="p-4 font-bold text-slate-700 bg-slate-50/30">決済方法</td>
                  <td className="p-4 text-center text-slate-400">-</td>
                  <td className="p-4 text-center font-bold text-indigo-600 bg-indigo-50/30">クレジットカード</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="max-w-md mx-auto">
            <button
              onClick={() => {
                onClose();
                onRegister();
              }}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2 text-lg"
            >
              <span>登録手続きへ進む</span>
              <Zap className="w-5 h-5 fill-current" />
            </button>
            <p className="text-center text-xs text-slate-400 mt-4">
              いつでも解約可能です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};