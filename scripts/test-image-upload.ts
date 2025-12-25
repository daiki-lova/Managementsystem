import { config } from "dotenv";
config({ path: ".env.local" });

import { getDecryptedSettings } from "../src/lib/settings";
import { uploadImage } from "../src/lib/supabase";
import { randomUUID } from "crypto";

const NANO_BANANA_MODEL = "google/gemini-2.5-flash-image-preview";

async function testImageUpload() {
  console.log("=== OpenRouter 画像生成 & アップロードテスト ===\n");

  const settings = await getDecryptedSettings();
  if (!settings?.openRouterApiKey) {
    console.error("OpenRouter APIキーが設定されていません");
    return;
  }

  const prompt = "Generate a simple yoga illustration";

  console.log("プロンプト:", prompt);
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
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("APIエラー:", response.status, errorText);
      return;
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;

    if (!message?.images?.length) {
      console.error("画像がレスポンスに含まれていません");
      console.log("レスポンス:", JSON.stringify(data, null, 2).substring(0, 1000));
      return;
    }

    console.log("✅ 画像生成成功！");

    const imageData = message.images[0];
    let dataUrl: string | null = null;

    // オブジェクト形式
    if (typeof imageData === "object" && imageData.image_url?.url) {
      dataUrl = imageData.image_url.url;
      console.log("形式: オブジェクト (image_url.url)");
    }
    // 文字列形式
    else if (typeof imageData === "string" && imageData.startsWith("data:image")) {
      dataUrl = imageData;
      console.log("形式: 文字列 (data:image...)");
    }

    if (!dataUrl) {
      console.error("画像データURLが見つかりません");
      console.log("imageData:", JSON.stringify(imageData).substring(0, 500));
      return;
    }

    // Base64をデコード
    const base64Match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.error("Base64形式が不正です");
      return;
    }

    const extension = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const base64Data = base64Match[2];
    const imageBuffer = Buffer.from(base64Data, "base64");

    console.log(`画像フォーマット: ${extension}`);
    console.log(`画像サイズ: ${(imageBuffer.length / 1024).toFixed(2)} KB`);

    // Supabaseにアップロード
    console.log("\nSupabaseにアップロード中...");
    const filePath = `generated/${Date.now()}-${randomUUID()}.${extension}`;

    const { url } = await uploadImage(
      "MEDIA",
      filePath,
      imageBuffer,
      `image/${base64Match[1]}`
    );

    console.log("\n✅ アップロード成功！");
    console.log("URL:", url);
  } catch (error) {
    console.error("エラー:", error);
  }
}

testImageUpload().catch(console.error);
