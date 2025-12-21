// 3ステップパイプライン用プロンプト

import type { Stage1Input, Stage2Input, Stage3Input } from "./types";

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

<p style="font-size:1.1em;color:#444;margin-bottom:32px;border-left:4px solid #8B5CF6;padding-left:16px;background:#FAFAFA;padding:16px 16px 16px 20px;border-radius:0 8px 8px 0;">[導入文：読者の悩みに共感し、監修者の体験を1文入れる。150〜250字]</p>

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#1a1a1a;border-bottom:3px solid #8B5CF6;padding-bottom:12px;">[章タイトル1：感情語＋具体名詞]</h2>

<p style="margin-bottom:20px;">[本文。段落ごとに\`<p>\`タグで区切る]</p>

<p style="margin-bottom:20px;">[次の段落]</p>

<!-- IMAGE_PLACEHOLDER: position="section_1" context="[この章の内容]" alt_hint="[alt属性]" -->

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#1a1a1a;border-bottom:3px solid #8B5CF6;padding-bottom:12px;">[章タイトル2]</h2>

<p style="margin-bottom:20px;">[本文]</p>

<h3 style="font-size:1.25em;font-weight:bold;margin:32px 0 16px;color:#333;padding-left:12px;border-left:4px solid #A78BFA;">[小見出し]</h3>

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

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#1a1a1a;border-bottom:3px solid #8B5CF6;padding-bottom:12px;">[章タイトル3〜5]</h2>

...

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#1a1a1a;border-bottom:3px solid #8B5CF6;padding-bottom:12px;">よくある質問</h2>

<details style="margin-bottom:16px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
  <summary style="padding:16px;background:#F9FAFB;cursor:pointer;font-weight:600;">[質問1]</summary>
  <div style="padding:16px;background:#fff;"><p style="margin:0;">[回答]</p></div>
</details>

<details style="margin-bottom:16px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
  <summary style="padding:16px;background:#F9FAFB;cursor:pointer;font-weight:600;">[質問2]</summary>
  <div style="padding:16px;background:#fff;"><p style="margin:0;">[回答]</p></div>
</details>

...（計5つ）

<h2 style="font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#1a1a1a;border-bottom:3px solid #8B5CF6;padding-bottom:12px;">受講生の声</h2>

<blockquote style="margin:24px 0;padding:20px 24px;background:#F9FAFB;border-left:4px solid #8B5CF6;border-radius:0 8px 8px 0;">
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

### 文体ガイドライン

* 一文は20〜80字を基本に、短文と長文を混ぜる
* 語尾は「です」「ます」「でしょう」「ですね」を循環（3連続禁止）
* 接続詞を多様化：「しかし」「ただ」「実は」「というのも」「一方で」
* 監修者の口癖やフレーズを自然に2〜3回織り込む
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
 * Stage 3: 画像生成プロンプト（短縮版）
 * トークン制限を回避するため、簡潔なプロンプトを生成
 */
export function buildImagePrompt(input: {
  position: string;
  context: string;
  altHint: string;
  articleTitle: string;
  categoryName: string;
  brandTone?: string;
}): string {
  const { context, altHint } = input;

  // 非常に短いプロンプトでトークン制限を回避
  return `Generate a yoga/wellness illustration: ${context}. Style: calm pastel colors, flat design, professional. No text, no faces. Alt: ${altHint}`;
}

/**
 * 記事用インラインスタイル定義
 */
const ARTICLE_STYLES = {
  article: `max-width:800px;margin:0 auto;padding:24px;font-family:'Hiragino Sans','ヒラギノ角ゴ Pro W3','Noto Sans JP',sans-serif;line-height:1.8;color:#333;`,
  h2: `font-size:1.5em;font-weight:bold;margin:48px 0 24px;color:#1a1a1a;border-bottom:3px solid #8B5CF6;padding-bottom:12px;`,
  h3: `font-size:1.25em;font-weight:bold;margin:32px 0 16px;color:#333;padding-left:12px;border-left:4px solid #A78BFA;`,
  h4: `font-size:1.1em;font-weight:bold;margin:24px 0 12px;color:#444;`,
  p: `margin-bottom:20px;`,
  ul: `margin:20px 0;padding-left:24px;`,
  ol: `margin:20px 0;padding-left:24px;`,
  li: `margin-bottom:8px;`,
  table: `width:100%;border-collapse:collapse;margin:24px 0;`,
  th: `padding:12px;border:1px solid #E5E7EB;text-align:left;background:#F3F4F6;font-weight:bold;`,
  td: `padding:12px;border:1px solid #E5E7EB;`,
  blockquote: `margin:24px 0;padding:20px 24px;background:#F9FAFB;border-left:4px solid #8B5CF6;border-radius:0 8px 8px 0;font-style:italic;color:#444;`,
  details: `margin-bottom:16px;border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;`,
  summary: `padding:16px;background:#F9FAFB;cursor:pointer;font-weight:600;`,
  strong: `font-weight:bold;color:#1a1a1a;`,
  // クラスベースの要素にもスタイルを適用
  intro: `font-size:1.1em;color:#444;margin-bottom:32px;border-left:4px solid #8B5CF6;padding-left:16px;background:#FAFAFA;padding:16px 16px 16px 20px;border-radius:0 8px 8px 0;`,
  highlight: `margin:24px 0;padding:20px;background:#F3F4F6;border-radius:8px;`,
  container: `max-width:800px;margin:0 auto;padding:24px;font-family:'Hiragino Sans','ヒラギノ角ゴ Pro W3','Noto Sans JP',sans-serif;line-height:1.8;color:#333;`,
  'cost-table': `margin:24px 0;overflow-x:auto;`,
};

/**
 * HTMLタグにインラインスタイルを注入
 */
function injectInlineStyles(html: string): string {
  let result = html;

  // articleタグにスタイルを追加
  result = result.replace(/<article(?![^>]*style=)([^>]*)>/gi, `<article style="${ARTICLE_STYLES.article}"$1>`);

  // 既存のstyle属性がないタグにスタイルを追加
  // h2タグ
  result = result.replace(/<h2(?![^>]*style=)([^>]*)>/gi, `<h2 style="${ARTICLE_STYLES.h2}"$1>`);

  // h3タグ
  result = result.replace(/<h3(?![^>]*style=)([^>]*)>/gi, `<h3 style="${ARTICLE_STYLES.h3}"$1>`);

  // h4タグ
  result = result.replace(/<h4(?![^>]*style=)([^>]*)>/gi, `<h4 style="${ARTICLE_STYLES.h4}"$1>`);

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

  // thタグ
  result = result.replace(/<th(?![^>]*style=)([^>]*)>/gi, `<th style="${ARTICLE_STYLES.th}"$1>`);

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
