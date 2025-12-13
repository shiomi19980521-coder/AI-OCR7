import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const StripeReturn: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        console.log('StripeReturn: Payment completed, redirecting to payment-success...');

        // Check if there's pending registration data
        const email = sessionStorage.getItem('pending_registration_email');
        const password = sessionStorage.getItem('pending_registration_password');

        console.log('StripeReturn: Checking sessionStorage:', {
            hasEmail: !!email,
            hasPassword: !!password
        });

        if (email && password) {
            // Redirect to payment success page to complete registration
            console.log('StripeReturn: Found pending registration, redirecting to /payment-success');
            navigate('/payment-success');
        } else {
            // No pending registration, redirect to home
            console.log('StripeReturn: No pending registration found, redirecting to home');
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
                <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">決済完了</h1>
                <p className="text-slate-600">アカウントを作成しています...</p>
            </div>
        </div>
    );
};
