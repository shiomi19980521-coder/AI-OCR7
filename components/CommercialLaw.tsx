import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const CommercialLaw: React.FC = () => {
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-8">特定商取引法に基づく表記</h1>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">提供するサービスの名称</h2>
                            <p className="text-slate-700 leading-relaxed">
                                AI-タイムカード-OCR
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">運営責任者</h2>
                            <p className="text-slate-700 leading-relaxed">
                                塩見和貴
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">所在地</h2>
                            <p className="text-slate-700 leading-relaxed">
                                大阪府大阪市東淀川区下新庄４丁目3-4301
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">連絡先</h2>
                            <p className="text-slate-700 leading-relaxed">
                                電話番号：080-9474-8412<br />
                                メールアドレス：aitimecardocr@gmail.com<br />
                                受付時間：平日10:00〜18:00（土日祝を除く）
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">販売価格</h2>
                            <p className="text-slate-700 leading-relaxed">
                                有料会員プラン: 月額1,480円（税込）
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">商品代金以外の必要料金</h2>
                            <p className="text-slate-700 leading-relaxed">
                                インターネット接続料金、通信料金等は、お客様のご負担となります。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">お支払い方法</h2>
                            <p className="text-slate-700 leading-relaxed">
                                クレジットカード決済（Stripe）
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">お支払い時期</h2>
                            <p className="text-slate-700 leading-relaxed">
                                クレジットカード決済の場合、各クレジットカード会社の規約に基づくお支払いとなります。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">サービス提供時期</h2>
                            <p className="text-slate-700 leading-relaxed">
                                決済完了後、即時ご利用いただけます。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">返品・キャンセルについて</h2>
                            <p className="text-slate-700 leading-relaxed">
                                デジタルコンテンツという商品の性質上、原則として返品・返金には応じかねます。<br />
                                ただし、サービスに重大な瑕疵がある場合は、個別に対応させていただきます。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">解約について</h2>
                            <p className="text-slate-700 leading-relaxed">
                                お問い合わせフォームから解約したい旨をご連絡ください。解約後は、次回請求日から課金が停止されます。<br />
                                現在の請求期間が終了するまでは、プレミアム機能をご利用いただけます。<br />
                                ※解約は次回更新日の前日までに行ってください
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">その他</h2>
                            <p className="text-slate-700 leading-relaxed">
                                本サービスの利用には、別途利用規約へのご同意が必要です<br />
                                サービス内容は予告なく変更する場合があります
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
