import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Contact: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-4xl mx-auto px-4 py-12">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>ホームに戻る</span>
                </button>

                <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-4">お問い合わせ</h1>
                    <p className="text-slate-600 mb-8">
                        ご質問やご要望がございましたら、下記のフォームよりお気軽にお問い合わせください。
                    </p>

                    {/* Form Mailer Form */}
                    <form
                        action="https://ssl.form-mailer.jp/fm/service/Forms/confirm"
                        method="post"
                        name="form1"
                        encType="multipart/form-data"
                        acceptCharset="UTF-8"
                    >
                        <input type="hidden" name="key" value="77b39e5e871345" />

                        <p className="text-sm text-slate-600 mb-6">
                            解約希望の場合は、その旨をこちらにご連絡ください
                        </p>

                        {/* Email */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                *メールアドレス
                            </label>
                            <input
                                name="field_7624721"
                                type="text"
                                size={30}
                                placeholder="info@example.com"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            />
                        </div>

                        {/* Message */}
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                *問い合わせ内容
                            </label>
                            <textarea
                                name="field_7624726"
                                cols={30}
                                rows={10}
                                placeholder="問い合わせ内容を入力してください"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-y"
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="mb-6">
                            <button
                                name="submit"
                                type="submit"
                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                確認画面へ
                            </button>
                        </div>

                        {/* Powered by */}
                        <p className="text-center text-xs text-slate-400">
                            <a
                                href="https://www.form-mailer.jp/?utm_source=https://ssl.form-mailer.jp/fms/77b39e5e871345&utm_medium=ownedmedia&utm_campaign=powered-by-formmailer"
                                target="_blank"
                                rel="noopener noreferrer"
                                id="powered"
                                className="hover:text-slate-600 transition-colors"
                            >
                                Powered by FormMailer.
                            </a>
                        </p>

                        <input type="hidden" name="code" value="utf8" />
                    </form>
                </div>
            </div>
        </div>
    );
};
