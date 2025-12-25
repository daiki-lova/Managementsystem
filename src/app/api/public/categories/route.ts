import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/public/categories - 公開カテゴリ一覧（認証不要）
export async function GET() {
  try {
    const categories = await prisma.categories.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        articlesCount: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Public categories list error:", error);
    return NextResponse.json(
      { success: false, error: { message: "Internal server error" } },
      { status: 500 }
    );
  }
}
