import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const Terms: React.FC = () => {
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-8">利用規約</h1>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第1条（適用）</h2>
                            <p className="text-slate-700 leading-relaxed">
                                本規約は、AI-タイムカード-OCR（以下「当サービス」といいます）の利用に関する条件を、当サービスを利用するお客様（以下「ユーザー」といいます）と当サービス運営者（以下「当社」といいます）との間で定めるものです。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第2条（利用登録）</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                1. 当サービスの利用を希望する方は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
                            </p>
                            <p className="text-slate-700 leading-relaxed">
                                2. 当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                            </p>
                            <ul className="list-disc list-inside text-slate-700 ml-4 mt-2">
                                <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                                <li>本規約に違反したことがある者からの申請である場合</li>
                                <li>その他、当社が利用登録を相当でないと判断した場合</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第3条（ユーザーIDおよびパスワードの管理）</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                1. ユーザーは、自己の責任において、当サービスのユーザーIDおよびパスワードを適切に管理するものとします。
                            </p>
                            <p className="text-slate-700 leading-relaxed">
                                2. ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第4条（禁止事項）</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。
                            </p>
                            <ul className="list-disc list-inside text-slate-700 ml-4 space-y-2">
                                <li>法令または公序良俗に違反する行為</li>
                                <li>犯罪行為に関連する行為</li>
                                <li>当サービスの内容等、当サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                                <li>当社、ほかのユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                                <li>当サービスによって得られた情報を商業的に利用する行為</li>
                                <li>当サービスの運営を妨害するおそれのある行為</li>
                                <li>不正アクセスをし、またはこれを試みる行為</li>
                                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                                <li>不正な目的を持って当サービスを利用する行為</li>
                                <li>1つのアカウントを複数人で利用する行為</li>
                                <li>他の利用者に成りすます行為</li>
                                <li>その他、当社が不適切と判断する行為</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第5条（本サービスの提供の停止等）</h2>
                            <p className="text-slate-700 leading-relaxed">
                                当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                            </p>
                            <ul className="list-disc list-inside text-slate-700 ml-4 mt-2">
                                <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                                <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第6条（利用制限および登録抹消）</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                1. 当サイトは、利用者が以下のいずれかに該当する場合には、事前の通知なく、利用者に対して、本サービスの全部もしくは一部の利用を制限し、または利用者としての登録を抹消することができるものとします。
                            </p>
                            <ul className="list-disc list-inside text-slate-700 ml-4 space-y-2">
                                <li>本規約のいずれかの条項に違反した場合</li>
                                <li>登録事項に虚偽の事実があることが判明した場合</li>
                                <li>料金等の債務の不履行があった場合</li>
                                <li>当サイトからの連絡に対し、一定期間返答がない場合</li>
                                <li>その他、当サイトが本サービスの利用を適当でないと判断した場合</li>
                            </ul>
                            <p className="text-slate-700 leading-relaxed mt-4">
                                2. 当サイトは、本条に基づき当サイトが行った行為により利用者に生じた損害について、一切の責任を負いません。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第7条（免責事項）</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                1. 当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます。）がないことを明示的にも黙示的にも保証しておりません。
                            </p>
                            <p className="text-slate-700 leading-relaxed">
                                2. 当社は、本サービスに起因してユーザーに生じたあらゆる損害について一切の責任を負いません。ただし、本サービスに関する当社とユーザーとの間の契約（本規約を含みます。）が消費者契約法に定める消費者契約となる場合、この免責規定は適用されません。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第8条（サービス内容の変更等）</h2>
                            <p className="text-slate-700 leading-relaxed">
                                当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第9条（利用規約の変更）</h2>
                            <p className="text-slate-700 leading-relaxed">
                                当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第10条（サービス利用契約上の地位の譲渡等）</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                1. 登録ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務につき、第三者に対し、譲渡、移転、担保設定、その他の処分をすることはできません。
                            </p>
                            <p className="text-slate-700 leading-relaxed">
                                2. 当社は本サービスにかかる事業を他社に譲渡した場合には、当該事業譲渡に伴い利用契約上の地位、本規約に基づく権利及び義務並びに登録ユーザーの登録事項その他の顧客情報を当該事業譲渡の譲受人に譲渡することができるものとし、登録ユーザーは、かかる譲渡につき本項において予め同意したものとします。なお、本項に定める事業譲渡には、通常の事業譲渡のみならず、会社分割その他事業が移転するあらゆる場合を含むものとします。
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-4">第11条（準拠法・裁判管轄）</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">
                                1. 本規約の解釈にあたっては、日本法を準拠法とします。
                            </p>
                            <p className="text-slate-700 leading-relaxed">
                                2. 本サービスに関して紛争が生じた場合には、大阪地方裁判所を第一審の専属的合意管轄裁判所とします。
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
