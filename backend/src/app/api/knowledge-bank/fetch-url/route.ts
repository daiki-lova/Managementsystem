import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import {
  successResponse,
  ApiErrors,
  errorResponse,
} from "@/lib/api-response";
import { validateBody, commonSchemas } from "@/lib/validation";
import { isAppError } from "@/lib/errors";

// URL取得スキーマ
const fetchUrlSchema = z.object({
  url: commonSchemas.url,
});

// URLからコンテンツを取得してAI要約
export async function POST(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { url } = await validateBody(request, fetchUrlSchema);

      // URLからHTMLを取得
      let html: string;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; YogaMediaBot/1.0; +https://example.com)",
          },
        });

        if (!response.ok) {
          return ApiErrors.badRequest(
            `URLの取得に失敗しました: ${response.status}`
          );
        }

        html = await response.text();
      } catch (error) {
        return ApiErrors.badRequest("URLの取得に失敗しました");
      }

      // HTMLから本文を抽出（簡易実装）
      const extractedContent = extractMainContent(html);

      // OpenRouter APIでAI要約を生成
      const systemSettings = await prisma.system_settings.findUnique({
        where: { id: "default" },
      });

      if (!systemSettings?.openRouterApiKey) {
        // APIキーがない場合は抽出したコンテンツをそのまま返す
        return successResponse({
          title: extractTitle(html),
          content: extractedContent,
          summarized: false,
        });
      }

      // AI要約を生成
      const summary = await generateSummary(
        extractedContent,
        systemSettings.openRouterApiKey,
        systemSettings.aiModel || "openai/gpt-4-turbo"
      );

      return successResponse({
        title: extractTitle(html),
        content: summary,
        originalContent: extractedContent,
        summarized: true,
      });
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Fetch URL error:", error);
    return ApiErrors.internalError();
  }
}

// HTMLからタイトルを抽出
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return titleMatch ? titleMatch[1].trim() : "";
}

// HTMLから本文を抽出（簡易実装）
function extractMainContent(html: string): string {
  // スクリプト、スタイル、ヘッダー、フッターを削除
  let content = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "");

  // mainまたはarticle要素があれば優先
  const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) {
    content = mainMatch[1];
  } else {
    const articleMatch = content.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      content = articleMatch[1];
    }
  }

  // HTMLタグを削除
  content = content.replace(/<[^>]+>/g, " ");

  // 空白を正規化
  content = content
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 10000); // 最大10000文字

  return content;
}

// OpenRouter APIでAI要約を生成
async function generateSummary(
  content: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3001",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: `あなたは情報を要約するアシスタントです。
以下のコンテンツを、記事作成に役立つ形で要約してください。
- 重要なポイントを箇条書きで整理
- 引用できる具体的なエピソードや数値があれば抽出
- 500〜1000文字程度にまとめる`,
        },
        {
          role: "user",
          content: `以下のコンテンツを要約してください:\n\n${content}`,
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    console.error("OpenRouter API error:", await response.text());
    return content; // エラー時は元のコンテンツを返す
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || content;
}
