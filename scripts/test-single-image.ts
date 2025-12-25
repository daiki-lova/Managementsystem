import { config } from "dotenv";
config({ path: ".env.local" });

import { getDecryptedSettings } from "../src/lib/settings";
import { randomUUID } from "crypto";

const FLUX_MODEL = "black-forest-labs/flux-1.1-pro";

async function main() {
  console.log("=== Flux 1.1 Pro 16:9画像生成テスト ===\n");

  const settings = await getDecryptedSettings();
  if (!settings?.openRouterApiKey) {
    console.error("OpenRouter APIキーが設定されていません");
    return;
  }

  const prompt = `Japanese fashion illustration style. A woman practicing yoga in a serene studio setting. Delicate brown and gold thin line art, minimal watercolor shading in cream and soft pastels, clean white background, elegant feminine aesthetic, sparkle decorations. No text, no faces.`;

  console.log("モデル:", FLUX_MODEL);
  console.log("サイズ: 1280x720 (16:9)");
  console.log("プロンプト:", prompt.substring(0, 80) + "...");
  console.log("\n画像生成中...");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.openRouterApiKey}`,
          "HTTP-Referer": "http://localhost:3000",
        },
        body: JSON.stringify({
          model: FLUX_MODEL,
          messages: [
            {
              role: "user",
              content: prompt,
            }
          ],
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("APIエラー:", response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log("レスポンス受信");
    console.log("レスポンス構造:", JSON.stringify(data).substring(0, 1000));
  } catch (error) {
    console.error("エラー:", error);
  }
}

main().catch(console.error);
