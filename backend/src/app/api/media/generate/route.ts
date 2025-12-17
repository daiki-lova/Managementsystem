import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { isAppError } from "@/lib/errors";
import { uploadImage } from "@/lib/supabase";
import { MediaSource } from "@prisma/client";
import { randomUUID } from "crypto";
import { getDecryptedSettings } from "@/lib/settings";
import { checkRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit-log";

// AI画像生成
export async function POST(request: NextRequest) {
  try {
    // レート制限チェック（生成: 10リクエスト/分）
    const rateLimitResult = checkRateLimit(
      request,
      { windowMs: 60000, maxRequests: 10 },
      "ai-generate"
    );
    if (!rateLimitResult.allowed) {
      const retryAfter = Math.ceil(
        (rateLimitResult.resetAt - Date.now()) / 1000
      );
      return errorResponse(
        "RATE_LIMITED",
        `生成制限に達しました。${retryAfter}秒後に再試行してください`,
        429
      );
    }

    return await withAuth(request, async (user) => {
      const body = await request.json();
      const { prompt } = body;

      if (!prompt || typeof prompt !== "string") {
        return ApiErrors.badRequest("プロンプトが指定されていません");
      }

      if (prompt.length > 1000) {
        return ApiErrors.badRequest("プロンプトは1000文字以内で指定してください");
      }

      // システム設定を取得
      const settings = await getDecryptedSettings();

      if (!settings?.openRouterApiKey) {
        return ApiErrors.badRequest("OpenRouter APIキーが設定されていません");
      }

      // システムプロンプトとユーザープロンプトを結合
      const systemPrompt = settings.imagePrompt || "";
      const fullPrompt = systemPrompt
        ? `${systemPrompt}\n\nUser request: ${prompt}`
        : prompt;

      // 画像生成
      const imageUrl = await generateImage({
        prompt: fullPrompt,
        apiKey: settings.openRouterApiKey,
        model: settings.imageModel || "google/imagen-3",
      });

      if (!imageUrl) {
        return errorResponse("GENERATION_FAILED", "画像生成に失敗しました", 500);
      }

      // DB に保存
      const media = await prisma.media_assets.create({
        data: {
          id: randomUUID(),
          url: imageUrl,
          fileName: `ai-generated-${Date.now()}.png`,
          altText: prompt.substring(0, 100),
          source: MediaSource.AI_GENERATED,
          showInLibrary: true,
        },
        select: {
          id: true,
          url: true,
          fileName: true,
          altText: true,
          source: true,
          createdAt: true,
        },
      });

      // 監査ログ
      await auditLog.masterDataChange(
        request,
        "MEDIA_AI_GENERATE",
        user.id,
        "media",
        media.id,
        { prompt: prompt.substring(0, 200) }
      );

      return successResponse(media, undefined, 201);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Generate image error:", error);
    return ApiErrors.internalError();
  }
}

// 画像生成関数
interface GenerateImageParams {
  prompt: string;
  apiKey: string;
  model: string;
}

async function generateImage(params: GenerateImageParams): Promise<string | null> {
  const { prompt, apiKey, model } = params;
  // OpenRouterで画像生成をサポートするモデル
  // デフォルトは gemini-2.5-flash-image-preview (無料枠あり)
  const selectedModel = model || "google/gemini-2.5-flash-image-preview";

  try {
    // OpenRouterは chat/completions エンドポイントで画像生成をサポート
    // modalities: ["image", "text"] を指定する
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
      },
      body: JSON.stringify({
        model: selectedModel,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: `Generate an image: ${prompt}`,
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Image generation API failed:", errorText);
      return null;
    }

    const data = await response.json();
    console.log("Image API response structure:", Object.keys(data));

    // chat/completions レスポンス形式から画像を取得
    const imageData = data.choices?.[0]?.message?.images?.[0];

    if (!imageData) {
      console.error("No image data in response");
      return null;
    }

    let imageBuffer: Buffer;

    // 型アサーション用
    const img = imageData as Record<string, unknown>;

    // 複数の形式に対応
    if (typeof imageData === "object" && img.b64_json && typeof img.b64_json === "string") {
      imageBuffer = Buffer.from(img.b64_json, "base64");
    } else if (typeof imageData === "object" && img.image_url && typeof img.image_url === "object") {
      const imageUrl = img.image_url as { url?: string };
      const dataUrl = imageUrl.url || "";
      const base64Match = dataUrl.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        imageBuffer = Buffer.from(base64Match[1], "base64");
      } else if (dataUrl.startsWith("http")) {
        const imageResponse = await fetch(dataUrl);
        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      } else {
        console.error("Unknown image_url format:", dataUrl.substring(0, 100));
        return null;
      }
    } else if (typeof imageData === "object" && img.url && typeof img.url === "string") {
      const imageResponse = await fetch(img.url);
      imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    } else if (typeof imageData === "string") {
      const base64Match = imageData.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        imageBuffer = Buffer.from(base64Match[1], "base64");
      } else {
        imageBuffer = Buffer.from(imageData, "base64");
      }
    } else {
      console.error("Unknown image data format:", typeof imageData, JSON.stringify(imageData).substring(0, 200));
      return null;
    }

    // Supabase Storageにアップロード
    const filePath = `generated/${Date.now()}-${randomUUID()}.png`;
    const { url } = await uploadImage(
      "MEDIA",
      filePath,
      imageBuffer,
      "image/png"
    );

    return url;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
}
