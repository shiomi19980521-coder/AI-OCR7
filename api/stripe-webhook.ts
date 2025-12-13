// Stripe Webhook用のサーバーレス関数
import Stripe from 'stripe';
import { handleStripeWebhook } from '../services/stripeService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2023-10-16',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;

    try {
        // Stripeからのイベントを検証
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        // イベントを処理
        await handleStripeWebhook(event);
        res.status(200).json({ received: true });
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        res.status(500).json({ error: error.message });
    }
}
