import { config } from "dotenv";
config({ path: ".env.local" });

import prisma from "../src/lib/prisma";
import * as fs from "fs";
import { randomUUID } from "crypto";

// OREO YOGA ACADEMYのお客様の声CSVを情報バンクに登録するスクリプト
async function main() {
  const csvPath = "/Users/daiki/Downloads/OREO voice  - voice.csv";
  const content = fs.readFileSync(csvPath, "utf-8");

  // CSVを行単位で分割（ヘッダーをスキップ）
  const lines = content.split("\n");
  const header = lines[0];
  console.log("ヘッダー:", header);

  // OREOブランドのIDを取得
  const brand = await prisma.brands.findFirst({
    where: { name: { contains: "OREO" } }
  });

  if (!brand) {
    console.error("OREOブランドが見つかりません");
    await prisma.$disconnect();
    return;
  }

  console.log(`ブランド: ${brand.name} (${brand.id})\n`);

  // CSVパース（引用符で囲まれたフィールドを考慮）
  const entries: { title: string; content: string; date: string }[] = [];

  let currentLine = "";
  let inQuotes = false;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (!inQuotes) {
      currentLine = line;
    } else {
      currentLine += "\n" + line;
    }

    // 引用符の数をカウント
    const quoteCount = (currentLine.match(/"/g) || []).length;
    inQuotes = quoteCount % 2 !== 0;

    if (!inQuotes && currentLine.trim()) {
      // CSVフィールドを解析
      const fields = parseCSVLine(currentLine);

      if (fields.length >= 7) {
        const title = fields[0].replace(/^"|"$/g, "").trim();
        const voiceContent = fields[1].replace(/^"|"$/g, "").replace(/""/g, '"').trim();
        const date = fields[6].replace(/^"|"$/g, "").trim();

        if (title && voiceContent && voiceContent.length > 50) {
          entries.push({ title, content: voiceContent, date });
        }
      }

      currentLine = "";
    }
  }

  console.log(`\n=== ${entries.length}件のお客様の声を検出 ===\n`);

  // 各エントリを情報バンクに登録
  let created = 0;
  for (const entry of entries) {
    try {
      // タイトルを整形（長すぎる場合は切り詰め）
      const displayTitle = entry.title.length > 80
        ? entry.title.substring(0, 80) + "..."
        : entry.title;

      const knowledgeItem = await prisma.knowledge_items.create({
        data: {
          id: randomUUID(),
          title: displayTitle,
          content: entry.content,
          type: "VOICE", // お客様の声タイプ
          brandId: brand.id,
          sourceUrl: `OREO YOGA ACADEMY お客様の声 ${entry.date}`,
        }
      });

      console.log(`✓ 登録: ${displayTitle.substring(0, 50)}...`);
      created++;
    } catch (error) {
      console.error(`✗ エラー (${entry.title.substring(0, 30)}...):`, error);
    }
  }

  console.log(`\n=== 完了: ${created}/${entries.length}件を登録 ===`);

  await prisma.$disconnect();
}

// CSVの1行を解析してフィールドの配列を返す
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // エスケープされた引用符
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

main().catch(console.error);
