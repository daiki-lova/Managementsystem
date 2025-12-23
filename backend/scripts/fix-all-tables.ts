import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";

/**
 * テーブルHTMLの構造を修正する
 */
function fixTableHtml(html: string): string {
  return html.replace(/<table[\s\S]*?<\/table>/gi, (tableHtml) => {
    let result = tableHtml;

    // パターン1: <table>直後に<th>があり、その中に<tr>がある構造
    // <table><th><tr>...</tr></th> → <table><thead><tr>...</tr></thead>
    const brokenPattern1 = /(<table[^>]*>)(\s*)<th[^>]*>(\s*)(<tr>[\s\S]*?<\/tr>)(\s*)<\/th>/i;
    if (brokenPattern1.test(result)) {
      result = result.replace(brokenPattern1, '$1$2<thead>$3$4$5</thead>');
    }

    // パターン2: <table>直後に<th>があり、直接内容がある場合（trなし）
    // これは<th>がtheadの代わりに使われている可能性
    const brokenPattern2 = /(<table[^>]*>)\s*<th[^>]*>\s*(?!<tr)/i;
    if (brokenPattern2.test(result) && !result.includes('<thead')) {
      // 最初の<th>から</th>までを削除（壊れたラッパー）
      result = result.replace(/(<table[^>]*>)\s*<th[^>]*>([\s\S]*?)<\/th>/i, (match, table, content) => {
        // 中身に<tr>が含まれていれば、それをtheadで囲む
        if (content.includes('<tr>')) {
          return table + '\n<thead>' + content + '</thead>';
        }
        return table + content;
      });
    }

    // theadの後のtrをtbodyで囲む
    if (result.includes('<thead>') && !result.includes('<tbody>')) {
      result = result.replace(
        /(<\/thead>)(\s*)(<tr>[\s\S]*?)(<\/table>)/i,
        '$1$2<tbody>$3</tbody>$4'
      );
    }

    // スタイル適用（<thead>を<th>に変えないように注意）
    const tableStyle = 'width:100%;border-collapse:collapse;margin:24px 0;';
    result = result.replace(/<table[^>]*>/gi, `<table style="${tableStyle}">`);

    // <th>タグのみにマッチ（<thead>にはマッチしない）
    const thStyle = 'padding:12px 16px;border:1px solid #e5e7eb;text-align:left;font-weight:600;color:#374151;background:#f3f4f6;';
    result = result.replace(/<th(?![ea])[^>]*>/gi, `<th style="${thStyle}">`);

    const tdStyle = 'padding:12px 16px;border:1px solid #e5e7eb;vertical-align:top;';
    result = result.replace(/<td[^>]*>/gi, `<td style="${tdStyle}">`);

    result = result.replace(/<tr[^>]*>/gi, '<tr>');
    result = result.replace(/<thead[^>]*>/gi, '<thead>');
    result = result.replace(/<tbody[^>]*>/gi, '<tbody>');

    return result;
  });
}

async function main() {
  const articles = await prisma.articles.findMany({
    select: { id: true, title: true, blocks: true },
  });

  console.log(`=== 全${articles.length}件の記事をチェック ===\n`);

  let fixedCount = 0;
  // <th(?!ead) は <th> にマッチするが <thead> にはマッチしない
  const brokenPattern = /<table[^>]*>\s*<th(?!ead)[^>]*>/i;

  for (const article of articles) {
    const blocks = article.blocks as any[];
    const htmlBlockIndex = blocks?.findIndex((b: any) => b.type === "html");
    if (htmlBlockIndex === -1 || !blocks) continue;

    const html = blocks[htmlBlockIndex].content as string;

    if (brokenPattern.test(html)) {
      console.log(`修正中: ${article.title.substring(0, 40)}...`);

      // 修正を適用
      const fixedHtml = fixTableHtml(html);

      // 修正結果を確認
      const stillBroken = brokenPattern.test(fixedHtml);
      if (stillBroken) {
        console.log(`  ⚠️ まだ問題あり - 手動確認必要`);
        // デバッグ: 最初のテーブルを表示
        const tableMatch = fixedHtml.match(/<table[\s\S]{0,300}/i);
        if (tableMatch) {
          console.log(`  HTML: ${tableMatch[0].substring(0, 150)}...`);
        }
      } else {
        // DBを更新
        blocks[htmlBlockIndex].content = fixedHtml;
        await prisma.articles.update({
          where: { id: article.id },
          data: { blocks: blocks as any },
        });
        console.log(`  ✅ 修正完了`);
        fixedCount++;
      }
    }
  }

  console.log(`\n=== 完了: ${fixedCount}件を修正 ===`);
  await prisma.$disconnect();
}

main().catch(console.error);
