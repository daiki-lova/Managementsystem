import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GoogleAnalyticsClient, getDateRange } from "@/lib/google-analytics";
import { SearchConsoleClient } from "@/lib/search-console";
import { isAppError } from "@/lib/errors";

// GET /api/analytics - ダッシュボード用アナリティクスデータ
export async function GET(request: NextRequest) {
  try {
    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const days = parseInt(searchParams.get("days") || "30", 10);
      const dateRange = getDateRange(days);

      // 設定を取得
      const settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
      });

      const result: {
        ga?: object;
        gsc?: object;
        internal?: object;
        configured: {
          ga: boolean;
          gsc: boolean;
        };
      } = {
        configured: {
          ga: !!(settings?.gaPropertyId && settings?.gaApiKey),
          gsc: !!(settings?.searchConsoleSiteUrl && settings?.searchConsoleApiKey),
        },
      };

      // Google Analyticsデータ
      if (settings?.gaPropertyId && settings?.gaApiKey) {
        try {
          const gaClient = new GoogleAnalyticsClient({
            propertyId: settings.gaPropertyId,
          });
          gaClient.setAccessToken(settings.gaApiKey);

          const [totals, dailyMetrics, topPages] = await Promise.all([
            gaClient.getTotals(dateRange),
            gaClient.getDailyMetrics(dateRange),
            gaClient.getPagePerformance(dateRange, 10),
          ]);

          result.ga = {
            totals,
            dailyMetrics,
            topPages,
          };
        } catch (error) {
          console.error("GA4 error:", error);
          result.ga = { error: "GA4データの取得に失敗しました" };
        }
      }

      // Search Consoleデータ
      if (settings?.searchConsoleSiteUrl && settings?.searchConsoleApiKey) {
        try {
          const gscClient = new SearchConsoleClient({
            siteUrl: settings.searchConsoleSiteUrl,
          });
          gscClient.setAccessToken(settings.searchConsoleApiKey);

          const [totals, dailyData, topKeywords, topPages] = await Promise.all([
            gscClient.getTotals(dateRange),
            gscClient.getDailyData(dateRange),
            gscClient.getKeywordData(dateRange, 10),
            gscClient.getPageData(dateRange, 10),
          ]);

          result.gsc = {
            totals,
            dailyData,
            topKeywords,
            topPages,
          };
        } catch (error) {
          console.error("GSC error:", error);
          result.gsc = { error: "Search Consoleデータの取得に失敗しました" };
        }
      }

      // 内部統計データ
      const [
        totalArticles,
        publishedArticles,
        draftArticles,
        scheduledArticles,
        recentArticles,
        recentJobs,
      ] = await Promise.all([
        prisma.article.count({
          where: { status: { not: "DELETED" } },
        }),
        prisma.article.count({
          where: { status: "PUBLISHED" },
        }),
        prisma.article.count({
          where: { status: "DRAFT" },
        }),
        prisma.article.count({
          where: { status: "SCHEDULED" },
        }),
        prisma.article.findMany({
          where: { status: "PUBLISHED" },
          orderBy: { publishedAt: "desc" },
          take: 5,
          select: {
            id: true,
            title: true,
            slug: true,
            publishedAt: true,
            category: { select: { name: true } },
          },
        }),
        prisma.generationJob.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            keyword: true,
            status: true,
            progress: true,
            createdAt: true,
          },
        }),
      ]);

      result.internal = {
        articles: {
          total: totalArticles,
          published: publishedArticles,
          draft: draftArticles,
          scheduled: scheduledArticles,
        },
        recentArticles,
        recentJobs,
      };

      return successResponse(result);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Analytics error:", error);
    return ApiErrors.internalError();
  }
}
