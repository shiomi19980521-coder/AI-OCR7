import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Loader2 } from 'lucide-react';

export const PaymentSuccess: React.FC = () => {
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(true);

    useEffect(() => {
        const completeRegistration = async () => {
            try {
                console.log('PaymentSuccess: Starting registration process');

                // Get stored email and password from sessionStorage
                const email = sessionStorage.getItem('pending_registration_email');
                const password = sessionStorage.getItem('pending_registration_password');

                console.log('PaymentSuccess: Retrieved from sessionStorage:', {
                    hasEmail: !!email,
                    hasPassword: !!password,
                    email: email
                });

                if (!email || !password) {
                    console.error('PaymentSuccess: No pending registration found in sessionStorage');
                    setIsProcessing(false);
                    // If no pending registration, just redirect to home
                    setTimeout(() => navigate('/'), 1000);
                    return;
                }

                console.log('PaymentSuccess: Creating Supabase account...');

                // Create Supabase account now that payment is complete
                const { data, error } = await supabase.auth.signUp({
                    email: email,
                    password: password,
                    options: {
                        emailRedirectTo: window.location.origin,
                        data: {
                            is_premium: true // Set premium status immediately
                        }
                    }
                });

                if (error) {
                    console.error('PaymentSuccess: Error creating account:', error);
                    setIsProcessing(false);
                    return;
                }

                console.log('PaymentSuccess: Account created successfully!', data);
                console.log('PaymentSuccess: Verification email should be sent to:', email);

                // Clear stored credentials
                sessionStorage.removeItem('pending_registration_email');
                sessionStorage.removeItem('pending_registration_password');

                // Wait a moment to show success message
                setTimeout(() => {
                    setIsProcessing(false);
                    // Redirect to home page after 3 seconds
                    setTimeout(() => {
                        navigate('/');
                    }, 3000);
                }, 1000);
            } catch (error) {
                console.error('PaymentSuccess: Unexpected error:', error);
                setIsProcessing(false);
            }
        };

        completeRegistration();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
                {isProcessing ? (
                    <>
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">処理中...</h1>
                        <p className="text-slate-600">プレミアムプランを有効化しています</p>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">決済完了！</h1>
                        <p className="text-slate-600 mb-6">
                            プレミアムプランへようこそ！<br />
                            認証メールを送信しました。メールをご確認ください。<br />
                            まもなくホームページに移動します...
                        </p>
                        <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-600 h-full animate-[progress_3s_ease-in-out]" style={{
                                animation: 'progress 3s ease-in-out forwards'
                            }}></div>
                        </div>
                    </>
                )}
            </div>
            <style>{`
                @keyframes progress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}</style>
        </div>
    );
};
