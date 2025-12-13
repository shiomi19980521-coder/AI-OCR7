// Stripe関連のサービス関数
import { supabase } from '../lib/supabase';

export const createCheckoutSession = async (email: string): Promise<string> => {
    try {
        // バックエンドAPIを呼び出してStripeチェックアウトセッションを作成
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                priceId: 'price_1MotwRLkdIwHu7ixYcPLm5', // あなたのStripe Price ID
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to create checkout session');
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        console.error('Error creating checkout session:', error);
        throw error;
    }
};

// Webhookでプレミアムステータスを更新する関数
export const handleStripeWebhook = async (event: any) => {
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            const customerEmail = session.customer_email;

            // Supabaseでユーザーを検索してプレミアムステータスを更新
            const { data: users, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('email', customerEmail)
                .single();

            if (!fetchError && users) {
                // ユーザーのメタデータを更新
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                    users.id,
                    {
                        user_metadata: { is_premium: true }
                    }
                );

                if (updateError) {
                    console.error('Error updating user premium status:', updateError);
                }
            }
            break;

        case 'customer.subscription.deleted':
            // サブスクリプションがキャンセルされた場合
            const subscription = event.data.object;
            // プレミアムステータスを解除する処理
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }
};
