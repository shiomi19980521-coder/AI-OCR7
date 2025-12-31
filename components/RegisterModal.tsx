import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Mail, Lock, UserPlus, Sparkles, ArrowRight } from 'lucide-react';

interface RegisterModalProps {
    isOpen: boolean;
    toggle: () => void;
    onLogin?: () => void;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({ isOpen, toggle, onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;


    // doRegister function removed - registration now happens after Stripe payment in PaymentSuccess component

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={toggle}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header Section with Gradient */}
                <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>

                    <button
                        onClick={toggle}
                        className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md mb-4 shadow-lg border border-white/10">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">新規会員登録</h2>
                        <p className="text-indigo-100 text-sm">
                            登録して、AI-OCRの全機能を利用しましょう。<br />
                            <span className="font-bold text-white flex items-center gap-1 mt-1">
                                <Sparkles className="w-3 h-3" /> 1分で完了します
                            </span>
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <div className="p-8">
                    {errorMsg && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
                            <div className="text-red-500 mt-0.5">⚠️</div>
                            <p className="text-sm text-red-600 font-medium">{errorMsg}</p>
                        </div>
                    )}

                    {successMsg ? (
                        <div className="text-center py-8 animate-in fade-in duration-300">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">送信完了！</h3>
                            <p className="text-slate-600 whitespace-pre-line mb-8">{successMsg}</p>
                            <button
                                onClick={toggle}
                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                            >
                                閉じる
                            </button>
                        </div>
                    ) : (
                        <form className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">メールアドレス</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50 focus:bg-white"
                                        placeholder="example@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">パスワード</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50 focus:bg-white"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">パスワード（確認）</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all bg-slate-50 focus:bg-white"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        minLength={6}
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={async () => {
                                    // Validate that all fields are filled
                                    if (!email || !password || !confirmPassword) {
                                        setErrorMsg('すべての項目を入力してください。');
                                        return;
                                    }

                                    // Validate that passwords match
                                    if (password !== confirmPassword) {
                                        setErrorMsg('パスワードが一致しません。');
                                        return;
                                    }

                                    // Clear any previous errors
                                    setErrorMsg(null);
                                    setIsSubmitting(true);

                                    try {
                                        // Skip email check to prevent sending confirmation email before payment
                                        // Directly proceed to payment
                                        console.log('RegisterModal: Storing credentials and redirecting to Stripe');

                                        // Store email and password in sessionStorage for later use after payment
                                        sessionStorage.setItem('pending_registration_email', email);
                                        sessionStorage.setItem('pending_registration_password', password);

                                        console.log('RegisterModal: Credentials stored:', {
                                            email,
                                            hasPassword: !!password
                                        });
                                        console.log('RegisterModal: Redirecting to Stripe...');

                                        // Redirect to Stripe payment page
                                        // After successful payment, user will be redirected to /payment-success
                                        // where the actual Supabase registration will happen
                                        window.location.href = 'https://buy.stripe.com/14A7sL6yl0525Bn1h83AY01';
                                    } catch (err: any) {
                                        console.error('RegisterModal: Error:', err);
                                        setErrorMsg('エラーが発生しました。もう一度お試しください。');
                                        setIsSubmitting(false);
                                    }
                                }}
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <span>決済ページへ移動中...</span>
                                ) : (
                                    <>
                                        <span>新規会員登録</span>
                                        <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <div className="mt-6 text-center">
                                <p className="text-sm text-slate-500">
                                    すでにアカウントをお持ちの方は{' '}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            toggle();
                                            onLogin?.();
                                        }}
                                        className="text-indigo-600 hover:text-indigo-700 font-bold underline"
                                    >
                                        ログイン
                                    </button>
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
