import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { DropZone } from './DropZone';
import { DataGrid } from './DataGrid';
import { SpreadsheetPanel } from './SpreadsheetPanel';
import { PremiumModal } from './PremiumModal';
import { LoginModal } from './LoginModal';
import { RegisterModal } from './RegisterModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { supabase } from '../lib/supabase';
import { analyzeTimeCardImage } from '../services/geminiService';
import { exportToGoogleSheet } from '../services/sheetService';
import { ProcessingStatus, TimeEntry, User, ProcessingResult } from '../types';
import { Loader2, Sparkles, AlertCircle, ArrowRight, CheckCircle2, Zap, Lock, Sheet, Crown, Infinity, FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const MAX_DAILY_USAGE = 2;
const STORAGE_KEY = 'smarttime_ocr_usage_tracker_v1';
const SETTINGS_KEY = 'smarttime_ocr_settings_v3';
const USER_KEY = 'smarttime_ocr_current_user_v1';

// Fixed GAS Web App URL
const FIXED_GAS_URL = "https://script.google.com/macros/s/AKfycbzp0gED3fgGgUWU5YsgwxSOUEmoDwdWLw4dwJ61zmEt0-7g1v70BxPgetrQP1VaL8v2/exec";

// Helper to get consistent YYYY-MM-DD date string
const getTodayString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
};

export const Home: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);

  // Changed from single list of entries to list of Results
  const [results, setResults] = useState<ProcessingResult[]>([]);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string | null>(null);

  // User State
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);

  // Only store ID now
  const [sheetSettings, setSheetSettings] = useState<{ id: string }>({ id: '' });

  // Define isPremium in component scope to be used in JSX and logic
  const isPremium = user?.isPremium || false;

  const [dailyUsage, setDailyUsage] = useState<number>(() => {
    // Initial load from localStorage for guests to prevent UI flash
    if (typeof window !== 'undefined') {
      try {
        const storedUsage = localStorage.getItem('smarttime_ocr_guest_usage');
        if (storedUsage) {
          const { date, count } = JSON.parse(storedUsage);
          if (date === getTodayString()) {
            return count;
          }
        }
      } catch (e) {
        console.error("Failed to load initial usage:", e);
      }
    }
    return 0;
  });

  // Load user status on mount and listen for auth changes
  useEffect(() => {
    // Helper to update user state from session
    const updateUserFromSession = async (sessionUser: any) => {
      // Any logged in user is considered Premium
      const isPremium = true;
      const newUser: User = {
        name: sessionUser.email?.split('@')[0] || 'User',
        email: sessionUser.email || '',
        isPremium: isPremium,
        user_metadata: sessionUser.user_metadata
      };
      setUser(newUser);

      // Load usage data from metadata
      const today = getTodayString();
      const lastUsageDate = sessionUser.user_metadata?.last_usage_date;
      let currentUsage = sessionUser.user_metadata?.daily_usage_count || 0;

      // Reset if new day
      if (lastUsageDate !== today) {
        currentUsage = 0;
        // Update Supabase with reset count
        await supabase.auth.updateUser({
          data: { last_usage_date: today, daily_usage_count: 0 }
        });
      }
      setDailyUsage(currentUsage);

      // Load settings (prioritize Supabase metadata)
      const remoteSheetId = sessionUser.user_metadata?.spreadsheet_id;
      if (remoteSheetId) {
        setSheetSettings({ id: remoteSheetId });
        // Do NOT sync to local storage to prevent privacy leaks between accounts
      } else {
        // If logged in but no remote ID, ensure we don't accidentally show guest data
        setSheetSettings({ id: '' });
      }
    };

    // Check active session immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        updateUserFromSession(session.user);
      } else {
        // Guest User: Load usage from localStorage
        try {
          const storedUsage = localStorage.getItem('smarttime_ocr_guest_usage');
          if (storedUsage) {
            const { date, count } = JSON.parse(storedUsage);
            if (date === getTodayString()) {
              setDailyUsage(count);
            } else {
              // Reset usage if date changed
              setDailyUsage(0);
              localStorage.setItem('smarttime_ocr_guest_usage', JSON.stringify({
                date: getTodayString(),
                count: 0
              }));
            }
          } else {
            setDailyUsage(0);
          }
        } catch (e) {
          console.error("Failed to load guest usage:", e);
          setDailyUsage(0);
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        updateUserFromSession(session.user);
      } else if (_event === 'SIGNED_OUT') {
        setUser(null);
        // Fallback to guest usage
        try {
          const storedUsage = localStorage.getItem('smarttime_ocr_guest_usage');
          if (storedUsage) {
            const { date, count } = JSON.parse(storedUsage);
            if (date === getTodayString()) {
              setDailyUsage(count);
            } else {
              setDailyUsage(0);
            }
          }
        } catch {
          setDailyUsage(0);
        }
        setSheetSettings({ id: '' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const incrementUsage = async (amount = 1) => {
    const newCount = dailyUsage + amount;
    setDailyUsage(newCount);

    if (user) {
      // Persist to Supabase for logged-in users
      await supabase.auth.updateUser({
        data: {
          last_usage_date: getTodayString(),
          daily_usage_count: newCount
        }
      });
    } else {
      // Persist to localStorage for guest users
      localStorage.setItem('smarttime_ocr_guest_usage', JSON.stringify({
        date: getTodayString(),
        count: newCount
      }));
    }
  };

  const saveSettings = async (id: string) => {
    const newSettings = { id };
    setSheetSettings(newSettings);

    // If logged in, SAVE ONLY TO SUPABASE to protect privacy
    if (user) {
      try {
        await supabase.auth.updateUser({
          data: { spreadsheet_id: id }
        });
      } catch (error) {
        console.error("Failed to save settings to Supabase:", error);
      }
    } else {
      // If guest, save to local storage so they don't lose work
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    }
  };

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));

    // Restore settings from metadata ONLY
    const remoteSheetId = loggedInUser.user_metadata?.spreadsheet_id;
    if (remoteSheetId) {
      setSheetSettings({ id: remoteSheetId });
    } else {
      // Ensure clean slate if no remote data
      setSheetSettings({ id: '' });
    }

    setIsLoginOpen(false);
    setSuccessMsg(`ようこそ、${loggedInUser.name}さん`);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      console.error("Logout failed:", error);
      // Force reload anyway to clear state if possible
      window.location.reload();
    }
  };

  const handleUpgrade = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setIsPremiumOpen(false);
    setSuccessMsg("プレミアム会員登録が完了しました！ありがとうございます。");
  };

  const handleFileSelect = (selectedFiles: File[]) => {
    if (!isPremium && selectedFiles.length > 1) {
      setFiles([selectedFiles[0]]);
      setErrorMsg("無料プランでは一度に1枚しかアップロードできません。");
    } else {
      setFiles(selectedFiles);
      setErrorMsg(null);
    }

    setResults([]);
    setStatus(ProcessingStatus.IDLE);
    setSuccessMsg(null);
  };

  const handleClear = () => {
    setFiles([]);
    setResults([]);
    setStatus(ProcessingStatus.IDLE);
    setErrorMsg(null);
    setSuccessMsg(null);
    setProgressMsg(null);
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Helper for batch Excel Download
  const downloadExcel = () => {
    if (results.length === 0) return;

    const calculateDurationMinutes = (start: string, end: string): number => {
      if (!start || !end) return 0;
      try {
        const [sH, sM] = start.split(':').map(Number);
        const [eH, eM] = end.split(':').map(Number);
        if (isNaN(sH) || isNaN(eH)) return 0;
        const startMin = sH * 60 + (sM || 0);
        const endMin = eH * 60 + (eM || 0);
        return Math.max(0, endMin - startMin);
      } catch {
        return 0;
      }
    };

    const formatTime = (totalMins: number): string => {
      if (totalMins === 0) return '';
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      return `${h}:${m.toString().padStart(2, '0')}`;
    };

    // Create a new Workbook
    const wb = XLSX.utils.book_new();
    const usedSheetNames = new Set<string>();

    results.forEach((res) => {
      // 1. Determine unique sheet name
      let baseName = res.detectedName || "null";
      let sheetName = baseName;
      let counter = 2;

      while (usedSheetNames.has(sheetName)) {
        sheetName = `${baseName}${counter}`;
        counter++;
      }
      usedSheetNames.add(sheetName);

      // 2. Prepare Data for Worksheet
      const wsData: (string | number)[][] = [
        ["日付", "開始1", "終了1", "開始2", "終了2", "合計"]
      ];

      let totalMinutes = 0;

      res.entries.forEach(row => {
        const p1 = calculateDurationMinutes(row.startTime1, row.endTime1);
        const p2 = calculateDurationMinutes(row.startTime2, row.endTime2);
        const rowTotal = p1 + p2;
        totalMinutes += rowTotal;

        wsData.push([
          row.date,
          row.startTime1,
          row.endTime1,
          row.startTime2,
          row.endTime2,
          "'" + formatTime(rowTotal) // Force text format
        ]);
      });

      // Grand Total Row
      wsData.push(["総合計時間", "", "", "", "", "'" + formatTime(totalMinutes)]);

      // 3. Create Worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      ws['!cols'] = [
        { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }
      ];

      // 4. Append Sheet
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    // 5. Generate File
    const d = new Date();
    const dateStr = `${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}`;
    const filename = `勤怠データ_${dateStr}.xlsx`;

    XLSX.writeFile(wb, filename);
  };

  const processImage = async () => {
    if (files.length === 0) return;

    if (!isPremium && dailyUsage >= MAX_DAILY_USAGE) {
      setErrorMsg("本日の利用回数制限（3回）に達しました。明日またご利用ください。");
      return;
    }

    try {
      setStatus(ProcessingStatus.ANALYZING);
      setErrorMsg(null);
      setSuccessMsg(null);
      setResults([]);

      let successCount = 0;
      let sheetErrorCount = 0;
      const newResults: ProcessingResult[] = [];

      let lastError: any = null;

      for (let i = 0; i < files.length; i++) {
        const fileNumber = i + 1;
        const totalFiles = files.length;
        const currentFile = files[i];

        setProgressMsg(`${fileNumber} / ${totalFiles} 枚目を解析中...`);

        const base64 = await convertToBase64(currentFile);

        try {
          const result = await analyzeTimeCardImage(base64);
          const entries = result.entries;
          const name = result.name;

          newResults.push({
            id: crypto.randomUUID(),
            fileName: currentFile.name,
            detectedName: name || "検出なし",
            entries: entries
          });

          setResults([...newResults]);

          if (sheetSettings.id) {
            setProgressMsg(`${fileNumber} / ${totalFiles} 枚目をスプレッドシートへ転記中...`);
            const targetSheetName = name || "null";
            try {
              await exportToGoogleSheet(sheetSettings.id, FIXED_GAS_URL, entries, targetSheetName);
            } catch (sheetErr) {
              console.error("Sheet export failed for file " + fileNumber, sheetErr);
              sheetErrorCount++;
            }
          }

          successCount++;
          if (!isPremium) incrementUsage();

        } catch (e) {
          console.error(`Failed to process file ${i + 1}`, e);
          lastError = e;
          newResults.push({
            id: crypto.randomUUID(),
            fileName: currentFile.name,
            detectedName: "エラー",
            entries: []
          });
          setResults([...newResults]);
        }
      }

      if (successCount === 0) {
        throw new Error(lastError?.message || "すべての画像の解析に失敗しました。");
      }

      setProgressMsg(null);

      if (sheetSettings.id) {
        if (sheetErrorCount > 0) {
          setSuccessMsg(`${successCount}枚中、${successCount - sheetErrorCount}枚の転記に成功しました。（${sheetErrorCount}枚失敗）`);
        } else {
          setSuccessMsg(`${successCount}枚のデータを抽出し、スプレッドシートへ転記しました！`);
        }
      } else {
        setSuccessMsg(`${successCount}枚の抽出が完了しました。`);
      }

      setStatus(ProcessingStatus.SUCCESS);
    } catch (error: any) {
      console.error(error);
      setStatus(ProcessingStatus.ERROR);
      setErrorMsg(`エラーが発生しました: ${error.message || "詳細不明"}`);
    }
  };

  const isLimitReached = !isPremium && dailyUsage >= MAX_DAILY_USAGE;

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-900 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      <Header
        onOpenPremium={() => setIsPremiumOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        user={user}
      />

      <PremiumModal
        isOpen={isPremiumOpen}
        onClose={() => setIsPremiumOpen(false)}
        onUpgrade={handleUpgrade}
        onRegister={() => setIsRegisterOpen(true)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLogin={handleLogin}
        onForgotPassword={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterOpen}
        toggle={() => setIsRegisterOpen(!isRegisterOpen)}
        onLogin={() => setIsLoginOpen(true)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* Hero Section */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            タイムカードを<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Googleスプレッドシート</span>へ瞬時に転記
          </h1>
          <p className="text-base text-slate-600 max-w-2xl mx-auto">
            写真をアップロードするだけで、AIが名前・日付・開始・終了時間を自動で読み取ります。<br />
            手書きでの文字や日付の抜け漏れ等も自動補完し、スプレッドシートへ即転記します。
          </p>

          {/* Integrated Spreadsheet Config Panel */}
          <SpreadsheetPanel
            savedId={sheetSettings.id}
            onSave={saveSettings}
          />
        </div>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Input */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50 relative overflow-hidden">
              {isPremium && (
                <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-amber-200 z-10 flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-current" />
                  Premium
                </div>
              )}

              <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center">
                <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2 shadow-md shadow-slate-900/20">1</div>
                画像をアップロード
              </h2>
              <DropZone
                onFileSelect={handleFileSelect}
                selectedFiles={files}
                onClear={handleClear}
                disabled={status === ProcessingStatus.ANALYZING}
                isPremium={isPremium}
              />

              {/* Sample Timecard Download Button */}
              <div className="mt-4">
                <button
                  onClick={() => {
                    // Create a link to download the sample image
                    const link = document.createElement('a');
                    link.href = '/sample-timecard.png';
                    link.download = 'sample-timecard.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 border border-slate-200"
                >
                  <Download className="w-4 h-4" />
                  サンプル画像をダウンロード
                </button>
              </div>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-semibold text-slate-500">本日の残り回数</span>
                  {isPremium ? (
                    <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                      <Infinity className="w-3 h-3" />
                      無制限
                    </span>
                  ) : (
                    <span className={`text-xs font-bold ${isLimitReached ? 'text-red-500' : 'text-indigo-600'}`}>
                      {Math.max(0, MAX_DAILY_USAGE - dailyUsage)} / {MAX_DAILY_USAGE} 回
                    </span>
                  )}
                </div>

                <button
                  onClick={processImage}
                  disabled={files.length === 0 || status === ProcessingStatus.ANALYZING || isLimitReached}
                  className={`
                    w-full py-3.5 px-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center space-x-2 transition-all duration-300 transform
                    ${files.length === 0 || isLimitReached
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : status === ProcessingStatus.ANALYZING
                        ? 'bg-indigo-400 cursor-wait translate-y-1'
                        : isPremium
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 hover:-translate-y-1 hover:shadow-amber-500/30'
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 hover:-translate-y-1 hover:shadow-indigo-500/30'
                    }
                  `}
                >
                  {status === ProcessingStatus.ANALYZING ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>{progressMsg || '解析中...'}</span>
                    </>
                  ) : isLimitReached ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>本日の上限に達しました</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 fill-current" />
                      <span>データを抽出する</span>
                    </>
                  )}
                </button>
              </div>

              {errorMsg && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium">{errorMsg}</p>
                </div>
              )}

              {successMsg && (
                <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-lg flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-green-700 font-medium">{successMsg}</p>
                </div>
              )}
            </div>

            {/* Premium Promo (visible if free) */}
            {!isPremium && (
              <div className="hidden lg:block p-1 bg-gradient-to-r from-amber-200 to-orange-200 rounded-2xl shadow-lg cursor-pointer transition-transform hover:scale-[1.02]" onClick={() => setIsPremiumOpen(true)}>
                <div className="bg-white rounded-xl p-4 text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600 mb-2">
                    <Crown className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm mb-1">有料会員で制限解除</h3>
                  <p className="text-xs text-slate-500 mb-3">
                    一括アップロード＆無制限利用が可能に
                  </p>
                  <button className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                    詳細を見る &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Instructional Graphic */}
            <div className="hidden lg:block p-5 bg-slate-800 rounded-2xl text-white relative overflow-hidden shadow-lg">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-500 rounded-full blur-3xl opacity-10"></div>
              <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                精度の高い読み取りのために
              </h3>
              <ul className="space-y-3 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0"></span>
                  明るい場所で撮影してください
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 flex-shrink-0"></span>
                  カード全体が写るようにしてください
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-9">
            <div className="bg-slate-50/0 min-h-[600px] flex flex-col relative">
              {results.length > 0 || status === ProcessingStatus.SUCCESS ? (
                <div className="space-y-6">
                  <div className="flex justify-end mb-2">
                    <button
                      onClick={downloadExcel}
                      className="flex items-center gap-2 px-5 py-2.5 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 text-sm border border-green-800"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      すべての結果をExcelでダウンロード
                    </button>
                  </div>
                  {results.map((res) => (
                    <DataGrid
                      key={res.id}
                      data={res.entries}
                      detectedName={res.detectedName}
                      fileName={res.fileName}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-white/50 flex-1 flex flex-col items-center justify-center p-12 text-center overflow-hidden relative">
                  {status === ProcessingStatus.ANALYZING ? (
                    <div className="relative z-10">
                      <div className="w-24 h-24 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin shadow-2xl shadow-indigo-200"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="w-8 h-8 text-indigo-600 animate-pulse" />
                      </div>
                      <h3 className="mt-8 text-xl font-bold text-slate-800">解析中...</h3>
                      <p className="text-slate-500 text-sm mt-2 whitespace-pre-line">
                        {progressMsg ? progressMsg : 'Gemini AIが画像を読み取っています\n少々お待ちください'}
                      </p>
                    </div>
                  ) : (
                    <div className="max-w-md mx-auto opacity-80 hover:opacity-100 transition-opacity relative z-10">
                      <div className="w-32 h-32 bg-gradient-to-b from-slate-50 to-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-200 shadow-inner">
                        <ArrowRight className="w-12 h-12 text-slate-300" />
                      </div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-3">準備完了</h3>
                      <p className="text-slate-500 leading-relaxed">
                        左側のパネルから画像をアップロードして<br />
                        <span className="font-semibold text-indigo-600">「データを抽出する」</span>をクリックしてください。
                      </p>
                    </div>
                  )}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl"></div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Pricing Comparison Table */}
        <div className="max-w-6xl mx-auto px-4 py-16 bg-gradient-to-b from-transparent to-slate-50">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">プラン比較</h2>
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700 border-b border-slate-200"></th>
                  <th className="px-6 py-4 text-center text-lg font-bold text-slate-900 border-b border-slate-200">非会員</th>
                  <th className="px-6 py-4 text-center text-lg font-bold bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-b border-indigo-700">有料会員</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-700">料金</td>
                  <td className="px-6 py-4 text-center text-slate-600">0円</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50/50">月額1,480円（税込）</td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-700">会員登録</td>
                  <td className="px-6 py-4 text-center text-slate-600">不要</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50/50">
                    必要（新規会員登録）
                  </td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-700">OCR利用回数</td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-slate-600">1日2回まで</div>
                    <div className="text-xs text-slate-400 mt-1">（有料会員検討のデモとして）</div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50/50">無制限</td>
                </tr>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-700">一括アップロード</td>
                  <td className="px-6 py-4 text-center text-slate-600">1枚まで</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50/50">10枚まで</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-700">決済方法</td>
                  <td className="px-6 py-4 text-center text-slate-400">-</td>
                  <td className="px-6 py-4 text-center font-bold text-indigo-600 bg-indigo-50/50">クレジットカード</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-8">
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 active:scale-[0.98] inline-flex items-center gap-2"
            >
              <span>今すぐ有料会員に登録</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};