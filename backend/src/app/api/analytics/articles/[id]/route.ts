import { NextRequest } from "next/server";
import { successResponse, errorResponse, ApiErrors } from "@/lib/api-response";
import { withAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { GoogleAnalyticsClient, getDateRange } from "@/lib/google-analytics";
import { SearchConsoleClient } from "@/lib/search-console";
import { isAppError } from "@/lib/errors";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/analytics/articles/:id - 記事別アナリティクスデータ
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    return await withAuth(request, async () => {
      const { searchParams } = new URL(request.url);
      const days = parseInt(searchParams.get("days") || "30", 10);
      const dateRange = getDateRange(days);

      // 記事を取得
      const article = await prisma.article.findUnique({
        where: { id },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          publishedAt: true,
          category: { select: { name: true, slug: true } },
        },
      });

      if (!article) {
        return ApiErrors.notFound("記事");
      }

      // 記事のパスを構築
      const pagePath = `/${article.category.slug}/${article.slug}`;

      // 設定を取得
      const settings = await prisma.systemSettings.findUnique({
        where: { id: "default" },
      });

      const result: {
        article: typeof article;
        ga?: object;
        gsc?: object;
        stored?: object;
      } = {
        article,
      };

      // Google Analyticsデータ
      if (settings?.gaPropertyId && settings?.gaApiKey) {
        try {
          const gaClient = new GoogleAnalyticsClient({
            propertyId: settings.gaPropertyId,
          });
          gaClient.setAccessToken(settings.gaApiKey);

          const dailyMetrics = await gaClient.getPageMetrics(
            pagePath,
            dateRange
          );

          // 合計を計算
          const totals = dailyMetrics.reduce(
            (acc, day) => ({
              pageViews: acc.pageViews + day.pageViews,
              sessions: acc.sessions + day.sessions,
              bounceRateSum: acc.bounceRateSum + day.bounceRate * day.sessions,
              timeSum: acc.timeSum + day.avgTimeOnPage * day.sessions,
            }),
            { pageViews: 0, sessions: 0, bounceRateSum: 0, timeSum: 0 }
          );

          result.ga = {
            dailyMetrics,
            totals: {
              pageViews: totals.pageViews,
              sessions: totals.sessions,
              bounceRate:
                totals.sessions > 0
                  ? Math.round(totals.bounceRateSum / totals.sessions)
                  : 0,
              avgTimeOnPage:
                totals.sessions > 0
                  ? Math.round(totals.timeSum / totals.sessions)
                  : 0,
            },
          };
        } catch (error) {
          console.error("GA4 error for article:", error);
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

          const keywords = await gscClient.getPageKeywords(
            pagePath,
            dateRange,
            20
          );

          // キーワードの合計を計算
          const totals = keywords.reduce(
            (acc, kw) => ({
              clicks: acc.clicks + kw.clicks,
              impressions: acc.impressions + kw.impressions,
              positionSum: acc.positionSum + kw.position * kw.impressions,
            }),
            { clicks: 0, impressions: 0, positionSum: 0 }
          );

          result.gsc = {
            keywords,
            totals: {
              clicks: totals.clicks,
              impressions: totals.impressions,
              ctr:
                totals.impressions > 0
                  ? Math.round((totals.clicks / totals.impressions) * 10000) /
                    100
                  : 0,
              avgPosition:
                totals.impressions > 0
                  ? Math.round((totals.positionSum / totals.impressions) * 10) /
                    10
                  : 0,
            },
          };
        } catch (error) {
          console.error("GSC error for article:", error);
          result.gsc = { error: "Search Consoleデータの取得に失敗しました" };
        }
      }

      // 保存済みアナリティクスデータを取得
      const storedData = await prisma.analyticsData.findMany({
        where: {
          articleId: id,
          date: {
            gte: new Date(dateRange.startDate),
            lte: new Date(dateRange.endDate),
          },
        },
        orderBy: { date: "asc" },
      });

      if (storedData.length > 0) {
        result.stored = {
          daily: storedData,
          totals: storedData.reduce(
            (acc, day) => ({
              pageViews: acc.pageViews + day.pageViews,
              organicViews: acc.organicViews + day.organicViews,
              conversionClicks: acc.conversionClicks + day.conversionClicks,
            }),
            { pageViews: 0, organicViews: 0, conversionClicks: 0 }
          ),
        };
      }

      return successResponse(result);
    });
  } catch (error) {
    if (isAppError(error)) {
      return errorResponse(error.code, error.message, error.statusCode);
    }
    console.error("Article analytics error:", error);
    return ApiErrors.internalError();
  }
}
