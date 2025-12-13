// Stripe Checkout Session作成用のサーバーレス関数
// このファイルは Vercel Functions または Netlify Functions として使用できます

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, priceId } = req.body;

        // 本番環境とテスト環境のURLを環境変数から取得
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        // Stripeチェックアウトセッションを作成
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId || 'price_1MotwRLkdIwHu7ixYcPLm5', // デフォルトのPrice ID
                    quantity: 1,
                },
            ],
            mode: 'subscription', // または 'payment' (一回払いの場合)
            customer_email: email,
            success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/?canceled=true`,
            metadata: {
                user_email: email,
            },
        });

        res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe error:', error);
        res.status(500).json({ error: error.message });
    }
}
