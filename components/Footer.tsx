import React from 'react';
import { Mail } from 'lucide-react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-slate-900 text-slate-300 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-white text-lg font-bold mb-4">AI-タイムカード-OCR</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            タイムカード専用AI-OCRツール
                        </p>
                        <p className="text-sm text-slate-400">
                            タイムカードの読み取りを自動化し、業務効率を向上させます。
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white text-sm font-bold mb-4">サポート</h4>
                        <ul className="space-y-2">
                            <li>
                                <a
                                    href="/terms"
                                    className="text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    利用規約
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/privacy"
                                    className="text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    プライバシーポリシー
                                </a>
                            </li>
                            <li>
                                <a
                                    href="/commercial-law"
                                    className="text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    特定商取引法に基づく表記
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white text-sm font-bold mb-4">お問い合わせ</h4>
                        <a
                            href="/contact"
                            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            <span>お問い合わせフォーム</span>
                        </a>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-slate-800 mt-8 pt-8 text-center">
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} AI-タイムカード-OCR. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
