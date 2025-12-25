import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

// AI臭の本質的な定義（ユーザー定義）:
// - 整いすぎている（同じ語尾の連続、過度な統一感）
// - ハルシネーション（嘘の情報）→ 自動検出困難
// - 矛盾・統一感のなさ → 自動検出困難
//
// 「かもしれません」「また、」等のフレーズは人間も普通に使うため、AI臭とは見なさない

interface EvaluationResult {
  title: string;
  articleId: string;
  scores: {
    seo: { score: number; max: 20; details: string[] };
    llmo: { score: number; max: 15; details: string[] };
    textVolume: { score: number; max: 15; details: string[] };
    infoBankDuplication: { score: number; max: 15; details: string[] };
    redundancy: { score: number; max: 10; details: string[] };
    aiSmell: { score: number; max: 10; details: string[] };
    other: { score: number; max: 15; details: string[] };
  };
  total: number;
}

function extractTextFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function evaluateSEO(html: string, title: string, keyword: string): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];

  // タイトルにキーワード含有（5点）
  const keywordParts = keyword.split(/\s+/);
  const titleHasKeyword = keywordParts.some(k => title.includes(k));
  if (titleHasKeyword) {
    score += 5;
  } else {
    details.push("タイトルにキーワードなし (-5)");
  }

  // H2/H3見出しにキーワード適切配置（5点）
  const h2Matches = html.match(/<h2[^>]*>([^<]+)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>([^<]+)<\/h3>/gi) || [];
  const headings = [...h2Matches, ...h3Matches].map(h => h.replace(/<[^>]+>/g, ""));
  const headingsWithKeyword = headings.filter(h => keywordParts.some(k => h.includes(k)));
  if (headingsWithKeyword.length >= 2) {
    score += 5;
  } else if (headingsWithKeyword.length === 1) {
    score += 3;
    details.push("見出しのキーワード使用が少ない (-2)");
  } else {
    details.push("見出しにキーワードなし (-5)");
  }

  // 導入文でキーワード使用（3点）
  const firstParagraph = html.match(/<p[^>]*>([^<]{50,})<\/p>/i);
  if (firstParagraph && keywordParts.some(k => firstParagraph[1].includes(k))) {
    score += 3;
  } else {
    details.push("導入文にキーワードなし (-3)");
  }

  // 見出し階層の正しさ（4点）
  const headingOrder = html.match(/<h[2-6]/gi) || [];
  let hierarchyCorrect = true;
  let lastLevel = 2;
  for (const h of headingOrder) {
    const level = parseInt(h.replace("<h", ""));
    if (level > lastLevel + 1) {
      hierarchyCorrect = false;
      break;
    }
    lastLevel = level;
  }
  if (hierarchyCorrect && headingOrder.length > 0) {
    score += 4;
  } else {
    details.push("見出し階層が不正 (-4)");
  }

  // 内部リンク・関連記事への誘導（3点）
  const hasInternalLinks = html.includes('href="/') || html.includes("関連記事");
  if (hasInternalLinks) {
    score += 3;
  } else {
    details.push("内部リンクなし (-3)");
  }

  return { score, details };
}

function evaluateLLMO(html: string): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];

  // 明確な定義・説明文の存在（5点）
  const hasDefinition = html.includes("とは") || html.includes("定義") || html.includes("意味");
  if (hasDefinition) {
    score += 5;
  } else {
    details.push("明確な定義文なし (-5)");
  }

  // FAQ形式のQ&Aセクション（3点）
  const hasFAQ = html.includes("Q.") || html.includes("Q：") ||
                 html.includes("よくある質問") || html.includes("FAQ");
  if (hasFAQ) {
    score += 3;
  } else {
    details.push("FAQ形式なし (-3)");
  }

  // 構造化リスト・表の活用（4点）
  const hasList = html.includes("<ul") || html.includes("<ol");
  const hasTable = html.includes("<table");
  if (hasList && hasTable) {
    score += 4;
  } else if (hasList || hasTable) {
    score += 2;
    details.push("リストまたは表が不足 (-2)");
  } else {
    details.push("リスト・表なし (-4)");
  }

  // 引用されやすい短い結論文（3点）
  const hasConclusion = html.includes("まとめ") || html.includes("結論") ||
                        html.includes("ポイント");
  if (hasConclusion) {
    score += 3;
  } else {
    details.push("明確なまとめなし (-3)");
  }

  return { score, details };
}

function evaluateTextVolume(html: string): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];

  const text = extractTextFromHtml(html);
  const charCount = text.length;

  // 全体文字数（4500字以上で満点8点、4000字で6点、3000字で4点、1500字未満は0点）
  if (charCount >= 4500) {
    score += 8;
  } else if (charCount >= 4000) {
    score += 6;
    details.push(`文字数${charCount}字 (4500字未満 -2)`);
  } else if (charCount >= 3000) {
    score += 4;
    details.push(`文字数${charCount}字 (4000字未満 -4)`);
  } else if (charCount >= 1500) {
    score += 2;
    details.push(`文字数${charCount}字 (3000字未満 -6)`);
  } else {
    details.push(`文字数${charCount}字 (1500字未満 -8)`);
  }

  // 各H2セクションの最低文字数（4点）
  const h2Sections = html.split(/<h2/i).slice(1);
  const shortSections = h2Sections.filter(section => {
    const sectionText = extractTextFromHtml(section.split(/<h2/i)[0] || section);
    return sectionText.length < 300;
  });
  if (shortSections.length === 0 && h2Sections.length > 0) {
    score += 4;
  } else if (shortSections.length <= 1) {
    score += 2;
    details.push("短いセクションあり (-2)");
  } else {
    details.push(`短いセクション${shortSections.length}個 (-4)`);
  }

  // 空セクション・極端に短いセクションがない（3点）
  const emptyH2 = h2Sections.filter(section => {
    const sectionText = extractTextFromHtml(section.split(/<h2/i)[0] || section);
    return sectionText.length < 100;
  });
  if (emptyH2.length === 0) {
    score += 3;
  } else {
    details.push(`空に近いセクション${emptyH2.length}個 (-3)`);
  }

  return { score, details };
}

async function evaluateInfoBankDuplication(
  articleId: string,
  html: string,
  allArticlesQuotes: Map<string, { id: string; quotes: string[] }>
): Promise<{ score: number; details: string[] }> {
  let score = 15;
  const details: string[] = [];

  // 体験談を抽出
  const quotes = html.match(/「[^」]{20,100}」/g) || [];

  // 他記事との重複チェック（8点）
  let duplicateCount = 0;
  for (const [otherId, otherData] of allArticlesQuotes) {
    if (otherId === articleId) continue;
    for (const quote of quotes) {
      if (otherData.quotes.includes(quote)) {
        duplicateCount++;
        if (duplicateCount <= 2) {
          details.push(`他記事と重複: ${quote.substring(0, 30)}...`);
        }
      }
    }
  }
  if (duplicateCount > 0) {
    const deduction = Math.min(8, duplicateCount * 3);
    score -= deduction;
    details.push(`他記事との重複${duplicateCount}件 (-${deduction})`);
  }

  // 同じ仮名の使い回しチェック（7点）
  const namePatterns = html.match(/[（(][^）)]{1,10}さん[、,][0-9０-９]+代[）)]/g) || [];
  const uniqueNames = new Set(namePatterns);
  if (namePatterns.length > uniqueNames.size + 1) {
    const deduction = Math.min(7, (namePatterns.length - uniqueNames.size) * 2);
    score -= deduction;
    details.push(`同じ人物設定の重複使用 (-${deduction})`);
  }

  return { score: Math.max(0, score), details };
}

function evaluateRedundancy(html: string): { score: number; details: string[] } {
  let score = 10;
  const details: string[] = [];

  const text = extractTextFromHtml(html);

  // 同じフレーズの過剰使用チェック（3点）
  const phrases = text.match(/.{10,20}/g) || [];
  const phraseCounts = new Map<string, number>();
  for (const phrase of phrases) {
    const count = (phraseCounts.get(phrase) || 0) + 1;
    phraseCounts.set(phrase, count);
  }
  const repeatedPhrases = [...phraseCounts.entries()].filter(([_, count]) => count >= 3);
  if (repeatedPhrases.length > 0) {
    score -= 3;
    details.push(`同じフレーズの繰り返し${repeatedPhrases.length}件 (-3)`);
  }

  // 同じストーリーパターンの繰り返しチェック（5点）
  const storyPatterns = [
    /最初は[^。]+だった[^。]*。[^。]*今では/g,
    /始めた[^。]+きっかけ[^。]*。/g,
    /不安[^。]+でしたが[^。]*今では/g,
  ];
  let patternRepeatCount = 0;
  for (const pattern of storyPatterns) {
    const matches = text.match(pattern) || [];
    if (matches.length >= 2) {
      patternRepeatCount++;
    }
  }
  if (patternRepeatCount > 0) {
    const deduction = Math.min(5, patternRepeatCount * 2);
    score -= deduction;
    details.push(`似たストーリーパターンの繰り返し (-${deduction})`);
  }

  // 各セクションで新しい価値を提供（2点）
  const h2Sections = html.split(/<h2/i).slice(1);
  const sectionTexts = h2Sections.map(s => extractTextFromHtml(s).substring(0, 200));
  const similarSections = sectionTexts.filter((text, i) =>
    sectionTexts.slice(i + 1).some(other => {
      const overlap = text.split("").filter(c => other.includes(c)).length;
      return overlap > text.length * 0.7;
    })
  );
  if (similarSections.length > 0) {
    score -= 2;
    details.push("セクション間の内容が類似 (-2)");
  }

  return { score: Math.max(0, score), details };
}

function evaluateAISmell(html: string): { score: number; details: string[] } {
  let score = 10;
  const details: string[] = [];

  // AI臭 = 「整いすぎている」ことを検出
  // フレーズリストは削除（「かもしれません」等は人間も使う普通の表現）

  // 同じ語尾の連続チェック（5点）- 整いすぎの検出
  const text = extractTextFromHtml(html);
  const sentences = text.split(/[。！？]/);
  let maxConsecutive = 0;
  let currentConsecutive = 1;
  let lastEnding = "";

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length < 5) continue;
    const ending = trimmed.slice(-3);
    if (ending === lastEnding) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      lastEnding = ending;
      currentConsecutive = 1;
    }
  }

  if (maxConsecutive >= 4) {
    score -= 5;
    details.push(`同じ語尾が${maxConsecutive}回連続（整いすぎ） (-5)`);
  } else if (maxConsecutive >= 3) {
    score -= 3;
    details.push(`同じ語尾が${maxConsecutive}回連続 (-3)`);
  }

  // 段落の長さの均一性チェック（5点）- 整いすぎの検出
  const paragraphs = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
  const lengths = paragraphs.map(p => extractTextFromHtml(p).length).filter(l => l > 20);
  if (lengths.length >= 5) {
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / avg;

    // 変動係数が0.2未満 = 長さが揃いすぎている
    if (coefficientOfVariation < 0.15) {
      score -= 5;
      details.push("段落の長さが均一すぎる（整いすぎ） (-5)");
    } else if (coefficientOfVariation < 0.2) {
      score -= 2;
      details.push("段落の長さがやや均一 (-2)");
    }
  }

  return { score: Math.max(0, score), details };
}

function evaluateOther(html: string): { score: number; details: string[] } {
  let score = 0;
  const details: string[] = [];

  // 具体性: 数字・データ・具体例の有無（5点）
  const hasNumbers = /[0-9０-９]+[%％分時間回個人年名本秒週月日歳代以上]/.test(html);
  const hasSpecificExample = html.includes("例えば") || html.includes("具体的に") ||
                             html.includes("実際に") || html.includes("累計");
  if (hasNumbers && hasSpecificExample) {
    score += 5;
  } else if (hasNumbers || hasSpecificExample) {
    score += 3;
    details.push("具体例または数値が不足 (-2)");
  } else {
    details.push("具体性に欠ける (-5)");
  }

  // 信頼性: 監修者引用/プロフィールが適切にある（3点）
  const blockquoteCount = (html.match(/<blockquote/g) || []).length;
  const hasAuthorAside = html.includes("監修者プロフィール") || html.includes("監修者：");
  if (blockquoteCount >= 1 && blockquoteCount <= 2) {
    score += 3;
  } else if (hasAuthorAside) {
    // blockquoteはないが監修者プロフィールがあればOK
    score += 3;
  } else if (blockquoteCount === 0) {
    details.push("監修者引用なし (-3)");
  } else {
    score += 1;
    details.push(`監修者引用${blockquoteCount}回は多すぎ (-2)`);
  }

  // 導入文の質: 最初の100字で読者を引き込む（3点）
  const firstParagraphMatch = html.match(/<p[^>]*>([^<]+)<\/p>/i);
  const firstParagraph = firstParagraphMatch ? firstParagraphMatch[1] : "";
  const hasHook = firstParagraph.includes("？") || firstParagraph.includes("悩") ||
                  firstParagraph.includes("方法") || firstParagraph.includes("解決") ||
                  firstParagraph.includes("——") || firstParagraph.includes("「") ||
                  firstParagraph.includes("...") || firstParagraph.includes("…");
  if (hasHook && firstParagraph.length >= 50) {
    score += 3;
  } else if (firstParagraph.length >= 50) {
    score += 1;
    details.push("導入文のフックが弱い (-2)");
  } else {
    details.push("導入文が短い/フックなし (-3)");
  }

  // CTA: 読者の次のアクションを促す文がある（2点）
  const hasCTA = html.includes("試してみ") || html.includes("始めてみ") ||
                 html.includes("チェック") || html.includes("おすすめ");
  if (hasCTA) {
    score += 2;
  } else {
    details.push("CTAなし (-2)");
  }

  // 画像配置: IMAGE_PLACEHOLDERまたはimgタグの適切な配置（2点）
  const imageCount = (html.match(/<img|IMAGE_PLACEHOLDER/g) || []).length;
  const h2Count = (html.match(/<h2/gi) || []).length;
  if (imageCount >= h2Count && imageCount > 0) {
    score += 2;
  } else if (imageCount > 0) {
    score += 1;
    details.push("画像が少ない (-1)");
  } else {
    details.push("画像なし (-2)");
  }

  return { score, details };
}

async function evaluateArticles() {
  console.log("=== 新評価基準での記事採点 ===\n");

  // 最新10記事を取得
  const articles = await prisma.articles.findMany({
    orderBy: { createdAt: "desc" },
    take: 1,
    select: {
      id: true,
      title: true,
      blocks: true,
      createdAt: true,
      generation_jobs: {
        select: { keyword: true }
      }
    }
  });

  // 全記事の体験談を事前に抽出（重複チェック用）
  const allArticlesQuotes = new Map<string, { id: string; quotes: string[] }>();
  for (const article of articles) {
    const blocks = article.blocks as any[];
    const htmlBlock = blocks?.find(b => b.type === "html");
    if (htmlBlock?.content) {
      const quotes = htmlBlock.content.match(/「[^」]{20,100}」/g) || [];
      allArticlesQuotes.set(article.id, { id: article.id, quotes });
    }
  }

  const results: EvaluationResult[] = [];

  for (const article of articles) {
    const blocks = article.blocks as any[];
    const htmlBlock = blocks?.find(b => b.type === "html");

    if (!htmlBlock?.content) continue;

    const html = htmlBlock.content;
    const keyword = article.generation_jobs?.keyword || "";

    const seo = evaluateSEO(html, article.title, keyword);
    const llmo = evaluateLLMO(html);
    const textVolume = evaluateTextVolume(html);
    const infoBankDuplication = await evaluateInfoBankDuplication(article.id, html, allArticlesQuotes);
    const redundancy = evaluateRedundancy(html);
    const aiSmell = evaluateAISmell(html);
    const other = evaluateOther(html);

    const total = seo.score + llmo.score + textVolume.score +
                  infoBankDuplication.score + redundancy.score + aiSmell.score + other.score;

    results.push({
      title: article.title,
      articleId: article.id,
      scores: {
        seo: { score: seo.score, max: 20, details: seo.details },
        llmo: { score: llmo.score, max: 15, details: llmo.details },
        textVolume: { score: textVolume.score, max: 15, details: textVolume.details },
        infoBankDuplication: { score: infoBankDuplication.score, max: 15, details: infoBankDuplication.details },
        redundancy: { score: redundancy.score, max: 10, details: redundancy.details },
        aiSmell: { score: aiSmell.score, max: 10, details: aiSmell.details },
        other: { score: other.score, max: 15, details: other.details },
      },
      total,
    });
  }

  // スコア順にソート
  results.sort((a, b) => b.total - a.total);

  // サマリーテーブル
  console.log("┌────┬───────────────────────────────────────────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬───────┐");
  console.log("│ #  │ タイトル                                 │ SEO │LLMO │文量 │重複 │冗長 │AI臭│その他│ 合計  │");
  console.log("├────┼───────────────────────────────────────────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼───────┤");

  results.forEach((r, i) => {
    const shortTitle = r.title.length > 35 ? r.title.substring(0, 32) + "..." : r.title.padEnd(35);
    const rank = (i + 1).toString().padStart(2);
    console.log(
      `│ ${rank} │ ${shortTitle} │` +
      ` ${r.scores.seo.score.toString().padStart(3)} │` +
      ` ${r.scores.llmo.score.toString().padStart(3)} │` +
      ` ${r.scores.textVolume.score.toString().padStart(3)} │` +
      ` ${r.scores.infoBankDuplication.score.toString().padStart(3)} │` +
      ` ${r.scores.redundancy.score.toString().padStart(3)} │` +
      ` ${r.scores.aiSmell.score.toString().padStart(3)} │` +
      ` ${r.scores.other.score.toString().padStart(3)} │` +
      ` ${r.total.toString().padStart(3)}点 │`
    );
  });

  console.log("└────┴───────────────────────────────────────────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┴───────┘");

  // 配点説明
  console.log("\n【配点】SEO:20 / LLMO:15 / 文量:15 / 重複:15 / 冗長:10 / AI臭:10 / その他:15 = 100点\n");

  // 平均スコア
  const avgScore = results.reduce((sum, r) => sum + r.total, 0) / results.length;
  console.log(`📊 平均スコア: ${avgScore.toFixed(1)}点\n`);

  // 詳細な問題点（上位3件と下位3件）
  console.log("=== 詳細レポート ===\n");

  for (const r of results) {
    const emoji = r.total >= 85 ? "🏆" : r.total >= 70 ? "✅" : r.total >= 50 ? "⚠️" : "❌";
    console.log(`${emoji} ${r.title.substring(0, 50)}`);
    console.log(`   合計: ${r.total}点`);

    const allDetails = [
      ...r.scores.seo.details.map(d => `[SEO] ${d}`),
      ...r.scores.llmo.details.map(d => `[LLMO] ${d}`),
      ...r.scores.textVolume.details.map(d => `[文量] ${d}`),
      ...r.scores.infoBankDuplication.details.map(d => `[重複] ${d}`),
      ...r.scores.redundancy.details.map(d => `[冗長] ${d}`),
      ...r.scores.aiSmell.details.map(d => `[AI臭] ${d}`),
      ...r.scores.other.details.map(d => `[その他] ${d}`),
    ];

    if (allDetails.length > 0) {
      allDetails.slice(0, 8).forEach(d => console.log(`   - ${d}`));
      if (allDetails.length > 8) {
        console.log(`   ... 他${allDetails.length - 8}件の問題`);
      }
    } else {
      console.log("   - 問題なし");
    }
    console.log("");
  }

  await prisma.$disconnect();
}

evaluateArticles().catch(console.error);
