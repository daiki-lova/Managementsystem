import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";
import * as fs from "fs";
import { randomUUID } from "crypto";

// MIO先生のブログCSVを情報バンクに登録するスクリプト
async function main() {
  const csvPath = "/Users/daiki/Downloads/シークエンス！講師の日記 - MIOさんブログ.csv";
  const content = fs.readFileSync(csvPath, "utf-8");

  // CSVを行単位で分割
  const lines = content.split("\n");

  // ブログエントリを抽出
  const entries: { date: string; content: string }[] = [];
  let currentDate = "";
  let currentContent = "";
  let inContent = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // 日付行を検出 (例: "2024.6.11,,,,,,,,,,")
    const dateMatch = line.match(/^(\d{4}\.\d{1,2}\.\d{1,2})/);
    if (dateMatch) {
      // 前のエントリを保存
      if (currentDate && currentContent.trim()) {
        entries.push({ date: currentDate, content: currentContent.trim() });
      }
      currentDate = dateMatch[1];
      currentContent = "";
      inContent = false;
      continue;
    }

    // コンテンツ開始を検出 (引用符で始まる行)
    if (line.startsWith('"') && !inContent) {
      inContent = true;
      currentContent = line.substring(1); // 先頭の引用符を除去
      continue;
    }

    // コンテンツ終了を検出 (引用符で終わる行)
    if (inContent && (line.endsWith('",,,,,,,,,,"') || line.endsWith('",,,,,,,,,,') || line.endsWith('",,,,,,,,,,'))) {
      currentContent += "\n" + line.replace(/[",]+$/, ""); // 末尾の引用符とカンマを除去
      inContent = false;
      continue;
    }

    // コンテンツ中
    if (inContent) {
      currentContent += "\n" + line;
    }
  }

  // 最後のエントリを保存
  if (currentDate && currentContent.trim()) {
    entries.push({ date: currentDate, content: currentContent.trim() });
  }

  console.log(`\n=== ${entries.length}件のブログエントリを検出 ===\n`);

  // 武川未央先生のIDを取得
  const author = await prisma.authors.findFirst({
    where: { name: { contains: "武川" } }
  });

  if (!author) {
    console.error("武川未央先生が見つかりません");
    await prisma.$disconnect();
    return;
  }

  console.log(`監修者: ${author.name} (${author.id})`);

  // RADIANCEブランドのIDを取得
  const brand = await prisma.brands.findFirst({
    where: { name: { contains: "RADIANCE" } }
  });

  if (!brand) {
    console.error("RADIANCEブランドが見つかりません");
    await prisma.$disconnect();
    return;
  }

  console.log(`ブランド: ${brand.name} (${brand.id})\n`);

  // 各エントリを情報バンクに登録
  let created = 0;
  for (const entry of entries) {
    // 日付をパース (例: "2024.6.11" -> "2024-06-11")
    const [year, month, day] = entry.date.split(".");
    const formattedDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

    // タイトルを生成 (最初の質問または内容の先頭から)
    const firstQuestion = entry.content.match(/⚫︎(.+?)[\n\r]/);
    const title = firstQuestion
      ? `MIO先生ブログ ${formattedDate} - ${firstQuestion[1].substring(0, 30)}...`
      : `MIO先生ブログ ${formattedDate}`;

    try {
      // コンテンツのクリーンアップ（末尾のカンマなどを除去）
      const cleanContent = entry.content
        .replace(/[",]+$/, "")
        .replace(/\r\n/g, "\n")
        .replace(/,,+/g, "")
        .trim();

      // 空のコンテンツはスキップ
      if (cleanContent.length < 50) {
        console.log(`⊘ スキップ (内容が短い): ${entry.date}`);
        continue;
      }

      const knowledgeItem = await prisma.knowledge_items.create({
        data: {
          id: randomUUID(),
          title,
          content: cleanContent,
          type: "BLOG", // ブログタイプ
          course: "RYT200",
          sourceUrl: `シークエンス！講師の日記 ${entry.date}`,
          brandId: brand.id,
          authorId: author.id,
        }
      });

      console.log(`✓ 登録: ${title}`);
      created++;
    } catch (error) {
      console.error(`✗ エラー (${entry.date}):`, error);
    }
  }

  console.log(`\n=== 完了: ${created}/${entries.length}件を登録 ===`);

  await prisma.$disconnect();
}

main().catch(console.error);
