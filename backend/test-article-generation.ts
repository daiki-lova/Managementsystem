// 記事生成テストスクリプト
const API_KEY = "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";
const MODEL = "openai/gpt-4o-mini";

interface GeneratedContent {
  title: string;
  blocks: object[];
  metaTitle: string;
  metaDescription: string;
}

async function generateArticle(keyword: string): Promise<GeneratedContent> {
  const systemPrompt = `【監修者プロフィール】
■ 資格・肩書: ヨガインストラクター / RYT500認定
■ 得意領域: 初心者向けヨガ、リラクゼーション
■ 語り口・トーン: 優しく丁寧、親しみやすい

【構成作成・執筆・SEOの共通ルール】
1. **構成作成（PREP法）**:
   - 読者が知りたい結論を最初に提示する。
   - 各見出しは具体的かつ魅力的にし、読み飛ばしを防ぐ。
   - 記事の最後には具体的なアクションプランを提示する。

2. **SEO最適化**:
   - メインキーワード、共起語、関連クエリを自然に網羅する。
   - タイトルは32文字以内、メタディスクリプションは120文字以内とし、クリック率を意識する。

3. **品質管理（E-E-A-T）**:
   - 断定表現を使う場合は根拠を明確にする。
   - 専門用語には補足を入れ、誰にでもわかる表現にする。

記事はJSON形式で出力してください。以下の形式に従ってください：
{
  "title": "記事タイトル（32文字以内・SEO最適化）",
  "metaTitle": "SEOタイトル（32文字以内）",
  "metaDescription": "メタディスクリプション（120文字以内・興味付け）",
  "blocks": [
    {"id": "unique-id", "type": "p", "content": "段落テキスト"},
    {"id": "unique-id", "type": "h2", "content": "見出し2"},
    {"id": "unique-id", "type": "h3", "content": "見出し3"},
    {"id": "unique-id", "type": "ul", "content": "リスト項目1\\nリスト項目2"}
  ]
}

記事の構成：
1. 導入部（共感＋結論）
2. 本題（H2で3セクション、各セクションにH3を含む）
3. まとめ（アクションプラン）

注意点：
- 各ブロックのidはユニークな文字列
- 1500-2000文字程度の充実した内容
- 読みやすく、SEOに最適化された内容`;

  console.log("記事生成を開始します...");
  console.log(`キーワード: ${keyword}`);
  console.log(`使用モデル: ${MODEL}`);
  console.log("");

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3001",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `以下のキーワードで記事を作成してください: 「${keyword}」`,
        },
      ],
      max_tokens: 3000,
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenRouter API error:", errorText);
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("No content generated");
  }

  return JSON.parse(content) as GeneratedContent;
}

// 実行
async function main() {
  try {
    const result = await generateArticle("朝ヨガ 効果");

    console.log("=".repeat(60));
    console.log("【生成完了】");
    console.log("=".repeat(60));
    console.log("");
    console.log(`タイトル: ${result.title}`);
    console.log(`SEOタイトル: ${result.metaTitle}`);
    console.log(`メタディスクリプション: ${result.metaDescription}`);
    console.log("");
    console.log("【記事本文】");
    console.log("-".repeat(60));

    for (const block of result.blocks) {
      const b = block as { type: string; content: string };
      switch (b.type) {
        case "h2":
          console.log(`\n## ${b.content}\n`);
          break;
        case "h3":
          console.log(`\n### ${b.content}\n`);
          break;
        case "p":
          console.log(b.content);
          console.log("");
          break;
        case "ul":
          b.content.split("\\n").forEach((item: string) => {
            console.log(`- ${item}`);
          });
          console.log("");
          break;
        default:
          console.log(b.content);
      }
    }

    console.log("-".repeat(60));
    console.log(`ブロック数: ${result.blocks.length}`);
  } catch (error) {
    console.error("エラー:", error);
  }
}

main();
