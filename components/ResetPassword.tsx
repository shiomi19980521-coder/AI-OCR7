import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Check if we have a session (hash fragment handled by Supabase client automatically)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!session) {
                // If no session, they might have clicked a link but the hash wasn't processed yet or it's invalid
                // For now, we'll let them try, but usually the link logs them in automatically.
            }
        });
    }, []);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);

        if (password !== confirmPassword) {
            setErrorMsg("パスワードが一致しません。");
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccessMsg("パスワードが正常に変更されました。\nトップページへ移動します...");

            setTimeout(() => {
                navigate('/');
                window.location.reload(); // Ensure fresh state
            }, 2000);

        } catch (error: any) {
            console.error("Reset password error:", error);
            setErrorMsg(error.message || "パスワードの変更に失敗しました。");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 font-sans text-slate-900">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                    <KeyRound className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-bold text-lg text-slate-800">新しいパスワードの設定</h3>
                </div>

                <div className="p-6">
                    {successMsg ? (
                        <div className="text-center py-8 animate-in fade-in duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">変更完了</h3>
                            <p className="text-slate-600 whitespace-pre-line">{successMsg}</p>
                        </div>
                    ) : (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <p className="text-sm text-slate-500">
                                新しいパスワードを入力してください。
                            </p>

                            {errorMsg && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2 text-red-600 text-sm">
                                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                    新しいパスワード
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">
                                    新しいパスワード（確認）
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span>更新中...</span>
                                ) : (
                                    <>
                                        <span>パスワードを変更</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
