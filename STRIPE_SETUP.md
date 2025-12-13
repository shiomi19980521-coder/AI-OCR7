# Stripe統合のセットアップガイド

## 必要な環境変数

`.env`ファイルに以下の環境変数を追加してください：

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Base URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## セットアップ手順

### 1. Stripeパッケージのインストール

```bash
npm install stripe @stripe/stripe-js
```

### 2. Stripeダッシュボードでの設定

1. **Price IDの取得**
   - https://dashboard.stripe.com/products にアクセス
   - 商品を作成または既存の商品を選択
   - Price IDをコピー（例: `price_1MotwRLkdIwHu7ixYcPLm5`）

2. **Webhookの設定**
   - https://dashboard.stripe.com/webhooks にアクセス
   - 「エンドポイントを追加」をクリック
   - エンドポイントURL: `https://yourdomain.com/api/stripe-webhook`
   - イベントを選択:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
   - Webhook署名シークレットをコピー

### 3. RegisterModal.tsxの更新

現在のハードコードされたStripe URLを、動的なチェックアウトセッション作成に変更：

```tsx
// RegisterModal.tsx内のボタンのonClickハンドラーを以下に変更：

import { createCheckoutSession } from '../services/stripeService';

// ...

onClick={async () => {
  // バリデーション処理...
  
  try {
    // Stripeチェックアウトセッションを作成
    const checkoutUrl = await createCheckoutSession(email);
    
    // Stripeチェックアウトページにリダイレクト
    window.location.href = checkoutUrl;
  } catch (error) {
    setErrorMsg('決済ページの作成に失敗しました。');
    setIsSubmitting(false);
  }
}}
```

### 4. デプロイ設定

#### Vercelの場合:
- `api/`フォルダ内のファイルが自動的にサーバーレス関数として認識されます
- 環境変数をVercelダッシュボードで設定

#### Netlifyの場合:
- `netlify.toml`を作成:
```toml
[functions]
  directory = "api"
```

### 5. テスト

1. テストモードで決済を実行
2. Stripeダッシュボードでイベントログを確認
3. Webhookが正しく受信されているか確認
4. ユーザーのプレミアムステータスが更新されているか確認

## 本番環境への移行

1. Stripeのテストキーを本番キーに変更
2. `NEXT_PUBLIC_BASE_URL`を本番URLに変更
3. Webhookエンドポイントを本番URLに更新
4. Payment Linkの`success_url`を本番URLに更新

## トラブルシューティング

- Webhookが受信されない場合、Stripeダッシュボードのログを確認
- CORS エラーが発生する場合、APIエンドポイントにCORSヘッダーを追加
- 環境変数が正しく設定されているか確認
