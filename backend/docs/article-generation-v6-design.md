# V6パイプライン設計書

## 設計思想

**情報バンクの体験談を深掘りし、自然な流れで価値ある記事を生成する**

- 体験談ベースで読者に寄り添う
- 監修者の専門的コメントで信頼性向上
- 必要に応じてエビデンスで補強
- 自然な流れでスクール紹介（押し売りしない）
- 再現性の高いシンプルな構成

---

## V5 → V6 改善点

| 項目 | V5 | V6 |
|------|----|----|
| 文字数 | 4,000-5,000文字 | **8,000-10,000文字** |
| 受講生の声 | 1件 | **2-3件（複数）** |
| 監修者 | blockquote1箇所 | **複数箇所でコメント** |
| 外部データ | Web検索のみ | **必要に応じて公的データ・学術文献** |
| スクール紹介 | なし | **体験談の延長で自然に紹介** |

---

## 記事の標準構成

```
┌─────────────────────────────────────────────────────────────┐
│                    記事構成（自然な流れ）                      │
└─────────────────────────────────────────────────────────────┘

1. 導入
   ├─ 読者の悩み・課題に共感
   └─ この記事で得られることを提示

2. 体験談の深掘り（メインコンテンツ）
   ├─ 【受講生の声①】メインの体験談を詳しく展開
   │   └─ きっかけ → 学び → 変化 → 今
   ├─ 【監修者コメント】専門家としての補足・解説
   ├─ 【受講生の声②】別の視点からの体験
   └─ 【受講生の声③】さらに別の体験（あれば）

3. エビデンス補強（必要に応じて）
   ├─ 公的機関データ（厚生労働省等）
   ├─ 学術研究・論文の引用
   └─ ※テーマに関連する場合のみ。無理に入れない

4. 実践的な情報
   ├─ 具体的な方法・ステップ
   ├─ よくある失敗と対策
   └─ 【監修者コメント】プロとしてのアドバイス

5. スクール紹介（自然な流れで）
   ├─ 「〇〇さんが学んだオレオヨガアカデミーでは...」
   ├─ 体験談の延長として紹介
   └─ 押し売り感のない情報提供

6. FAQ
   ├─ よくある質問 8-10問
   └─ 構造化データ対応

7. まとめ
   ├─ 要点の整理
   ├─ 【監修者の総括コメント】
   └─ 次のアクション提案

8. CTA
   └─ 資料請求・無料体験への自然な誘導
```

---

## 監修者コンテキストの活用

### 監修者情報

```typescript
interface SupervisorContext {
  name: string;           // 監修者名
  role: string;           // 役職（例：オレオヨガアカデミー代表）
  qualifications: string[]; // 資格（RYT500、E-RYT等）
  bio: string;            // 経歴・プロフィール
  imageUrl: string;       // 顔写真
}
```

### 監修者コメントの配置

| 配置場所 | 役割 |
|----------|------|
| 体験談セクション内 | 受講生の体験への専門家としての補足 |
| 実践情報セクション | プロとしての具体的アドバイス |
| まとめ | 読者へのメッセージ・総括 |

### 監修者コメントのHTML

```html
<blockquote class="supervisor-comment">
  <div class="comment-header">
    <img src="{imageUrl}" alt="{name}" class="supervisor-avatar" />
    <div class="supervisor-info">
      <span class="supervisor-name">{name}</span>
      <span class="supervisor-role">{role}</span>
    </div>
  </div>
  <p>「{コメント内容}」</p>
</blockquote>
```

---

## スクール紹介のルール

### 自然な導入例

```
❌ 悪い例（押し売り感）
「おすすめのスクールを紹介します。オレオヨガアカデミーは...」

✓ 良い例（自然な流れ）
「田中さんが学んだオレオヨガアカデミーでは、
 少人数制のクラスで一人ひとりに丁寧な指導が行われています。
 田中さんも『質問しやすい環境だった』と話しています。」
```

### 紹介できるスクール

- **オレオヨガアカデミー**
- **シークエンス**

※体験談の中で言及があるスクールを自然に紹介

---

## エビデンスの使い方

### 基本方針

- **必要な時だけ使う**（無理に入れない）
- テーマに関連する場合のみ
- 押し売り感のある「権威付け」は避ける

### 使うべきケース

| テーマ | エビデンス例 |
|--------|-------------|
| ヨガの健康効果 | 厚生労働省の運動指針、研究論文 |
| ストレス軽減 | 学術研究データ |
| キャリアチェンジ | 労働統計、転職市場データ |

### 使わなくていいケース

- 体験談が十分に説得力を持っている場合
- 個人的な成長・変化がテーマの場合
- エビデンスが見つからない場合

### 引用形式

```html
<p class="evidence-citation">
  ※厚生労働省「健康づくりのための身体活動基準2013」より
</p>
```

---

## データ収集フェーズ

### 1. 複数の受講生の声

```typescript
async function collectTestimonials(
  mainKnowledgeId: string,
  categoryId: string
): Promise<KnowledgeItem[]> {
  // メインの声
  const main = await getKnowledgeItem(mainKnowledgeId);

  // 同カテゴリから追加の声を取得（あれば）
  const additional = await prisma.knowledgeBank.findMany({
    where: {
      categoryId,
      type: 'voice',
      id: { not: mainKnowledgeId }
    },
    take: 2,
    orderBy: { createdAt: 'desc' }
  });

  return [main, ...additional];
}
```

### 2. 監修者情報

```typescript
async function getSupervisorContext(authorId: string): Promise<SupervisorContext> {
  const author = await prisma.authors.findUnique({
    where: { id: authorId }
  });

  return {
    name: author.name,
    role: author.role,
    qualifications: author.qualifications || [],
    bio: author.bio,
    imageUrl: author.imageUrl
  };
}
```

### 3. エビデンス検索（必要に応じて）

```typescript
async function searchEvidenceIfNeeded(
  topic: string,
  requiresEvidence: boolean
): Promise<SearchResult[]> {
  if (!requiresEvidence) {
    return [];
  }

  const queries = [
    `site:mhlw.go.jp ${topic}`,  // 厚生労働省
    `${topic} 研究 効果 論文`,   // 学術文献
  ];

  const results = [];
  for (const query of queries) {
    const data = await webSearch(query);
    results.push(...data);
  }
  return results;
}
```

---

## パイプラインフロー

```
┌─────────────────────────────────────────────────────────────┐
│                    V6 Pipeline Flow                         │
└─────────────────────────────────────────────────────────────┘

STEP 1: データ収集
        ├─ メインの受講生の声
        ├─ 追加の受講生の声（2件）
        ├─ 監修者情報
        └─ Web検索（テーマ関連情報）

STEP 2: タイトル生成
        └─ SEO最適化タイトル

STEP 3: 記事生成
        ├─ 導入（読者の悩みに共感）
        ├─ 体験談の深掘り + 監修者コメント
        ├─ エビデンス（必要に応じて）
        ├─ 実践情報 + 監修者コメント
        ├─ スクール紹介（自然な流れで）
        ├─ FAQ（8-10問）
        └─ まとめ + 監修者総括

STEP 4: 画像生成
        ├─ アイキャッチ
        └─ 本文内画像（2-3枚）

STEP 5: 後処理
        ├─ HTML整形
        ├─ CTA挿入
        └─ 関連記事挿入

STEP 6: 品質チェック
        └─ 基準を満たしているか確認
```

---

## 品質基準

| 項目 | 目標 |
|------|------|
| 総文字数 | **8,000-10,000文字** |
| H2見出し | 5-7個 |
| H3見出し | 10-15個 |
| 受講生の声 | 2-3件 |
| 監修者コメント | 2-3箇所 |
| FAQ | 8-10問 |
| CTA | あり |
| メタ情報 | 完備 |

### 品質チェック

```typescript
interface QualityCheck {
  charCount: boolean;       // 8,000文字以上
  testimonials: boolean;    // 2件以上
  supervisorComments: boolean; // 2箇所以上
  faq: boolean;             // 8問以上
  cta: boolean;             // CTAあり
  metaSeo: boolean;         // メタ情報完備
}
```

---

## 再現性の担保

### シンプルな構成

1. **体験談を深掘り** - 毎回同じアプローチ
2. **監修者コメント** - 決まった箇所に配置
3. **自然なスクール紹介** - 体験談の延長
4. **FAQ + CTA** - 固定要素

### プロンプトの標準化

```
【記事生成の指示】

1. 導入：読者の悩みに共感し、この記事で得られることを提示

2. 体験談の深掘り：
   - {testimonial1}の体験を詳しく展開
   - きっかけ → 学び → 変化 → 今 の流れで
   - {testimonial2}、{testimonial3}も織り交ぜる

3. 監修者コメント：
   - {supervisor.name}（{supervisor.role}）として専門的な補足
   - 2-3箇所に自然に配置

4. スクール紹介：
   - 「〇〇さんが学んだ{スクール名}では...」の形で自然に
   - 押し売り感を出さない

5. FAQ：8-10問

6. まとめ：監修者の総括コメントを含める
```

---

## 実装計画

### Phase 1: データ収集
- [ ] 複数受講生の声取得
- [ ] 監修者コンテキスト取得
- [ ] エビデンス検索（必要時）

### Phase 2: プロンプト作成
- [ ] 体験談深掘りプロンプト
- [ ] 監修者コメント生成指示
- [ ] 自然なスクール紹介指示

### Phase 3: 後処理
- [ ] 監修者コメントスタイル
- [ ] CTA挿入
- [ ] 品質チェック

### Phase 4: テスト
- [ ] 3記事生成してテスト
- [ ] 品質評価
- [ ] 調整
