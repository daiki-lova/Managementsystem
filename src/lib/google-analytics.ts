// Google Analytics 4 Data API クライアント

interface GACredentials {
  apiKey?: string;
  propertyId: string;
}

interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface GAReportRow {
  dimensions: string[];
  metrics: number[];
}

interface GAReport {
  rows: GAReportRow[];
  totals?: number[];
}

interface PageViewsData {
  date: string;
  pageViews: number;
  sessions: number;
  bounceRate: number;
  avgTimeOnPage: number;
}

interface PagePerformance {
  pagePath: string;
  pageViews: number;
  sessions: number;
  bounceRate: number;
  avgTimeOnPage: number;
}

export class GoogleAnalyticsClient {
  private propertyId: string;
  private accessToken: string | null = null;

  constructor(credentials: GACredentials) {
    this.propertyId = credentials.propertyId;
  }

  // アクセストークンを設定（OAuth2フローで取得したトークン）
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  // GA4 Data API を呼び出す
  private async runReport(request: object): Promise<GAReport> {
    if (!this.accessToken) {
      throw new Error("Access token not set");
    }

    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("GA4 API error:", error);
      throw new Error(`GA4 API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      rows: (data.rows || []).map((row: { dimensionValues?: { value: string }[]; metricValues?: { value: string }[] }) => ({
        dimensions: row.dimensionValues?.map((d) => d.value) || [],
        metrics: row.metricValues?.map((m) => parseFloat(m.value)) || [],
      })),
      totals: data.totals?.[0]?.metricValues?.map((m: { value: string }) => parseFloat(m.value)),
    };
  }

  // 日別のページビュー・セッションデータを取得
  async getDailyMetrics(dateRange: DateRange): Promise<PageViewsData[]> {
    const report = await this.runReport({
      dateRanges: [dateRange],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    return report.rows.map((row) => ({
      date: row.dimensions[0],
      pageViews: row.metrics[0],
      sessions: row.metrics[1],
      bounceRate: Math.round(row.metrics[2] * 100),
      avgTimeOnPage: Math.round(row.metrics[3]),
    }));
  }

  // ページ別パフォーマンスを取得
  async getPagePerformance(
    dateRange: DateRange,
    limit = 50
  ): Promise<PagePerformance[]> {
    const report = await this.runReport({
      dateRanges: [dateRange],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit,
    });

    return report.rows.map((row) => ({
      pagePath: row.dimensions[0],
      pageViews: row.metrics[0],
      sessions: row.metrics[1],
      bounceRate: Math.round(row.metrics[2] * 100),
      avgTimeOnPage: Math.round(row.metrics[3]),
    }));
  }

  // 特定ページのパフォーマンスを取得
  async getPageMetrics(
    pagePath: string,
    dateRange: DateRange
  ): Promise<PageViewsData[]> {
    const report = await this.runReport({
      dateRanges: [dateRange],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "pagePath",
          stringFilter: {
            matchType: "EXACT",
            value: pagePath,
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
    });

    return report.rows.map((row) => ({
      date: row.dimensions[0],
      pageViews: row.metrics[0],
      sessions: row.metrics[1],
      bounceRate: Math.round(row.metrics[2] * 100),
      avgTimeOnPage: Math.round(row.metrics[3]),
    }));
  }

  // 合計値を取得
  async getTotals(dateRange: DateRange): Promise<{
    pageViews: number;
    sessions: number;
    bounceRate: number;
    avgTimeOnPage: number;
  }> {
    const report = await this.runReport({
      dateRanges: [dateRange],
      metrics: [
        { name: "screenPageViews" },
        { name: "sessions" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    });

    const totals = report.totals || [0, 0, 0, 0];

    return {
      pageViews: totals[0],
      sessions: totals[1],
      bounceRate: Math.round(totals[2] * 100),
      avgTimeOnPage: Math.round(totals[3]),
    };
  }
}

// 日付ヘルパー
export function getDateRange(days: number): DateRange {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
