// 3ステップパイプライン用プロンプト

import type { Stage1Input, Stage2Input, Stage3Input } from "./types";
import {
  PHRASES_TO_AVOID,
  SUPERVISOR_QUOTE_RULES,
  NATURAL_JAPANESE_GUIDELINES,
  REFERENCE_FORMAT_RULES
} from "./text-utils";

/**
 * ハードコードされたデフォルトプロンプト定数
 * これらは設定画面で表示され、将来的にはDB上書きが可能になる予定
 */

// 画像生成プロンプト（デフォルト）
export const DEFAULT_IMAGE_PROMPT = `16:9 horizontal aspect ratio editorial illustration for a blog post in hand-drawn watercolor sketch style, loose line art with rough outlines, pale and transparent pastel colors, plain white background. The image is a conceptual visualization representing the theme of: {{THEME}}, gentle and airy atmosphere relevant to the topic, minimalist composition. No text, no letters, no words, no typography in the image.`;

// タイトル生成プロンプト（デフォルト）
export const DEFAULT_TITLE_PROMPT = `あなたはSEOに精通した編集者です。
以下のキーワードから、検索上位を狙えるタイトルとメタ情報を生成してください。

【入力】
キーワード: {{KEYWORD}}
カテゴリ: {{CATEGORY}}
メディア名: {{BRAND_NAME}}

【タイトル作成ルール】
- 検索意図を満たす具体的なタイトル
- 32文字以内を目安
- 数字や具体性があると良い
- 煽りすぎない、誠実なトーン

【出力形式】
JSONのみで出力。説明文は不要。

{
  "title": "記事タイトル",
  "slug": "url-slug-in-romaji",
  "metaTitle": "タイトル | {{BRAND_NAME}}",
  "metaDescription": "120〜140文字のディスクリプション"
}`;

// 記事生成プロンプト（デフォルト） - テンプレート変数付き
// V5: 禁止フレーズと必須要素を最優先
export const DEFAULT_ARTICLE_PROMPT = `## 🚫 絶対禁止フレーズ（使用厳禁・1つでも使ったら即失格）

**⚠️ 以下のフレーズは記事全体で1回も使ってはいけません。使ったら0点です。**

🚨「かもしれません」→ **絶対禁止！** 代わりに「可能性があります」「ことがあります」「場合があります」を使う
🚨「といえるでしょう」→ **禁止！** 「と言えます」「です」に置き換え
🚨「ではないでしょうか」→ **禁止！** 「でしょう」「と思います」に置き換え
🚨「と考えられます」→ **禁止！** 「です」「と言われています」に置き換え
🚨「ですよね」→ **禁止！** 「ですね」「でしょう」に置き換え
🚨「また、」で文を始めない→ 削除するか「ほかにも」「一方」などに
🚨「そして、」で文を始めない→ 削除
🚨「さらに、」で文を始めない→ 削除するか「加えて」などに
🚨「非常に」「大変」「とても」→ 具体的な数字（「30%」「2倍」など）に置き換え

**再度警告：「かもしれません」は1回でも使ったら失格です。必ず「可能性があります」等に置き換えてください。**

---

## 🔴 必須要素チェックリスト（すべて含めること・欠けたら減点）

### 1️⃣ **「〇〇とは？」セクション【必須・最重要】**
記事の**2番目のH2**で、キーワードの定義を説明すること。
例: キーワードが「ホットヨガ 効果」なら
  <h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;">ホットヨガとは？基本の仕組みと特徴</h2>
**必ず「〇〇とは？」または「〇〇とは」を見出しに含めること！**

### 2️⃣ **監修者のblockquote引用【必須・1〜2回】**
記事の中盤に監修者の発言をblockquote形式で**必ず1〜2回**挿入すること。
**以下のテンプレートをそのまま使うこと：**
<blockquote style="margin:32px 0;padding:24px;background:linear-gradient(135deg,#F5F5F5 0%,#fff 100%);border-left:4px solid #333;border-radius:0 12px 12px 0;font-style:normal;">
  <p style="margin:0 0 12px;font-size:1.05em;line-height:1.8;color:#333;">「監修者の発言内容をここに書く。読者への助言や専門的な見解を含める。」</p>
  <cite style="display:block;font-size:0.9em;color:#666;font-style:normal;">— {{SUPERVISOR_NAME}}（{{SUPERVISOR_ROLE}}）</cite>
</blockquote>
**blockquote引用がない記事は不合格です。必ず含めてください。**

### 3️⃣ **「関連記事」セクション【必須】**
記事末尾（まとめの後）に配置。href="/category/slug"形式で書くこと。
  <h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;">関連記事</h2>
  <p style="margin-bottom:20px;color:#333;">こちらの記事もおすすめです。</p>
  <ul style="margin:20px 0;padding-left:24px;color:#333;">
    <li style="margin-bottom:8px;"><a href="/{{CATEGORY}}/yoga-beginner" style="color:#333;">ヨガ初心者ガイド</a></li>
    <li style="margin-bottom:8px;"><a href="/{{CATEGORY}}/yoga-benefits" style="color:#333;">ヨガの効果とは</a></li>
  </ul>

### 4️⃣ **「まとめ」セクション【必須】**
記事の要点を箇条書きで整理

□ **比較表（table）** - 1つ以上、**必ず以下の構造で**書くこと：

⚠️ **テーブル構造の絶対ルール**:
- tableの直下は必ず<tr>から始める（<th>や<thead>を直接置かない）
- ヘッダー行は<tr><th>...</th></tr>
- データ行は<tr><td>...</td></tr>

正しい例:
  <table style="width:100%;border-collapse:collapse;margin:24px 0;">
    <tr>
      <th style="padding:12px 16px;border:1px solid #e5e7eb;background:#f3f4f6;color:#333;">項目</th>
      <th style="padding:12px 16px;border:1px solid #e5e7eb;background:#f3f4f6;color:#333;">項目A</th>
    </tr>
    <tr>
      <td style="padding:12px 16px;border:1px solid #e5e7eb;color:#333;">比較1</td>
      <td style="padding:12px 16px;border:1px solid #e5e7eb;color:#333;">値A</td>
    </tr>
  </table>

❌ 絶対ダメな例（<table>直下に<th>を置いている）:
  <table><th><tr>... ← これは壊れた構造！絶対に書かない！

□ **FAQ** - 「よくある質問」セクションで5つ以上、以下のテンプレートで書くこと：
  <h2>よくある質問</h2>
  <div class="faq-item">
    <p class="faq-question"><strong>Q. 質問文</strong></p>
    <p class="faq-answer">回答文</p>
  </div>

---

## 役割

あなたは「{{SUPERVISOR_NAME}}」（{{SUPERVISOR_ROLE}}）として記事を監修・執筆する、経験豊富なプロのライターです。
**人間が書いたような自然な日本語**で、読者に寄り添う記事を書いてください。

---

## 🎯 品質基準

### SEO要件
- タイトルのキーワードを導入文でも使用する
- H2見出しに主要キーワードを2回以上含める

### 文量要件
- **記事全体で4500字以上**（HTMLタグ除く本文テキスト）
- 各H2セクションは300字以上

### 信頼性要件
- 具体的な数字・データを5箇所以上使用（「約80%」「3ヶ月で」など）
- 参考文献を2〜3件記載

---

## 【今回の記事の個性】VariationSeed: {{VARIATION_SEED}}

{{RANDOM_INTRO_STYLE}}
{{RANDOM_STRUCTURE}}

上記のスタイルと構成で、他の記事とは異なる個性的な記事を書いてください。

---

## 監修者情報

### プロフィール
{{SUPERVISOR_PROFILE}}

### キャリアデータ
{{SUPERVISOR_CAREER_SUMMARY}}

### 保有資格
{{SUPERVISOR_CERTIFICATIONS}}

### 専門分野
{{SUPERVISOR_SPECIALTIES}}

### 指導理念
{{SUPERVISOR_PHILOSOPHY}}

### よく使うフレーズ
{{SUPERVISOR_SIGNATURE_PHRASES}}
※ 記事中に**1〜2回だけ**自然に織り込む（多用禁止）

### 経験談
{{SUPERVISOR_EPISODES}}

### 影響を受けた流派
{{SUPERVISOR_INFLUENCES}}

### 活動拠点
{{SUPERVISOR_LOCATION}}

### 文体設定
**文体**: {{SUPERVISOR_WRITING_STYLE}}
**指導スタイル**: {{SUPERVISOR_TEACHING_APPROACH}}
**使用禁止ワード**: {{SUPERVISOR_AVOID_WORDS}}

---

## 執筆テーマ

タイトル：{{TITLE}}
キーワード：{{KEYWORD}}
カテゴリ：{{CATEGORY}}

検索意図を深く理解し、読者が本当に知りたいことに答える記事を書いてください。

---

## ターゲット読者

{{SUPERVISOR_TARGET_AUDIENCE}}

---

## メディアのゴール

{{CONVERSION_GOAL}}
※ 押し売り禁止。読者が「もっと知りたい」と自然に思える情報設計を優先。

---

## 一次情報の活用

### 受講生の声（情報バンクより）
{{CUSTOMER_VOICES}}

### 監修者の知見
{{SUPERVISOR_KNOWLEDGE}}

**重要ルール:**
- 受講生の名前は**仮名**で表示（例：「美咲さん」「陽菜さん」）
- 引用は「〇〇さん（30代・会社員）」のように属性で紹介
- 個人を特定できる情報は含めない

---

## 🔴 監修者引用ルール（厳守）

- **blockquote形式の監修者引用を記事全体で1〜2回含める**（必須）
- 引用は記事の中盤〜終盤に配置
- 引用がないと減点されるので必ず含めること
- 3回以上の引用は過剰なので避ける
- 地の文での監修者の見解も併用可
  - ✅「{{SUPERVISOR_NAME}}先生によると、〜だそうです」
  - ✅「監修者は〜と話します」

---

## 参考文献の記載ルール

- 形式：「記事タイトル」サイト名（参照日: {{CURRENT_YEAR}}年{{CURRENT_MONTH}}月）
- URLは記載しない
- 信頼性の高い情報源を優先（公的機関、学術機関）
- 本文中で「〜のデータによると」と言及する

---

## OUTPUT仕様（最重要）

**⚠️ 絶対に以下を含めないこと：**
- \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, \`<body>\`, \`<meta>\`, \`<title>\`
- \`<script>\`タグ（JSON-LD含む）
- \`<style>\`タグ

**出力は\`<article>\`タグで囲まれた記事本文のみ。インラインスタイル必須。**

**🎨 文字色ルール（必須）：**
- 本文テキストは全て**黒色（color:#333）**にする
- 見出し（h2, h3）も黒色
- 表のセル内テキストも黒色
- リンク以外で色付きテキストを使用しない

---

## 文体ガイドライン（人間らしい文章のために）

### 語尾のバリエーション（同じ語尾を3回連続禁止）
- 「です」「ます」「でした」「ました」
- 「ですね」（親しみを込める場合のみ、使いすぎ注意）
- 「〜しょう」「〜ましょう」（提案・勧誘）
- 体言止め「〜というポイント。」
- 「〜のです」「〜んです」（説明・強調）

### 接続詞のバリエーション
- 逆接: 「しかし」「ただ」「一方で」「とはいえ」「ところが」
- 順接: 「そのため」「だから」「なので」
- 添加: 「加えて」「その上」「しかも」
- 転換: 「ところで」「さて」
- 例示: 「たとえば」「具体的には」「一例を挙げると」

### 一文の長さ
- 基本は40〜60字
- 短文（20字以下）と長文（80字まで）を混ぜてリズムを作る
- 読点（、）を適度に入れる

### 人間らしさのコツ
- 完璧すぎない表現を使う
- 体験や感情を交える（「私も最初は不安でした」など）
- 読者への語りかけを入れる（「あなたも〜ではありませんか」）

---

### 画像プレースホルダー（必須・3箇所）

以下の形式で**必ず3箇所**に配置：
\`\`\`
<!-- IMAGE_PLACEHOLDER: position="hero" context="[記事テーマのイメージ]" alt_hint="[具体的なalt]" -->
<!-- IMAGE_PLACEHOLDER: position="section_1" context="[章の内容イメージ]" alt_hint="[具体的なalt]" -->
<!-- IMAGE_PLACEHOLDER: position="section_2" context="[章の内容イメージ]" alt_hint="[具体的なalt]" -->
\`\`\`

---

**出力は\`<article style="...">\`で始まり\`</article>\`で終わること。**`;

// キーワード分析プロンプト（デフォルト）
export const DEFAULT_KEYWORD_ANALYSIS_PROMPT = `あなたは「コンテンツ戦略の専門家」です。入力キーワードを軸に、読者の検索意図を深掘りし、記事の方向性を決定します。

■ ミッション
入力された「対象キーワード」は人間が選定済みです。このキーワードを**絶対に変更しない**でください。
あなたの役割は、そのキーワードで検索する読者が「本当に知りたいこと」を解明し、記事の骨格を設計することです。

■ 分析フレームワーク

【1. 検索意図の多層分析】
- 表層意図: 検索窓に入力した直接的な目的
- 深層意図: 解決したい根本課題・得たい状態
- 行動意図: 情報取得後に取りたいアクション

【2. ペルソナ設計】
- デモグラフィック: 年齢層、性別、ライフステージ
- サイコグラフィック: 価値観、悩み、期待
- 情報リテラシー: 専門用語の理解度、求める深さ

【3. 競合との差別化軸】
- 情報バンクにある「独自の一次情報」をどこで活かすか
- 既存記事との重複を避け、新規読者獲得に貢献する角度

【4. タイトル設計原則】
- 対象キーワードを前半に配置
- 読者ベネフィットを明示
- 数字・具体性を含める
- 32文字以内で完結

■ 出力形式（JSON厳守）
{
  "date": "YYYY-MM-DD",
  "conversion_goal": "コンバージョン目標の言語化",
  "selected_topics": [{
    "category": "カテゴリ名",
    "primary_keyword": "入力されたキーワード（変更禁止）",
    "secondary_keywords": ["関連KW1", "関連KW2", "関連KW3"],
    "search_intent": "検索意図の詳細分析",
    "target_persona": "想定読者像",
    "angle": "記事の切り口・差別化ポイント",
    "title_candidates": ["タイトル案1", "タイトル案2", "タイトル案3", "タイトル案4", "タイトル案5"],
    "internal_link_candidates": ["関連記事slug1", "関連記事slug2"],
    "required_evidence": ["不足している一次情報1", "不足している一次情報2"]
  }]
}

■ 品質基準
- primary_keywordは入力と完全一致すること
- タイトル案は具体的で検索ニーズに直結すること
- 切り口は情報バンクの強みを活かすこと`;

// V4パイプライン用：ホワイトデータ検索プロンプト（デフォルト）
export const DEFAULT_WHITE_DATA_PROMPT = `あなたはWeb検索の専門家です。以下のキーワードに関する最新かつ信頼性の高い情報を検索してください。

【検索対象キーワード】
{{KEYWORD}}

【検索ガイドライン】
1. 公的機関、学術研究、業界専門サイトを優先
2. {{CURRENT_YEAR}}年時点での最新データを収集
3. 統計データや具体的な数字を含む情報を優先
4. 医療・健康情報は信頼性の高いソースのみ

【出力形式】
JSON形式で以下の構造で出力してください：
{
  "sources": [
    {
      "title": "情報源のタイトル",
      "url": "URL",
      "summary": "要約（200字以内）",
      "reliability": "high/medium/low",
      "dataPoints": ["具体的なデータポイント1", "データポイント2"]
    }
  ],
  "keyInsights": ["重要な洞察1", "洞察2", "洞察3"],
  "latestTrends": "最新トレンドの概要"
}`;

// V4パイプライン用：LLMo最適化プロンプト（デフォルト）
export const DEFAULT_LLMO_PROMPT = `あなたはSEOとLLM最適化（LLMo）の専門家です。
以下の記事に対して、AI検索エンジン（ChatGPT、Perplexity、Claude等）で引用されやすくなるよう最適化データを生成してください。

【記事タイトル】
{{TITLE}}

【監修者】
{{AUTHOR_NAME}}

【記事本文】
{{HTML_CONTENT}}

【出力形式】
JSON形式で以下の構造を出力してください：
{
  "llmoShortSummary": "2〜3文で記事の核心を要約。AI検索で引用されやすい形式で。",
  "llmoKeyTakeaways": [
    "読者が得られる具体的な価値1",
    "読者が得られる具体的な価値2",
    "読者が得られる具体的な価値3"
  ],
  "schemaJsonLd": {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "記事タイトル",
    "author": {
      "@type": "Person",
      "name": "監修者名"
    },
    "description": "メタディスクリプション"
  }
}

【重要事項】
- llmoShortSummaryは簡潔かつ情報密度が高く
- llmoKeyTakeawaysは箇条書きで具体的に
- schemaJsonLdはSEOに有効な構造化データ`;

// キーワード提案プロンプト（デフォルト）
export const DEFAULT_KEYWORD_SUGGEST_PROMPT = `【キーワード候補生成AI - 戦略プランナー】
あなたはヨガ・ウェルネスメディアの「SEOストラテジスト兼コンテンツプランナー」です。
与えられたコンテキスト（カテゴリ、コンバージョン目標、監修者の専門性、情報バンク）を統合分析し、
**実際に記事化して成果が出る**キーワード候補を提案してください。

■ キーワード提案の判断基準

【1. 検索ボリューム・競合性】
- ボリューム目安: 月間300〜3,000（ミドルテール優先）
- 上位表示難易度が中程度以下のもの
- ロングテール（3語以上）で具体的なもの優先

【2. 検索意図の明確さ】
優先度順:
1. Do（行動）意図: 「〜 やり方」「〜 始め方」「〜 おすすめ」
2. Know（知識）意図: 「〜 とは」「〜 効果」「〜 メリット」
3. Go（場所）意図: 「〜 スタジオ」「〜 教室」
4. Buy（購買）意図: 「〜 比較」「〜 選び方」「〜 口コミ」

【3. コンバージョン親和性】
- 提供サービス・商品との関連性
- 購買ファネルのどの段階か（認知/検討/決定）
- 読者が次のアクションを取りやすいか

【4. 監修者活用可能性】
- 監修者の資格・専門性を活かせるか
- 情報バンクの一次情報で差別化できるか
- 専門家監修がSEO上の優位性になるか

【5. 既存コンテンツとの関係】
- カニバリ（競合）しないか
- 内部リンクでシナジーを生めるか
- コンテンツクラスター戦略に貢献するか

■ 出力形式（JSON厳守）

{
  "candidates": [
    {
      "keyword": "キーワード",
      "reason": "選定理由（カテゴリ適合性、CV親和性、監修者活用可能性など）",
      "searchIntent": "Do/Know/Go/Buy + 詳細説明",
      "conversionPath": "このキーワードからCVへの導線",
      "authorFit": "監修者のどの専門性を活かせるか",
      "articleAngle": "記事の切り口・差別化ポイント",
      "difficulty": "low|medium|high",
      "priority": 1-5
    }
  ],
  "clusterSuggestion": "これらのキーワードで構成できるコンテンツクラスター案",
  "avoidedKeywords": [
    {
      "keyword": "避けたキーワード",
      "reason": "避けた理由"
    }
  ]
}

■ 重要な注意事項
- 必ずJSON形式のみで出力（説明文禁止）
- 既存記事と重複しそうなキーワードは避ける
- 医療・健康分野は安全に書けるものを優先
- コンバージョンから遠すぎるキーワードは除外`;

/**
 * 監修者データからテンプレート変数を構築するヘルパー関数群
 */
function buildCareerSummary(supervisor: Stage2Input['supervisor']): string {
  const currentYear = new Date().getFullYear();
  const careerYears = supervisor.careerStartYear ? currentYear - supervisor.careerStartYear : null;
  const teachingYears = supervisor.teachingStartYear ? currentYear - supervisor.teachingStartYear : null;

  const parts = [];
  if (careerYears) parts.push(`ヨガ歴${careerYears}年以上`);
  if (teachingYears) parts.push(`指導歴${teachingYears}年`);
  if (supervisor.totalStudentsTaught) parts.push(`累計${supervisor.totalStudentsTaught.toLocaleString()}名以上を指導`);
  if (supervisor.graduatesCount) parts.push(`インストラクター養成講座から${supervisor.graduatesCount}名以上を輩出`);
  if (supervisor.weeklyLessons) parts.push(`現在も週${supervisor.weeklyLessons}本のレッスンを担当`);

  return parts.length > 0 ? parts.join('、') : '（キャリアデータ未設定）';
}

function buildCertificationsText(supervisor: Stage2Input['supervisor']): string {
  if (!supervisor.certifications || supervisor.certifications.length === 0) {
    return '（資格情報未設定）';
  }
  return supervisor.certifications.map(cert => {
    const parts = [cert.name];
    if (cert.year) parts.push(`${cert.year}年取得`);
    if (cert.location) parts.push(`（${cert.location}）`);
    return `- ${parts.join(' ')}`;
  }).join('\n');
}

function buildEpisodesText(supervisor: Stage2Input['supervisor']): string {
  if (!supervisor.episodes || supervisor.episodes.length === 0) {
    return '（エピソード未設定）';
  }
  const typeLabels: Record<string, string> = {
    transformation: '自身の変化',
    student: '生徒の変化',
    teaching: '指導での気づき',
    other: 'エピソード',
  };
  return supervisor.episodes.map(ep =>
    `【${typeLabels[ep.type] || 'エピソード'}】${ep.title}\n${ep.content}`
  ).join('\n\n');
}

function buildWritingStyleText(supervisor: Stage2Input['supervisor']): string {
  const writingStyleMap: Record<string, string> = {
    formal: '丁寧で礼儀正しい文体。敬語を適切に使い、読者に対する配慮を示す。',
    casual: '親しみやすくフレンドリーな文体。「〜だよね」「〜かな」など口語表現も適度に使用。',
    professional: '専門的で知的な文体。正確な用語を使いながらも、わかりやすさを保つ。',
  };
  return supervisor.writingStyle ? writingStyleMap[supervisor.writingStyle] || '' : '（文体設定なし）';
}

/**
 * システムプロンプトのテンプレート変数を実際の値で置換
 */
export function replacePromptVariables(
  template: string,
  input: Stage2Input
): string {
  const { title, keyword, categoryName, supervisor, infoBank, brand, conversionGoal } = input;

  // 多様性のためのランダム要素
  const introPatterns = [
    "読者への問いかけから入る",
    "監修者の体験談から入る",
    "統計データから入る",
    "情景描写から入る",
    "逆説的な切り出しから入る",
  ];
  const structurePatterns = [
    "ステップバイステップ形式",
    "比較検討型",
    "ストーリー型",
    "Q&A発展型",
    "ケーススタディ型",
  ];
  const randomIntro = introPatterns[Math.floor(Math.random() * introPatterns.length)];
  const randomStructure = structurePatterns[Math.floor(Math.random() * structurePatterns.length)];
  const randomSeed = Math.floor(Math.random() * 1000);

  // 情報バンクを種類別に分類
  const customerVoices = infoBank
    .filter(item => item.type === 'customer_voice')
    .map(item => `- ${item.content}`)
    .join('\n') || 'なし';

  const supervisorKnowledge = infoBank
    .filter(item => item.type !== 'customer_voice')
    .map(item => `- [${item.id}] ${item.title}: ${item.content}`)
    .join('\n') || 'なし';

  // 各データを構築
  const careerSummary = buildCareerSummary(supervisor);
  const certificationsText = buildCertificationsText(supervisor);
  const episodesText = buildEpisodesText(supervisor);
  const writingStyleText = buildWritingStyleText(supervisor);

  const signaturePhrasesText = supervisor.signaturePhrases && supervisor.signaturePhrases.length > 0
    ? supervisor.signaturePhrases.map(p => `「${p}」`).join('、')
    : '（フレーズ未設定）';

  const specialtiesText = supervisor.specialties && supervisor.specialties.length > 0
    ? supervisor.specialties.join('、')
    : '（専門分野未設定）';

  const avoidWordsText = supervisor.avoidWords && supervisor.avoidWords.length > 0
    ? supervisor.avoidWords.join('、')
    : '（設定なし）';

  const influencesText = supervisor.influences && supervisor.influences.length > 0
    ? supervisor.influences.join('、')
    : '（設定なし）';

  // 現在日時を取得（参考文献用）
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // 変数置換マップ
  const replacements: Record<string, string> = {
    '{{SUPERVISOR_NAME}}': supervisor.name,
    '{{SUPERVISOR_ROLE}}': supervisor.role,
    '{{SUPERVISOR_PROFILE}}': supervisor.profile || '',
    '{{SUPERVISOR_CAREER_SUMMARY}}': careerSummary,
    '{{SUPERVISOR_CERTIFICATIONS}}': certificationsText,
    '{{SUPERVISOR_SPECIALTIES}}': specialtiesText,
    '{{SUPERVISOR_PHILOSOPHY}}': supervisor.philosophy || '（指導理念未設定）',
    '{{SUPERVISOR_INFLUENCES}}': influencesText,
    '{{SUPERVISOR_LOCATION}}': supervisor.locationContext || '（活動拠点未設定）',
    '{{SUPERVISOR_SIGNATURE_PHRASES}}': signaturePhrasesText,
    '{{SUPERVISOR_WRITING_STYLE}}': writingStyleText,
    '{{SUPERVISOR_TEACHING_APPROACH}}': supervisor.teachingApproach || '（指導スタイル未設定）',
    '{{SUPERVISOR_AVOID_WORDS}}': avoidWordsText,
    '{{SUPERVISOR_EPISODES}}': episodesText,
    '{{SUPERVISOR_TARGET_AUDIENCE}}': supervisor.targetAudience || 'ヨガインストラクターを目指している方、または資格取得を検討している方。\n年齢層は25〜45歳、女性が8割を想定。',
    '{{SUPERVISOR_KNOWLEDGE}}': supervisorKnowledge,
    '{{TITLE}}': title,
    '{{KEYWORD}}': keyword,
    '{{CATEGORY}}': categoryName,
    '{{CONVERSION_GOAL}}': conversionGoal || '読者がオンラインスクール説明会に申し込むこと。',
    '{{CUSTOMER_VOICES}}': customerVoices,
    '{{MEDIA_NAME}}': brand.name,
    '{{DOMAIN}}': brand.domain,
    '{{SLUG}}': '{{SLUG}}', // これはStage1で生成されるため、そのまま残す
    // 多様性のためのランダム変数
    '{{RANDOM_INTRO_STYLE}}': randomIntro,
    '{{RANDOM_STRUCTURE}}': randomStructure,
    '{{VARIATION_SEED}}': String(randomSeed),
    // 日付変数（参考文献用）
    '{{CURRENT_YEAR}}': String(currentYear),
    '{{CURRENT_MONTH}}': String(currentMonth),
  };

  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    result = result.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }

  return result;
}

/**
 * Stage 1: タイトル生成プロンプト
 */
export function buildStage1Prompt(input: Stage1Input): string {
  const { keyword, categoryName, brandName } = input;

  return `あなたはSEOに精通した編集者です。
以下のキーワードから、検索上位を狙えるタイトルとメタ情報を生成してください。

【入力】
キーワード: ${keyword}
カテゴリ: ${categoryName}
メディア名: ${brandName}

【タイトル作成ルール】
- 検索意図を満たす具体的なタイトル
- 32文字以内を目安
- 数字や具体性があると良い
- 煽りすぎない、誠実なトーン

【出力形式】
JSONのみで出力。説明文は不要。

{
  "title": "記事タイトル",
  "slug": "url-slug-in-romaji",
  "metaTitle": "タイトル | ${brandName}",
  "metaDescription": "120〜140文字のディスクリプション"
}`;
}

/**
 * Stage 2: 記事生成プロンプト
 */
export function buildStage2Prompt(input: Stage2Input): string {
  const { title, keyword, categoryName, supervisor, infoBank, brand, conversionGoal } = input;

  // 情報バンクを種類別に分類
  const customerVoices = infoBank
    .filter(item => item.type === 'customer_voice')
    .map(item => `- ${item.content}`)
    .join('\n');

  const supervisorContent = infoBank
    .filter(item => item.type !== 'customer_voice')
    .map(item => `- [${item.id}] ${item.title}: ${item.content}`)
    .join('\n');

  // 監修者のキャリアサマリーを構築
  const currentYear = new Date().getFullYear();
  const careerYears = supervisor.careerStartYear ? currentYear - supervisor.careerStartYear : null;
  const teachingYears = supervisor.teachingStartYear ? currentYear - supervisor.teachingStartYear : null;

  let careerSummary = '';
  if (careerYears || teachingYears || supervisor.totalStudentsTaught) {
    const parts = [];
    if (careerYears) parts.push(`ヨガ歴${careerYears}年以上`);
    if (teachingYears) parts.push(`指導歴${teachingYears}年`);
    if (supervisor.totalStudentsTaught) parts.push(`累計${supervisor.totalStudentsTaught.toLocaleString()}名以上を指導`);
    if (supervisor.graduatesCount) parts.push(`インストラクター養成講座から${supervisor.graduatesCount}名以上を輩出`);
    if (supervisor.weeklyLessons) parts.push(`現在も週${supervisor.weeklyLessons}本のレッスンを担当`);
    careerSummary = parts.join('、');
  }

  // 資格情報の構築
  let certificationsText = '';
  if (supervisor.certifications && supervisor.certifications.length > 0) {
    certificationsText = supervisor.certifications.map(cert => {
      const parts = [cert.name];
      if (cert.year) parts.push(`${cert.year}年取得`);
      if (cert.location) parts.push(`（${cert.location}）`);
      return `- ${parts.join(' ')}`;
    }).join('\n');
  }

  // エピソード情報の構築
  let episodesText = '';
  if (supervisor.episodes && supervisor.episodes.length > 0) {
    const typeLabels: Record<string, string> = {
      transformation: '自身の変化',
      student: '生徒の変化',
      teaching: '指導での気づき',
      other: 'エピソード',
    };
    episodesText = supervisor.episodes.map(ep =>
      `【${typeLabels[ep.type] || 'エピソード'}】${ep.title}\n${ep.content}`
    ).join('\n\n');
  }

  // よく使うフレーズ
  const signaturePhrasesText = supervisor.signaturePhrases && supervisor.signaturePhrases.length > 0
    ? supervisor.signaturePhrases.map(p => `「${p}」`).join('、')
    : '';

  // 専門分野
  const specialtiesText = supervisor.specialties && supervisor.specialties.length > 0
    ? supervisor.specialties.join('、')
    : '';

  // パーソナリティフィールド
  const writingStyleMap: Record<string, string> = {
    formal: '丁寧で礼儀正しい文体。敬語を適切に使い、読者に対する配慮を示す。',
    casual: '親しみやすくフレンドリーな文体。「〜だよね」「〜かな」など口語表現も適度に使用。',
    professional: '専門的で知的な文体。正確な用語を使いながらも、わかりやすさを保つ。',
  };
  const writingStyleText = supervisor.writingStyle
    ? writingStyleMap[supervisor.writingStyle] || ''
    : '';

  const avoidWordsText = supervisor.avoidWords && supervisor.avoidWords.length > 0
    ? supervisor.avoidWords.join('、')
    : '';

  const influencesText = supervisor.influences && supervisor.influences.length > 0
    ? supervisor.influences.join('、')
    : '';

  // ランダムな導入パターンと構成を選択（多様性のため）
  const introPatterns = [
    "【導入スタイル：問いかけ】読者に「〜ではありませんか？」と問いかけ、共感を得る形で始める",
    "【導入スタイル：体験談】監修者自身の具体的なエピソードから始める。情景描写を含める",
    "【導入スタイル：データ】驚きの統計データや事実を冒頭に提示し、関心を引く",
    "【導入スタイル：情景描写】具体的な場面や風景から始め、読者を物語に引き込む",
    "【導入スタイル：逆説】「〜と思っていませんか？実は...」という意外性のある切り出し",
  ];
  const structurePatterns = [
    "【構成：ステップバイステップ】初心者でも実践できるよう、段階的に説明する",
    "【構成：比較検討型】複数の選択肢を比較し、それぞれのメリット・デメリットを解説",
    "【構成：ストーリー型】読者の変化を物語として描く。ビフォー・アフターを意識",
    "【構成：Q&A発展型】よくある疑問から深堀りしていく形式",
    "【構成：ケーススタディ型】具体的な事例を中心に展開する",
  ];
  const randomIntro = introPatterns[Math.floor(Math.random() * introPatterns.length)];
  const randomStructure = structurePatterns[Math.floor(Math.random() * structurePatterns.length)];
  const randomSeed = Math.floor(Math.random() * 1000);

  return `## 役割

あなたは「${supervisor.name}」（${supervisor.role}）として記事を監修・執筆します。

---

## 【今回の記事の個性】VariationSeed: ${randomSeed}

${randomIntro}
${randomStructure}

上記のスタイルと構成で、他の記事とは異なる個性的な記事を書いてください。

### 監修者プロフィール
${supervisor.profile}

### キャリアデータ（具体的な実績）
${careerSummary || '（キャリアデータ未設定）'}

${certificationsText ? `### 保有資格\n${certificationsText}\n` : ''}
${specialtiesText ? `### 専門・得意分野\n${specialtiesText}\n` : ''}
${supervisor.philosophy ? `### 指導理念・信念\n${supervisor.philosophy}\n` : ''}
${signaturePhrasesText ? `### よく使うフレーズ（記事中に自然に織り込むこと）\n${signaturePhrasesText}\n` : ''}
${episodesText ? `### 監修者の経験談（記事に活用すること）\n${episodesText}\n` : ''}
${influencesText ? `### 師事した先生・影響を受けた流派\n${influencesText}\n` : ''}
${supervisor.locationContext ? `### 活動拠点\n${supervisor.locationContext}（地域性を記事に反映すること）\n` : ''}

### 文体・パーソナリティ設定
${writingStyleText ? `**文体**: ${writingStyleText}\n` : ''}
${supervisor.teachingApproach ? `**指導スタイル**: ${supervisor.teachingApproach}（この姿勢を記事にも反映）\n` : ''}
${avoidWordsText ? `**使用禁止ワード**: 以下の言葉・表現は絶対に使わないでください。\n${avoidWordsText}\n` : ''}

**重要**: 上記のキャリアデータや経験談を記事中に自然に織り込み、「この人だからこそ書ける」説得力を持たせてください。
具体的な数字（指導人数、年数など）は読者の信頼を高める要素となります。
監修者の指導理念や信念が記事全体のトーンに反映されるようにしてください。

---

## 執筆テーマ

タイトル：${title}
キーワード：${keyword}
カテゴリ：${categoryName}

検索意図を深く理解し、メインテーマから派生した語句を3つ抽出したうえで、検索1位を取るためのSEO記事を書いてください。

---

## ターゲット読者

${supervisor.targetAudience || 'ヨガインストラクターを目指している方、または資格取得を検討している方。\n年齢層は25〜45歳、女性が8割を想定。\n「本当に自分にできるのか」「どのスクールを選べばいいのか」「費用対効果はあるのか」という不安を抱えている。'}

---

## メディアのゴール

${conversionGoal || '読者がオンラインスクール説明会に申し込むこと。'}
ただし、押し売り感のある誘導は禁止。読者が「もっと知りたい」と自然に思える情報設計を優先する。

---

## 一次情報の活用

### 受講生の声（情報バンクより）
${customerVoices || 'なし'}

### 監修者の知見・発言
${supervisorContent || 'なし'}

上記の一次情報を本文中に自然に織り込んでください。引用時は「〇〇さん（受講歴△年）」「監修者の${supervisor.name}先生によると」のように出典を明示すること。

**⚠️ 受講生の名前について（個人情報保護）**
- 受講生の名前が英語イニシャル（例：A.S.、M.K.など）の場合、必ず日本の女性名（仮名）に変換して記載してください
- 例：「A.S.さん」→「美咲さん」、「M.K.さん」→「陽菜さん」
- 仮名は自然な日本の名前を使用し、プライバシーを保護してください

---

## 🚫 絶対に避けるべき表現（AI臭が強い）

以下のフレーズはAI生成感が強いため、絶対に使用しないでください：

${PHRASES_TO_AVOID.slice(0, 10).map(phrase => `- ❌「${phrase}」`).join('\n')}

**代替表現の例：**
- ❌「といえるでしょう」→ ✅「と言えます」「です」でシンプルに
- ❌「ではないでしょうか」→ ✅「と思います」「でしょう」
- ❌「かもしれません」→ ✅「可能性があります」「ことがあります」「場合があります」
- ❌「非常に」「大変」の多用 → ✅ 具体的な形容（「30分で効果を実感」など）
- ❌「させていただきます」→ ✅「します」「いたします」
- ❌「また、」「そして、」「さらに、」の多用 → ✅ 多様な接続詞を使う

**🚨 重要警告：「かもしれません」は絶対禁止です。1回でも使ったら失格！**

---

## 🔴 監修者引用ルール（厳守）

${SUPERVISOR_QUOTE_RULES}

---

${NATURAL_JAPANESE_GUIDELINES}

---

${REFERENCE_FORMAT_RULES}

---

## OUTPUT仕様（最重要：必ず従うこと）

**⚠️ 絶対に以下を含めないこと：**
- \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, \`<body>\`, \`<meta>\`, \`<title>\`
- \`<script>\`タグ（JSON-LD含む）
- \`<style>\`タグ

**出力するのは\`<article>\`タグで囲まれた記事本文のみです。インラインスタイルを必ず含めてください。**

### 出力形式（このテンプレートに従うこと）

\`\`\`html
<article style="max-width:800px;margin:0 auto;padding:24px;font-family:'Hiragino Sans','ヒラギノ角ゴ Pro W3','Noto Sans JP',sans-serif;line-height:1.8;color:#333;">

<!-- IMAGE_PLACEHOLDER: position="hero" context="[テーマを表すイメージ]" alt_hint="[alt属性]" -->

<p style="font-size:1.1em;color:#444;margin-bottom:32px;border-left:4px solid #333;padding-left:16px;background:#FAFAFA;padding:16px 16px 16px 20px;border-radius:0 8px 8px 0;">[導入文：読者の悩みに共感し、監修者の体験を1文入れる。150〜250字]</p>

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;">[章タイトル1：感情語＋具体名詞]</h2>

<p style="margin-bottom:20px;">[本文。段落ごとに\`<p>\`タグで区切る]</p>

<p style="margin-bottom:20px;">[次の段落]</p>

<!-- IMAGE_PLACEHOLDER: position="section_1" context="[この章の内容]" alt_hint="[alt属性]" -->

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;">[章タイトル2]</h2>

<p style="margin-bottom:20px;">[本文]</p>

<h3 style="font-size:1.25em;font-weight:bold;margin:32px 0 16px;color:#333;padding-left:12px;border-left:4px solid #666;">[小見出し]</h3>

<p style="margin-bottom:20px;">[本文]</p>

<ul style="margin:20px 0;padding-left:24px;">
  <li style="margin-bottom:8px;">[リストアイテム]</li>
  <li style="margin-bottom:8px;">[リストアイテム]</li>
</ul>

<table style="width:100%;border-collapse:collapse;margin:24px 0;">
  <thead>
    <tr style="background:#F3F4F6;">
      <th style="padding:12px;border:1px solid #E5E7EB;text-align:left;">[ヘッダー]</th>
      <th style="padding:12px;border:1px solid #E5E7EB;text-align:left;">[ヘッダー]</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding:12px;border:1px solid #E5E7EB;">[データ]</td>
      <td style="padding:12px;border:1px solid #E5E7EB;">[データ]</td>
    </tr>
  </tbody>
</table>

<!-- IMAGE_PLACEHOLDER: position="section_2" context="[この章の内容]" alt_hint="[alt属性]" -->

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;">[章タイトル3〜5]</h2>

...

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;">よくある質問</h2>

<details style="margin-bottom:16px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
  <summary style="padding:16px;background:#F9FAFB;cursor:pointer;font-weight:600;">[質問1]</summary>
  <div style="padding:16px;background:#fff;"><p style="margin:0;">[回答]</p></div>
</details>

<details style="margin-bottom:16px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
  <summary style="padding:16px;background:#F9FAFB;cursor:pointer;font-weight:600;">[質問2]</summary>
  <div style="padding:16px;background:#fff;"><p style="margin:0;">[回答]</p></div>
</details>

...（計5つ）

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;">受講生の声</h2>

<blockquote style="margin:24px 0;padding:20px 24px;background:#F9FAFB;border-left:4px solid #333;border-radius:0 8px 8px 0;">
  <p style="margin:0 0 12px;font-style:italic;color:#444;">[実際の受講生の声。情報バンクから引用]</p>
  <cite style="font-size:0.9em;color:#666;">— [名前]さん（[背景]）</cite>
</blockquote>

<div style="margin-top:48px;padding:24px;background:#F3F4F6;border-radius:12px;">
  <h3 style="font-size:1.1em;font-weight:bold;margin:0 0 12px;color:#333;">監修者プロフィール</h3>
  <p style="margin:0;"><strong>${supervisor.name}</strong>（${supervisor.role}）</p>
  <p style="margin:8px 0 0;font-size:0.95em;color:#555;">[経歴・資格・指導実績を2〜3文で簡潔に]</p>
</div>

<div style="margin-top:32px;">
  <h3 style="font-size:1em;font-weight:bold;margin:0 0 12px;color:#666;">参考文献</h3>
  <ol style="margin:0;padding-left:20px;font-size:0.9em;color:#666;">
    <li style="margin-bottom:4px;">[文献1]</li>
    <li style="margin-bottom:4px;">[文献2]</li>
  </ol>
</div>

<p style="margin-top:40px;padding:20px;background:#F9FAFB;border-radius:8px;font-size:0.85em;color:#666;line-height:1.6;">
  本記事は${supervisor.name}が監修した一般情報であり、個別の医療アドバイスに替わるものではありません。
  身体に不調がある場合は、必ず医師や専門家へご相談ください。
  当サイトおよび執筆者は、本記事の情報利用によって生じたいかなる損害についても一切の責任を負いかねます。
</p>

</article>
\`\`\`

---

### 重要なHTML規則

1. **\`<article>\`タグで全体を囲む** - インラインスタイル付きで出力
2. **段落は\`<p style="margin-bottom:20px;">\`** - 改行ではなく段落分け
3. **見出しは\`<h2>\`と\`<h3>\`のみ** - 上記のスタイルをそのまま使用
4. **リスト・表も上記のスタイルをコピー** - 一貫したデザイン
5. **各要素に必ずインラインスタイルを含める** - CSSクラスのみは不可

### 文体ガイドライン（人間らしい文章のために）

* 一文は20〜80字を基本に、短文と長文を混ぜる
* 語尾は「です」「ます」「でしょう」「ですね」を循環（**同じ語尾を3回連続で使わない**）
* 接続詞を多様化：「しかし」「ただ」「実は」「というのも」「一方で」「ところで」「さて」
* 監修者の口癖やフレーズを自然に2〜3回織り込む
* 体言止めを適度に使用（「〜というポイント。」「〜の効果。」）
* 完璧すぎない文章を意識（人間らしい揺らぎを持たせる）
* 読者に語りかけるような「私も最初は不安でした」などの体験的表現を入れる
${brand.tone ? `* トーン: ${brand.tone}` : ''}

### 画像プレースホルダー（必須・3箇所）

以下の形式で**必ず3箇所**に配置（\`<article>\`タグ内に）：
\`\`\`
<!-- IMAGE_PLACEHOLDER: position="hero" context="[記事テーマのイメージ]" alt_hint="[具体的なalt]" -->
<!-- IMAGE_PLACEHOLDER: position="section_1" context="[章の内容イメージ]" alt_hint="[具体的なalt]" -->
<!-- IMAGE_PLACEHOLDER: position="section_2" context="[章の内容イメージ]" alt_hint="[具体的なalt]" -->
\`\`\`

---

**🚫 再度警告：以下は絶対に出力しないこと**
- \`<!DOCTYPE html>\`, \`<html>\`, \`<head>\`, \`<body>\`, \`<meta>\`, \`<title>\`, \`<script>\`

**出力は\`<article style="...">\`で始まり\`</article>\`で終わること。インラインスタイル必須。**`;
}

/**
 * Stage 3: 画像生成プロンプト
 * スタイル: 手描き水彩スケッチ風のエディトリアルイラスト
 * アスペクト比: 16:9
 */
export function buildImagePrompt(input: {
  position: string;
  context: string;
  altHint: string;
  articleTitle: string;
  categoryName: string;
  brandTone?: string;
}): string {
  const { context, altHint, articleTitle } = input;

  // コンテキストを英語のキーワードに変換するヘルパー
  // altHintを使用（通常は英語または簡潔な日本語）
  const themeKeywords = altHint || context;

  return `editorial illustration for a blog post in hand-drawn watercolor sketch style, loose line art with rough outlines, pale and transparent pastel colors, plain white background. The image is a conceptual visualization representing the theme of: ${themeKeywords}, gentle and airy atmosphere relevant to the topic, minimalist composition. No text, no letters, no words, no typography in the image.`;
}

/**
 * 記事用インラインスタイル定義
 */
const ARTICLE_STYLES = {
  article: `max-width:800px;margin:0 auto;padding:24px;font-family:'Hiragino Sans','ヒラギノ角ゴ Pro W3','Noto Sans JP',sans-serif;line-height:1.8;color:#333;`,
  h2: `font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;`,
  h3: `font-size:1.25em;font-weight:bold;margin:32px 0 16px;color:#333;padding-left:12px;border-left:4px solid #666;`,
  h4: `font-size:1.1em;font-weight:bold;margin:24px 0 12px;color:#333;`,
  p: `margin-bottom:20px;color:#333;`,
  ul: `margin:20px 0;padding-left:24px;color:#333;`,
  ol: `margin:20px 0;padding-left:24px;color:#333;`,
  li: `margin-bottom:8px;color:#333;`,
  table: `width:100%;border-collapse:collapse;margin:24px 0;`,
  th: `padding:12px 16px;border:1px solid #E5E7EB;text-align:left;background:#F3F4F6;font-weight:bold;color:#333;`,
  td: `padding:12px 16px;border:1px solid #E5E7EB;color:#333;`,
  blockquote: `margin:24px 0;padding:20px 24px;background:#F9FAFB;border-left:4px solid #666;border-radius:0 8px 8px 0;font-style:italic;color:#333;`,
  details: `margin-bottom:16px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;`,
  summary: `padding:16px;background:#F9FAFB;cursor:pointer;font-weight:600;color:#333;`,
  strong: `font-weight:bold;color:#333;`,
  // クラスベースの要素にもスタイルを適用
  intro: `font-size:1.1em;color:#333;margin-bottom:32px;border-left:4px solid #333;padding-left:16px;background:#FAFAFA;padding:16px 16px 16px 20px;border-radius:0 8px 8px 0;`,
  highlight: `margin:24px 0;padding:20px;background:#F3F4F6;border-radius:8px;color:#333;`,
  container: `max-width:800px;margin:0 auto;padding:24px;font-family:'Hiragino Sans','ヒラギノ角ゴ Pro W3','Noto Sans JP',sans-serif;line-height:1.8;color:#333;`,
  'cost-table': `margin:24px 0;overflow-x:auto;`,
};;

/**
 * HTMLタグにインラインスタイルを注入
 */
function injectInlineStyles(html: string): string {
  let result = html;

  // 内部のarticleタグを削除（外側のarticleは後でcleanGeneratedHtmlで追加される）
  // AIが記事内部にarticleタグを生成してしまう問題を解決
  result = result.replace(/<article[^>]*>/gi, '').replace(/<\/article>/gi, '');

  // h2タグ：AIが生成したスタイルをすべて削除して固定スタイルに置換
  result = result.replace(/<h2[^>]*>/gi, `<h2 style="${ARTICLE_STYLES.h2}">`);

  // h3タグ：AIが生成したスタイルをすべて削除して固定スタイルに置換
  result = result.replace(/<h3[^>]*>/gi, `<h3 style="${ARTICLE_STYLES.h3}">`);

  // h4タグ：固定スタイルに置換
  result = result.replace(/<h4[^>]*>/gi, `<h4 style="${ARTICLE_STYLES.h4}">`);

  // pタグ
  result = result.replace(/<p(?![^>]*style=)([^>]*)>/gi, `<p style="${ARTICLE_STYLES.p}"$1>`);

  // ulタグ
  result = result.replace(/<ul(?![^>]*style=)([^>]*)>/gi, `<ul style="${ARTICLE_STYLES.ul}"$1>`);

  // olタグ
  result = result.replace(/<ol(?![^>]*style=)([^>]*)>/gi, `<ol style="${ARTICLE_STYLES.ol}"$1>`);

  // liタグ
  result = result.replace(/<li(?![^>]*style=)([^>]*)>/gi, `<li style="${ARTICLE_STYLES.li}"$1>`);

  // tableタグ
  result = result.replace(/<table(?![^>]*style=)([^>]*)>/gi, `<table style="${ARTICLE_STYLES.table}"$1>`);

  // thタグ（theadにマッチしないよう負の先読みを使用）
  result = result.replace(/<th(?![ea])(?![^>]*style=)([^>]*)>/gi, `<th style="${ARTICLE_STYLES.th}"$1>`);

  // tdタグ
  result = result.replace(/<td(?![^>]*style=)([^>]*)>/gi, `<td style="${ARTICLE_STYLES.td}"$1>`);

  // blockquoteタグ
  result = result.replace(/<blockquote(?![^>]*style=)([^>]*)>/gi, `<blockquote style="${ARTICLE_STYLES.blockquote}"$1>`);

  // detailsタグ
  result = result.replace(/<details(?![^>]*style=)([^>]*)>/gi, `<details style="${ARTICLE_STYLES.details}"$1>`);

  // summaryタグ
  result = result.replace(/<summary(?![^>]*style=)([^>]*)>/gi, `<summary style="${ARTICLE_STYLES.summary}"$1>`);

  // クラスベースの要素にスタイルを追加
  // class="intro"
  result = result.replace(/<div[^>]*class="[^"]*intro[^"]*"[^>]*>/gi, (match) => {
    if (match.includes('style=')) return match;
    return match.replace(/>$/, ` style="${ARTICLE_STYLES.intro}">`);
  });

  // class="highlight"
  result = result.replace(/<div[^>]*class="[^"]*highlight[^"]*"[^>]*>/gi, (match) => {
    if (match.includes('style=')) return match;
    return match.replace(/>$/, ` style="${ARTICLE_STYLES.highlight}">`);
  });

  // class="container"
  result = result.replace(/<div[^>]*class="[^"]*container[^"]*"[^>]*>/gi, (match) => {
    if (match.includes('style=')) return match;
    return match.replace(/>$/, ` style="${ARTICLE_STYLES.container}">`);
  });

  // class="cost-table"
  result = result.replace(/<div[^>]*class="[^"]*cost-table[^"]*"[^>]*>/gi, (match) => {
    if (match.includes('style=')) return match;
    return match.replace(/>$/, ` style="${ARTICLE_STYLES['cost-table']}">`);
  });

  return result;
}

/**
 * AIが生成したHTMLを後処理してクリーンアップ
 * - DOCTYPE, html, head, body タグを除去
 * - Markdownコードブロックを除去
 * - JSON-LDスクリプトを除去
 * - 記事本文のみを抽出
 * - インラインスタイルを注入
 */
export function cleanGeneratedHtml(rawHtml: string): string {
  let html = rawHtml.trim();

  // Markdownコードブロック（```html...```）を除去
  html = html.replace(/^```html\s*/i, '').replace(/\s*```$/i, '');
  html = html.replace(/^```\s*/i, '').replace(/\s*```$/i, '');

  // DOCTYPE を除去
  html = html.replace(/<!DOCTYPE[^>]*>/gi, '');

  // <html>...</html> タグを除去（中身は保持）
  html = html.replace(/<html[^>]*>/gi, '').replace(/<\/html>/gi, '');

  // <head>...</head> セクション全体を除去
  html = html.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');

  // <body>...</body> タグを除去（中身は保持）
  html = html.replace(/<body[^>]*>/gi, '').replace(/<\/body>/gi, '');

  // JSON-LDスクリプトを除去
  html = html.replace(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi, '');

  // その他の <script> タグを除去
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // <style> タグを除去
  html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // 先頭・末尾の空白を整理
  html = html.trim();

  // 連続する空行を1つに
  html = html.replace(/\n{3,}/g, '\n\n');

  // 禁止フレーズの自動置換（AIが生成してしまう場合の対策）
  html = html.replace(/かもしれません/g, '可能性があります');
  html = html.replace(/といえるでしょう/g, 'と言えます');
  html = html.replace(/ではないでしょうか/g, 'でしょう');

  // テーブルのマルフォームドHTML修復
  // AIが <thead> を <th style="..."ead> と誤生成するパターンを修復
  // パターン: <th style="..."ead> → <thead>
  html = html.replace(/<th\s+style="[^"]*"ead>/gi, '<thead>');
  html = html.replace(/<\/th\s*ead>/gi, '</thead>');
  // <tbody を含む壊れたパターンも修復
  html = html.replace(/<t[bd]\s+style="[^"]*"body>/gi, '<tbody>');
  html = html.replace(/<\/t[bd]\s*body>/gi, '</tbody>');

  // インラインスタイルを注入
  html = injectInlineStyles(html);

  // 全体をarticleで囲む（まだ囲まれていない場合）
  if (!html.startsWith('<article')) {
    html = `<article style="${ARTICLE_STYLES.article}">\n${html}\n</article>`;
  }

  return html;
}

/**
 * HTMLから画像プレースホルダーを抽出
 */
export function extractImagePlaceholders(html: string): {
  position: string;
  context: string;
  altHint: string;
}[] {
  const regex = /<!-- IMAGE_PLACEHOLDER: position="([^"]+)" context="([^"]+)" alt_hint="([^"]+)" -->/g;
  const placeholders: { position: string; context: string; altHint: string }[] = [];

  let match;
  while ((match = regex.exec(html)) !== null) {
    placeholders.push({
      position: match[1],
      context: match[2],
      altHint: match[3],
    });
  }

  return placeholders;
}

/**
 * プレースホルダーを<img>タグに置換
 */
export function replacePlaceholderWithImage(
  html: string,
  position: string,
  imageUrl: string,
  alt: string
): string {
  const placeholder = new RegExp(
    `<!-- IMAGE_PLACEHOLDER: position="${position}" context="[^"]+" alt_hint="[^"]+" -->`,
    'g'
  );

  // ポジションに応じたスタイル
  const isHero = position === "hero";
  const figureStyle = isHero
    ? "margin:0 0 32px 0;text-align:center;"
    : "margin:32px 0;text-align:center;";

  const imgStyle = isHero
    ? "max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 6px rgba(0,0,0,0.1);"
    : "max-width:100%;height:auto;border-radius:8px;";

  const imgTag = `<figure style="${figureStyle}">
  <img src="${imageUrl}" alt="${alt}" loading="lazy" style="${imgStyle}" />
</figure>`;

  return html.replace(placeholder, imgTag);
}

/**
 * CTAバナー情報
 */
export interface CTABanner {
  name: string;
  url: string;
  thumbnailUrl?: string | null;
  context?: string;
}

/**
 * CTAバナーを記事中間（3番目のH2の後）に挿入
 */
export function insertCTABanner(html: string, banner: CTABanner): string {
  // CTAバナーのHTML生成
  let ctaHtml: string;

  if (!banner.thumbnailUrl) {
    // バナー画像がない場合はテキストCTAを挿入
    ctaHtml = `
<div style="margin:48px 0 32px;padding:32px;background:linear-gradient(135deg, #333 0%, #666 100%);border-radius:16px;text-align:center;">
  <p style="margin:0 0 16px;font-size:1.2em;font-weight:bold;color:#fff;">${banner.name}</p>
  <p style="margin:0 0 20px;color:#fff;opacity:0.9;">${banner.context || "詳しくはこちらをご覧ください"}</p>
  <a href="${banner.url}" style="display:inline-block;padding:14px 32px;background:#fff;color:#333;font-weight:bold;text-decoration:none;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);transition:transform 0.2s;">
    詳細を見る →
  </a>
</div>`;
  } else {
    // バナー画像がある場合
    ctaHtml = `
<div style="margin:48px 0 32px;text-align:center;">
  <a href="${banner.url}" style="display:block;max-width:100%;text-decoration:none;">
    <img src="${banner.thumbnailUrl}" alt="${banner.name}" loading="lazy" style="max-width:100%;height:auto;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
  </a>
  <p style="margin-top:12px;font-size:0.9em;color:#666;">
    <a href="${banner.url}" style="color:#333;text-decoration:none;font-weight:500;">${banner.name} →</a>
  </p>
</div>`;
  }

  // H2タグの位置を全て取得
  const h2Matches = [...html.matchAll(/<h2[^>]*>/gi)];

  // 3番目のH2の後に挿入（H2が3つ未満なら最後のH2の後）
  const targetIndex = Math.min(2, h2Matches.length - 1); // 0-indexed で2 = 3番目

  if (targetIndex >= 0 && h2Matches[targetIndex]) {
    const h2Position = h2Matches[targetIndex].index!;
    // このH2セクションの終わり（次のH2の前）を見つける
    const nextH2 = h2Matches[targetIndex + 1];
    const insertPosition = nextH2 ? nextH2.index! : html.indexOf('</article>');

    // 挿入位置の直前に挿入
    return html.slice(0, insertPosition) + ctaHtml + '\n' + html.slice(insertPosition);
  }

  // H2が見つからない場合は記事末尾に挿入
  return html.replace(/<\/article>/i, `${ctaHtml}\n</article>`);
}

/**
 * 自然なテキスト形式のCTAを挿入（バナーなし）
 * 記事の流れの中で、さりげなく無料登録へ誘導
 */
export function insertNaturalCTA(html: string, cta: { name: string; url: string }): string {
  // 自然な誘導テキスト（複数パターンからランダム選択）
  const ctaPatterns = [
    `<aside class="natural-cta" style="margin:40px 0;padding:24px 28px;background:#fafafa;border-left:4px solid #333;border-radius:0 8px 8px 0;">
  <p style="margin:0 0 12px;font-size:1.05em;line-height:1.8;color:#333;">
    この記事を読んで「私もやってみたい」と思った方へ。
    まずは<a href="${cta.url}" style="color:#333;font-weight:600;text-decoration:underline;">無料の資料請求</a>から始めてみませんか？
  </p>
  <p style="margin:0;font-size:0.95em;color:#666;">
    実際の受講生の声や、カリキュラムの詳細をお届けします。
  </p>
</aside>`,
    `<aside class="natural-cta" style="margin:40px 0;padding:24px 28px;background:#fafafa;border-left:4px solid #333;border-radius:0 8px 8px 0;">
  <p style="margin:0 0 12px;font-size:1.05em;line-height:1.8;color:#333;">
    「でも、本当に自分にできるかな…」そう思っていませんか？
    <a href="${cta.url}" style="color:#333;font-weight:600;text-decoration:underline;">無料相談</a>で、あなたの不安を解消できます。
  </p>
  <p style="margin:0;font-size:0.95em;color:#666;">
    経験豊富なスタッフが、一人ひとりに合ったプランをご提案します。
  </p>
</aside>`,
    `<aside class="natural-cta" style="margin:40px 0;padding:24px 28px;background:#fafafa;border-left:4px solid #333;border-radius:0 8px 8px 0;">
  <p style="margin:0 0 12px;font-size:1.05em;line-height:1.8;color:#333;">
    一歩踏み出すなら、今がチャンスかもしれません。
    <a href="${cta.url}" style="color:#333;font-weight:600;text-decoration:underline;">${cta.name}</a>で、新しい自分に出会ってみませんか？
  </p>
</aside>`,
  ];

  // ランダムにパターンを選択
  const ctaHtml = ctaPatterns[Math.floor(Math.random() * ctaPatterns.length)];

  // 4番目のH2の前に挿入（記事の中盤〜後半）
  const h2Matches = [...html.matchAll(/<h2[^>]*>/gi)];
  const targetIndex = Math.min(3, h2Matches.length - 1); // 4番目のH2（0-indexed: 3）

  if (targetIndex >= 1 && h2Matches[targetIndex]) {
    const insertPosition = h2Matches[targetIndex].index!;
    return html.slice(0, insertPosition) + ctaHtml + '\n\n' + html.slice(insertPosition);
  }

  // H2が足りない場合はまとめセクションの前に挿入
  const summaryMatch = html.match(/<h2[^>]*>.*?(まとめ|おわりに|最後に)/i);
  if (summaryMatch && summaryMatch.index) {
    return html.slice(0, summaryMatch.index) + ctaHtml + '\n\n' + html.slice(summaryMatch.index);
  }

  // それでも見つからない場合は記事末尾
  return html.replace(/<\/article>/i, `${ctaHtml}\n</article>`);
}

/**
 * 内部リンクが無い場合、関連記事セクションを挿入する
 */
export function insertRelatedArticles(html: string, categorySlug: string): string {
  // すでに内部リンクがある場合はスキップ
  if (html.includes('href="/')) {
    return html;
  }

  const relatedSection = `
<section style="margin:48px 0 24px;padding:24px;background:#f8f8f8;border-radius:12px;">
  <h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#333;border-bottom:3px solid #333;padding-bottom:12px;">関連記事</h2>
  <p style="margin:0 0 12px;color:#666;">こちらの記事もおすすめです。</p>
  <ul style="margin:0;padding-left:20px;">
    <li style="margin-bottom:8px;"><a href="/${categorySlug}/yoga-beginner-guide" style="color:#333;">ヨガ初心者ガイド｜始め方から続け方まで</a></li>
    <li style="margin-bottom:8px;"><a href="/${categorySlug}/yoga-benefits" style="color:#333;">ヨガの効果とは？心身への影響を解説</a></li>
  </ul>
</section>`;

  // </article>の直前に挿入
  return html.replace(/<\/article>/i, `${relatedSection}\n</article>`);
}

/**
 * blockquote監修者引用がない場合に自動挿入する
 */
export function insertSupervisorQuote(
  html: string,
  supervisor: { name: string; role: string }
): string {
  // すでにblockquoteがある場合はスキップ
  if (html.includes('<blockquote')) {
    return html;
  }

  const quoteHtml = `
<blockquote style="margin:32px 0;padding:24px;background:linear-gradient(135deg,#F5F5F5 0%,#fff 100%);border-left:4px solid #333;border-radius:0 12px 12px 0;font-style:normal;">
  <p style="margin:0 0 12px;font-size:1.05em;line-height:1.8;color:#333;">「この記事のポイントを押さえて実践していただければ、きっと良い変化が感じられるはずです。無理なく、自分のペースで続けていきましょう。」</p>
  <cite style="display:block;font-size:0.9em;color:#666;font-style:normal;">— ${supervisor.name}（${supervisor.role}）</cite>
</blockquote>`;

  // 3番目のH2の後に挿入
  const h2Matches = [...html.matchAll(/<h2[^>]*>[\s\S]*?<\/h2>/gi)];
  if (h2Matches.length >= 3) {
    const thirdH2End = h2Matches[2].index! + h2Matches[2][0].length;
    // H2の次の</p>の後に挿入
    const afterH2 = html.slice(thirdH2End);
    const pEndMatch = afterH2.match(/<\/p>/i);
    if (pEndMatch && pEndMatch.index !== undefined) {
      const insertPos = thirdH2End + pEndMatch.index + pEndMatch[0].length;
      return html.slice(0, insertPos) + quoteHtml + html.slice(insertPos);
    }
  }

  // H2が3つ未満の場合、記事の中盤（2番目のH2の後）に挿入
  if (h2Matches.length >= 2) {
    const secondH2End = h2Matches[1].index! + h2Matches[1][0].length;
    const afterH2 = html.slice(secondH2End);
    const pEndMatch = afterH2.match(/<\/p>/i);
    if (pEndMatch && pEndMatch.index !== undefined) {
      const insertPos = secondH2End + pEndMatch.index + pEndMatch[0].length;
      return html.slice(0, insertPos) + quoteHtml + html.slice(insertPos);
    }
  }

  return html;
}

/**
 * 表のHTMLを修正
 * AIが生成した壊れた表構造を修正し、統一されたスタイルを適用
 */
export function fixTableHtml(html: string): string {
  return html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    let result = tableHtml;

    // ステップ1: <table>直後の壊れた<th>...</th>ブロックを検出して置換
    // パターン: <table...>...空白...<th...>...空白...<tr>...</tr>...空白...</th>
    // これは <thead> の代わりに誤って <th> を使っているケース
    const brokenPattern = /(<table[^>]*>)(\s*)<th[^>]*>(\s*)(<tr>[\s\S]*?<\/tr>)(\s*)<\/th>/i;

    if (brokenPattern.test(result)) {
      result = result.replace(brokenPattern, '$1$2<thead>$3$4$5</thead>');
    }

    // ステップ2: theadの後のtrをtbodyで囲む
    if (result.includes('<thead>') && !result.includes('<tbody>')) {
      result = result.replace(
        /(<\/thead>)(\s*)(<tr>[\s\S]*?)(<\/table>)/i,
        '$1$2<tbody>$3</tbody>$4'
      );
    }

    // ステップ3: スタイル適用（色は#333で統一）
    const tableStyle = 'width:100%;border-collapse:collapse;margin:24px 0;';
    result = result.replace(/<table[^>]*>/gi, `<table style="${tableStyle}">`);

    // <th> タグのみにマッチ（<thead> にはマッチしない）
    const thStyle = 'padding:12px 16px;border:1px solid #e5e7eb;text-align:left;font-weight:600;color:#333;background:#f3f4f6;';
    result = result.replace(/<th(?![ea])[^>]*>/gi, `<th style="${thStyle}">`);

    const tdStyle = 'padding:12px 16px;border:1px solid #e5e7eb;vertical-align:top;color:#333;';
    result = result.replace(/<td[^>]*>/gi, `<td style="${tdStyle}">`);

    result = result.replace(/<tr[^>]*>/gi, '<tr>');
    result = result.replace(/<thead[^>]*>/gi, '<thead>');
    result = result.replace(/<tbody[^>]*>/gi, '<tbody>');

    return result;
  });
}

/**
 * FAQのスタイルを改善
 * 複数のFAQ形式に対応（details/summary, div.faq-item, dl/dt/dd）
 */
export function improveFaqStyle(html: string): string {
  let result = html;

  // パターン1: details/summary形式 → div形式に変換
  result = result.replace(
    /<details[^>]*>\s*<summary[^>]*>([^<]*)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/details>/gi,
    (_, question, answer) => {
      const q = question.replace(/^Q\.\s*/, '').trim();
      return `
<div style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
  <p style="margin:0;padding:16px 20px;background:#f8f9fa;font-weight:600;color:#1f2937;display:flex;align-items:center;gap:12px;">
    <span style="display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;background:#333;color:#fff;border-radius:50%;font-size:0.85em;font-weight:bold;">Q</span>
    ${q}
  </p>
  <p style="margin:0;padding:16px 20px;line-height:1.8;color:#4b5563;border-top:1px solid #e5e7eb;">
    ${answer.trim()}
  </p>
</div>`;
    }
  );

  // パターン2: div.faq-item形式のスタイル適用
  result = result.replace(
    /<div[^>]*class="faq-item"[^>]*>/gi,
    '<div style="margin:16px 0;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">'
  );

  result = result.replace(
    /<p[^>]*class="faq-question"[^>]*>/gi,
    '<p style="margin:0;padding:16px 20px;background:#f8f9fa;font-weight:600;color:#1f2937;">'
  );

  result = result.replace(
    /<p[^>]*class="faq-answer"[^>]*>/gi,
    '<p style="margin:0;padding:16px 20px;line-height:1.8;color:#4b5563;border-top:1px solid #e5e7eb;">'
  );

  // Q. を装飾
  result = result.replace(
    /(<p[^>]*>)\s*<strong>Q\.\s*/gi,
    '$1<span style="display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;background:#333;color:#fff;border-radius:50%;font-size:0.85em;font-weight:bold;margin-right:12px;">Q</span><strong>'
  );

  return result;
}
