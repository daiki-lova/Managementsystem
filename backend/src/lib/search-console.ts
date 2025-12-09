// Google Search Console API クライアント

interface GSCCredentials {
  siteUrl: string; // e.g., "https://example.com" or "sc-domain:example.com"
}

interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface SearchAnalyticsResponse {
  rows: SearchAnalyticsRow[];
}

interface KeywordData {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageData {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface DailyData {
  date: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export class SearchConsoleClient {
  private siteUrl: string;
  private accessToken: string | null = null;

  constructor(credentials: GSCCredentials) {
    this.siteUrl = credentials.siteUrl;
  }

  // アクセストークンを設定
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  // Search Analytics API を呼び出す
  private async query(request: object): Promise<SearchAnalyticsResponse> {
    if (!this.accessToken) {
      throw new Error("Access token not set");
    }

    const encodedSiteUrl = encodeURIComponent(this.siteUrl);

    const response = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
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
      console.error("Search Console API error:", error);
      throw new Error(`Search Console API error: ${response.status}`);
    }

    return response.json();
  }

  // キーワード別データを取得
  async getKeywordData(
    dateRange: DateRange,
    limit = 100
  ): Promise<KeywordData[]> {
    const response = await this.query({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["query"],
      rowLimit: limit,
    });

    return (response.rows || []).map((row) => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 10000) / 100, // パーセンテージ
      position: Math.round(row.position * 10) / 10,
    }));
  }

  // ページ別データを取得
  async getPageData(dateRange: DateRange, limit = 100): Promise<PageData[]> {
    const response = await this.query({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["page"],
      rowLimit: limit,
    });

    return (response.rows || []).map((row) => ({
      page: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 10000) / 100,
      position: Math.round(row.position * 10) / 10,
    }));
  }

  // 日別データを取得
  async getDailyData(dateRange: DateRange): Promise<DailyData[]> {
    const response = await this.query({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["date"],
    });

    return (response.rows || []).map((row) => ({
      date: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 10000) / 100,
      position: Math.round(row.position * 10) / 10,
    }));
  }

  // 特定ページのキーワードデータを取得
  async getPageKeywords(
    pagePath: string,
    dateRange: DateRange,
    limit = 50
  ): Promise<KeywordData[]> {
    const response = await this.query({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
      dimensions: ["query"],
      dimensionFilterGroups: [
        {
          filters: [
            {
              dimension: "page",
              operator: "contains",
              expression: pagePath,
            },
          ],
        },
      ],
      rowLimit: limit,
    });

    return (response.rows || []).map((row) => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: Math.round(row.ctr * 10000) / 100,
      position: Math.round(row.position * 10) / 10,
    }));
  }

  // 合計値を取得
  async getTotals(dateRange: DateRange): Promise<{
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }> {
    const response = await this.query({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    });

    if (!response.rows || response.rows.length === 0) {
      return { clicks: 0, impressions: 0, ctr: 0, position: 0 };
    }

    // 全行の合計を計算
    const totals = response.rows.reduce(
      (acc, row) => ({
        clicks: acc.clicks + row.clicks,
        impressions: acc.impressions + row.impressions,
        ctrSum: acc.ctrSum + row.ctr * row.impressions,
        positionSum: acc.positionSum + row.position * row.impressions,
      }),
      { clicks: 0, impressions: 0, ctrSum: 0, positionSum: 0 }
    );

    return {
      clicks: totals.clicks,
      impressions: totals.impressions,
      ctr:
        totals.impressions > 0
          ? Math.round((totals.ctrSum / totals.impressions) * 10000) / 100
          : 0,
      position:
        totals.impressions > 0
          ? Math.round((totals.positionSum / totals.impressions) * 10) / 10
          : 0,
    };
  }
}
