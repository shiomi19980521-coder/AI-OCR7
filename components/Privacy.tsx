import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Privacy: React.FC = () => {
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-8">プライバシーポリシー</h1>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">基本方針</h2>
                            <p className="text-slate-700 leading-relaxed">
                                AIタイムカードOCR（以下「当サイト」といいます）は、個人情報の重要性を認識し、個人情報の保護に関する法律（以下「個人情報保護法」）を遵守すると共に、適切な個人情報の取得、利用、管理を行います。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">1. 個人情報の収集</h2>
                            <p className="text-slate-700 leading-relaxed">
                                当サービスでは、ユーザーから以下の個人情報を収集することがあります：
                            </p>
                            <ul className="list-disc list-inside text-slate-700 ml-4 mt-2">
                                <li>メールアドレス</li>
                                <li>利用履歴</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">2. 画像データの取り扱い</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                当サイトは、OCR処理のためにアップロードされた画像データについて、以下の取り扱いを行います。
                            </p>
                            <ul className="list-disc list-inside text-slate-700 ml-4 space-y-2">
                                <li>画像データはOCR処理完了後、即座に削除されます</li>
                                <li>画像データはOCR処理以外の目的では使用いたしません</li>
                                <li>画像データは第三者に提供いたしません</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">3. 個人情報の利用目的</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                収集した個人情報は、以下の目的で利用します：
                            </p>
                            <ul className="list-disc list-inside text-slate-700 ml-4 space-y-2">
                                <li>サービスの提供・運営のため</li>
                                <li>ユーザーからのお問い合わせに回答するため</li>
                                <li>サービスの改善・新機能の開発のため</li>
                                <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                                <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">4. 個人情報の第三者提供</h2>
                            <p className="text-slate-700 leading-relaxed">
                                当社は、以下の場合を除き、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません：
                            </p>
                            <ul className="list-disc list-inside text-slate-700 ml-4 mt-2">
                                <li>法令に基づく場合</li>
                                <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                                <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">5. 個人情報の開示</h2>
                            <p className="text-slate-700 leading-relaxed">
                                当社は、本人から個人情報の開示を求められたときは、本人に対し、遅滞なくこれを開示します。ただし、開示することにより次のいずれかに該当する場合は、その全部または一部を開示しないこともあり、開示しない決定をした場合には、その旨を遅滞なく通知します。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">6. 個人情報の訂正および削除</h2>
                            <p className="text-slate-700 leading-relaxed">
                                ユーザーは、当社の保有する自己の個人情報が誤った情報である場合には、当社が定める手続きにより、当社に対して個人情報の訂正、追加または削除（以下、「訂正等」といいます。）を請求することができます。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">7. Cookieの使用</h2>
                            <p className="text-slate-700 leading-relaxed">
                                当サービスでは、ユーザーの利便性向上のためにCookieを使用することがあります。Cookieの使用を望まない場合は、ブラウザの設定でCookieを無効にすることができます。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">8. アクセス解析ツール</h2>
                            <p className="text-slate-700 leading-relaxed">
                                当サービスでは、サービスの利用状況を把握するために、アクセス解析ツールを使用することがあります。これらのツールは、トラフィックデータの収集のためにCookieを使用することがあります。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">9. プライバシーポリシーの変更</h2>
                            <p className="text-slate-700 leading-relaxed">
                                本ポリシーの内容は、法令その他本ポリシーに別段の定めのある事項を除いて、ユーザーに通知することなく、変更することができるものとします。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">10. お問い合わせ窓口</h2>
                            <p className="text-slate-700 leading-relaxed">
                                本ポリシーに関するお問い合わせは、お問い合わせフォームよりご連絡ください。
                            </p>
                        </section>

                        <p className="text-sm text-slate-500 mt-12">
                            最終更新日: {new Date().toLocaleDateString('ja-JP')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
