# 記事生成パイプライン V4 設計書

## 概要

V3をベースに、以下の強化を行う：

1. **ホワイトデータ活用**: Web検索で権威あるデータ（統計・研究）を取得し、一次情報を補強
2. **LLMo最適化**: AI検索エンジン向けのメタデータを自動生成
3. **画像品質向上**: 記事内容に即した画像プロンプト生成
4. **構造化データ強化**: 目次・FAQ schema・Article schemaの自動生成

## 品質目標

| 評価項目 | V3 | V4目標 |
|---------|-----|--------|
| SEO対策 | 72点 | 95点 |
| LLM対策 | 45点 | 95点 |
| 一次情報活用 | 68点 | 90点 |
| 著者の色 | 82点 | 95点 |
| 画像品質 | 58点 | 90点 |
| **総合** | **65点** | **93点** |

---

## フロー概要

```
1. 受講生の声を選択（V3同様）
   ↓
2. テーマ・キーワード候補を抽出（V3同様）
   ↓
3. キーワードのフィルタリング（V3同様）
   ↓
4. ★ホワイトデータ取得（NEW）
   - Web検索で関連する統計・研究データを取得
   - 信頼ドメイン・数値データ・URL必須でフィルタ
   ↓
5. 記事生成（強化）
   - 一次情報 + ホワイトデータを統合
   - 目次を自動生成
   - 画像プロンプトを記事内容から生成
   ↓
6. ★LLMo最適化（NEW）
   - llmoShortSummary生成
   - llmoKeyTakeaways生成
   - schemaJsonLd生成（Article + FAQ）
   ↓
7. メタ情報・画像生成（強化）
   ↓
8. 下書き保存
```

---

## 新規ステージ詳細

### Step 4: ホワイトデータ取得

**目的**: 一次情報（体験談）では得られない客観的なデータで記事の権威性を向上

**入力**: 選択されたキーワード

**処理**:

1. 複数の検索クエリを生成
```typescript
const queries = [
  `${keyword} 統計 調査 ${currentYear}`,
  `${keyword} 市場規模 日本`,
  `ヨガ 資格 研究 効果`,
  `${keyword} 取得率 データ`
];
```

2. Web検索を実行

3. 品質フィルタリング
```typescript
const qualityFilter = {
  // 信頼できるドメイン
  trustedDomains: [
    '.gov', '.go.jp',           // 政府機関
    '.ac.jp', '.edu',           // 学術機関
    'yogaalliance.org',         // 業界団体
    'mhlw.go.jp',               // 厚生労働省
    'statista.com',             // 統計サイト
    'prtimes.jp',               // プレスリリース
  ],

  // 必須条件
  requirements: {
    hasNumericData: true,       // 数値データがある
    hasSourceUrl: true,         // URLが検証可能
    publishedAfter: 2020,       // 2020年以降
  },

  // 除外条件
  exclude: [
    '個人ブログ',
    'SNS投稿',
    'ソース不明',
  ]
};
```

**出力**: 検証済みホワイトデータ（3〜5件）

```typescript
interface WhiteDataItem {
  content: string;      // データ内容（例: "RYT資格取得者の78%が..."）
  sourceName: string;   // ソース名（例: "全米ヨガアライアンス"）
  sourceUrl: string;    // 検証可能なURL
  publishedYear: number;// 発行年
  dataType: 'statistics' | 'research' | 'survey' | 'report';
}
```

**プロンプト（品質制御）**:

```
【検索結果から採用するデータの基準】

必須条件（全て満たすこと）:
1. 信頼できる情報源である（政府、学術機関、業界団体、大手調査会社）
2. 具体的な数値データがある（○○%、○○人、○○億円など）
3. 元のURLが存在し検証可能である
4. 2020年以降に発行されたデータである

除外条件:
- 個人ブログ、SNS投稿からの情報
- 「〜と言われている」などソース不明の情報
- 数値データのない曖昧な記述

出力形式:
各データについて以下を必ず記載:
- データ内容: 具体的な数値と文脈
- ソース名: 組織名・レポート名
- URL: 完全なURL
- 発行年: YYYY年

採用基準を満たすデータがない場合は「該当なし」と回答すること。
品質を落としてまで無理にデータを採用しないこと。
```

---

### Step 5: 記事生成（強化版）

**入力**:
- メインの受講生の声
- 選択されたキーワード
- 監修者情報
- 補助的な他の受講生の声（2〜3件）
- コンバージョン情報
- **ホワイトデータ（NEW）**

**記事構成の方針（V4）**:

```
【記事構成】

1. 目次（自動生成）
   - 記事内の全H2/H3見出しをリスト化
   - アンカーリンク付き

2. この記事のポイント（NEW）
   - 3〜5個の箇条書きサマリー
   - LLMに引用されやすい形式

3. リード文
   - 読者の悩み・共感ポイント
   - この記事で得られること

4. メインストーリー（受講生の体験）
   - きっかけ・動機
   - 受講中の体験・気づき
   - 成果・変化
   - ★ホワイトデータで補強（例: 「実際、〇〇調査によると...」）

5. 監修者の視点
   - この体験に対するコメント
   - 専門家としての補足
   - よく使うフレーズを自然に入れる

6. 他の受講生の声（補助）
   - 「同じような体験をした方も...」

7. 実践的な情報
   - キーワードに関連するハウツー要素
   - ★関連する統計データを引用

8. よくある質問（FAQ）
   - 構造化データ対応
   - LLMO対策

9. まとめ・CTA
   - 体験談のポイント整理
   - コンバージョンへの誘導

10. 参考文献（NEW）
    - ホワイトデータの出典をリスト化
    - URLリンク付き
```

**ホワイトデータの挿入ルール**:

```
【ホワイトデータ挿入の原則】

1. 自然な文脈で挿入
   NG: 「統計によると78%です。」（唐突）
   OK: 「M.Kさんの体験は特別ではありません。全米ヨガアライアンスの
        2023年調査によると、RYT資格取得者の78%が同様の変化を
        実感しています。」

2. 出典を明記
   OK: 「（出典: 全米ヨガアライアンス 2023年調査）」
   OK: リンク付き「[出典](https://example.com)」

3. 体験談を否定しない
   NG: 「しかし統計では違う結果が...」
   OK: 「この体験を裏付けるように、調査でも...」

4. 過度に使用しない
   - 記事全体で3〜5箇所程度
   - 体験談が主役、データは補強役
```

**画像プロンプト生成（強化）**:

```typescript
// 記事内容から画像プロンプトを動的生成
function generateImagePrompts(article: Article): ImagePrompt[] {
  return [
    {
      position: 'cover',
      prompt: `水彩画風イラスト、${article.mainTheme}をテーマに、
               ${article.protagonist}（${article.protagonistAge}代${article.protagonistGender}）が
               ${article.mainAction}している様子、
               明るく温かみのある雰囲気、ヨガスタジオ背景`,
      alt: `${article.title}のカバー画像：${article.mainTheme}のイメージ`
    },
    {
      position: 'body_1',
      prompt: `水彩画風イラスト、${article.sections[0].theme}、
               講師と生徒が一緒にヨガを楽しむ様子`,
      alt: `${article.sections[0].title}のイメージ画像`
    },
    {
      position: 'body_2',
      prompt: `水彩画風イラスト、${article.conclusion}、
               達成感と笑顔、明るい未来を感じさせる`,
      alt: `資格取得後の変化をイメージした画像`
    }
  ];
}
```

---

### Step 6: LLMo最適化（NEW）

**目的**: AI検索エンジン（Perplexity、Google SGE、Bing Chat等）に引用されやすい形式でメタデータを生成

**入力**: 生成された記事

**処理**:

1. **llmoShortSummary生成**
```typescript
// 100文字以内の要約
// AIが「この記事は〇〇について書かれています」と説明する際に使用
const shortSummary = await generateWithAI(`
  以下の記事を100文字以内で要約してください。
  - 誰の体験談か
  - 何をしたか
  - どんな結果・変化があったか
  を簡潔に含めること。
`);
```

2. **llmoKeyTakeaways生成**
```typescript
// 重要ポイント5つ
// AIが「この記事のポイントは...」と回答する際に使用
const keyTakeaways = await generateWithAI(`
  以下の記事から、読者にとって最も価値のある情報を
  5つの箇条書きで抽出してください。
  - 各項目は30文字以内
  - 具体的で実用的な情報
  - 数値データがあれば優先的に含める
`);
```

3. **schemaJsonLd生成**
```typescript
// Article + FAQPage 構造化データ
const schemaJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": article.title,
  "description": article.metaDescription,
  "author": {
    "@type": "Person",
    "name": author.name,
    "jobTitle": author.role,
    "description": author.bio
  },
  "datePublished": article.publishedAt,
  "dateModified": article.updatedAt,
  "publisher": {
    "@type": "Organization",
    "name": "RADIANCE",
    "logo": { ... }
  },
  "mainEntity": {
    "@type": "FAQPage",
    "mainEntity": article.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
};
```

**出力**:
```typescript
interface LlmoData {
  llmoShortSummary: string;      // 100文字以内の要約
  llmoKeyTakeaways: string[];    // 5つの重要ポイント
  schemaJsonLd: object;          // 構造化データ
}
```

---

## 著者スタイル検証

記事生成後、著者の設定との整合性を検証：

```typescript
function validateAuthorStyle(content: string, author: Author): ValidationResult {
  const issues: string[] = [];

  // 1. 避けるべき言葉のチェック
  for (const word of author.avoidWords || []) {
    if (content.includes(word)) {
      issues.push(`著者が避ける表現「${word}」が含まれています`);
    }
  }

  // 2. writingStyleのチェック
  if (author.writingStyle === 'formal') {
    const casualPatterns = [/だよ[。！]/, /じゃない[？?]/, /ね[。！]/];
    for (const pattern of casualPatterns) {
      if (pattern.test(content)) {
        issues.push(`formalスタイルにカジュアルな表現が含まれています`);
      }
    }
  }

  // 3. signaturePhrasesの使用確認
  const usedPhrases = author.signaturePhrases?.filter(p => content.includes(p)) || [];
  if (usedPhrases.length === 0) {
    issues.push(`著者の特徴的なフレーズが使用されていません`);
  }

  return { valid: issues.length === 0, issues };
}
```

---

## データベース変更

### articles テーブル（既存フィールド活用）

```sql
-- 既にあるが未使用のフィールドを活用
llmoShortSummary  TEXT      -- LLMo用要約
llmoKeyTakeaways  JSONB     -- LLMo用キーポイント
schemaJsonLd      JSONB     -- 構造化データ
```

### 新規フィールド（必要に応じて）

```sql
-- article_white_data テーブル（オプション：履歴管理用）
CREATE TABLE article_white_data (
  id            TEXT PRIMARY KEY,
  articleId     TEXT REFERENCES articles(id),
  content       TEXT,
  sourceName    TEXT,
  sourceUrl     TEXT,
  publishedYear INT,
  createdAt     TIMESTAMP DEFAULT NOW()
);
```

---

## 実装優先度

| 優先度 | 施策 | 効果 | 実装難易度 |
|-------|------|------|-----------|
| **1** | LLMo生成ステージ | +30点 | 中 |
| **2** | ホワイトデータ取得 | +20点 | 中 |
| **3** | 画像プロンプト改善 | +15点 | 低 |
| **4** | 目次自動生成 | +5点 | 低 |
| **5** | 構造化データ出力 | +5点 | 低 |
| **6** | 著者スタイル検証 | +3点 | 低 |

---

## 期待される効果

1. **E-E-A-T向上**: 権威あるデータ引用で専門性・信頼性アップ
2. **AI検索対応**: LLMoデータでPerplexity/SGE等に引用されやすく
3. **差別化**: 一次情報 + ホワイトデータの組み合わせは競合に真似できない
4. **SEO強化**: 構造化データでリッチスニペット獲得
5. **品質安定**: プロンプト制御で記事品質のばらつき軽減

---

## 参考: V3からの変更点まとめ

| 項目 | V3 | V4 |
|-----|-----|-----|
| データソース | 一次情報のみ | 一次情報 + ホワイトデータ |
| LLMo対応 | なし | llmoShortSummary, keyTakeaways, schema |
| 画像生成 | 汎用プロンプト | 記事内容に即した動的プロンプト |
| 構造化データ | なし | Article + FAQ schema |
| 目次 | なし | 自動生成 |
| 品質検証 | なし | 著者スタイル検証 |
| 参考文献 | なし | ホワイトデータ出典リスト |
