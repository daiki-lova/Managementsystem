// テキスト処理ユーティリティ
// - 仮名生成
// - AI臭フレーズの検出・修正
// - 個人情報の匿名化

// ========================================
// 仮名生成（個人情報保護）
// ========================================

const PSEUDONYMS_FEMALE = [
  "美咲", "陽菜", "結衣", "さくら", "真由", "愛", "彩花", "莉子", "千尋", "優花",
  "琴美", "麻衣", "奈々", "あかり", "ひかり", "みゆき", "ゆうこ", "なつみ", "まなみ", "あやか",
  "えり", "かな", "のぞみ", "ゆり", "みさき", "ともか", "ちさと", "あすか", "かおり", "めぐみ"
];

const PSEUDONYMS_INITIAL = [
  "A.S.", "M.K.", "Y.T.", "S.H.", "K.M.", "R.N.", "E.O.", "H.Y.", "N.I.", "T.A.",
  "C.W.", "L.F.", "P.G.", "D.B.", "J.R.", "V.L.", "B.C.", "F.D.", "G.E.", "I.H."
];

// 英語イニシャル（J.D.など）から仮名を生成
export function generatePseudonym(originalName: string, seed?: number): string {
  // シード値がない場合は名前からハッシュを生成
  const seedValue = seed ?? hashString(originalName);

  // イニシャル形式かどうかを判定（例: J.D., A.S.など）
  const isInitialFormat = /^[A-Z]\.[A-Z]\.?$/i.test(originalName.trim());

  if (isInitialFormat) {
    // イニシャル形式の場合は日本の名前に変換
    const index = seedValue % PSEUDONYMS_FEMALE.length;
    return PSEUDONYMS_FEMALE[index];
  }

  // 日本語名の場合はそのまま仮名を生成
  const index = seedValue % PSEUDONYMS_FEMALE.length;
  return PSEUDONYMS_FEMALE[index];
}

// 文字列からシンプルなハッシュ値を生成
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32bit整数に変換
  }
  return Math.abs(hash);
}

// 受講生の声から名前を抽出して仮名に置換
export function anonymizeStudentVoice(content: string): {
  anonymizedContent: string;
  pseudonym: string;
  originalName: string | null;
} {
  // 名前パターンを検索（様々な形式に対応）
  const namePatterns = [
    /(?:受講生|卒業生)(?:の)?([A-Z]\.[A-Z]\.?|[A-Za-z]+)さん/gi,
    /^([A-Z]\.[A-Z]\.?)さん/gim,
    /【([A-Z]\.[A-Z]\.?|[ぁ-んァ-ヶ一-龥]+)さん(?:の声)?】/gi,
  ];

  let originalName: string | null = null;
  let pseudonym = PSEUDONYMS_FEMALE[Math.floor(Math.random() * PSEUDONYMS_FEMALE.length)];
  let anonymizedContent = content;

  for (const pattern of namePatterns) {
    const match = pattern.exec(content);
    if (match && match[1]) {
      originalName = match[1];
      pseudonym = generatePseudonym(originalName);
      // 全ての出現箇所を置換
      anonymizedContent = content.replace(new RegExp(escapeRegex(originalName), 'g'), pseudonym);
      break;
    }
  }

  return { anonymizedContent, pseudonym, originalName };
}

// 正規表現のエスケープ
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ========================================
// AI臭フレーズの検出・回避
// ========================================

// 避けるべきフレーズ（AI生成感が強い）
export const PHRASES_TO_AVOID = [
  // 過剰な推量表現
  "といえるでしょう",
  "ではないでしょうか",
  "かもしれません",
  "と言っても過言ではありません",
  "と考えられます",

  // 過剰な確認・同意要求
  "ですよね",
  "ではありませんか",
  "と思いませんか",

  // 空虚な強調
  "まさに",
  "非常に",
  "大変",
  "とても素晴らしい",
  "まさしく",
  "極めて",
  "実に",
  "素晴らしい",
  "すばらしい",

  // 定型的な接続
  "また、",
  "そして、",
  "さらに、",
  "加えて、",

  // 過剰な謙遜・婉曲
  "させていただきます",
  "してまいります",
];

// 記事間で重複使用を避けるべきフレーズ
export const UNIQUE_PHRASES_POOL = [
  // 導入フレーズ（記事ごとに1つ選択）
  [
    "今回は、",
    "この記事では、",
    "ここでは、",
    "さっそく、",
    "早速ですが、",
  ],
  // 締めフレーズ（記事ごとに1つ選択）
  [
    "ぜひ参考にしてみてください。",
    "最初の一歩を踏み出してみませんか。",
    "あなたも始めてみてはいかがでしょうか。",
    "きっと新しい発見があるはずです。",
    "あなたの挑戦を応援しています。",
  ],
];

// ========================================
// 監修者引用の制限
// ========================================

export const SUPERVISOR_QUOTE_RULES = `
【監修者引用ルール（厳守）】
- 監修者の直接引用（blockquote形式）は記事全体で**1回のみ**
- 引用は記事の中盤〜後半に1箇所だけ配置
- 監修者の見解は地の文で自然に織り込む（引用形式にしない）
- 「〇〇先生によると」「〇〇氏は〜と述べている」などの間接話法を使う
- 記事末尾の監修者プロフィールは引用カウントに含まない
`;

// ========================================
// 自然な日本語表現のガイドライン
// ========================================

export const NATURAL_JAPANESE_GUIDELINES = `
【自然な日本語のためのルール】

■ 語尾のバリエーション（同じ語尾を3回連続で使わない）
- 「です」「ます」「でした」「ました」
- 「ですね」「ますね」（親しみを込める場合のみ、使いすぎ注意）
- 「〜しょう」「〜ましょう」（提案・勧誘）
- 「〜ください」「〜てみてください」（依頼・推奨）
- 体言止め（名詞で終わる）「〜というポイント。」
- 「〜のです」「〜んです」（説明・強調）

■ 避けるべき表現（AI臭が強い）
- ❌「といえるでしょう」→ ✅「と言えます」「です」
- ❌「ではないでしょうか」→ ✅「と思います」「でしょう」
- ❌「非常に」「大変」の多用 → ✅ 具体的な形容（「30分で効果を実感」など）
- ❌「させていただきます」→ ✅「します」「いたします」
- ❌「まさに」の多用 → ✅ 削除するか具体的な表現に

■ 接続詞のバリエーション
- 逆接: 「しかし」「ただ」「一方で」「とはいえ」「ところが」
- 順接: 「そのため」「だから」「なので」（口語的）
- 添加: 「加えて」「その上」「しかも」
- 転換: 「ところで」「さて」「話は変わりますが」
- 例示: 「たとえば」「具体的には」「一例を挙げると」

■ 人間らしい表現のコツ
- 完璧すぎない文を書く（少し口語的な表現を混ぜる）
- 一文を短くする（40〜60字を基本に）
- 読点（、）を適度に入れる（息継ぎポイント）
- 体験や感情を交える（「私も最初は不安でした」など）
`;

// ========================================
// 参考文献フォーマット
// ========================================

export const REFERENCE_FORMAT_RULES = `
【参考文献の記載ルール】

■ 形式
1. Web記事の場合:
   「記事タイトル」サイト名（参照日: YYYY年MM月）

2. 公的機関の場合:
   「資料名」発行機関（発行年）

3. 統計データの場合:
   「統計名 YYYY年版」発行機関

■ 注意事項
- URLは記載しない（変更される可能性があるため）
- 参照日を明記する
- 信頼性の高い情報源を優先（公的機関、学術機関、業界団体）
- Web検索で取得した情報は必ず出典を明記
- 「〜によると」「〜のデータでは」と本文中でも言及
`;

// ========================================
// コンテンツ品質チェック
// ========================================

export interface QualityCheckResult {
  score: number;
  issues: string[];
  suggestions: string[];
}

export function checkContentQuality(html: string): QualityCheckResult {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // AI臭フレーズの検出
  for (const phrase of PHRASES_TO_AVOID) {
    const count = (html.match(new RegExp(phrase, 'g')) || []).length;
    if (count > 0) {
      issues.push(`「${phrase}」が${count}回使用されています`);
      score -= count * 3;
    }
  }

  // 監修者引用の回数チェック
  const blockquoteCount = (html.match(/<blockquote/g) || []).length;
  if (blockquoteCount > 2) {
    issues.push(`blockquoteが${blockquoteCount}回使用されています（推奨: 1〜2回）`);
    score -= (blockquoteCount - 2) * 5;
  }

  // 同じ語尾の連続チェック
  const sentences = html.replace(/<[^>]+>/g, '').split(/[。！？]/);
  let sameEndingCount = 0;
  let lastEnding = '';
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 5) continue;
    const ending = trimmed.slice(-3);
    if (ending === lastEnding) {
      sameEndingCount++;
    } else {
      lastEnding = ending;
      sameEndingCount = 0;
    }
    if (sameEndingCount >= 2) {
      issues.push('同じ語尾が3回以上連続しています');
      score -= 5;
      break;
    }
  }

  // IMAGE_PLACEHOLDERの残存チェック
  if (html.includes('IMAGE_PLACEHOLDER')) {
    issues.push('IMAGE_PLACEHOLDERが残存しています');
    score -= 10;
  }

  // スコアが0未満にならないように
  score = Math.max(0, score);

  // 改善提案
  if (score < 90) {
    suggestions.push('AI臭の強いフレーズを削減してください');
    suggestions.push('語尾のバリエーションを増やしてください');
  }

  return { score, issues, suggestions };
}
