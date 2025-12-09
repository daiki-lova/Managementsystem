// Keywords Everywhere API クライアント

interface KeywordData {
  keyword: string;
  volume: number;
  cpc: number;
  competition: number;
  trend: number[];
}

interface KeywordsEverywhereResponse {
  data: KeywordData[];
  credits: number;
  time: number;
}

interface SearchParams {
  keywords: string[];
  country?: string;
  currency?: string;
}

export class KeywordsEverywhereClient {
  private apiKey: string;
  private baseUrl = "https://api.keywordseverywhere.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // キーワードのボリュームデータを取得
  async getKeywordData(params: SearchParams): Promise<KeywordData[]> {
    const { keywords, country = "jp", currency = "JPY" } = params;

    const response = await fetch(`${this.baseUrl}/get_keyword_data`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        country,
        currency,
        dataSource: "gkp", // Google Keyword Planner
        kw: JSON.stringify(keywords),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Keywords Everywhere API error:", error);
      throw new Error(`Keywords Everywhere API error: ${response.status}`);
    }

    const data: KeywordsEverywhereResponse = await response.json();
    return data.data;
  }

  // 関連キーワードを取得
  async getRelatedKeywords(
    keyword: string,
    country = "jp"
  ): Promise<KeywordData[]> {
    const response = await fetch(`${this.baseUrl}/get_related_keywords`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        country,
        currency: "JPY",
        dataSource: "gkp",
        kw: keyword,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Keywords Everywhere API error:", error);
      throw new Error(`Keywords Everywhere API error: ${response.status}`);
    }

    const data: KeywordsEverywhereResponse = await response.json();
    return data.data;
  }

  // ロングテールキーワードを取得
  async getLongTailKeywords(
    keyword: string,
    country = "jp"
  ): Promise<KeywordData[]> {
    const response = await fetch(`${this.baseUrl}/get_longtail_keywords`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        country,
        currency: "JPY",
        dataSource: "gkp",
        kw: keyword,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Keywords Everywhere API error:", error);
      throw new Error(`Keywords Everywhere API error: ${response.status}`);
    }

    const data: KeywordsEverywhereResponse = await response.json();
    return data.data;
  }
}

// 推奨検索ボリュームゾーン
export const RECOMMENDED_VOLUME_RANGE = {
  min: 300,
  max: 2000,
};

// キーワードが推奨ゾーン内かチェック
export function isInRecommendedRange(volume: number): boolean {
  return (
    volume >= RECOMMENDED_VOLUME_RANGE.min &&
    volume <= RECOMMENDED_VOLUME_RANGE.max
  );
}

// キーワードデータをスコアリング
export function scoreKeyword(keyword: KeywordData): number {
  let score = 0;

  // ボリュームスコア（推奨範囲内で高得点）
  if (isInRecommendedRange(keyword.volume)) {
    score += 50;
  } else if (keyword.volume > 0 && keyword.volume < RECOMMENDED_VOLUME_RANGE.min) {
    score += 20;
  } else if (keyword.volume > RECOMMENDED_VOLUME_RANGE.max) {
    score += 30;
  }

  // 競合スコア（低いほど良い）
  if (keyword.competition < 0.3) {
    score += 30;
  } else if (keyword.competition < 0.6) {
    score += 20;
  } else {
    score += 10;
  }

  // トレンドスコア（上昇傾向で高得点）
  if (keyword.trend && keyword.trend.length >= 2) {
    const recentTrend = keyword.trend.slice(-3);
    const isUpward = recentTrend[recentTrend.length - 1] > recentTrend[0];
    if (isUpward) {
      score += 20;
    }
  }

  return score;
}
