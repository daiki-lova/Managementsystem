# セキュリティ・運用設計書

## 1. 認証・認可

### 1.1 トークン設計
- **アクセストークン**: Supabase Auth 発行、TTL 1時間
- **リフレッシュトークン**: Supabase Auth 発行、TTL 7日間
- **リフレッシュエンドポイント**: `POST /api/auth/refresh`

### 1.2 CSRF対策
- Origin/Referer ヘッダー検証（`src/middleware.ts`）
- 許可オリジン: `NEXTAUTH_URL`, `FRONTEND_URL`
- 状態変更メソッド（POST/PUT/PATCH/DELETE）のみ検証

### 1.3 RBAC
- **OWNER**: 全権限（マスタデータ変更、設定変更、永久削除、監査ログ閲覧）
- **EDITOR**: 記事・メディア操作、生成ジョブ作成

### 1.4 アカウントロック
- 5回連続ログイン失敗で15分間ロック
- `src/lib/rate-limit.ts` で実装

---

## 2. 秘密情報管理

### 2.1 暗号化
- **アルゴリズム**: AES-256-GCM
- **対象フィールド**:
  - `gaApiKey`
  - `searchConsoleApiKey`
  - `searchVolumeApiKey`
  - `openRouterApiKey`
- **実装**: `src/lib/encryption.ts`

### 2.2 必要な環境変数
```env
ENCRYPTION_KEY=<32バイトのキー>
ENCRYPTION_SALT=<ソルト文字列>
```

### 2.3 キーローテーション
1. 新しい `ENCRYPTION_KEY` を環境変数に設定
2. マイグレーションスクリプトで再暗号化
3. 古いキーを破棄

---

## 3. レート制限

| エンドポイント | 制限 | キー |
|---------------|------|------|
| `/api/auth/*` | 10 req/分 | IP + User-Agent |
| `/api/media` (POST) | 30 req/分 | IP + User-Agent |
| `/api/generation-jobs` (POST) | 10 req/時 | IP + User-Agent |
| `/api/public/*` | 60 req/分 | IP + User-Agent |

**注意**: 本番環境では Redis への移行を推奨

---

## 4. Inngest ジョブ設計

### 4.1 信頼性
- **リトライ**: 各関数で 2-3 回
- **バックオフ**: 指数バックオフ（Inngest デフォルト）
- **冪等性**: `step.run()` の名前をキーとして自動保証
- **キャンセル**: `cancelOn` イベントで実行中ジョブをキャンセル

### 4.2 タイムゾーン
- **Cron**: UTC 基準
- **予約投稿**: DB は UTC、UI は JST 表示
- 換算例:
  - `0 3 * * *` (UTC 03:00) = JST 12:00
  - `* * * * *` = 毎分（TZ 無関係）

### 4.3 部分失敗ハンドリング

#### 記事生成成功 + 画像生成失敗
1. 記事は保存される（DRAFT ステータス）
2. 画像生成失敗の通知を作成
3. ユーザーは手動で画像をアップロード可能
4. 記事編集画面から再生成は未実装（v2 検討）

#### キャンセル
- `DELETE /api/generation-jobs/:id` で Inngest イベント発火
- 実行中ステップは完了まで実行、次ステップでキャンセル

---

## 5. 監査ログ

### 5.1 記録対象
| カテゴリ | アクション |
|---------|----------|
| 認証 | LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE |
| ユーザー | CREATE, UPDATE, DELETE |
| 記事 | PUBLISH, TRASH, DELETE_PERMANENT |
| マスタデータ | CATEGORY/AUTHOR/CONVERSION/BRAND の CUD |
| メディア | UPLOAD, DELETE |
| 設定 | UPDATE |
| 生成ジョブ | CREATE, CANCEL |

### 5.2 保持期間
- **デフォルト**: 90日
- **クリーンアップ**: 週1回（日曜 JST 13:00）

### 5.3 閲覧
- `GET /api/audit-logs` （オーナーのみ）
- フィルター: action, userId, resourceType, startDate, endDate

---

## 6. メディア安全性

### 6.1 アップロード検証
- MIME タイプ検証
- マジックバイト検証
- SVG コンテンツスキャン（スクリプト検出）
- ファイル名サニタイズ

### 6.2 Storage 設計（Supabase）
```
buckets:
  - media (公開バケット)
    - uploads/      # ユーザーアップロード
    - generated/    # AI生成画像
  - avatars (公開バケット)
    - users/
    - authors/
```

### 6.3 未実装（v2 検討）
- ウイルススキャン（ClamAV 等）
- 不適切画像検知（AWS Rekognition 等）
- 署名付き URL（プライベートコンテンツ用）

---

## 7. モニタリング・通知

### 7.1 現在の通知
- **チャネル**: 管理画面内通知（`Notification` モデル）
- **種類**:
  - 生成完了
  - 生成失敗
  - 予約公開完了
  - 画像生成失敗

### 7.2 未実装（v2 検討）
- メール通知
- Slack 連携
- 外部監視サービス（Datadog, Sentry 等）

---

## 8. アナリティクス整合性

### 8.1 Slug 変更対応
- `SlugHistory` テーブルで旧スラッグを記録
- 301 リダイレクトで SEO 価値を維持
- GA/GSC のデータは新 URL に自動的に引き継がれる（リダイレクト経由）

### 8.2 削除記事
- 410 Gone を返却
- GA/GSC からは自然に除外される

### 8.3 データ保持
- GA4/GSC のデータ保持期間は各サービスの設定に依存
- 本システムでは参照のみ、データ保存は行わない

---

## 環境変数一覧

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database
DATABASE_URL=

# Auth
NEXTAUTH_URL=http://localhost:3001
FRONTEND_URL=http://localhost:5173

# Encryption
ENCRYPTION_KEY=
ENCRYPTION_SALT=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```
