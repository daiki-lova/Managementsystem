import { config } from "dotenv";
config({ path: ".env.local" });

import { getDecryptedSettings } from "../src/lib/settings";

const NANO_BANANA_MODEL = "google/gemini-2.5-flash-image-preview";

async function testImageGeneration() {
  console.log("=== OpenRouter 画像生成テスト ===\n");

  const settings = await getDecryptedSettings();
  if (!settings?.openRouterApiKey) {
    console.error("OpenRouter APIキーが設定されていません");
    return;
  }

  console.log("APIキー: ****" + settings.openRouterApiKey.slice(-4));
  console.log("モデル:", NANO_BANANA_MODEL);

  const prompt = "ヨガマットの上でリラックスした瞬間を表すイラスト。柔らかいパステルカラーで、穏やかな雰囲気。";

  console.log("\nプロンプト:", prompt);
  console.log("\nリクエスト送信中...\n");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.openRouterApiKey}`,
        "HTTP-Referer": "http://localhost:3000",
      },
      body: JSON.stringify({
        model: NANO_BANANA_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    console.log("ステータス:", response.status, response.statusText);

    const data = await response.json();

    if (!response.ok) {
      console.error("エラーレスポンス:", JSON.stringify(data, null, 2));
      return;
    }

    console.log("\n=== レスポンス構造 ===");
    console.log("choices数:", data.choices?.length);

    const message = data.choices?.[0]?.message;
    if (!message) {
      console.log("messageがありません");
      console.log("生のレスポンス:", JSON.stringify(data, null, 2).substring(0, 2000));
      return;
    }

    console.log("message.role:", message.role);
    console.log("message.content type:", typeof message.content);

    // 各種形式をチェック
    if (message.images) {
      console.log("message.images 形式:", message.images.length, "個の画像");
      console.log("最初の画像のタイプ:", typeof message.images[0]);
      if (typeof message.images[0] === "string") {
        console.log("最初の画像の先頭100文字:", message.images[0].substring(0, 100));
      } else if (typeof message.images[0] === "object") {
        console.log("\n=== 画像オブジェクトの詳細 ===");
        console.log("オブジェクトのキー:", Object.keys(message.images[0]));
        console.log("オブジェクト全体:", JSON.stringify(message.images[0]).substring(0, 500));

        // 一般的なパターンをチェック
        const img = message.images[0];
        if (img.url) console.log("img.url:", img.url.substring(0, 100));
        if (img.data) console.log("img.data 長さ:", img.data.length);
        if (img.base64) console.log("img.base64 長さ:", img.base64.length);
        if (img.b64_json) console.log("img.b64_json 長さ:", img.b64_json.length);
        if (img.image_url) console.log("img.image_url:", JSON.stringify(img.image_url).substring(0, 200));
      }
    }

    if (typeof message.content === "string") {
      console.log("message.content の長さ:", message.content.length);
      console.log("message.content の先頭200文字:", message.content.substring(0, 200));

      if (message.content.startsWith("data:image")) {
        console.log("✅ Base64画像データを検出！");
      }
    }

    if (Array.isArray(message.content)) {
      console.log("message.content は配列:", message.content.length, "個の要素");
      for (let i = 0; i < message.content.length; i++) {
        const part = message.content[i];
        console.log(`  [${i}] type:`, part.type);
        if (part.type === "image_url") {
          console.log(`  [${i}] image_url.url 先頭100文字:`, part.image_url?.url?.substring(0, 100));
        } else if (part.type === "text") {
          console.log(`  [${i}] text:`, part.text?.substring(0, 100));
        }
      }
    }

    // 生のレスポンスも出力（デバッグ用）
    console.log("\n=== 生レスポンス（1500文字まで） ===");
    console.log(JSON.stringify(data, null, 2).substring(0, 1500));
  } catch (error) {
    console.error("エラー:", error);
  }
}

testImageGeneration().catch(console.error);
