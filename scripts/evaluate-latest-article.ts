import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function evaluateArticle() {
  const article = await prisma.articles.findUnique({
    where: { id: "b668681b-bac3-4f8c-838b-da42ea079bee" }
  });

  if (!article) {
    console.log("記事が見つかりません");
    return;
  }

  const blocks = article.blocks as { content?: string }[] | null;
  const html = blocks?.[0]?.content || "";

  console.log("============================================================");
  console.log("📊 記事品質評価レポート");
  console.log("============================================================");
  console.log();
  console.log("タイトル:", article.title);
  console.log();

  let score = 100;
  const issues: string[] = [];
  const goods: string[] = [];

  // 1. 文字数チェック
  const textOnly = html.replace(/<[^>]*>/g, "");
  const charCount = textOnly.length;
  console.log("【1. コンテンツ量】");
  console.log("   本文文字数:", charCount, "文字");
  if (charCount >= 8000) {
    goods.push("✅ 十分な文字数（8000文字以上）");
  } else if (charCount >= 5000) {
    goods.push("⚠️ 文字数はやや少なめ（5000-8000文字）");
    score -= 5;
  } else {
    issues.push("❌ 文字数不足（5000文字未満）");
    score -= 15;
  }

  // 2. 見出し構造チェック
  console.log();
  console.log("【2. 見出し構造】");
  const h2Count = (html.match(/<h2/g) || []).length;
  const h3Count = (html.match(/<h3/g) || []).length;
  console.log("   H2タグ:", h2Count, "個");
  console.log("   H3タグ:", h3Count, "個");

  if (h2Count >= 5) {
    goods.push("✅ H2見出しが十分（5個以上）");
  } else if (h2Count >= 3) {
    goods.push("⚠️ H2見出しはやや少なめ");
    score -= 5;
  } else {
    issues.push("❌ H2見出し不足");
    score -= 10;
  }

  // 3. モノトーンスタイルチェック
  console.log();
  console.log("【3. モノトーンスタイル】");
  const colorMatches = html.match(/color:\s*#[0-9a-f]{3,6}/gi) || [];
  console.log("   カラー指定:", colorMatches.length, "箇所");

  const badColors = colorMatches.filter((c) => {
    const color = c.toLowerCase();
    const isMonotone =
      color.includes("#333") ||
      color.includes("#666") ||
      color.includes("#999") ||
      color.includes("#fff") ||
      color.includes("#000") ||
      color.includes("#f");
    return !isMonotone;
  });

  if (badColors.length === 0) {
    goods.push("✅ モノトーンスタイル統一");
  } else {
    console.log("   非モノトーン色:", badColors.slice(0, 5).join(", "));
    issues.push("⚠️ 一部非モノトーン色あり");
    score -= 5;
  }

  // 4. テーブル構造チェック
  console.log();
  console.log("【4. テーブル構造】");
  const tableCount = (html.match(/<table/g) || []).length;
  console.log("   テーブル数:", tableCount, "個");

  if (tableCount > 0) {
    const hasProperTable = html.includes("<thead") || html.includes("<th");
    if (hasProperTable) {
      goods.push("✅ テーブル構造が正常");
    } else {
      issues.push("⚠️ テーブルにtheadがない");
      score -= 5;
    }
  }

  // 5. 内部リンク・CTAチェック
  console.log();
  console.log("【5. CTA・内部リンク】");
  const ctaBanner = (html.match(/cta-banner/gi) || []).length;
  const ctaText = (html.match(/資料請求|無料|お申し込み/gi) || []).length;
  console.log("   CTAバナー:", ctaBanner, "個");
  console.log("   CTA関連テキスト:", ctaText, "個");

  if (ctaBanner >= 1) {
    goods.push("✅ CTAバナーが含まれている");
  } else if (ctaText >= 1) {
    goods.push("⚠️ CTAテキストあり（バナーなし）");
  } else {
    issues.push("⚠️ CTAが見つからない");
    score -= 5;
  }

  // 6. FAQ構造チェック
  console.log();
  console.log("【6. FAQ】");
  const hasFaq = html.includes("FAQ") || html.includes("よくある質問");
  console.log("   FAQ:", hasFaq ? "あり" : "なし");

  if (hasFaq) {
    goods.push("✅ FAQセクションあり");
  }

  // 7. 監修者引用チェック
  console.log();
  console.log("【7. 監修者引用】");
  const hasBlockquote = html.includes("<blockquote");
  console.log("   blockquote:", hasBlockquote ? "あり" : "なし");

  if (hasBlockquote) {
    goods.push("✅ 監修者引用（blockquote）あり");
  }

  // 8. 画像チェック
  console.log();
  console.log("【8. 画像】");
  const imgCount = (html.match(/<img/g) || []).length;
  console.log("   img タグ:", imgCount, "個");

  if (imgCount >= 3) {
    goods.push("✅ 画像が十分（3枚以上）");
  } else if (imgCount >= 1) {
    goods.push("⚠️ 画像は少なめ");
  } else {
    issues.push("⚠️ 画像がない");
  }

  // 9. SEOメタ情報
  console.log();
  console.log("【9. SEOメタ情報】");
  console.log("   metaTitle:", article.metaTitle ? "設定済み" : "未設定");
  console.log("   metaDescription:", article.metaDescription ? "設定済み" : "未設定");

  if (article.metaTitle && article.metaDescription) {
    goods.push("✅ SEOメタ情報完備");
  } else {
    issues.push("❌ SEOメタ情報不足");
    score -= 10;
  }

  // 最終スコア
  console.log();
  console.log("============================================================");
  console.log("📈 総合評価");
  console.log("============================================================");
  console.log();
  console.log("🏆 スコア:", score, "/ 100点");
  console.log();

  if (goods.length > 0) {
    console.log("【良い点】");
    goods.forEach((g) => console.log("  ", g));
  }

  if (issues.length > 0) {
    console.log();
    console.log("【改善点】");
    issues.forEach((i) => console.log("  ", i));
  }

  console.log();
  if (score >= 90) {
    console.log("📝 評価: 優秀 - 高品質な記事です");
  } else if (score >= 75) {
    console.log("📝 評価: 良好 - 軽微な改善で更に良くなります");
  } else if (score >= 60) {
    console.log("📝 評価: 普通 - いくつかの改善が必要です");
  } else {
    console.log("📝 評価: 要改善 - 大幅な修正が必要です");
  }

  await prisma.$disconnect();
}

evaluateArticle().catch(console.error);
