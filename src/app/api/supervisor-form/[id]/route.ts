import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// バリデーションスキーマ（authors APIと同じ）
const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  role: z.string().max(100).optional(),
  imageUrl: z.string().url().optional().nullable(),
  bio: z.string().optional().nullable(),
  // キャリアデータ
  careerStartYear: z.number().int().min(1950).max(new Date().getFullYear()).optional().nullable(),
  teachingStartYear: z.number().int().min(1950).max(new Date().getFullYear()).optional().nullable(),
  totalStudentsTaught: z.number().int().min(0).optional().nullable(),
  graduatesCount: z.number().int().min(0).optional().nullable(),
  weeklyLessons: z.number().int().min(0).optional().nullable(),
  // 資格情報
  certifications: z.array(z.object({
    name: z.string(),
    year: z.number().optional(),
    location: z.string().optional(),
  })).optional().nullable(),
  // エピソード
  episodes: z.array(z.object({
    type: z.enum(["transformation", "student", "teaching", "other"]),
    title: z.string(),
    content: z.string(),
  })).optional().nullable(),
  // その他
  signaturePhrases: z.array(z.string()).optional().nullable(),
  specialties: z.array(z.string()).optional().nullable(),
  writingStyle: z.enum(["formal", "casual", "professional"]).optional().nullable(),
  philosophy: z.string().optional().nullable(),
  avoidWords: z.array(z.string()).optional().nullable(),
  targetAudience: z.string().optional().nullable(),
  teachingApproach: z.string().optional().nullable(),
  influences: z.array(z.string()).optional().nullable(),
  locationContext: z.string().optional().nullable(),
});

/**
 * GET /api/supervisor-form/[id]
 * 監修者情報を取得（認証不要）
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const author = await prisma.authors.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        role: true,
        imageUrl: true,
        bio: true,
        // キャリアデータ
        careerStartYear: true,
        teachingStartYear: true,
        totalStudentsTaught: true,
        graduatesCount: true,
        weeklyLessons: true,
        // 資格情報
        certifications: true,
        // エピソード
        episodes: true,
        // パーソナリティ
        signaturePhrases: true,
        specialties: true,
        writingStyle: true,
        philosophy: true,
        avoidWords: true,
        targetAudience: true,
        teachingApproach: true,
        influences: true,
        locationContext: true,
      },
    });

    if (!author) {
      return NextResponse.json(
        { success: false, error: "監修者が見つかりません" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: author });
  } catch (error) {
    console.error("[supervisor-form] GET error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/supervisor-form/[id]
 * 監修者情報を更新（認証不要）
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 監修者の存在確認
    const existingAuthor = await prisma.authors.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingAuthor) {
      return NextResponse.json(
        { success: false, error: "監修者が見つかりません" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parseResult = updateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "入力内容に問題があります", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // nullをundefinedに変換して更新
    const updateData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    const updatedAuthor = await prisma.authors.update({
      where: { id },
      data: updateData,
    });

    console.log(`[supervisor-form] Updated author: ${updatedAuthor.name} (${id})`);

    return NextResponse.json({ success: true, data: updatedAuthor });
  } catch (error) {
    console.error("[supervisor-form] PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "サーバーエラーが発生しました" },
      { status: 500 }
    );
  }
}
